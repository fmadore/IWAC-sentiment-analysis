/**
 * Dataset State Module
 * 
 * Manages dataset configuration and selection state.
 * Uses writable stores internally for proper Svelte reactivity.
 */

import { writable, get } from 'svelte/store';
import type { DatasetOption, ModelPair } from '$lib/types/data';

// ============================================
// Dataset Configuration
// ============================================

/** Available datasets with their configuration */
export const availableDatasets = writable<DatasetOption[]>([
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        file: '/data/iwac_articles_chatgpt.json',
        logo: '/logo/ChatGPT_logo.svg',
        color: '#10a37f'
    },
    {
        id: 'gemini',
        name: 'Gemini',
        file: '/data/iwac_articles_gemini.json',
        logo: '/logo/Gemini_logo.svg',
        color: '#8e75b2'
    },
    {
        id: 'mistral',
        name: 'Mistral',
        file: '/data/iwac_articles_mistral.json',
        logo: '/logo/Mistral_AI_logo.svg',
        color: '#F54E42'
    }
]);

/** Currently selected dataset ID */
export const selectedDataset = writable<string>('chatgpt');

/** Whether comparison mode is active */
export const comparisonMode = writable<boolean>(false);

/** Currently selected model pair for comparison */
export const comparisonPair = writable<ModelPair>('chatgpt-gemini');

// ============================================
// Modern State Accessors (for gradual migration)
// ============================================

/**
 * Dataset state object with getters and setters.
 * Provides a more ergonomic API for new code.
 */
export const datasetState = {
    // Available datasets
    get availableDatasets() {
        return get(availableDatasets);
    },

    // Selected dataset
    get selectedDataset() {
        return get(selectedDataset);
    },
    setSelectedDataset(value: string) {
        selectedDataset.set(value);
    },

    // Comparison mode
    get comparisonMode() {
        return get(comparisonMode);
    },
    setComparisonMode(value: boolean) {
        comparisonMode.set(value);
    },
    toggleComparisonMode() {
        comparisonMode.update((v) => !v);
    },

    // Comparison pair
    get comparisonPair() {
        return get(comparisonPair);
    },
    setComparisonPair(value: ModelPair) {
        comparisonPair.set(value);
    },

    // Utility: Get dataset by ID
    getDatasetById(id: string): DatasetOption | undefined {
        return get(availableDatasets).find((d) => d.id === id);
    },

    // Utility: Get current dataset config
    get currentDataset(): DatasetOption | undefined {
        return get(availableDatasets).find((d) => d.id === get(selectedDataset));
    }
};
