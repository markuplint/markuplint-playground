import { describe, expect, test } from 'vitest';

import { isGzip, isSatisfiedBySnapshot } from './snapshot';
import { isSnapshotManifest } from './snapshot-manifest';

const distTags = { latest: '5.6.1', next: '5.0.0-rc.1', v4: '4.18.5' };

describe('isSatisfiedBySnapshot', () => {
	test('matches when the dist-tag resolves to the snapshot version', () => {
		expect(isSatisfiedBySnapshot(['markuplint@latest'], '5.6.1', distTags)).toBe(true);
	});

	test('matches an exact version', () => {
		expect(isSatisfiedBySnapshot(['markuplint@5.6.1'], '5.6.1', distTags)).toBe(true);
	});

	test('does not match when the snapshot is outdated', () => {
		expect(isSatisfiedBySnapshot(['markuplint@latest'], '5.6.0', distTags)).toBe(false);
	});

	test('does not match another dist-tag', () => {
		expect(isSatisfiedBySnapshot(['markuplint@next'], '5.6.1', distTags)).toBe(false);
	});

	test('does not match when additional packages are requested', () => {
		expect(isSatisfiedBySnapshot(['markuplint@latest', '@markuplint/jsx-parser@latest'], '5.6.1', distTags)).toBe(
			false,
		);
	});

	test('does not match other packages', () => {
		expect(isSatisfiedBySnapshot(['@markuplint/jsx-parser@latest'], '5.6.1', distTags)).toBe(false);
	});
});

describe('isSnapshotManifest', () => {
	const manifest = { version: '5.6.1' };

	test('accepts a valid manifest', () => {
		expect(isSnapshotManifest(manifest)).toBe(true);
	});

	test('accepts a prerelease version', () => {
		expect(isSnapshotManifest({ version: '5.0.0-rc.1' })).toBe(true);
	});

	test('rejects a version that could change the file path', () => {
		expect(isSnapshotManifest({ version: '../evil' })).toBe(false);
		expect(isSnapshotManifest({ version: 'https://example.com/x' })).toBe(false);
	});

	test('rejects invalid values', () => {
		expect(isSnapshotManifest(null)).toBe(false);
		expect(isSnapshotManifest('<!doctype html>')).toBe(false);
		expect(isSnapshotManifest({ ...manifest, version: 5 })).toBe(false);
	});
});

describe('isGzip', () => {
	test('detects the gzip magic bytes', () => {
		expect(isGzip(new Uint8Array([31, 139, 8]))).toBe(true);
	});

	test('rejects other data such as an uncompressed snapshot (msgpack)', () => {
		expect(isGzip(new Uint8Array([129, 161, 100]))).toBe(false);
		expect(isGzip(new Uint8Array([]))).toBe(false);
	});
});
