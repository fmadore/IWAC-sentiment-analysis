import { expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dataRelease } from '../../../scripts/data-release.mjs';

it('binds release identity to filenames and bytes and refuses interrupted publication', () => {
	const directory = mkdtempSync(join(tmpdir(), 'iwac-release-test-'));
	const files = ['scores.json', 'other.json', '.generation-pending.json'];
	try {
		writeFileSync(join(directory, files[0]), '{"score":1}');
		const url = pathToFileURL(directory + sep);
		const first = dataRelease(url);
		expect(dataRelease(url)).toBe(first);
		writeFileSync(join(directory, files[0]), '{"score":2}');
		expect(dataRelease(url)).not.toBe(first);
		const second = dataRelease(url);
		writeFileSync(join(directory, files[1]), '{"score":2}');
		unlinkSync(join(directory, files[0]));
		expect(dataRelease(url)).not.toBe(second);
		writeFileSync(join(directory, files[2]), '{}');
		expect(() => dataRelease(url)).toThrow('Interrupted data publication');
	} finally {
		for (const name of files) {
			if (existsSync(join(directory, name))) unlinkSync(join(directory, name));
		}
		rmdirSync(directory);
	}
});
