const MARKUPLINT_REGISTRY_URL = 'https://registry.npmjs.org/markuplint';

export type DistTags = Readonly<Record<string, string>>;

const isDistTags = (value: unknown): value is DistTags =>
	typeof value === 'object' && value !== null && Object.values(value).every(version => typeof version === 'string');

let distTagsCache: Promise<DistTags> | undefined;

/**
 * Fetches the dist-tags of `markuplint` (e.g. `{ latest: '5.6.1', next: '...' }`).
 * The result is shared between callers so the registry is requested only once.
 */
export const fetchMarkuplintDistTags = (): Promise<DistTags> => {
	if (!distTagsCache) {
		distTagsCache = (async () => {
			// The abbreviated metadata is smaller and still contains `dist-tags`.
			const response = await fetch(MARKUPLINT_REGISTRY_URL, {
				headers: { Accept: 'application/vnd.npm.install-v1+json' },
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch dist-tags: ${response.status}`);
			}
			const json = await response.json();
			const distTags: unknown = json['dist-tags'];
			if (!isDistTags(distTags)) {
				throw new TypeError('Invalid dist-tags');
			}
			return distTags;
		})();
		// Allow retrying on the next call if it failed.
		distTagsCache.catch(() => {
			distTagsCache = undefined;
		});
	}
	return distTagsCache;
};
