import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CITATION } from './citation';

const cff = readFileSync(
	// Vitest runs from the app root; CITATION.cff sits one level up.
	resolve(process.cwd(), '../CITATION.cff'),
	'utf8'
);
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
	version: string;
};

/** A top-level scalar of CITATION.cff, unquoted. */
function field(name: string): string | undefined {
	const match = cff.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
	return match?.[1].trim().replace(/^"(.*)"$/, '$1');
}

describe('footer citation mirrors CITATION.cff', () => {
	it('agrees on title, version, release date, DOI and licence', () => {
		expect(CITATION.title).toBe(field('title'));
		expect(CITATION.version).toBe(field('version'));
		expect(CITATION.dateReleased).toBe(field('date-released'));
		expect(CITATION.doi).toBe(field('doi'));
		expect(CITATION.license).toBe(field('license'));
		expect(CITATION.repository).toBe(field('repository-code'));
	});

	it('names the author and the dataset the file references', () => {
		expect(cff).toContain(`family-names: ${CITATION.author.family}`);
		expect(cff).toContain(`given-names: ${CITATION.author.given}`);
		expect(cff).toContain(`url: "${CITATION.dataset}"`);
	});

	it('matches the app version in package.json', () => {
		expect(CITATION.version).toBe(pkg.version);
	});
});
