/**
 * Datasets Store Unit Tests
 *
 * Tests the runes-based datasetState accessor:
 * - available datasets config
 * - selection, comparison mode, pair
 * - getById / current helpers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { datasetState } from '$lib/stores/datasets.svelte';

beforeEach(() => {
	datasetState.selected = 'chatgpt';
	datasetState.isComparisonMode = false;
	datasetState.pair = 'chatgpt-gemini';
});

describe('datasetState.available', () => {
	it('contains both generations', () => {
		expect(datasetState.available).toHaveLength(6);
		expect(datasetState.available.map((d) => d.id)).toEqual([
			'chatgpt',
			'gemini',
			'mistral',
			'luna',
			'mistral-small',
			'deepseek'
		]);
	});

	it('has correct structure for each dataset', () => {
		datasetState.available.forEach((dataset) => {
			expect(dataset).toHaveProperty('id');
			expect(dataset).toHaveProperty('generation');
			expect(dataset).toHaveProperty('name');
			expect(dataset).toHaveProperty('file');
			expect(dataset).toHaveProperty('logo');
			expect(dataset).toHaveProperty('color');
		});
	});

	it('has valid file paths', () => {
		datasetState.available.forEach((dataset) => {
			// The id may contain a hyphen (`mistral-small`), so `\w+` is too narrow.
			expect(dataset.file).toMatch(/^\/data\/iwac_sentiment_[\w-]+\.json$/);
			expect(dataset.file).toBe(`/data/iwac_sentiment_${dataset.id}.json`);
		});
	});
});

describe('datasetState.availableInGeneration', () => {
	it('offers only the archived models while v1 is selected', () => {
		expect(datasetState.availableInGeneration.map((d) => d.id)).toEqual([
			'chatgpt',
			'gemini',
			'mistral'
		]);
	});

	it('offers only the current models while v2 is selected', () => {
		datasetState.selected = 'luna';
		expect(datasetState.availableInGeneration.map((d) => d.id)).toEqual([
			'luna',
			'mistral-small',
			'deepseek'
		]);
		expect(datasetState.pairsInGeneration).toEqual([
			'luna-mistral-small',
			'luna-deepseek',
			'mistral-small-deepseek'
		]);
	});
});

describe('datasetState.generation', () => {
	it('derives the generation from the selected dataset', () => {
		expect(datasetState.generation).toBe('v1');
		expect(datasetState.isArchived).toBe(true);
		datasetState.selected = 'deepseek';
		expect(datasetState.generation).toBe('v2');
		expect(datasetState.isArchived).toBe(false);
	});

	it('derives the generation from the pair in comparison mode', () => {
		datasetState.selected = 'luna';
		datasetState.isComparisonMode = true;
		expect(datasetState.generation).toBe('v2');
	});

	it('keeps the generation when entering comparison mode from an archived model', () => {
		datasetState.selected = 'mistral';
		datasetState.pair = 'luna-deepseek';
		datasetState.isComparisonMode = true;
		// The pair belonged to the other generation, so it is normalized rather
		// than silently switching the whole dashboard to v2.
		expect(datasetState.pair).toBe('chatgpt-gemini');
		expect(datasetState.generation).toBe('v1');
	});

	it('keeps the generation when leaving comparison mode', () => {
		datasetState.isComparisonMode = true;
		datasetState.pair = 'mistral-small-deepseek';
		datasetState.isComparisonMode = false;
		expect(datasetState.selected).toBe('mistral-small');
		expect(datasetState.generation).toBe('v2');
	});

	it('switches both ids together', () => {
		datasetState.setGeneration('v2');
		expect(datasetState.selected).toBe('luna');
		expect(datasetState.pair).toBe('luna-mistral-small');
		datasetState.setGeneration('v1');
		expect(datasetState.selected).toBe('chatgpt');
		expect(datasetState.pair).toBe('chatgpt-gemini');
	});
});

describe('datasetState.selected', () => {
	it('can be changed to gemini', () => {
		datasetState.selected = 'gemini';
		expect(datasetState.selected).toBe('gemini');
	});

	it('can be changed to mistral', () => {
		datasetState.selected = 'mistral';
		expect(datasetState.selected).toBe('mistral');
	});

	it('can be changed to a v2 model', () => {
		datasetState.selected = 'mistral-small';
		expect(datasetState.selected).toBe('mistral-small');
	});

	it('rejects an unknown id', () => {
		expect(() => {
			datasetState.selected = 'gpt4' as never;
		}).toThrow();
	});
});

describe('datasetState.isComparisonMode', () => {
	it('defaults to false', () => {
		expect(datasetState.isComparisonMode).toBe(false);
	});

	it('can be enabled', () => {
		datasetState.isComparisonMode = true;
		expect(datasetState.isComparisonMode).toBe(true);
	});

	it('toggles from false to true', () => {
		datasetState.toggleComparisonMode();
		expect(datasetState.isComparisonMode).toBe(true);
	});

	it('toggles from true to false', () => {
		datasetState.isComparisonMode = true;
		datasetState.toggleComparisonMode();
		expect(datasetState.isComparisonMode).toBe(false);
	});
});

describe('datasetState.pair', () => {
	it('defaults to chatgpt-gemini', () => {
		expect(datasetState.pair).toBe('chatgpt-gemini');
	});

	it('can be set to chatgpt-mistral', () => {
		datasetState.pair = 'chatgpt-mistral';
		expect(datasetState.pair).toBe('chatgpt-mistral');
	});

	it('can be set to gemini-mistral', () => {
		datasetState.pair = 'gemini-mistral';
		expect(datasetState.pair).toBe('gemini-mistral');
	});
});

describe('datasetState.getById', () => {
	it('returns ChatGPT dataset', () => {
		const dataset = datasetState.getById('chatgpt');
		expect(dataset?.name).toBe('ChatGPT');
		expect(dataset?.color).toBe('#10a37f');
	});

	it('returns Gemini dataset', () => {
		const dataset = datasetState.getById('gemini');
		expect(dataset?.name).toBe('Gemini');
		expect(dataset?.color).toBe('#8e75b2');
	});

	it('returns Mistral dataset', () => {
		const dataset = datasetState.getById('mistral');
		expect(dataset?.name).toBe('Mistral');
		expect(dataset?.color).toBe('#F54E42');
	});

	it('returns undefined for unknown id', () => {
		expect(datasetState.getById('unknown')).toBeUndefined();
	});
});

describe('datasetState.current', () => {
	it('returns current dataset config', () => {
		datasetState.selected = 'gemini';
		const current = datasetState.current;
		expect(current?.id).toBe('gemini');
		expect(current?.name).toBe('Gemini');
	});
});
