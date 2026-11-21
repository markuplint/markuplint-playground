/**
 * Builds a WebContainer filesystem snapshot that contains `markuplint@latest`
 * already installed, so the playground can mount it instead of running
 * `npm install` on every visit.
 *
 * Usage (Node.js runs this file by stripping types):
 *   node scripts/build-snapshot.ts [--out <dir>]
 *
 * Output (default: dist/snapshot):
 *   manifest.json             - SnapshotManifest
 *   markuplint-<version>.bin  - gzipped snapshot for `WebContainer#mount()`
 *
 * The file is gzipped by itself but has no `.gz` extension, because some servers
 * add `Content-Encoding: gzip` to `.gz` files and browsers then decompress it implicitly.
 * The client checks the gzip magic bytes, so both cases work.
 */
import type { SnapshotManifest } from '../src/modules/snapshot-manifest.ts';

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { snapshot } from '@webcontainer/snapshot';

import { SNAPSHOT_DIR, SNAPSHOT_MANIFEST_FILE, getSnapshotFileName } from '../src/modules/snapshot-manifest.ts';

const PACKAGE_NAME = 'markuplint';

/** Files that are never read at runtime. Removing them makes the snapshot much smaller. */
const PRUNE_FILE_PATTERN = /(?:\.d\.[cm]?ts|\.map|\.md|\.markdown)$/i;
/**
 * `node_modules/.bin` holds symlinks to CLI entry points, which the linter server does not use.
 * `@webcontainer/snapshot` follows symlinks, so they would be stored as duplicated files.
 */
const PRUNE_DIR_NAMES: ReadonlySet<string> = new Set(['.bin']);

const getOutDir = (): string => {
	const defaultDir = path.join('dist', SNAPSHOT_DIR);
	const index = process.argv.indexOf('--out');
	return path.resolve(index === -1 ? defaultDir : (process.argv[index + 1] ?? defaultDir));
};

/**
 * Removes files unused at runtime.
 * @returns removed bytes
 */
const prune = async (dir: string): Promise<number> => {
	let removed = 0;
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (PRUNE_DIR_NAMES.has(entry.name)) {
				await fs.rm(fullPath, { recursive: true });
			} else {
				removed += await prune(fullPath);
			}
		} else if (entry.isFile() && PRUNE_FILE_PATTERN.test(entry.name)) {
			const { size } = await fs.stat(fullPath);
			removed += size;
			await fs.rm(fullPath);
		}
	}
	return removed;
};

const readInstalledVersion = async (workDir: string): Promise<string> => {
	const json = await fs.readFile(path.join(workDir, 'node_modules', PACKAGE_NAME, 'package.json'), 'utf8');
	const { version }: { version?: unknown } = JSON.parse(json);
	if (typeof version !== 'string') {
		throw new TypeError(`Cannot read the installed version of ${PACKAGE_NAME}`);
	}
	return version;
};

const toMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

const main = async () => {
	const outDir = getOutDir();
	const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'markuplint-snapshot-'));
	try {
		// Reproduce what the playground does in WebContainer: `npm install -D markuplint@latest` in an empty dir.
		// `--ignore-scripts`: no dependency of markuplint has install scripts, and the build should not run any.
		execFileSync(
			'npm',
			[
				'install',
				'-D',
				`${PACKAGE_NAME}@latest`,
				'--ignore-scripts',
				'--no-audit',
				'--no-fund',
				'--loglevel=error',
			],
			{ cwd: workDir, stdio: 'inherit' },
		);

		const version = await readInstalledVersion(workDir);
		const removed = await prune(path.join(workDir, 'node_modules'));
		const data = gzipSync(await snapshot(workDir), { level: 9 });
		const file = getSnapshotFileName(version);

		await fs.rm(outDir, { recursive: true, force: true });
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, file), data);
		const manifest: SnapshotManifest = { version };
		await fs.writeFile(path.join(outDir, SNAPSHOT_MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);

		// eslint-disable-next-line no-console
		console.log(
			`[snapshot] ${PACKAGE_NAME}@${version}: ${toMB(data.byteLength)} (pruned ${toMB(removed)}) -> ${path.relative(process.cwd(), outDir)}/${file}`,
		);
	} finally {
		await fs.rm(workDir, { recursive: true, force: true });
	}
};

await main();
