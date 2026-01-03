/**
 * Datasets Store Unit Tests
 * 
 * Tests the dataset state management:
 * - datasetState API
 * - Dataset selection
 * - Comparison mode toggling
 * - getById helper
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
    datasetState,
    selectedDataset,
    comparisonMode,
    comparisonPair,
    availableDatasets
} from '$lib/stores/datasets.svelte';

// ============================================
// Setup - Reset state before each test
// ============================================

beforeEach(() => {
    selectedDataset.set('chatgpt');
    comparisonMode.set(false);
    comparisonPair.set('chatgpt-gemini');
});

// ============================================
// availableDatasets Tests
// ============================================

describe('availableDatasets', () => {
    it('contains all three models', () => {
        const datasets = get(availableDatasets);
        expect(datasets).toHaveLength(3);
        expect(datasets.map(d => d.id)).toEqual(['chatgpt', 'gemini', 'mistral']);
    });

    it('has correct structure for each dataset', () => {
        const datasets = get(availableDatasets);
        datasets.forEach(dataset => {
            expect(dataset).toHaveProperty('id');
            expect(dataset).toHaveProperty('name');
            expect(dataset).toHaveProperty('file');
            expect(dataset).toHaveProperty('logo');
            expect(dataset).toHaveProperty('color');
        });
    });

    it('has valid file paths', () => {
        const datasets = get(availableDatasets);
        datasets.forEach(dataset => {
            expect(dataset.file).toMatch(/^\/data\/iwac_articles_\w+\.json$/);
        });
    });
});

// ============================================
// selectedDataset Tests
// ============================================

describe('selectedDataset', () => {
    it('defaults to chatgpt', () => {
        expect(get(selectedDataset)).toBe('chatgpt');
    });

    it('can be changed to gemini', () => {
        selectedDataset.set('gemini');
        expect(get(selectedDataset)).toBe('gemini');
    });

    it('can be changed to mistral', () => {
        selectedDataset.set('mistral');
        expect(get(selectedDataset)).toBe('mistral');
    });

    it('syncs with datasetState', () => {
        selectedDataset.set('gemini');
        expect(datasetState.selected).toBe('gemini');
    });
});

// ============================================
// comparisonMode Tests
// ============================================

describe('comparisonMode', () => {
    it('defaults to false', () => {
        expect(get(comparisonMode)).toBe(false);
    });

    it('can be enabled', () => {
        comparisonMode.set(true);
        expect(get(comparisonMode)).toBe(true);
    });

    it('syncs with datasetState', () => {
        comparisonMode.set(true);
        expect(datasetState.isComparisonMode).toBe(true);
    });
});

// ============================================
// comparisonPair Tests
// ============================================

describe('comparisonPair', () => {
    it('defaults to chatgpt-gemini', () => {
        expect(get(comparisonPair)).toBe('chatgpt-gemini');
    });

    it('can be set to chatgpt-mistral', () => {
        comparisonPair.set('chatgpt-mistral');
        expect(get(comparisonPair)).toBe('chatgpt-mistral');
    });

    it('can be set to gemini-mistral', () => {
        comparisonPair.set('gemini-mistral');
        expect(get(comparisonPair)).toBe('gemini-mistral');
    });

    it('syncs with datasetState', () => {
        comparisonPair.set('gemini-mistral');
        expect(datasetState.pair).toBe('gemini-mistral');
    });
});

// ============================================
// datasetState API Tests
// ============================================

describe('datasetState', () => {
    describe('getById', () => {
        it('returns ChatGPT dataset', () => {
            const dataset = datasetState.getById('chatgpt');
            expect(dataset).toBeDefined();
            expect(dataset?.name).toBe('ChatGPT');
            expect(dataset?.color).toBe('#10a37f');
        });

        it('returns Gemini dataset', () => {
            const dataset = datasetState.getById('gemini');
            expect(dataset).toBeDefined();
            expect(dataset?.name).toBe('Gemini');
            expect(dataset?.color).toBe('#8e75b2');
        });

        it('returns Mistral dataset', () => {
            const dataset = datasetState.getById('mistral');
            expect(dataset).toBeDefined();
            expect(dataset?.name).toBe('Mistral');
            expect(dataset?.color).toBe('#F54E42');
        });

        it('returns undefined for unknown id', () => {
            const dataset = datasetState.getById('unknown');
            expect(dataset).toBeUndefined();
        });
    });

    describe('current', () => {
        it('returns current dataset config', () => {
            selectedDataset.set('gemini');
            const current = datasetState.current;
            expect(current).toBeDefined();
            expect(current?.id).toBe('gemini');
            expect(current?.name).toBe('Gemini');
        });
    });

    describe('available', () => {
        it('returns readonly array of datasets', () => {
            const available = datasetState.available;
            expect(available).toHaveLength(3);
            expect(available[0].id).toBe('chatgpt');
        });
    });

    describe('toggleComparisonMode', () => {
        it('toggles from false to true', () => {
            expect(datasetState.isComparisonMode).toBe(false);
            datasetState.toggleComparisonMode();
            expect(datasetState.isComparisonMode).toBe(true);
        });

        it('toggles from true to false', () => {
            comparisonMode.set(true);
            expect(datasetState.isComparisonMode).toBe(true);
            datasetState.toggleComparisonMode();
            expect(datasetState.isComparisonMode).toBe(false);
        });
    });

    describe('setters', () => {
        it('can set selected through datasetState', () => {
            datasetState.selected = 'mistral';
            expect(get(selectedDataset)).toBe('mistral');
        });

        it('can set isComparisonMode through datasetState', () => {
            datasetState.isComparisonMode = true;
            expect(get(comparisonMode)).toBe(true);
        });

        it('can set pair through datasetState', () => {
            datasetState.pair = 'chatgpt-mistral';
            expect(get(comparisonPair)).toBe('chatgpt-mistral');
        });
    });
});
