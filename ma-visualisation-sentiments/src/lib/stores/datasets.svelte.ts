/**
 * Dataset State Module
 *
 * Manages dataset configuration and selection state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable } from 'svelte/store';
import type { DatasetOption, ModelPair } from '$lib/types/data';

// ============================================
// Dataset Configuration (Static)
// ============================================

const DATASETS: DatasetOption[] = [
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
];

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedDataset = $state<string>('chatgpt');
let _comparisonMode = $state<boolean>(false);
let _comparisonPair = $state<ModelPair>('chatgpt-gemini');

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Dataset state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const current = datasetState.selected;
 *
 * // Write state
 * datasetState.selected = 'gemini';
 *
 * // Get dataset config
 * const config = datasetState.getById('chatgpt');
 */
export const datasetState = {
	// Available datasets (static, no setter needed)
	get available(): readonly DatasetOption[] {
		return DATASETS;
	},

	// Selected dataset
	get selected() {
		return _selectedDataset;
	},
	set selected(value: string) {
		_selectedDataset = value;
		selectedDataset.set(value);
	},

	// Comparison mode
	get isComparisonMode() {
		return _comparisonMode;
	},
	set isComparisonMode(value: boolean) {
		_comparisonMode = value;
		comparisonMode.set(value);
	},
	toggleComparisonMode() {
		_comparisonMode = !_comparisonMode;
		comparisonMode.set(_comparisonMode);
	},

	// Comparison pair
	get pair() {
		return _comparisonPair;
	},
	set pair(value: ModelPair) {
		_comparisonPair = value;
		comparisonPair.set(value);
	},

	// Utility: Get dataset by ID
	getById(id: string): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === id);
	},

	// Utility: Get current dataset config
	get current(): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === _selectedDataset);
	}
};

// ============================================
// Legacy Store Compatibility
// ============================================

/**
 * @deprecated Use datasetState.available instead
 */
export const availableDatasets = writable<DatasetOption[]>(DATASETS);

/**
 * @deprecated Use datasetState.selected instead
 */
export const selectedDataset = writable<string>('chatgpt');

/**
 * @deprecated Use datasetState.isComparisonMode instead
 */
export const comparisonMode = writable<boolean>(false);

/**
 * @deprecated Use datasetState.pair instead
 */
export const comparisonPair = writable<ModelPair>('chatgpt-gemini');

// Sync legacy stores to runes state
selectedDataset.subscribe((value) => {
	_selectedDataset = value;
});
comparisonMode.subscribe((value) => {
	_comparisonMode = value;
});
comparisonPair.subscribe((value) => {
	_comparisonPair = value;
});
