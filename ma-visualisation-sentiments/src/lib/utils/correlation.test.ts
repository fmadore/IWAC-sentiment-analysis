import { describe, it, expect } from 'vitest';
import { spearman, rankWithTies, interpretRho, studentTTwoSided } from './correlation';

describe('rankWithTies', () => {
	it('ranks distinct values 1..n', () => {
		expect(rankWithTies([10, 30, 20])).toEqual([1, 3, 2]);
	});

	it('averages ranks across a tied run', () => {
		// Ranks 2 and 3 are tied, so both take 2.5.
		expect(rankWithTies([1, 5, 5, 9])).toEqual([1, 2.5, 2.5, 4]);
	});

	it('handles an all-tied series', () => {
		expect(rankWithTies([7, 7, 7, 7])).toEqual([2.5, 2.5, 2.5, 2.5]);
	});

	it('preserves input order in the output', () => {
		expect(rankWithTies([30, 10, 20])).toEqual([3, 1, 2]);
	});
});

describe('spearman', () => {
	it('returns 1 for a perfectly monotonic increasing relation', () => {
		const result = spearman([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
		expect(result.rho).toBeCloseTo(1);
		expect(result.n).toBe(5);
	});

	it('returns -1 for a perfectly monotonic decreasing relation', () => {
		expect(spearman([1, 2, 3, 4, 5], [50, 40, 30, 20, 10]).rho).toBeCloseTo(-1);
	});

	it('captures monotonic but non-linear relations at full strength', () => {
		// This is why Spearman rather than Pearson: the relation is exact but
		// wildly non-linear.
		expect(spearman([1, 2, 3, 4, 5], [1, 4, 9, 16, 25]).rho).toBeCloseTo(1);
	});

	it('matches a hand-computed value with no ties', () => {
		// Σd² = 4 + 1 + 1 + 4 + 0 = 10, n = 5 → 1 - 60/120 = 0.5
		const result = spearman([1, 2, 3, 4, 5], [3, 1, 4, 2, 5]);
		expect(result.rho).toBeCloseTo(0.5, 10);
	});

	it('handles ties correctly rather than using the no-ties shortcut', () => {
		// With ties present, 1 - 6Σd²/n(n²-1) is wrong; Pearson-on-ranks is right.
		const result = spearman([1, 2, 2, 3], [1, 2, 3, 4]);
		expect(result.rho).toBeCloseTo(0.9486832980505138, 10);
	});

	it('returns NaN when a series is constant', () => {
		// A constant series has no correlation with anything, which is a
		// different claim from a correlation of zero.
		expect(Number.isNaN(spearman([1, 1, 1, 1], [1, 2, 3, 4]).rho)).toBe(true);
	});

	it('returns NaN for fewer than two pairs', () => {
		expect(Number.isNaN(spearman([1], [2]).rho)).toBe(true);
		expect(Number.isNaN(spearman([], []).rho)).toBe(true);
	});

	it('truncates to the shorter series', () => {
		expect(spearman([1, 2, 3, 4], [1, 2, 3]).n).toBe(3);
	});

	it('reports a small p-value for a strong relation in a large sample', () => {
		const xs = Array.from({ length: 200 }, (_, i) => i);
		const ys = xs.map((x) => x + (x % 7));
		const result = spearman(xs, ys);

		expect(result.rho).toBeGreaterThan(0.9);
		expect(result.pValue).toBeLessThan(0.001);
	});

	it('reports a large p-value for a weak relation in a small sample', () => {
		const result = spearman([1, 2, 3, 4, 5, 6], [3, 1, 4, 2, 6, 5]);
		expect(result.pValue).toBeGreaterThan(0.05);
	});
});

describe('studentTTwoSided', () => {
	// Reference values from independent Simpson integration of the t density
	// (smooth over [t, inf), unlike the beta form which is singular at the
	// endpoint). The continued fraction is the easiest part of this module to
	// get subtly wrong — an earlier draft returned 1 for every large t because
	// the symmetry branch flipped the result without swapping a and b.
	it.each([
		[2.0, 10, 0.0733880348],
		[3.5, 50, 0.000988085],
		[1.5, 20, 0.1492357712]
	])('matches the reference for t=%s, df=%s', (t, df, expected) => {
		expect(studentTTwoSided(t, df)).toBeCloseTo(expected, 9);
	});

	it('is symmetric in the sign of t', () => {
		expect(studentTTwoSided(-2.0, 10)).toBeCloseTo(studentTTwoSided(2.0, 10), 12);
	});

	it('approaches 1 as t approaches 0', () => {
		expect(studentTTwoSided(0, 10)).toBeCloseTo(1, 10);
	});

	it('approaches 0 for a very large t', () => {
		expect(studentTTwoSided(50, 198)).toBeLessThan(1e-10);
	});
});

describe('interpretRho', () => {
	it('bands by magnitude, ignoring sign', () => {
		expect(interpretRho(0.05)).toBe('negligible');
		expect(interpretRho(-0.05)).toBe('negligible');
		expect(interpretRho(0.2)).toBe('weak');
		expect(interpretRho(-0.4)).toBe('moderate');
		expect(interpretRho(0.8)).toBe('strong');
	});

	it('returns null for an undefined correlation', () => {
		expect(interpretRho(NaN)).toBeNull();
	});
});
