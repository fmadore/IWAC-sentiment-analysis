/**
 * Invariants of the two-generation registry.
 *
 * The generation is derived from an id rather than stored, so these tests
 * guard the properties that derivation depends on: ids must not collide, a
 * pair id must be its members joined, and both generations must share the
 * ordinal scales the shared chart code reads from v1.
 */
import { describe, expect, it } from 'vitest';
import {
	ARCHIVED_GENERATION,
	CURRENT_GENERATION,
	DATASET_IDS,
	DATASET_IDS_V1,
	DATASET_IDS_V2,
	GENERATION_IDS,
	MODEL_PAIR_IDS,
	MODEL_PAIR_IDS_V2,
	SENTIMENT_CONTRACTS,
	analysisModelName,
	datasetIdsOf,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	isDatasetId,
	isModelPair,
	modelDisplayName,
	pairIdsOf
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
			['deepseek_v4_flash_0731']
		]);
	});
});

describe('model naming', () => {
	it('names every model from its own contract', () => {
		expect(modelDisplayName('luna')).toBe('GPT-5.6 Luna');
		expect(modelDisplayName('deepseek')).toBe('DeepSeek v4 Flash');
		expect(modelDisplayName('chatgpt')).toBe('ChatGPT');
		expect(analysisModelName('mistral-small')).toBe('Mistral Small 4 2603');
		expect(analysisModelName('mistral')).toBe('Ministral 14B 2512');
	});
});
