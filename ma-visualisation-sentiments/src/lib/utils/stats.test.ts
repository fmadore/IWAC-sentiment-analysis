import { describe, expect, it } from 'vitest';
import { countGroupsBelow, median, pearson, sampleStandardDeviation, summarizeMean } from './stats';

describe('stats', () => {
	it('summarises a mean with a sample SD and a 1.96 SE interval', () => {
		const summary = summarizeMean([1, 2, 3, 4]);
		expect(summary.mean).toBe(2.5);
		expect(summary.standardDeviation).toBeCloseTo(Math.sqrt(5 / 3));
		expect(summary.confidence).toBeCloseTo(1.96 * (Math.sqrt(5 / 3) / 2));
		expect(summary.n).toBe(4);
	});

	it('gives a single value no spread and no interval', () => {
		expect(summarizeMean([7])).toEqual({ mean: 7, standardDeviation: 0, confidence: 0, n: 1 });
		expect(sampleStandardDeviation([])).toBe(0);
	});

	it('takes the middle, or the mean of the two middles', () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 3, 2])).toBe(2.5);
		expect(median([])).toBeNull();
	});

	it('correlates, and returns NaN without variance', () => {
		expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
		expect(pearson([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1);
		expect(pearson([1, 1, 1], [1, 2, 3])).toBeNaN();
	});

	it('counts groups under a threshold', () => {
		expect(countGroupsBelow(['a', 'a', 'b', 'c', 'c', 'c'], 2)).toBe(1);
	});
});
