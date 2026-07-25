import { describe, it, expect } from 'vitest';
import {
	cohensKappa,
	buildConfusionMatrix,
	interpretKappa,
	fleissKappa,
	type LabelPair
} from './agreement';

const POLARITY = ['Très négatif', 'Négatif', 'Neutre', 'Positif', 'Très positif'];

/** Expand a confusion matrix (rows = model A) into the flat pair list. */
function pairsFromMatrix(categories: string[], matrix: number[][]): LabelPair[] {
	const pairs: LabelPair[] = [];
	matrix.forEach((row, i) =>
		row.forEach((count, j) => {
			for (let c = 0; c < count; c++) pairs.push({ a: categories[i], b: categories[j] });
		})
	);
	return pairs;
}

describe('cohensKappa', () => {
	it('returns 1 for perfect agreement', () => {
		const pairs = POLARITY.map((label) => ({ a: label, b: label }));
		const result = cohensKappa(pairs, POLARITY);
		expect(result.kappa).toBeCloseTo(1);
		expect(result.observedAgreement).toBeCloseTo(1);
		expect(result.n).toBe(5);
	});

	it('returns ~0 when agreement is exactly what chance predicts', () => {
		// Both raters split 50/50 independently: observed agreement 0.5 equals
		// expected agreement 0.5, so the chance-corrected value is 0.
		const pairs = pairsFromMatrix(
			['A', 'B'],
			[
				[25, 25],
				[25, 25]
			]
		);
		const result = cohensKappa(pairs, ['A', 'B']);
		expect(result.kappa).toBeCloseTo(0, 10);
	});

	it('goes negative when agreement is worse than chance', () => {
		const pairs = pairsFromMatrix(
			['A', 'B'],
			[
				[0, 50],
				[50, 0]
			]
		);
		expect(cohensKappa(pairs, ['A', 'B']).kappa).toBeLessThan(0);
	});

	it('matches a hand-computed textbook value', () => {
		// Standard 2x2 worked example: Po = 0.70, Pe = 0.50, kappa = 0.40.
		const pairs = pairsFromMatrix(
			['yes', 'no'],
			[
				[20, 5],
				[10, 15]
			]
		);
		const result = cohensKappa(pairs, ['yes', 'no']);
		expect(result.observedAgreement).toBeCloseTo(0.7);
		expect(result.expectedAgreement).toBeCloseTo(0.5);
		expect(result.kappa).toBeCloseTo(0.4);
	});

	it('rates a one-notch systematic offset far higher when weighted', () => {
		// The real ChatGPT/Mistral centrality signature: everything shifted down
		// exactly one category. Unweighted kappa reads this as near-total
		// disagreement; ordinal weighting correctly reads it as close agreement.
		const pairs = pairsFromMatrix(POLARITY, [
			[0, 20, 0, 0, 0],
			[0, 0, 20, 0, 0],
			[0, 0, 0, 20, 0],
			[0, 0, 0, 0, 20],
			[0, 0, 0, 0, 20]
		]);

		const unweighted = cohensKappa(pairs, POLARITY, 'none');
		const quadratic = cohensKappa(pairs, POLARITY, 'quadratic');

		expect(unweighted.kappa).toBeLessThan(0.3);
		expect(quadratic.kappa).toBeGreaterThan(unweighted.kappa + 0.4);
	});

	it('orders the weighting schemes as none <= linear <= quadratic for ordinal drift', () => {
		const pairs = pairsFromMatrix(POLARITY, [
			[10, 5, 0, 0, 0],
			[4, 10, 5, 0, 0],
			[0, 4, 10, 5, 0],
			[0, 0, 4, 10, 5],
			[0, 0, 0, 4, 10]
		]);

		const none = cohensKappa(pairs, POLARITY, 'none').kappa;
		const linear = cohensKappa(pairs, POLARITY, 'linear').kappa;
		const quadratic = cohensKappa(pairs, POLARITY, 'quadratic').kappa;

		expect(linear).toBeGreaterThanOrEqual(none);
		expect(quadratic).toBeGreaterThanOrEqual(linear);
	});

	it('drops pairs carrying a label outside the category list', () => {
		const result = cohensKappa(
			[
				{ a: 'Positif', b: 'Positif' },
				{ a: 'Positif', b: 'Non applicable' },
				{ a: 'inconnu', b: 'Positif' }
			],
			POLARITY
		);
		expect(result.n).toBe(1);
	});

	it('reports NaN rather than 0 when kappa is undefined', () => {
		// Every rating in one category: expected agreement is 1, so there is no
		// chance-agreement baseline to correct against.
		const pairs = pairsFromMatrix(
			['A', 'B'],
			[
				[10, 0],
				[0, 0]
			]
		);
		expect(Number.isNaN(cohensKappa(pairs, ['A', 'B']).kappa)).toBe(true);
	});

	it('handles an empty input without throwing', () => {
		const result = cohensKappa([], POLARITY);
		expect(result.n).toBe(0);
		expect(Number.isNaN(result.kappa)).toBe(true);
	});
});

describe('buildConfusionMatrix', () => {
	const categories = ['Marginal', 'Secondaire', 'Central'];

	it('cross-tabulates counts with row-relative percentages', () => {
		const pairs = pairsFromMatrix(categories, [
			[8, 2, 0],
			[0, 5, 5],
			[0, 0, 10]
		]);
		const matrix = buildConfusionMatrix(pairs, categories);

		const cell = (i: number, j: number) =>
			matrix.cells.find((c) => c.rowIndex === i && c.columnIndex === j)!;

		expect(cell(0, 0).count).toBe(8);
		expect(cell(0, 0).rowPercent).toBeCloseTo(80);
		expect(cell(1, 2).rowPercent).toBeCloseTo(50);
		expect(matrix.n).toBe(30);
	});

	it('computes row and column totals', () => {
		const pairs = pairsFromMatrix(categories, [
			[8, 2, 0],
			[0, 5, 5],
			[0, 0, 10]
		]);
		const matrix = buildConfusionMatrix(pairs, categories);
		expect(matrix.rowTotals).toEqual([10, 10, 10]);
		expect(matrix.columnTotals).toEqual([8, 7, 15]);
	});

	it('separates exact from adjacent agreement', () => {
		// Everything sits exactly one category off the diagonal.
		const pairs = pairsFromMatrix(categories, [
			[0, 10, 0],
			[0, 0, 10],
			[0, 10, 0]
		]);
		const matrix = buildConfusionMatrix(pairs, categories);

		expect(matrix.exactAgreement).toBe(0);
		expect(matrix.adjacentAgreement).toBe(1);
	});

	it('emits a full grid of cells even where counts are zero', () => {
		const matrix = buildConfusionMatrix([{ a: 'Marginal', b: 'Marginal' }], categories);
		expect(matrix.cells).toHaveLength(9);
	});

	it('avoids dividing by an empty row', () => {
		const matrix = buildConfusionMatrix([{ a: 'Marginal', b: 'Central' }], categories);
		const emptyRowCells = matrix.cells.filter((c) => c.rowIndex === 1);
		emptyRowCells.forEach((c) => expect(c.rowPercent).toBe(0));
	});
});

describe('interpretKappa', () => {
	it('maps values onto the Landis & Koch bands', () => {
		expect(interpretKappa(-0.1)).toBe('poor');
		expect(interpretKappa(0.15)).toBe('slight');
		expect(interpretKappa(0.35)).toBe('fair');
		expect(interpretKappa(0.55)).toBe('moderate');
		expect(interpretKappa(0.75)).toBe('substantial');
		expect(interpretKappa(0.95)).toBe('almostPerfect');
	});

	it('returns null for an undefined kappa so the UI can show n/a', () => {
		expect(interpretKappa(NaN)).toBeNull();
	});
});

describe('fleissKappa', () => {
	it('returns 1 when every rater always agrees', () => {
		const items = [
			['Positif', 'Positif', 'Positif'],
			['Neutre', 'Neutre', 'Neutre']
		];
		expect(fleissKappa(items, POLARITY).kappa).toBeCloseTo(1);
	});

	it('reports the rater count and complete-case n', () => {
		const result = fleissKappa(
			[
				['Positif', 'Positif', 'Neutre'],
				['Neutre', 'Neutre', 'Neutre']
			],
			POLARITY
		);
		expect(result.raters).toBe(3);
		expect(result.n).toBe(2);
	});

	it('drops incomplete items rather than mixing rater counts', () => {
		// The second article is missing a model's label; counting it as a
		// two-rater item would answer a different question than the rest.
		const result = fleissKappa(
			[
				['Positif', 'Positif', 'Neutre'],
				['Neutre', 'Neutre'],
				['Neutre', 'Neutre', 'Neutre']
			],
			POLARITY
		);
		expect(result.n).toBe(2);
	});

	it('drops items carrying an unknown label', () => {
		const result = fleissKappa(
			[
				['Positif', 'Positif', 'Neutre'],
				['Positif', 'Positif', 'inconnu']
			],
			POLARITY
		);
		expect(result.n).toBe(1);
	});

	it('handles empty input without throwing', () => {
		const result = fleissKappa([], POLARITY);
		expect(result.n).toBe(0);
		expect(Number.isNaN(result.kappa)).toBe(true);
	});
});
