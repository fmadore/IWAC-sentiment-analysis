import { describe, expect, it } from 'vitest';
import type { Article, DatasetId } from '#lib/types/data.js';
import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
import { buildConfusionMatrix, cohensKappa, type LabelPair } from './agreement';
import {
	DIMENSION_CATEGORIES,
	applicabilityLabel,
	buildLabelColumns,
	buildLabelPairs,
	type ApplicabilityLabel
} from './agreementData';
import {
	agreementMetricValue,
	applicabilityAgreement,
	expectedAdjacentAgreement,
	leaveOneOut,
	panelReliability,
	summarizeAgreement,
	summarizeModelPairs,
	summarizePanelPairs
} from './agreementMetrics';
import { allRows, buildPanelJoin } from './panelJoin';

const pairs: LabelPair[] = [
	{ a: 'Non applicable', b: 'Très négatif' },
	{ a: 'Non applicable', b: 'Non applicable' },
	{ a: 'Très négatif', b: 'Négatif' },
	{ a: 'Neutre', b: 'Neutre' },
	{ a: 'Très positif', b: 'Positif' }
];

describe('versioned weighted agreement', () => {
	it('preserves the archived v1 calculation exactly', () => {
		const result = summarizeAgreement(pairs, 'polarity', 'v1');
		expect(result.weightedMethod).toBe('ordinal-v1');
		expect(result.weightedKappa).toEqual(
			cohensKappa(pairs, DIMENSION_CATEGORIES.polarity, 'quadratic')
		);
		expect(result.weightedKappa.n).toBe(5);
	});

	it('uses applicable-only ordinal pairs in v2 without changing the full categorical matrix', () => {
		const current = summarizeAgreement(pairs, 'polarity', 'v2');
		const archived = summarizeAgreement(pairs, 'polarity', 'v1');
		expect(current.weightedMethod).toBe('applicable-ordinal-v2');
		expect(current.matrix).toEqual(archived.matrix);
		expect(current.kappa).toEqual(archived.kappa);
		expect(current.weightedKappa).toEqual(
			cohensKappa(
				pairs.slice(2),
				['Très négatif', 'Négatif', 'Neutre', 'Positif', 'Très positif'],
				'quadratic'
			)
		);
		expect(agreementMetricValue(current, 'weighted').n).toBe(3);
		expect(agreementMetricValue(current, 'exact').n).toBe(5);
		expect(agreementMetricValue(current, 'kappa').n).toBe(5);
	});

	it('keeps Not addressed as an ordinal centrality response in both generations', () => {
		const centrality = [
			{ a: 'Non abordé', b: 'Marginal' },
			{ a: 'Très central', b: 'Très central' }
		];
		expect(summarizeAgreement(centrality, 'centrality', 'v2').weightedKappa).toEqual(
			summarizeAgreement(centrality, 'centrality', 'v1').weightedKappa
		);
	});

	it('does not report empty applicable subsets as zero agreement', () => {
		const result = summarizeAgreement(pairs.slice(0, 2), 'polarity', 'v2');
		expect(result.matrix.n).toBe(2);
		expect(agreementMetricValue(result, 'weighted').n).toBe(0);
		expect(agreementMetricValue(result, 'weighted').value).toBeNaN();
		expect(result.ordinalAdjacency.value).toBeNaN();
		expect(result.ordinalAdjacency.n).toBe(0);
		expect(agreementMetricValue(summarizeAgreement([], 'polarity', 'v2'), 'exact').value).toBeNaN();
	});

	it('excludes non-ordinal verdicts from v2 within-one-step agreement and preserves v1', () => {
		const sample = [
			{ a: 'Non applicable', b: 'Très négatif' },
			{ a: 'Très positif', b: 'Très négatif' }
		];
		const current = summarizeAgreement(sample, 'polarity', 'v2');
		const legacy = summarizeAgreement(sample, 'polarity', 'v1');
		expect(current.matrix.adjacentAgreement).toBe(0.5);
		expect(current.ordinalAdjacency).toEqual({ value: 0, expected: 0, n: 1 });
		expect(legacy.ordinalAdjacency).toEqual({ value: 0.5, expected: 0.5, n: 2 });
	});
});

function article(id: number, model: DatasetId): Article {
	return {
		'o:id': id,
		dataset_id: model,
		sentiment_analysis: {
			polarite: id % 2 ? 'Positif' : 'Neutre',
			polarite_justification: null,
			centralite_islam_musulmans: 'Central',
			centralite_justification: null,
			subjectivite_score: 2,
			subjectivite_justification: null
		}
	};
}

it.each([
	['v1', 3],
	['v2', 15]
] as const)('enumerates the %s contract pairs without splitting model ids', (generation, count) => {
	const models = datasetIdsOf(generation);
	const datasets = Object.fromEntries(
		models.map((model) => [model, [article(1, model), article(2, model)]])
	);
	const result = summarizeModelPairs(datasets, generation, 'polarity');
	expect(result).toHaveLength(count);
	for (const pair of result) {
		expect(pair.models).toHaveLength(2);
		expect(pair.matrix.n).toBe(2);
		expect(agreementMetricValue(pair, 'exact').value).toBe(1);
	}
	if (generation === 'v2')
		expect(result.find((pair) => pair.pair === 'mistral-small-deepseek')?.models).toEqual([
			'mistral-small',
			'deepseek'
		]);
});

describe('chance-expected within-one agreement', () => {
	it('is the share of marginal products within one step', () => {
		// Rows [2, 0, 0]; columns [0, 1, 1] over three ordered categories: only
		// the 0→1 cell is within one step, so chance is 1/2.
		const matrix = buildConfusionMatrix(
			[
				{ a: 'a', b: 'b' },
				{ a: 'a', b: 'c' }
			],
			['a', 'b', 'c']
		);
		expect(expectedAdjacentAgreement(matrix)).toBe(0.5);
		expect(expectedAdjacentAgreement(buildConfusionMatrix([], ['a']))).toBeNaN();
	});

	it('is high whenever the mass sits in three adjacent categories', () => {
		const sample = [
			...Array.from({ length: 40 }, () => ({ a: 'Neutre', b: 'Neutre' })),
			...Array.from({ length: 30 }, () => ({ a: 'Positif', b: 'Neutre' })),
			...Array.from({ length: 30 }, () => ({ a: 'Négatif', b: 'Positif' }))
		];
		const result = summarizeAgreement(sample, 'polarity', 'v2');
		expect(result.ordinalAdjacency.expected).toBeGreaterThan(0.6);
	});
});

describe('panel reliability over label columns', () => {
	const columns = [
		['Positif', 'Neutre', 'Négatif', 'Positif', null],
		['Positif', 'Neutre', 'Négatif', 'Neutre', 'Neutre'],
		['Positif', 'Positif', 'Négatif', 'Positif', 'Neutre']
	];
	const rows = [0, 1, 2, 3, 4];

	it('keeps incomplete rows for alpha and drops them for Fleiss', () => {
		const result = panelReliability(columns, rows, 'polarity', 'v2');
		expect(result.fleiss.n).toBe(4);
		expect(result.nominalAlpha.units).toBe(5);
		expect(result.ordinalAlpha.units).toBe(5);
		expect(result.ordinalAlpha.alpha).toBeGreaterThan(result.nominalAlpha.alpha);
	});

	it('leaves Non applicable out of v2 ordinal polarity only', () => {
		const withNA = [
			['Non applicable', 'Positif', 'Négatif'],
			['Neutre', 'Positif', 'Négatif'],
			['Neutre', 'Positif', 'Négatif']
		];
		const current = panelReliability(withNA, [0, 1, 2], 'polarity', 'v2');
		const archive = panelReliability(withNA, [0, 1, 2], 'polarity', 'v1');
		// v2 ordinal drops the verdict but keeps the unit's other two ratings.
		expect(current.ordinalAlpha.values).toBe(8);
		expect(current.ordinalAlpha.alpha).toBe(1);
		expect(archive.ordinalAlpha.values).toBe(9);
		expect(current.nominalAlpha).toEqual(archive.nominalAlpha);
	});

	it('recomputes the panel with each model left out', () => {
		const models = datasetIdsOf('v1');
		const loo = leaveOneOut(columns, models, rows, 'polarity', 'v1');
		expect(loo.map((row) => row.leftOut)).toEqual(models);
		expect(loo[0].reliability).toEqual(panelReliability(columns.slice(1), rows, 'polarity', 'v1'));
		// Leaving out the model with the missing rating restores the row for Fleiss.
		expect(loo[0].reliability.fleiss.n).toBe(5);
		expect(leaveOneOut(columns.slice(0, 2), models.slice(0, 2), rows, 'polarity', 'v1')).toEqual(
			[]
		);
	});
});

describe('applicability agreement', () => {
	it('derives the verdict from both scales and keeps missing ratings apart', () => {
		const base = article(1, 'chatgpt').sentiment_analysis!;
		expect(applicabilityLabel(base)).toBe('addressed');
		expect(applicabilityLabel({ ...base, polarite: 'Non applicable' })).toBe('not-addressed');
		expect(applicabilityLabel({ ...base, centralite_islam_musulmans: 'Non abordé' })).toBe(
			'not-addressed'
		);
		expect(applicabilityLabel({ ...base, polarite: null })).toBeNull();
		expect(applicabilityLabel(null)).toBeNull();
	});

	it('counts split verdicts, pair kappas and per-model totals', () => {
		const models = datasetIdsOf('v1');
		const columns: (ApplicabilityLabel | null)[][] = [
			['addressed', 'addressed', 'not-addressed', null],
			['addressed', 'not-addressed', 'not-addressed', 'addressed'],
			['addressed', 'addressed', 'not-addressed', null]
		];
		const result = applicabilityAgreement(columns, models, [0, 1, 2, 3], 'v1');
		expect(result.rated).toBe(3);
		expect(result.mixed).toBe(1);
		expect(result.allAddressed).toBe(1);
		expect(result.allNotAddressed).toBe(1);
		expect(result.pairs).toHaveLength(3);
		expect(result.pairs.find((pair) => pair.pair === 'chatgpt-gemini')?.disagreements).toBe(1);
		expect(result.perModel[0]).toEqual({
			modelId: 'chatgpt',
			addressed: 2,
			notAddressed: 1,
			missing: 1
		});
	});
});

it('summarizes pairs from the panel join exactly as the per-pair joins did', () => {
	const models = datasetIdsOf('v2');
	const datasets = Object.fromEntries(
		models.map((model, m) => [
			model,
			[1, 2, 3, 4].map((id) => {
				const entry = article(id, model);
				entry.sentiment_analysis!.polarite = (id + m) % 3 ? 'Positif' : 'Neutre';
				return entry;
			})
		])
	);
	const join = buildPanelJoin(datasets, models)!;
	const columns = buildLabelColumns(join);
	const viaJoin = summarizePanelPairs(columns.polarity, models, allRows(join), 'v2', 'polarity');
	viaJoin.forEach((summary) => {
		const [a, b] = summary.models;
		expect(summary.matrix).toEqual(
			summarizeAgreement(buildLabelPairs(datasets[a], datasets[b], 'polarity'), 'polarity', 'v2')
				.matrix
		);
	});
});
