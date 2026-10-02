import { describe, expect, it } from 'vitest';
import type { Article, DatasetId } from '$lib/types/data';
import { datasetIdsOf } from '$lib/domain/sentimentContract';
import { cohensKappa, type LabelPair } from './agreement';
import { DIMENSION_CATEGORIES } from './agreementData';
import { agreementMetricValue, summarizeAgreement, summarizeModelPairs } from './agreementMetrics';

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
		expect(current.ordinalAdjacency).toEqual({ value: 0, n: 1 });
		expect(legacy.ordinalAdjacency).toEqual({ value: 0.5, n: 2 });
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
	['v2', 10]
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
