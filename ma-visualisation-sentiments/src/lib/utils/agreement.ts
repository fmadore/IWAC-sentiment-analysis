/**
 * Inter-rater agreement statistics for model comparison.
 *
 * The comparison view's per-article "discrepancy score" is a scalar distance:
 * useful for ranking articles, useless for characterising a pair of models.
 * It cannot tell a systematic recalibration apart from genuine disagreement,
 * and for this corpus that difference is large — ChatGPT and Mistral agree on
 * centrality only 40% of the time (kappa 0.25), yet almost all of their
 * disagreement is Mistral labelling one notch lower (weighted kappa 0.73).
 *
 * These are pure functions over label pairs, so they can be unit-tested and
 * reused by any view. All of them ignore article pairs where either side has
 * no label, and report how many pairs actually contributed.
 */

/** A pair of labels assigned to the same article by two models. */
export interface LabelPair {
	a: string;
	b: string;
}

/** Weighting scheme for Cohen's kappa. */
export type KappaWeighting = 'none' | 'linear' | 'quadratic';

export interface KappaResult {
	/** Cohen's kappa. NaN when agreement is undefined (see below). */
	kappa: number;
	/** Raw proportion of exactly-matching pairs, 0-1. */
	observedAgreement: number;
	/** Agreement expected from the marginal distributions alone, 0-1. */
	expectedAgreement: number;
	/** Number of pairs that contributed (both labels present and known). */
	n: number;
}

/**
 * Disagreement weight between two categories at ordinal positions i and j.
 *
 * `none` is the classic all-or-nothing kappa. `linear`/`quadratic` are the
 * ordinal variants: being one category off costs less than being four off,
 * which is the right model for scales like Marginal → Très central.
 */
function disagreementWeight(i: number, j: number, k: number, weighting: KappaWeighting): number {
	if (weighting === 'none') return i === j ? 0 : 1;
	if (k <= 1) return 0;

	const distance = Math.abs(i - j) / (k - 1);
	return weighting === 'linear' ? distance : distance * distance;
}

/**
 * Cohen's kappa for two raters over an ordered category list.
 *
 * `categories` fixes both the label set and — for the weighted variants — the
 * ordinal positions, so callers must pass them in scale order. Pairs carrying a
 * label outside `categories` are dropped rather than silently bucketed.
 *
 * Returns NaN for `kappa` when expected agreement is 1 (every rating in a
 * single category, so chance-corrected agreement is undefined) or when no pair
 * contributed. Callers should render that as "n/a", not as zero.
 */
export function cohensKappa(
	pairs: LabelPair[],
	categories: string[],
	weighting: KappaWeighting = 'none'
): KappaResult {
	const index = new Map(categories.map((category, i) => [category, i]));
	const k = categories.length;

	const observedCounts = new Map<string, number>();
	const marginalsA = new Array<number>(k).fill(0);
	const marginalsB = new Array<number>(k).fill(0);
	let n = 0;

	for (const { a, b } of pairs) {
		const i = index.get(a);
		const j = index.get(b);
		if (i === undefined || j === undefined) continue;

		observedCounts.set(`${i}:${j}`, (observedCounts.get(`${i}:${j}`) ?? 0) + 1);
		marginalsA[i]++;
		marginalsB[j]++;
		n++;
	}

	if (n === 0) {
		return { kappa: NaN, observedAgreement: 0, expectedAgreement: 0, n: 0 };
	}

	// Both sums are expressed as *disagreement*, then converted back, so the
	// weighted and unweighted paths share one formula.
	let observedDisagreement = 0;
	for (const [key, count] of observedCounts) {
		const [i, j] = key.split(':').map(Number);
		observedDisagreement += disagreementWeight(i, j, k, weighting) * count;
	}
	observedDisagreement /= n;

	let expectedDisagreement = 0;
	for (let i = 0; i < k; i++) {
		if (marginalsA[i] === 0) continue;
		for (let j = 0; j < k; j++) {
			if (marginalsB[j] === 0) continue;
			expectedDisagreement +=
				disagreementWeight(i, j, k, weighting) * ((marginalsA[i] * marginalsB[j]) / (n * n));
		}
	}

	const observedAgreement = 1 - observedDisagreement;
	const expectedAgreement = 1 - expectedDisagreement;

	return {
		// Expected disagreement of 0 means the marginals leave no room for chance
		// agreement to be corrected against — kappa is undefined, not 0 or 1.
		kappa: expectedDisagreement === 0 ? NaN : 1 - observedDisagreement / expectedDisagreement,
		observedAgreement,
		expectedAgreement,
		n
	};
}

/** A single cell of the agreement matrix. */
export interface ConfusionCell {
	/** Row index into `categories` (model A's label). */
	rowIndex: number;
	/** Column index into `categories` (model B's label). */
	columnIndex: number;
	count: number;
	/** Share of model A's row total, 0-100. */
	rowPercent: number;
}

export interface ConfusionMatrix {
	categories: string[];
	cells: ConfusionCell[];
	/** Per-category totals for model A (row sums). */
	rowTotals: number[];
	/** Per-category totals for model B (column sums). */
	columnTotals: number[];
	/** Pairs that contributed. */
	n: number;
	/** Proportion of pairs on the diagonal, 0-1. */
	exactAgreement: number;
	/** Proportion within one ordinal step of the diagonal, 0-1. */
	adjacentAgreement: number;
}

/**
 * Cross-tabulate two models' labels.
 *
 * Row percentages (rather than percentages of the grand total) are what make
 * an offset legible: "of everything ChatGPT called Très central, Mistral
 * called 79% of it Central" is the finding; the same cell as a share of all
 * articles is just a big number.
 *
 * `adjacentAgreement` counts the diagonal plus its two neighbouring bands,
 * which separates "labels one notch apart" from "labels that disagree".
 */
export function buildConfusionMatrix(pairs: LabelPair[], categories: string[]): ConfusionMatrix {
	const index = new Map(categories.map((category, i) => [category, i]));
	const k = categories.length;

	const counts = Array.from({ length: k }, () => new Array<number>(k).fill(0));
	let n = 0;
	let onDiagonal = 0;
	let withinOne = 0;

	for (const { a, b } of pairs) {
		const i = index.get(a);
		const j = index.get(b);
		if (i === undefined || j === undefined) continue;

		counts[i][j]++;
		n++;
		if (i === j) onDiagonal++;
		if (Math.abs(i - j) <= 1) withinOne++;
	}

	const rowTotals = counts.map((row) => row.reduce((sum, value) => sum + value, 0));
	const columnTotals = categories.map((_, j) => counts.reduce((sum, row) => sum + row[j], 0));

	const cells: ConfusionCell[] = [];
	for (let i = 0; i < k; i++) {
		for (let j = 0; j < k; j++) {
			cells.push({
				rowIndex: i,
				columnIndex: j,
				count: counts[i][j],
				rowPercent: rowTotals[i] > 0 ? (counts[i][j] / rowTotals[i]) * 100 : 0
			});
		}
	}

	return {
		categories,
		cells,
		rowTotals,
		columnTotals,
		n,
		exactAgreement: n > 0 ? onDiagonal / n : 0,
		adjacentAgreement: n > 0 ? withinOne / n : 0
	};
}

/**
 * Landis & Koch (1977) interpretation bands for kappa.
 *
 * Widely used and widely criticised as arbitrary — surfaced in the UI as a
 * qualitative hint beside the number, never in place of it.
 */
export type AgreementStrength =
	'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almostPerfect';

export function interpretKappa(kappa: number): AgreementStrength | null {
	if (Number.isNaN(kappa)) return null;
	if (kappa <= 0) return 'poor';
	if (kappa <= 0.2) return 'slight';
	if (kappa <= 0.4) return 'fair';
	if (kappa <= 0.6) return 'moderate';
	if (kappa <= 0.8) return 'substantial';
	return 'almostPerfect';
}

/** One article's labels as assigned by every model being compared. */
export type RaterLabels = string[];

export interface FleissResult {
	kappa: number;
	observedAgreement: number;
	expectedAgreement: number;
	/** Articles that contributed (every rater supplied a known label). */
	n: number;
	/** Number of raters. */
	raters: number;
}

/**
 * Fleiss' kappa across three or more raters.
 *
 * Cohen's kappa only handles pairs, so summarising all three models at once
 * needs this. Only complete cases count: an article missing one model's label
 * is dropped rather than treated as a two-rater item, which would silently mix
 * two different agreement questions.
 */
export function fleissKappa(items: RaterLabels[], categories: string[]): FleissResult {
	const index = new Map(categories.map((category, i) => [category, i]));
	const k = categories.length;

	const complete = items.filter(
		(labels) => labels.length > 0 && labels.every((label) => index.has(label))
	);

	const raters = complete[0]?.length ?? 0;
	const usable = complete.filter((labels) => labels.length === raters);
	const n = usable.length;

	if (n === 0 || raters < 2) {
		return { kappa: NaN, observedAgreement: 0, expectedAgreement: 0, n, raters };
	}

	const categoryTotals = new Array<number>(k).fill(0);
	let agreementSum = 0;

	for (const labels of usable) {
		const counts = new Array<number>(k).fill(0);
		for (const label of labels) {
			counts[index.get(label) as number]++;
		}

		// Proportion of rater PAIRS on this item that agree.
		const pairsAgreeing = counts.reduce((sum, count) => sum + count * (count - 1), 0);
		agreementSum += pairsAgreeing / (raters * (raters - 1));

		counts.forEach((count, i) => (categoryTotals[i] += count));
	}

	const observedAgreement = agreementSum / n;
	const proportions = categoryTotals.map((total) => total / (n * raters));
	const expectedAgreement = proportions.reduce((sum, p) => sum + p * p, 0);

	return {
		kappa:
			expectedAgreement === 1
				? NaN
				: (observedAgreement - expectedAgreement) / (1 - expectedAgreement),
		observedAgreement,
		expectedAgreement,
		n,
		raters
	};
}
