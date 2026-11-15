import { describe, expect, it } from 'vitest';
import { coincidenceMatrix, krippendorffAlpha, type AlphaUnit } from './krippendorff';

/** Transpose coder rows into units, with `.` as a missing value. */
function unitsFromCoders(coders: string[]): AlphaUnit[] {
	const rows = coders.map((row) => row.split(' '));
	return rows[0].map((_, unit) => rows.map((row) => (row[unit] === '.' ? null : row[unit])));
}

// Krippendorff (2011), "Computing Krippendorff's Alpha-Reliability", example C:
// four observers, twelve units, missing data. Published values: nominal 0.743,
// ordinal 0.815, interval 0.849.
const exampleC = unitsFromCoders([
	'1 2 3 3 2 1 4 1 2 . . .',
	'1 2 3 3 2 2 4 1 2 5 . 3',
	'. 3 3 3 2 3 4 2 2 5 1 .',
	'1 2 3 3 2 4 4 1 2 5 1 .'
]);
const fiveValues = ['1', '2', '3', '4', '5'];

describe('krippendorffAlpha', () => {
	it('reproduces the binary two-observer example A (0.095)', () => {
		const units = unitsFromCoders(['0 1 0 0 0 0 0 0 1 0', '1 1 1 0 0 1 0 0 0 0']);
		expect(krippendorffAlpha(units, ['0', '1'], 'nominal').alpha).toBeCloseTo(0.095, 3);
	});

	it('reproduces the nominal example C with missing data (0.743)', () => {
		const result = krippendorffAlpha(exampleC, fiveValues, 'nominal');
		expect(result.alpha).toBeCloseTo(0.743, 3);
		// Unit 12 has a single value and is not pairable.
		expect(result.units).toBe(11);
		expect(result.values).toBe(40);
	});

	it('reproduces the ordinal example C (0.815)', () => {
		expect(krippendorffAlpha(exampleC, fiveValues, 'ordinal').alpha).toBeCloseTo(0.815, 3);
	});

	it('reproduces the interval example C (0.849)', () => {
		expect(krippendorffAlpha(exampleC, fiveValues, 'interval').alpha).toBeCloseTo(0.849, 3);
	});

	it('builds the published coincidence marginals for example C', () => {
		const matrix = coincidenceMatrix(exampleC, fiveValues);
		expect(matrix.totals.map((value) => Math.round(value * 1000) / 1000)).toEqual([
			9, 13, 10, 5, 3
		]);
	});

	it('treats labels outside the category set as missing, not as a category', () => {
		const units: AlphaUnit[] = [
			['a', 'a', 'Non applicable'],
			['b', 'b', null],
			['a', 'b', 'a']
		];
		const withNA = krippendorffAlpha(units, ['a', 'b']);
		const withoutNA = krippendorffAlpha(
			units.map((unit) => unit.map((label) => (label === 'Non applicable' ? null : label))),
			['a', 'b']
		);
		expect(withNA).toEqual(withoutNA);
	});

	it('is 1 for perfect agreement and NaN without variation or pairs', () => {
		expect(
			krippendorffAlpha(
				[
					['a', 'a'],
					['b', 'b']
				],
				['a', 'b']
			).alpha
		).toBe(1);
		expect(Number.isNaN(krippendorffAlpha([['a', 'a']], ['a', 'b']).alpha)).toBe(true);
		expect(Number.isNaN(krippendorffAlpha([['a', null]], ['a', 'b']).alpha)).toBe(true);
	});
});
