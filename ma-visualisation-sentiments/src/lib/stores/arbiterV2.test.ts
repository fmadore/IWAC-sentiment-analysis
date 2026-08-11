import { describe, expect, it } from 'vitest';
import { computeArbiterV2Statistics } from './arbiterV2.svelte';
import { parseArbiterV2EvaluationData } from '$lib/data/validation';
import { SENTIMENT_CONTRACT_V2, datasetIdsOf } from '$lib/domain/sentimentContract';
import type { ArbiterV2EvaluationData, ArbiterV2Preference, DatasetId } from '$lib/types/data';

const MODELS = datasetIdsOf('v2') as DatasetId[];

/**
 * The permutation is deliberately *not* the identity: every test below would
 * still pass with a label→model mix-up if A always meant the first model.
 */
const PERMUTATION = { a: MODELS[2], b: MODELS[0], c: MODELS[1] };

function verdict(preferred: ArbiterV2Preference) {
	return {
		score: 'Positif',
		justification: 'j',
		preferred,
		verdict_explanation: 'e'
	};
}

function evaluation(
	articleId: string,
	preferences: [ArbiterV2Preference, ArbiterV2Preference, ArbiterV2Preference],
	overall: ArbiterV2Preference,
	confidence: 'high' | 'medium' | 'low' = 'high',
	totalSpread = 4
) {
	return {
		article_id: articleId,
		cache_fingerprint: `fp-${articleId}`,
		spread: {
			polarity_spread: totalSpread,
			subjectivity_spread: 0,
			centrality_spread: 0,
			total_spread: totalSpread,
			has_significant_spread: true
		},
		arbiter: {
			article_id: articleId,
			polarity: verdict(preferences[0]),
			subjectivity: { ...verdict(preferences[1]), score: '3' },
			centrality: { ...verdict(preferences[2]), score: 'Central' },
			overall_winner: overall,
			overall_explanation: 'x',
			confidence_level: confidence,
			timestamp: '2026-08-10T00:00:00'
		}
	};
}

function payload(evaluations: ReturnType<typeof evaluation>[]): ArbiterV2EvaluationData {
	return {
		metadata: {
			generated: '2026-08-10T00:00:00',
			arbiter_model: SENTIMENT_CONTRACT_V2.arbiter.arbiterModel,
			mode: 'three-way',
			effort: 'medium',
			blind_evaluation: true,
			models: MODELS,
			model_names: Object.fromEntries(MODELS.map((id) => [id, `Name ${id}`])),
			blind_permutation: PERMUTATION,
			selection: {
				rule: 'spread',
				threshold: 3,
				limit: null,
				eligible_articles: 900,
				selected_articles: evaluations.length
			},
			total_articles: evaluations.length,
			successful_evaluations: evaluations.length,
			failed_evaluations: 0,
			contract_schema_version: SENTIMENT_CONTRACT_V2.schemaVersion,
			analysis_version: 'v2',
			cache_schema_version: SENTIMENT_CONTRACT_V2.arbiter.cacheSchemaVersion,
			prompt_version: SENTIMENT_CONTRACT_V2.arbiter.promptVersion,
			source: {
				scores: { repository: 'public', revision: 'r1' },
				text: { repository: 'private', revision: 'r2' }
			}
		},
		evaluations
	} as ArbiterV2EvaluationData;
}

describe('computeArbiterV2Statistics', () => {
	it('returns an empty, non-throwing shape when there is no run yet', () => {
		const stats = computeArbiterV2Statistics(null);
		expect(stats.hasData).toBe(false);
		expect(stats.totalEvaluated).toBe(0);
		expect(stats.models).toEqual([]);
		expect(stats.dimensions).toHaveLength(3);
	});

	it('resolves anonymised labels back through the permutation, not by position', () => {
		// Every verdict names label "a", which this permutation maps to the LAST
		// model in contract order.
		const stats = computeArbiterV2Statistics(payload([evaluation('1', ['a', 'a', 'a'], 'a')]));
		const byId = Object.fromEntries(stats.models.map((model) => [model.modelId, model]));

		expect(byId[MODELS[2]].dimensionWins).toBe(3);
		expect(byId[MODELS[2]].overallWins).toBe(1);
		expect(byId[MODELS[0]].dimensionWins).toBe(0);
		expect(byId[MODELS[1]].dimensionWins).toBe(0);
		expect(byId[MODELS[2]].label).toBe('a');
	});

	it('keeps model rows in contract order regardless of the permutation', () => {
		const stats = computeArbiterV2Statistics(payload([evaluation('1', ['a', 'b', 'c'], 'b')]));
		expect(stats.models.map((model) => model.modelId)).toEqual([...MODELS]);
	});

	it('counts multiple and none separately rather than folding them into a tie', () => {
		const stats = computeArbiterV2Statistics(
			payload([
				evaluation('1', ['multiple', 'none', 'a'], 'multiple'),
				evaluation('2', ['none', 'none', 'b'], 'none')
			])
		);
		expect(stats.multiple).toBe(1);
		expect(stats.none).toBe(3);
		expect(stats.overallMultiple).toBe(1);
		expect(stats.overallNone).toBe(1);
		// 6 dimension verdicts across 2 articles: 2 named a model, 4 did not.
		expect(stats.totalVerdicts).toBe(6);
		expect(stats.multiplePercentage).toBeCloseTo((1 / 6) * 100);
	});

	it('shares sum to 100% across the models plus multiple and none', () => {
		const stats = computeArbiterV2Statistics(
			payload([
				evaluation('1', ['a', 'b', 'c'], 'a'),
				evaluation('2', ['multiple', 'none', 'a'], 'b')
			])
		);
		const total =
			stats.models.reduce((sum, model) => sum + model.dimensionPercentage, 0) +
			stats.multiplePercentage +
			stats.nonePercentage;
		expect(total).toBeCloseTo(100);
	});

	it('breaks verdicts down per dimension', () => {
		const stats = computeArbiterV2Statistics(
			payload([evaluation('1', ['a', 'multiple', 'none'], 'a')])
		);
		const [polarity, subjectivity, centrality] = stats.dimensions;
		expect(polarity.byModel[PERMUTATION.a]).toBe(1);
		expect(subjectivity.multiple).toBe(1);
		expect(centrality.none).toBe(1);
	});

	it('tallies confidence levels', () => {
		const stats = computeArbiterV2Statistics(
			payload([
				evaluation('1', ['a', 'a', 'a'], 'a', 'high'),
				evaluation('2', ['b', 'b', 'b'], 'b', 'low'),
				evaluation('3', ['c', 'c', 'c'], 'c', 'low')
			])
		);
		expect(stats.confidence).toEqual({ high: 1, medium: 0, low: 2 });
	});
});

describe('parseArbiterV2EvaluationData', () => {
	it('accepts a well-formed payload', () => {
		const data = payload([evaluation('1', ['a', 'b', 'c'], 'a')]);
		expect(parseArbiterV2EvaluationData(JSON.parse(JSON.stringify(data)))).toBeTruthy();
	});

	it('rejects a permutation that is not a bijection over the v2 models', () => {
		const data = JSON.parse(JSON.stringify(payload([]))) as ArbiterV2EvaluationData;
		data.metadata.blind_permutation = { a: MODELS[0], b: MODELS[0], c: MODELS[1] };
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/bijection/);
	});

	it('rejects a permutation naming a model from the archived generation', () => {
		const data = JSON.parse(JSON.stringify(payload([]))) as ArbiterV2EvaluationData;
		data.metadata.blind_permutation = {
			a: 'chatgpt' as DatasetId,
			b: MODELS[1],
			c: MODELS[2]
		};
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/bijection/);
	});

	it('rejects a payload bound to another contract version', () => {
		const data = JSON.parse(JSON.stringify(payload([]))) as ArbiterV2EvaluationData;
		data.metadata.prompt_version = 'v1.0.0';
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/v2 sentiment contract/);
	});

	it('rejects a stale evaluation count', () => {
		const data = JSON.parse(
			JSON.stringify(payload([evaluation('1', ['a', 'b', 'c'], 'a')]))
		) as ArbiterV2EvaluationData;
		data.metadata.successful_evaluations = 5;
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/successful_evaluations/);
	});

	it('rejects duplicate article ids', () => {
		const data = JSON.parse(
			JSON.stringify(
				payload([evaluation('1', ['a', 'b', 'c'], 'a'), evaluation('1', ['a', 'b', 'c'], 'a')])
			)
		) as ArbiterV2EvaluationData;
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/Duplicate/);
	});
});
