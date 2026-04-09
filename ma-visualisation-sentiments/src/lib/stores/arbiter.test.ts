/**
 * Arbiter Module Unit Tests
 *
 * Tests the model mapping logic in the arbiter store, specifically:
 * - getModelsFromPair returns correct model IDs
 * - Model name mapping respects model_a_is_first flag
 * - Statistics computation correctly swaps counts when needed
 */
import { describe, it, expect } from 'vitest';
import { getModelsFromPair, type ModelPair } from '$lib/types/data';

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
// Model Mapping Logic Tests
// ============================================

describe('Model Mapping Logic', () => {
	// Test the pure logic that should be used in computeArbiterStatistics

	interface MockMetadata {
		model_a_is_first: boolean;
		model_a_name: string;
		model_b_name: string;
	}

	interface MockCounts {
		model_a: number;
		model_b: number;
		both: number;
		neither: number;
	}

	/**
	 * Pure function that replicates the mapping logic from computeArbiterStatistics
	 */
	function mapCountsToModels(
		pair: ModelPair,
		counts: MockCounts,
		metadata: MockMetadata
	): { firstModelPreferred: number; secondModelPreferred: number } {
		const modelAIsFirst = metadata.model_a_is_first;

		// When modelAIsFirst is true: JSON's model_a = first model, model_b = second model
		// When modelAIsFirst is false: JSON's model_a = second model, model_b = first model (need to swap)
		const firstModelPreferred = modelAIsFirst ? counts.model_a : counts.model_b;
		const secondModelPreferred = modelAIsFirst ? counts.model_b : counts.model_a;

		return { firstModelPreferred, secondModelPreferred };
	}

	describe('when model_a_is_first is true (chatgpt-mistral)', () => {
		const mockMetadata: MockMetadata = {
			model_a_is_first: true,
			model_a_name: 'ChatGPT',
			model_b_name: 'Mistral'
		};

		it('maps model_a counts to first model (ChatGPT)', () => {
			const counts: MockCounts = { model_a: 10, model_b: 5, both: 2, neither: 1 };
			const result = mapCountsToModels('chatgpt-mistral', counts, mockMetadata);

			// model_a counts should go to first model (ChatGPT)
			expect(result.firstModelPreferred).toBe(10);
			// model_b counts should go to second model (Mistral)
			expect(result.secondModelPreferred).toBe(5);
		});

		it('correctly handles zero counts', () => {
			const counts: MockCounts = { model_a: 0, model_b: 0, both: 0, neither: 0 };
			const result = mapCountsToModels('chatgpt-mistral', counts, mockMetadata);

			expect(result.firstModelPreferred).toBe(0);
			expect(result.secondModelPreferred).toBe(0);
		});
	});

	describe('when model_a_is_first is false (chatgpt-gemini)', () => {
		const mockMetadata: MockMetadata = {
			model_a_is_first: false,
			model_a_name: 'ChatGPT',
			model_b_name: 'Gemini'
		};

		it('swaps model counts - model_b goes to first model (ChatGPT)', () => {
			const counts: MockCounts = { model_a: 10, model_b: 5, both: 2, neither: 1 };
			const result = mapCountsToModels('chatgpt-gemini', counts, mockMetadata);

			// When model_a_is_first is false, model_b in JSON = first model in pair
			// So model_b counts (5) should be first model (ChatGPT)
			expect(result.firstModelPreferred).toBe(5);
			// And model_a counts (10) should be second model (Gemini)
			expect(result.secondModelPreferred).toBe(10);
		});

		it('correctly swaps when model_a has more preferences', () => {
			const counts: MockCounts = { model_a: 20, model_b: 3, both: 5, neither: 2 };
			const result = mapCountsToModels('chatgpt-gemini', counts, mockMetadata);

			// Model B (3 prefs) goes to first position (ChatGPT)
			expect(result.firstModelPreferred).toBe(3);
			// Model A (20 prefs) goes to second position (Gemini)
			expect(result.secondModelPreferred).toBe(20);
		});
	});

	describe('when model_a_is_first is false (gemini-mistral)', () => {
		const mockMetadata: MockMetadata = {
			model_a_is_first: false,
			model_a_name: 'Gemini',
			model_b_name: 'Mistral'
		};

		it('swaps model counts correctly for gemini-mistral', () => {
			const counts: MockCounts = { model_a: 15, model_b: 8, both: 3, neither: 1 };
			const result = mapCountsToModels('gemini-mistral', counts, mockMetadata);

			// When model_a_is_first is false, model_b in JSON = first model in pair
			// First model is Gemini, so it gets model_b counts (8)
			expect(result.firstModelPreferred).toBe(8);
			// Second model is Mistral, so it gets model_a counts (15)
			expect(result.secondModelPreferred).toBe(15);
		});
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
