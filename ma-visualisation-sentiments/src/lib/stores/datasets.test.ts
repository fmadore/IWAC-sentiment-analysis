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
	it('contains all three models', () => {
		expect(datasetState.available).toHaveLength(3);
		expect(datasetState.available.map((d) => d.id)).toEqual(['chatgpt', 'gemini', 'mistral']);
	});

	it('has correct structure for each dataset', () => {
		datasetState.available.forEach((dataset) => {
			expect(dataset).toHaveProperty('id');
			expect(dataset).toHaveProperty('name');
			expect(dataset).toHaveProperty('file');
			expect(dataset).toHaveProperty('logo');
			expect(dataset).toHaveProperty('color');
		});
	});

	it('has valid file paths', () => {
		datasetState.available.forEach((dataset) => {
			expect(dataset.file).toMatch(/^\/data\/iwac_sentiment_\w+\.json$/);
		});
	});
});

describe('datasetState.selected', () => {
	it('defaults to chatgpt', () => {
		expect(datasetState.selected).toBe('chatgpt');
	});

	it('can be changed to gemini', () => {
		datasetState.selected = 'gemini';
		expect(datasetState.selected).toBe('gemini');
	});

	it('can be changed to mistral', () => {
		datasetState.selected = 'mistral';
		expect(datasetState.selected).toBe('mistral');
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
