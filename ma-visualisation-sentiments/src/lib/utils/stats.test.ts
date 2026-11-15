import { describe, expect, it } from 'vitest';
import {
	LOW_N_THRESHOLD,
	cohensKappa,
	countGroupsBelow,
	isLowN,
	median,
	pearson,
	proportion,
	sampleStandardDeviation,
	summarizeMean,
	wilsonInterval
} from './stats';

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

describe('wilsonInterval', () => {
	it('matches the closed-form score interval', () => {
		// 205 of 301, reproduced in Python.
		const interval = wilsonInterval(205, 301)!;
		expect(interval.low).toBeCloseTo(0.62641, 5);
		expect(interval.high).toBeCloseTo(0.73115, 5);
	});

	it('keeps a width at zero successes and stays inside [0, 1]', () => {
		// n = 5, as a cross-model history point at the default minimum.
		const zero = wilsonInterval(0, 5)!;
		expect(zero.low).toBe(0);
		expect(zero.high).toBeGreaterThan(0.4);
		const all = wilsonInterval(5, 5)!;
		expect(all.high).toBe(1);
		expect(all.low).toBeLessThan(0.6);
	});

	it('is null when there is nothing to estimate from', () => {
		expect(wilsonInterval(0, 0)).toBeNull();
		expect(wilsonInterval(3, 2)).toBeNull();
	});

	it('wraps a share for display', () => {
		expect(proportion(0, 0)).toEqual({ successes: 0, n: 0, share: null, low: 0, high: 0 });
		expect(proportion(1, 4).share).toBe(0.25);
	});
});

describe('isLowN', () => {
	it('uses one shared floor', () => {
		expect(LOW_N_THRESHOLD).toBe(30);
		expect(isLowN(29)).toBe(true);
		expect(isLowN(30)).toBe(false);
	});
});

describe('cohensKappa', () => {
	it('is 1 for perfect agreement and 0 for chance-level agreement', () => {
		expect(
			cohensKappa([
				['a', 'a'],
				['b', 'b']
			])
		).toBe(1);
		expect(
			cohensKappa([
				['a', 'a'],
				['a', 'b'],
				['b', 'a'],
				['b', 'b']
			])
		).toBe(0);
	});

	it('is undefined when both raters used one category throughout', () => {
		expect(
			cohensKappa([
				['a', 'a'],
				['a', 'a']
			])
		).toBeNull();
		expect(cohensKappa([])).toBeNull();
	});
});
