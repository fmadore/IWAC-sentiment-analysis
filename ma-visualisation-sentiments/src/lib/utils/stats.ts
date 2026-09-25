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

/** How many groups hold fewer than `minimum` members, for an honest "n omitted" note. */
export function countGroupsBelow(keys: Iterable<string>, minimum: number): number {
	const counts = new Map<string, number>();
	for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
	let below = 0;
	for (const count of counts.values()) if (count < minimum) below++;
	return below;
}
