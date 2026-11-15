import { describe, expect, it } from 'vitest';
import {
	computeArbiterV2Statistics,
	secondJudgeFilename,
	SECOND_JUDGE_IDS
} from './arbiterV2.svelte';
import { compareJudges } from '#lib/utils/arbiterV2.js';
import { parseArbiterV2EvaluationData } from '#lib/data/validation.js';
import {
	ARBITER_PANEL_IDS,
	SENTIMENT_CONTRACT_V2,
	arbiterPanelFor,
	recusedFor
} from '#lib/domain/sentimentContract.js';
import { ARBITER_BLIND_LABELS } from '#lib/types/data.js';
import type {
	ArbiterBlindLabel,
	ArbiterV2EvaluationData,
	ArbiterV2Preference,
	DatasetId
} from '#lib/types/data.js';

// The arbiter's panel, not the generation's: Haiku is recused.
const MODELS = [...ARBITER_PANEL_IDS] as DatasetId[];

/**
 * The permutation is deliberately *not* the identity: every test below would
 * still pass with a label→model mix-up if A always meant the first model.
 *
 * Built by rotating contract order rather than written out, so it stays a
 * non-identity bijection whatever size the panel is — it went from three models
 * to five once already, and a hand-written map would have had to be rewritten
 * to keep the tests meaningful rather than merely passing.
 */
const PERMUTATION = Object.fromEntries(
	ARBITER_BLIND_LABELS.map((label, index) => [label, MODELS[(index + 2) % MODELS.length]])
) as Record<ArbiterBlindLabel, DatasetId>;

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
			// From the contract, never a literal: the mode string is the contract's to
			// change, and the parser compares the payload against it.
			mode: SENTIMENT_CONTRACT_V2.arbiter.mode,
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

	/** A deep copy whose permutation has been tampered with in one place. */
	function withPermutation(mutate: (permutation: Record<string, DatasetId>) => void) {
		const data = JSON.parse(JSON.stringify(payload([]))) as ArbiterV2EvaluationData;
		mutate(data.metadata.blind_permutation as unknown as Record<string, DatasetId>);
		return data;
	}

	it('rejects a permutation that is not a bijection over the v2 models', () => {
		// One model shown under two labels, so another is never shown at all.
		const data = withPermutation((permutation) => {
			permutation[ARBITER_BLIND_LABELS[1]] = permutation[ARBITER_BLIND_LABELS[0]];
		});
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/bijection/);
	});

	it('rejects a permutation naming a model from the archived generation', () => {
		const data = withPermutation((permutation) => {
			permutation[ARBITER_BLIND_LABELS[0]] = 'chatgpt' as DatasetId;
		});
		expect(() => parseArbiterV2EvaluationData(data)).toThrow(/bijection/);
	});

	it('rejects a permutation that leaves a label unassigned', () => {
		// Every verdict is expressed in labels. A label with no model behind it
		// would resolve to undefined and quietly drop that model's wins.
		const data = withPermutation((permutation) => {
			delete permutation[ARBITER_BLIND_LABELS[ARBITER_BLIND_LABELS.length - 1]];
		});
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

/**
 * A synthetic second-judge file, shaped like the one
 * `arbiter-evaluation-v2-second-judge.py` publishes: a Google judge, whose
 * panel is the generation minus Gemma, under its own permutation.
 */
function secondJudgePayload(developer: 'google' | 'openai' = 'google') {
	const panel = [...arbiterPanelFor(developer)] as DatasetId[];
	const base = JSON.parse(
		JSON.stringify(
			payload([evaluation('1', ['a', 'b', 'c'], 'b'), evaluation('7', ['a', 'b', 'c'], 'c')])
		)
	) as ArbiterV2EvaluationData;
	base.metadata.arbiter_model = 'gemini-4-argon';
	base.metadata.arbiter_name = 'Gemini 4 Argon';
	base.metadata.arbiter_developer = developer;
	base.metadata.recused_models = [...recusedFor(developer)];
	base.metadata.models = panel;
	base.metadata.model_names = Object.fromEntries(panel.map((id) => [id, `Name ${id}`]));
	base.metadata.blind_permutation = Object.fromEntries(
		ARBITER_BLIND_LABELS.map((label, index) => [label, panel[(index + 1) % panel.length]])
	) as Record<ArbiterBlindLabel, DatasetId>;
	return base;
}

describe('second judge', () => {
	it('reads the file the script publishes', () => {
		expect(SECOND_JUDGE_IDS).toContain('gemini-4-argon');
		expect(secondJudgeFilename('gemini-4-argon')).toBe(
			'/data/iwac_arbiter_evaluations_v2_gemini-4-argon.json'
		);
	});

	it('parses a second judge whose panel is the generation minus its developer’s model', () => {
		const data = parseArbiterV2EvaluationData(secondJudgePayload(), 'second');
		expect(data.metadata.models).toEqual([...arbiterPanelFor('google')]);
		expect(data.metadata.models).toContain('haiku');
		expect(data.metadata.models).not.toContain('gemma');
	});

	it('is still rejected by the published parser, whose panel is the contract arbiter’s', () => {
		expect(() => parseArbiterV2EvaluationData(secondJudgePayload())).toThrow(/arbiter panel/);
	});

	it('derives the panel from the developer, never from the file', () => {
		const data = secondJudgePayload();
		// Lists its own developer's model: the unrecused reading recusal prevents.
		data.metadata.models = [...ARBITER_PANEL_IDS];
		expect(() => parseArbiterV2EvaluationData(data, 'second')).toThrow(/arbiter panel/);
	});

	it('rejects an unregistered developer, the published developer, or a wrong recusal', () => {
		const unknown = secondJudgePayload();
		unknown.metadata.arbiter_developer = 'acme';
		expect(() => parseArbiterV2EvaluationData(unknown, 'second')).toThrow(/registered/);

		const same = secondJudgePayload();
		same.metadata.arbiter_developer = SENTIMENT_CONTRACT_V2.arbiter.developer;
		expect(() => parseArbiterV2EvaluationData(same, 'second')).toThrow(/another developer/);

		const recusal = secondJudgePayload();
		recusal.metadata.recused_models = [];
		expect(() => parseArbiterV2EvaluationData(recusal, 'second')).toThrow(/recusal/);
	});

	it('compares with the published judge on own scores over shared articles only', () => {
		const second = parseArbiterV2EvaluationData(secondJudgePayload(), 'second');
		const first = payload([
			evaluation('1', ['a', 'b', 'c'], 'a'),
			evaluation('2', ['a', 'b', 'c'], 'a')
		]);
		const comparison = compareJudges(first, second);
		expect(comparison.sharedArticles).toBe(1);
		// Fixture scores are identical on article 1, whatever each judge preferred.
		expect(comparison.dimensions.map((d) => d.exact.successes)).toEqual([1, 1, 1]);
	});
});
