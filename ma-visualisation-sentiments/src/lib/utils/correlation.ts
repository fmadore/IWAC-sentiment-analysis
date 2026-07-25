/**
 * Rank correlation.
 *
 * The "Distribution" view cross-tabulates polarity against subjectivity and
 * has always left the reader to eyeball whether the two move together. Both
 * are ordinal, not interval — the distance from Négatif to Neutre is not
 * meaningfully "one unit" — so Spearman's rho on ranks is the appropriate
 * coefficient, not Pearson's r on the coded values.
 */

export interface SpearmanResult {
	/** Spearman's rank correlation, -1 to 1. NaN when undefined. */
	rho: number;
	/** Pairs that contributed. */
	n: number;
	/**
	 * Two-sided p-value from the large-sample t approximation, or NaN when n is
	 * too small (< 4) for it to mean anything.
	 */
	pValue: number;
}

/**
 * Convert values to ranks, averaging ties.
 *
 * Tie handling matters here rather than being a technicality: these scales have
 * five or six levels across thousands of articles, so essentially every value
 * is tied. Competition ranking would systematically distort rho.
 */
export function rankWithTies(values: number[]): number[] {
	const indexed = values.map((value, index) => ({ value, index }));
	indexed.sort((a, b) => a.value - b.value);

	const ranks = new Array<number>(values.length);
	let i = 0;

	while (i < indexed.length) {
		let j = i;
		while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) j++;

		// Ranks are 1-based; a tied run all take the mean of the run's ranks.
		const averageRank = (i + j + 2) / 2;
		for (let k = i; k <= j; k++) ranks[indexed[k].index] = averageRank;

		i = j + 1;
	}

	return ranks;
}

/**
 * Two-sided Student's t p-value via a continued-fraction incomplete beta.
 * Exported for tests — the continued fraction is the easiest thing here to get
 * subtly wrong, and it is checked against independently computed values.
 */
export function studentTTwoSided(t: number, df: number): number {
	if (!Number.isFinite(t) || df <= 0) return NaN;

	const x = df / (df + t * t);
	return incompleteBeta(x, df / 2, 0.5);
}

/**
 * Regularized incomplete beta function I_x(a, b), Lentz's continued fraction.
 *
 * The continued fraction only converges usefully for x below the distribution's
 * mode, so above it we recurse on the symmetry I_x(a,b) = 1 - I_(1-x)(b,a).
 * That requires swapping x, a AND b — flipping only the sign of the result
 * silently returns garbage for large t.
 */
function incompleteBeta(x: number, a: number, b: number): number {
	if (x <= 0) return 0;
	if (x >= 1) return 1;

	if (x > (a + 1) / (a + b + 2)) {
		return 1 - incompleteBeta(1 - x, b, a);
	}

	const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
	const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;

	let f = 1;
	let c = 1;
	let d = 0;

	for (let i = 0; i <= 250; i++) {
		const m = Math.floor(i / 2);
		let numerator: number;

		if (i === 0) {
			numerator = 1;
		} else if (i % 2 === 0) {
			numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
		} else {
			numerator = (-((a + m) * (a + b + m)) * x) / ((a + 2 * m) * (a + 2 * m + 1));
		}

		d = 1 + numerator * d;
		if (Math.abs(d) < 1e-30) d = 1e-30;
		d = 1 / d;

		c = 1 + numerator / c;
		if (Math.abs(c) < 1e-30) c = 1e-30;

		const cd = c * d;
		f *= cd;

		if (Math.abs(1 - cd) < 1e-10) break;
	}

	return front * (f - 1);
}

/** Lanczos approximation to log Γ(z). */
function logGamma(z: number): number {
	const g = [
		676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
		12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
	];

	if (z < 0.5) {
		return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
	}

	const zz = z - 1;
	let x = 0.99999999999980993;
	for (let i = 0; i < g.length; i++) x += g[i] / (zz + i + 1);

	const t = zz + g.length - 0.5;
	return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Spearman's rank correlation between two paired series.
 *
 * Computed as Pearson's r over tie-averaged ranks, which is the definition
 * that stays correct with ties (the 1 - 6Σd²/n(n²-1) shortcut does not).
 * Returns NaN when either series has no variance — a constant series has no
 * correlation with anything, which is different from a correlation of zero.
 */
export function spearman(xs: number[], ys: number[]): SpearmanResult {
	const n = Math.min(xs.length, ys.length);
	if (n < 2) return { rho: NaN, n, pValue: NaN };

	const rx = rankWithTies(xs.slice(0, n));
	const ry = rankWithTies(ys.slice(0, n));

	const meanX = rx.reduce((s, v) => s + v, 0) / n;
	const meanY = ry.reduce((s, v) => s + v, 0) / n;

	let covariance = 0;
	let varianceX = 0;
	let varianceY = 0;

	for (let i = 0; i < n; i++) {
		const dx = rx[i] - meanX;
		const dy = ry[i] - meanY;
		covariance += dx * dy;
		varianceX += dx * dx;
		varianceY += dy * dy;
	}

	if (varianceX === 0 || varianceY === 0) return { rho: NaN, n, pValue: NaN };

	const rho = covariance / Math.sqrt(varianceX * varianceY);

	// t approximation; only meaningful once there are a few degrees of freedom.
	let pValue = NaN;
	if (n > 3 && Math.abs(rho) < 1) {
		const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
		pValue = studentTTwoSided(t, n - 2);
	} else if (n > 3 && Math.abs(rho) === 1) {
		pValue = 0;
	}

	return { rho, n, pValue };
}

/** Qualitative strength band for |rho|, for a plain-language hint. */
export type CorrelationStrength = 'negligible' | 'weak' | 'moderate' | 'strong';

export function interpretRho(rho: number): CorrelationStrength | null {
	if (Number.isNaN(rho)) return null;
	const magnitude = Math.abs(rho);
	if (magnitude < 0.1) return 'negligible';
	if (magnitude < 0.3) return 'weak';
	if (magnitude < 0.5) return 'moderate';
	return 'strong';
}
