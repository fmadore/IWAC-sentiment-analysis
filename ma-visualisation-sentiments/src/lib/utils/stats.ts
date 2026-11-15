/**
 * Small descriptive statistics shared by the ranking, consensus and
 * correlation utilities, which each used to carry their own copy.
 */

export function mean(values: readonly number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Sample (n − 1) standard deviation; 0 for fewer than two values. */
export function sampleStandardDeviation(
	values: readonly number[],
	valuesMean = mean(values)
): number {
	const n = values.length;
	if (n < 2) return 0;
	return Math.sqrt(values.reduce((sum, value) => sum + (value - valuesMean) ** 2, 0) / (n - 1));
}

export interface MeanSummary {
	mean: number;
	standardDeviation: number;
	/** Half-width of the 95% interval around the mean; 0 for fewer than two values. */
	confidence: number;
	n: number;
}

/**
 * Mean, sample SD and a 95% interval half-width (`1.96 × SE`).
 *
 * A normal-approximation interval. Every caller applies a floor of 30 articles
 * per group, where the t-based interval would be at most about 4% wider
 * (t₀.₉₇₅,₂₉ ≈ 2.045); the displayed intervals keep the normal figure.
 */
export function summarizeMean(values: readonly number[]): MeanSummary {
	const n = values.length;
	const valuesMean = mean(values);
	const standardDeviation = sampleStandardDeviation(values, valuesMean);
	return {
		mean: valuesMean,
		standardDeviation,
		confidence: n > 1 ? 1.96 * (standardDeviation / Math.sqrt(n)) : 0,
		n
	};
}

export function median(values: readonly number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Pearson correlation over the common length, or NaN when either series has no variance. */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
	const n = Math.min(xs.length, ys.length);
	if (n < 2) return Number.NaN;

	const meanX = mean(xs.slice(0, n));
	const meanY = mean(ys.slice(0, n));

	let covariance = 0;
	let varianceX = 0;
	let varianceY = 0;

	for (let index = 0; index < n; index++) {
		const dx = xs[index] - meanX;
		const dy = ys[index] - meanY;
		covariance += dx * dy;
		varianceX += dx * dx;
		varianceY += dy * dy;
	}

	const denominator = Math.sqrt(varianceX * varianceY);
	return denominator === 0 ? Number.NaN : covariance / denominator;
}

/**
 * Below this many observations a share or a mean is drawn with a weaker mark.
 *
 * One threshold for every view that de-emphasises small samples (the
 * cross-model history, the single-model share bands, map bubbles, Hijri
 * months), so "faded" means the same thing wherever a reader meets it. It is a
 * presentation floor, not a filter: nothing below it is hidden or dropped, and
 * no URL default depends on it. At n = 30 one article moves a share by more
 * than three points.
 */
export const LOW_N_THRESHOLD = 30;

/** Whether `n` observations fall below the shared low-sample floor. */
export function isLowN(n: number): boolean {
	return n < LOW_N_THRESHOLD;
}

export interface ProportionInterval {
	/** Lower bound, as a fraction. */
	low: number;
	/** Upper bound, as a fraction. */
	high: number;
}

/**
 * Wilson score interval for a binomial proportion (95% by default).
 *
 * Chosen over the normal (Wald) interval because the shares this app reports
 * are often near 0 — negative polarity is about 3% of ratings — where Wald
 * collapses to a zero-width interval at 0 successes and can fall below zero.
 * Wilson stays inside [0, 1] and keeps a sensible width at small n. Null when
 * there is nothing to estimate from.
 */
export function wilsonInterval(
	successes: number,
	n: number,
	z = 1.959963984540054
): ProportionInterval | null {
	if (!(n > 0) || successes < 0 || successes > n) return null;
	const p = successes / n;
	const z2 = z * z;
	const denominator = 1 + z2 / n;
	const centre = (p + z2 / (2 * n)) / denominator;
	const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denominator;
	return { low: Math.max(0, centre - half), high: Math.min(1, centre + half) };
}

export interface Proportion extends ProportionInterval {
	successes: number;
	n: number;
	/** successes / n, or null when n is 0. */
	share: number | null;
}

/** A share with its Wilson interval; the interval is [0, 0] — never shown — when n is 0. */
export function proportion(successes: number, n: number): Proportion {
	const interval = wilsonInterval(successes, n);
	return {
		successes,
		n,
		share: n > 0 ? successes / n : null,
		low: interval?.low ?? 0,
		high: interval?.high ?? 0
	};
}

/**
 * Cohen's κ for two raters over the same items (unweighted, nominal).
 *
 * Null when there are no pairs, or when chance agreement is total (both raters
 * used one and the same category throughout), where κ is undefined rather than
 * zero or one.
 */
export function cohensKappa(pairs: ReadonlyArray<readonly [string, string]>): number | null {
	const n = pairs.length;
	if (n === 0) return null;
	const first = new Map<string, number>();
	const second = new Map<string, number>();
	let observed = 0;
	for (const [a, b] of pairs) {
		if (a === b) observed++;
		first.set(a, (first.get(a) ?? 0) + 1);
		second.set(b, (second.get(b) ?? 0) + 1);
	}
	let expected = 0;
	for (const [category, count] of first)
		expected += (count / n) * ((second.get(category) ?? 0) / n);
	if (expected >= 1) return null;
	return (observed / n - expected) / (1 - expected);
}

/** How many groups hold fewer than `minimum` members, for an honest "n omitted" note. */
export function countGroupsBelow(keys: Iterable<string>, minimum: number): number {
	const counts = new Map<string, number>();
	for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
	let below = 0;
	for (const count of counts.values()) if (count < minimum) below++;
	return below;
}
