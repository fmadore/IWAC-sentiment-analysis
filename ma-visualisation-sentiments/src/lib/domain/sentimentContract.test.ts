/**
 * Invariants of the two-generation registry.
 *
 * The generation is derived from an id rather than stored, so these tests
 * guard the properties that derivation depends on: ids must not collide, a
 * pair id must be its members joined, and both generations must share the
 * ordinal scales the shared chart code reads from v1.
 */
import { describe, expect, it } from 'vitest';
import { ARBITER_BLIND_LABELS } from '$lib/types/data';
import shardFixtures from '$lib/data/justification-shard-fixtures.json';
import {
	ARBITER_DEVELOPER,
	ARBITER_PANEL_IDS,
	ARBITER_RECUSED_IDS,
	ARCHIVED_GENERATION,
	CURRENT_GENERATION,
	DATASET_IDS,
	DEVELOPER_IDS,
	DATASET_IDS_V1,
	DATASET_IDS_V2,
	GENERATION_IDS,
	JUSTIFICATION_SHARD_COUNT,
	MODEL_PAIR_IDS,
	MODEL_PAIR_IDS_V2,
	SENTIMENT_CONTRACTS,
	analysisModelName,
	arbiterPanelFor,
	datasetIdsOf,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	isArbiterRecused,
	isDatasetId,
	isModelPair,
	justificationShard,
	modelDisplayName,
	pairIdsOf,
	recusedFor
} from './sentimentContract';

describe('generation registry', () => {
	it('shows v2 by default and keeps v1 as the archive', () => {
		expect(CURRENT_GENERATION).toBe('v2');
		expect(ARCHIVED_GENERATION).toBe('v1');
		expect(GENERATION_IDS).toEqual(['v1', 'v2']);
	});

	it('never lets ids collide across generations', () => {
		// The whole derivation rests on this: a shared id would make
		// generationOf() ambiguous and silently mix two analyses.
		expect(new Set(DATASET_IDS).size).toBe(DATASET_IDS.length);
		expect(new Set(MODEL_PAIR_IDS).size).toBe(MODEL_PAIR_IDS.length);
		expect(DATASET_IDS_V1.some((id) => DATASET_IDS_V2.includes(id as never))).toBe(false);
	});

	it('derives the generation of every dataset and pair id', () => {
		for (const generation of GENERATION_IDS) {
			for (const id of datasetIdsOf(generation)) expect(generationOf(id)).toBe(generation);
			for (const pair of pairIdsOf(generation)) expect(generationOf(pair)).toBe(generation);
		}
	});

	it('defaults to the first model and pair of a generation', () => {
		expect(defaultDatasetOf('v2')).toBe('luna');
		expect(defaultPairOf('v2')).toBe('luna-mistral-small');
		expect(defaultDatasetOf('v1')).toBe('chatgpt');
		expect(defaultPairOf('v1')).toBe('chatgpt-gemini');
	});
});

describe('pair membership', () => {
	it('resolves every pair to two models of its own generation', () => {
		for (const pair of MODEL_PAIR_IDS) {
			const models = getPairModels(pair);
			expect(models).toHaveLength(2);
			expect(models.join('-')).toBe(pair);
			expect(models.every(isDatasetId)).toBe(true);
			expect(new Set(models.map(generationOf)).size).toBe(1);
		}
	});

	it('resolves a pair whose model id contains a hyphen', () => {
		// The trap this guards: splitting on '-' yields ('mistral', 'small-deepseek').
		expect(getPairModels('mistral-small-deepseek')).toEqual(['mistral-small', 'deepseek']);
		expect(getPairModels('luna-mistral-small')).toEqual(['luna', 'mistral-small']);
		expect(MODEL_PAIR_IDS_V2.every(isModelPair)).toBe(true);
	});
});

describe('shared scales', () => {
	it('keeps the v2 polarity and centrality scales identical to v1', () => {
		expect(SENTIMENT_CONTRACTS.v2.scales.polarity).toEqual(SENTIMENT_CONTRACTS.v1.scales.polarity);
		expect(SENTIMENT_CONTRACTS.v2.scales.centrality).toEqual(
			SENTIMENT_CONTRACTS.v1.scales.centrality
		);
	});

	it('uses exact model column prefixes with no vendor aliases in v2', () => {
		const prefixes = Object.values(SENTIMENT_CONTRACTS.v2.models).map((model) => model.hfPrefixes);
		expect(prefixes).toEqual([
			['gpt_5_6_luna'],
			['mistral_small_2603'],
			['deepseek_v4_flash_0731'],
			['gemma_4_31b_it'],
			['qwen3_8_27b'],
			['claude_haiku_5_5']
		]);
	});
});

describe('panel completeness', () => {
	it('declares every unordered pair of the v2 panel exactly once', () => {
		// The pair list is hand-authored in two places (the tuple here, the JSON
		// the pipeline reads) and grows quadratically: six models are fifteen pairs,
		// and a missing one is invisible — the picker simply never offers that
		// comparison, and nobody notices a conversation that was never had.
		const models = datasetIdsOf('v2');
		const expected = models.flatMap((a, index) => models.slice(index + 1).map((b) => `${a}-${b}`));

		expect([...pairIdsOf('v2')].sort()).toEqual([...expected].sort());
		expect(pairIdsOf('v2')).toHaveLength((models.length * (models.length - 1)) / 2);
	});

	it('gives the arbiter one blind label per model it reads', () => {
		// The permutation is a bijection labels → models; too few labels would
		// leave a model unnameable in a verdict, too many would name a model that
		// does not exist. parseArbiterV2EvaluationData enforces this at load.
		expect(ARBITER_BLIND_LABELS).toHaveLength(ARBITER_PANEL_IDS.length);
	});

	it('recuses the panel member that shares the arbiter’s developer', () => {
		// Claude Haiku 5.5 and the judge, Claude Opus 5, are both Anthropic's.
		// The arbiter's panel is every other model: exactly the five the
		// published run judged, so adding Haiku invalidated no verdict.
		expect(ARBITER_RECUSED_IDS).toEqual(['haiku']);
		expect(ARBITER_PANEL_IDS).toEqual(['luna', 'mistral-small', 'deepseek', 'gemma', 'qwen']);
		expect(isArbiterRecused('haiku')).toBe(true);
		expect(isArbiterRecused('luna')).toBe(false);
		expect(datasetIdsOf('v2')).toContain('haiku');
	});

	it('derives each judge’s recusal from its developer, as Python does', () => {
		// Mirrors SentimentContract.recused_for / panel_for: the contract names
		// who built each model, never which models a judge recuses.
		expect(ARBITER_DEVELOPER).toBe('anthropic');
		expect(recusedFor('google')).toEqual(['gemma']);
		expect(recusedFor('openai')).toEqual(['luna']);
		expect(arbiterPanelFor('google')).toEqual([
			'luna',
			'mistral-small',
			'deepseek',
			'qwen',
			'haiku'
		]);
		// Every frontier developer has one member, so every judge reads five.
		for (const developer of DEVELOPER_IDS) {
			expect(recusedFor(developer)).toHaveLength(1);
			expect(arbiterPanelFor(developer)).toHaveLength(ARBITER_BLIND_LABELS.length);
		}
	});
});

describe('model naming', () => {
	it('names every model from its own contract', () => {
		expect(modelDisplayName('luna')).toBe('GPT-5.6 Luna');
		expect(modelDisplayName('deepseek')).toBe('DeepSeek v4 Flash');
		expect(modelDisplayName('gemma')).toBe('Gemma 4 31B');
		expect(modelDisplayName('qwen')).toBe('Qwen3.8 27B');
		expect(modelDisplayName('haiku')).toBe('Claude Haiku 5.5');
		expect(analysisModelName('haiku')).toBe('Claude Haiku 5.5');
		expect(modelDisplayName('chatgpt')).toBe('ChatGPT');
		expect(analysisModelName('mistral-small')).toBe('Mistral Small 4 2603');
		expect(analysisModelName('gemma')).toBe('Gemma 4 31B IT');
		expect(analysisModelName('mistral')).toBe('Ministral 14B 2512');
	});
});

/**
 * The browser fetches exactly the shard this names; the Python pipeline placed
 * the row with its own implementation. `data-preprocess/test_shards.py` reads
 * the same fixture, so the two cannot drift apart.
 */
describe('shared justification shard contract', () => {
	it('uses the contract shard count', () => {
		expect(shardFixtures.shardCount).toBe(JUSTIFICATION_SHARD_COUNT);
	});

	for (const fixture of shardFixtures.cases) {
		it(fixture.name, () => {
			expect(justificationShard(fixture.id)).toBe(fixture.shard);
		});
	}

	it('shards a numeric id like its decimal string', () => {
		expect(justificationShard(12345)).toBe(justificationShard('12345'));
	});
});
