import type { DistTags } from './npm-registry';

import { SNAPSHOT_DIR, SNAPSHOT_MANIFEST_FILE, getSnapshotFileName, isSnapshotManifest } from './snapshot-manifest';

export type Snapshot = Readonly<{
	/** The installed version of markuplint. */
	version: string;
	data: Uint8Array;
}>;

/** The magic bytes of gzip (`1f 8b`). */
const GZIP_MAGIC = [31, 139] as const;

export const isGzip = (data: ArrayLike<number>) =>
	data.length >= GZIP_MAGIC.length && GZIP_MAGIC.every((byte, index) => data[index] === byte);

/**
 * Fetches the preinstalled `node_modules` snapshot built at deploy time.
 * Returns `null` when it is not available (e.g. in `vite dev` without running `build:snapshot:dev`).
 */
export const fetchSnapshot = async (baseUrl: string = import.meta.env.BASE_URL): Promise<Snapshot | null> => {
	try {
		const manifestResponse = await fetch(`${baseUrl}${SNAPSHOT_DIR}/${SNAPSHOT_MANIFEST_FILE}`, {
			cache: 'no-cache',
		});
		if (!manifestResponse.ok) {
			return null;
		}
		const manifest: unknown = await manifestResponse.json();
		if (!isSnapshotManifest(manifest)) {
			return null;
		}
		const dataResponse = await fetch(`${baseUrl}${SNAPSHOT_DIR}/${getSnapshotFileName(manifest.version)}`);
		if (!dataResponse.ok) {
			return null;
		}
		let data = new Uint8Array(await dataResponse.arrayBuffer());
		// The snapshot file is gzipped, but the server may also send it with `Content-Encoding: gzip`,
		// in which case the browser has already decompressed it.
		if (isGzip(data)) {
			const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
			data = new Uint8Array(await new Response(stream).arrayBuffer());
		}
		return { version: manifest.version, data };
	} catch {
		// e.g. the dev server returns index.html for unknown paths, which is not JSON.
		return null;
	}
};

/**
 * Whether the requested packages (e.g. `['markuplint@latest']`) are exactly what the snapshot contains.
 * Only a snapshot of `markuplint` alone is supported.
 */
export const isSatisfiedBySnapshot = (
	packages: readonly string[],
	snapshotVersion: string,
	distTags: DistTags,
): boolean => {
	if (packages.length !== 1) {
		return false;
	}
	const [name, spec] = packages[0].split('@');
	if (name !== 'markuplint') {
		return false;
	}
	const resolved = Object.prototype.hasOwnProperty.call(distTags, spec) ? distTags[spec] : spec;
	return resolved === snapshotVersion;
};
