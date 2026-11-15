/**
 * Krippendorff's alpha for any number of raters, with missing ratings.
 *
 * Fleiss' kappa needs every rater on every unit, so one model with thin
 * coverage removes those articles for the whole panel — and on this corpus the
 * articles it removes are not random (Qwen declines more where Islam is
 * peripheral). Alpha keeps every unit that at least two raters labelled: each
 * unit contributes its pairable values to a coincidence matrix, weighted by
 * 1 / (m_u − 1), so nothing is deleted listwise.
 *
 * Definitions follow Krippendorff (2011), "Computing Krippendorff's
 * Alpha-Reliability" (Departmental Papers, Annenberg School for
 * Communication):
 *
 *   α = 1 − D_o / D_e,  D_o = Σ o_ck δ²_ck / n,  D_e = Σ n_c n_k δ²_ck / (n (n − 1))
 *
 * with the nominal metric δ² = [c ≠ k] and the ordinal metric
 * δ²_ck = (Σ_{g=c..k} n_g − (n_c + n_k) / 2)², where n_g are the marginal
 * totals of the coincidence matrix — the ordinal distance depends on how the
 * values are actually used, not on equal steps between ranks.
 *
 * Pure functions over label arrays. `categories` fixes both the label set and,
 * for the ordinal metric, the rank order; a label outside it counts as missing.
 */

export type AlphaMetric = 'nominal' | 'ordinal' | 'interval';

export interface AlphaResult {
	/** Krippendorff's alpha. NaN when undefined (no pairable values, or no variation). */
	alpha: number;
	/** Units with at least two pairable values: the units that contributed. */
	units: number;
	/** Pairable values (n in Krippendorff's notation). */
	values: number;
	/** Observed and expected disagreement. */
	observedDisagreement: number;
	expectedDisagreement: number;
}

/**
 * One unit's ratings: one entry per rater, `null` (or any label outside the
 * category set) when that rater gave no usable value.
 */
export type AlphaUnit = readonly (string | null | undefined)[];

/** The coincidence matrix over `categories`, plus pairable-unit counts. */
export interface CoincidenceMatrix {
	categories: readonly string[];
	/** o[c][k], symmetric. */
	o: number[][];
	/** Marginal totals n_c. */
	totals: number[];
	n: number;
	units: number;
}

/** Build the coincidence matrix from per-unit category counts. */
export function coincidenceMatrix(
	units: Iterable<AlphaUnit>,
	categories: readonly string[]
): CoincidenceMatrix {
	const index = new Map(categories.map((category, i) => [category, i]));
	const k = categories.length;
	const o = Array.from({ length: k }, () => new Array<number>(k).fill(0));
	const counts = new Array<number>(k).fill(0);
	let pairable = 0;

	for (const unit of units) {
		counts.fill(0);
		let m = 0;
		for (const label of unit) {
			if (label === null || label === undefined) continue;
			const position = index.get(label);
			if (position === undefined) continue;
			counts[position]++;
			m++;
		}
		if (m < 2) continue;
		pairable++;
		const weight = 1 / (m - 1);
		for (let c = 0; c < k; c++) {
			const nc = counts[c];
			if (nc === 0) continue;
			o[c][c] += nc * (nc - 1) * weight;
			for (let j = c + 1; j < k; j++) {
				const nk = counts[j];
				if (nk === 0) continue;
				const value = nc * nk * weight;
				o[c][j] += value;
				o[j][c] += value;
			}
		}
	}

	const totals = o.map((row) => row.reduce((sum, value) => sum + value, 0));
	const n = totals.reduce((sum, value) => sum + value, 0);
	return { categories, o, totals, n, units: pairable };
}

/** δ²_ck for the chosen metric, given the coincidence marginals. */
function distanceMatrix(totals: number[], metric: AlphaMetric): number[][] {
	const k = totals.length;
	const delta = Array.from({ length: k }, () => new Array<number>(k).fill(0));
	for (let c = 0; c < k; c++) {
		for (let j = c + 1; j < k; j++) {
			let value: number;
			if (metric === 'nominal') value = 1;
			else if (metric === 'interval') value = (j - c) ** 2;
			else {
				let sum = 0;
				for (let g = c; g <= j; g++) sum += totals[g];
				value = (sum - (totals[c] + totals[j]) / 2) ** 2;
			}
			delta[c][j] = value;
			delta[j][c] = value;
		}
	}
	return delta;
}

/** Alpha from an existing coincidence matrix (shared by the metrics). */
export function alphaFromMatrix(matrix: CoincidenceMatrix, metric: AlphaMetric): AlphaResult {
	const { o, totals, n, units } = matrix;
	if (n < 2) {
		return {
			alpha: NaN,
			units,
			values: n,
			observedDisagreement: NaN,
			expectedDisagreement: NaN
		};
	}
	const delta = distanceMatrix(totals, metric);
	const k = totals.length;
	let observed = 0;
	let expected = 0;
	for (let c = 0; c < k; c++) {
		for (let j = 0; j < k; j++) {
			if (c === j) continue;
			observed += o[c][j] * delta[c][j];
			expected += totals[c] * totals[j] * delta[c][j];
		}
	}
	const observedDisagreement = observed / n;
	const expectedDisagreement = expected / (n * (n - 1));
	return {
		alpha: expectedDisagreement === 0 ? NaN : 1 - observedDisagreement / expectedDisagreement,
		units,
		values: n,
		observedDisagreement,
		expectedDisagreement
	};
}

/** Krippendorff's alpha over units of ratings (one array per unit). */
export function krippendorffAlpha(
	units: Iterable<AlphaUnit>,
	categories: readonly string[],
	metric: AlphaMetric = 'nominal'
): AlphaResult {
	return alphaFromMatrix(coincidenceMatrix(units, categories), metric);
}
