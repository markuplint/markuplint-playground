/**
 * Shared between the build script (`scripts/build-snapshot.ts`, run by Node.js)
 * and the playground (browser), so both agree on the snapshot files.
 *
 * Node.js runs this file by stripping types, so keep it:
 * - free of imports (imports in `src` have no file extension, which Node.js cannot resolve)
 * - free of syntax that cannot be stripped (e.g. `enum`)
 */

/** The directory of the snapshot files, relative to the site root. */
export const SNAPSHOT_DIR = 'snapshot';

export const SNAPSHOT_MANIFEST_FILE = 'manifest.json';

/**
 * The file name contains the version so the file never changes and can be cached for a long time.
 * It has no `.gz` extension because some servers add `Content-Encoding: gzip` to `.gz` files.
 */
export const getSnapshotFileName = (version: string) => `markuplint-${version}.bin`;

export type SnapshotManifest = Readonly<{
	/** The installed version of markuplint. */
	version: string;
}>;

/**
 * The version is used in the file name, so only characters of semver (and dist-tags) are allowed.
 * As `/` is not allowed, it cannot point to another path.
 */
const VERSION_PATTERN = /^[\w.+-]+$/;

export const isSnapshotManifest = (value: unknown): value is SnapshotManifest => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const { version } = value as Record<string, unknown>;
	return typeof version === 'string' && VERSION_PATTERN.test(version);
};
