/**
 * Arbiter Module Unit Tests
 *
 * Tests the model mapping logic in the arbiter store, specifically:
 * - getModelsFromPair returns correct model IDs
 * - Model name mapping respects model_a_is_first flag
 * - Statistics computation correctly swaps counts when needed
 */
import { describe, it, expect } from 'vitest';
import { getModelsFromPair, type ArbiterEvaluationData } from '$lib/types/data';
import { computeArbiterStatistics } from './arbiter.svelte';

// ============================================
// getModelsFromPair Tests
// ============================================

describe('getModelsFromPair', () => {
	it('returns correct model IDs for chatgpt-gemini pair', () => {
		const [modelA, modelB] = getModelsFromPair('chatgpt-gemini');
		expect(modelA).toBe('chatgpt');
		expect(modelB).toBe('gemini');
	});

	it('returns correct model IDs for chatgpt-mistral pair', () => {
		const [modelA, modelB] = getModelsFromPair('chatgpt-mistral');
		expect(modelA).toBe('chatgpt');
		expect(modelB).toBe('mistral');
	});

	it('returns correct model IDs for gemini-mistral pair', () => {
		const [modelA, modelB] = getModelsFromPair('gemini-mistral');
		expect(modelA).toBe('gemini');
		expect(modelB).toBe('mistral');
	});
});

// ============================================
// computeArbiterStatistics — tests the REAL shipped function
// ============================================

function makeEvaluation(
	preferred: 'model_a' | 'model_b' | 'both' | 'neither',
	winner: 'model_a' | 'model_b' | 'both' | 'neither'
): ArbiterEvaluationData['evaluations'][number] {
	const dim = {
		score: 'Neutre',
		justification: '',
		preferred_model: preferred,
		verdict_explanation: ''
	};
	return {
		article_id: '1',
		arbiter: {
			article_id: '1',
			polarity: dim,
			subjectivity: dim,
			centrality: dim,
			overall_winner: winner,
			overall_explanation: '',
			confidence_level: 'high',
			timestamp: ''
		},
		discrepancies: {
			polarity_diff: 0,
			subjectivity_diff: 0,
			centrality_diff: 0,
			total_diff: 0,
			has_significant_conflict: false
		}
	};
}

function makeEvaluationData(
	evaluations: ArbiterEvaluationData['evaluations'],
	arbiterModelA: string,
	pairFirstModel: string
): ArbiterEvaluationData {
	return {
		metadata: {
			generated: '',
			arbiter_model: 'test',
			blind_evaluation: true,
			arbiter_model_a: arbiterModelA,
			arbiter_model_b: arbiterModelA === 'ChatGPT' ? 'Gemini' : 'ChatGPT',
			pair: 'chatgpt-gemini',
			pair_first_model: pairFirstModel,
			pair_second_model: pairFirstModel === 'ChatGPT' ? 'Gemini' : 'ChatGPT',
			total_articles: evaluations.length,
			successful_evaluations: evaluations.length,
			failed_evaluations: 0
		},
		evaluations
	};
}

describe('computeArbiterStatistics', () => {
	it('returns hasData: false with model names for null/empty data', () => {
		const empty = computeArbiterStatistics(null, 'ChatGPT', 'Gemini');
		expect(empty.hasData).toBe(false);
		expect(empty.totalEvaluated).toBe(0);
		expect(empty.modelAName).toBe('ChatGPT');
		expect(empty.modelBName).toBe('Gemini');

		const noEvals = computeArbiterStatistics(
			makeEvaluationData([], 'ChatGPT', 'ChatGPT'),
			'ChatGPT',
			'Gemini'
		);
		expect(noEvals.hasData).toBe(false);
	});

	it('counts dimension preferences without swapping when arbiter model A is the pair first model', () => {
		// 2 evaluations preferring model_a on all 3 dimensions, 1 preferring model_b
		const data = makeEvaluationData(
			[
				makeEvaluation('model_a', 'model_a'),
				makeEvaluation('model_a', 'model_a'),
				makeEvaluation('model_b', 'model_b')
			],
			'ChatGPT', // arbiter saw ChatGPT as "Model A"
			'ChatGPT' // and ChatGPT is first in the pair -> no swap
		);
		const stats = computeArbiterStatistics(data, 'ChatGPT', 'Gemini');

		expect(stats.hasData).toBe(true);
		expect(stats.totalEvaluated).toBe(3);
		// 3 dimensions per evaluation
		expect(stats.modelAPreferred).toBe(6);
		expect(stats.modelBPreferred).toBe(3);
		expect(stats.overallModelAWins).toBe(2);
		expect(stats.overallModelBWins).toBe(1);
		expect(stats.overallTies).toBe(0);
	});

	it('swaps counts when the arbiter saw the pair second model as "Model A"', () => {
		const data = makeEvaluationData(
			[
				makeEvaluation('model_a', 'model_a'),
				makeEvaluation('model_a', 'model_a'),
				makeEvaluation('model_b', 'model_b')
			],
			'Gemini', // arbiter saw Gemini as "Model A"
			'ChatGPT' // but ChatGPT is first in the pair -> swap
		);
		const stats = computeArbiterStatistics(data, 'ChatGPT', 'Gemini');

		// model_a counts (6) belong to Gemini, which is the pair SECOND model
		expect(stats.modelAPreferred).toBe(3);
		expect(stats.modelBPreferred).toBe(6);
		expect(stats.overallModelAWins).toBe(1);
		expect(stats.overallModelBWins).toBe(2);
	});

	it('treats both/neither overall winners as ties and computes percentages over all verdicts', () => {
		const data = makeEvaluationData(
			[
				makeEvaluation('both', 'both'),
				makeEvaluation('neither', 'neither'),
				makeEvaluation('model_a', 'model_a'),
				makeEvaluation('model_b', 'model_b')
			],
			'ChatGPT',
			'ChatGPT'
		);
		const stats = computeArbiterStatistics(data, 'ChatGPT', 'Gemini');

		expect(stats.overallTies).toBe(2);
		expect(stats.bothEqual).toBe(3);
		expect(stats.neitherAccurate).toBe(3);
		// 12 dimension verdicts total; 3 each of a/b/both/neither
		expect(stats.modelAPercentage).toBeCloseTo(25);
		expect(stats.modelBPercentage).toBeCloseTo(25);
		expect(stats.bothPercentage).toBeCloseTo(25);
		expect(stats.neitherPercentage).toBeCloseTo(25);
	});
});

// ============================================
// getActualModelName Logic Tests
// ============================================

describe('getActualModelName Logic', () => {
	/**
	 * Pure function that replicates the getActualModelName logic
	 * This tests the core mapping without needing the actual store state
	 */
	function getActualModelNamePure(
		preferredModel: 'model_a' | 'model_b' | 'both' | 'neither',
		firstModelName: string,
		secondModelName: string,
		modelAIsFirst: boolean
	): string {
		if (preferredModel === 'both' || preferredModel === 'neither') {
			return preferredModel;
		}

		if (preferredModel === 'model_a') {
			return modelAIsFirst ? firstModelName : secondModelName;
		} else {
			return modelAIsFirst ? secondModelName : firstModelName;
		}
	}

	describe('special cases', () => {
		it('returns "both" unchanged', () => {
			const result = getActualModelNamePure('both', 'ChatGPT', 'Gemini', true);
			expect(result).toBe('both');
		});

		it('returns "neither" unchanged', () => {
			const result = getActualModelNamePure('neither', 'ChatGPT', 'Gemini', false);
			expect(result).toBe('neither');
		});
	});

	describe('when model_a_is_first is true', () => {
		it('maps model_a to first model name', () => {
			const result = getActualModelNamePure('model_a', 'ChatGPT', 'Mistral', true);
			expect(result).toBe('ChatGPT');
		});

		it('maps model_b to second model name', () => {
			const result = getActualModelNamePure('model_b', 'ChatGPT', 'Mistral', true);
			expect(result).toBe('Mistral');
		});
	});

	describe('when model_a_is_first is false', () => {
		it('maps model_a to SECOND model name (swapped)', () => {
			const result = getActualModelNamePure('model_a', 'ChatGPT', 'Gemini', false);
			expect(result).toBe('Gemini');
		});

		it('maps model_b to FIRST model name (swapped)', () => {
			const result = getActualModelNamePure('model_b', 'ChatGPT', 'Gemini', false);
			expect(result).toBe('ChatGPT');
		});
	});

	describe('chatgpt-gemini pair (model_a_is_first: false)', () => {
		// In this pair: first = ChatGPT, second = Gemini
		// With model_a_is_first: false, model_a in JSON = Gemini, model_b in JSON = ChatGPT

		it('correctly identifies Gemini when arbiter says model_a preferred', () => {
			const result = getActualModelNamePure('model_a', 'ChatGPT', 'Gemini', false);
			expect(result).toBe('Gemini');
		});

		it('correctly identifies ChatGPT when arbiter says model_b preferred', () => {
			const result = getActualModelNamePure('model_b', 'ChatGPT', 'Gemini', false);
			expect(result).toBe('ChatGPT');
		});
	});

	describe('gemini-mistral pair (model_a_is_first: false)', () => {
		// In this pair: first = Gemini, second = Mistral
		// With model_a_is_first: false, model_a in JSON = Mistral, model_b in JSON = Gemini

		it('correctly identifies Mistral when arbiter says model_a preferred', () => {
			const result = getActualModelNamePure('model_a', 'Gemini', 'Mistral', false);
			expect(result).toBe('Mistral');
		});

		it('correctly identifies Gemini when arbiter says model_b preferred', () => {
			const result = getActualModelNamePure('model_b', 'Gemini', 'Mistral', false);
			expect(result).toBe('Gemini');
		});
	});
});
