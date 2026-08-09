/**
 * Dataset State Module
 *
 * Manages dataset configuration and selection state using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import type { DatasetId, DatasetOption, ModelPair } from '$lib/types/data';
import { isDatasetId } from '$lib/domain/sentimentContract';

// ============================================
// Dataset Configuration (Static)
// ============================================

const DATASETS: DatasetOption[] = [
	{
		id: 'chatgpt',
		name: 'ChatGPT',
		file: '/data/iwac_sentiment_chatgpt.json',
		logo: '/logo/ChatGPT_logo.svg',
		color: '#10a37f'
	},
	{
		id: 'gemini',
		name: 'Gemini',
		file: '/data/iwac_sentiment_gemini.json',
		logo: '/logo/Gemini_logo.svg',
		color: '#8e75b2'
	},
	{
		id: 'mistral',
		name: 'Mistral',
		file: '/data/iwac_sentiment_mistral.json',
		logo: '/logo/Mistral_AI_logo.svg',
		color: '#F54E42'
	}
];

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedDataset = $state<DatasetId>('chatgpt');
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
	// Available datasets (static config; matches the legacy store's type)
	get available(): DatasetOption[] {
		return DATASETS;
	},

	// Selected dataset. The getter is narrowed to the DatasetId union; the
	// Invalid external values are rejected at their parsing boundary.
	get selected(): DatasetId {
		return _selectedDataset;
	},
	set selected(value: DatasetId) {
		if (!isDatasetId(value)) throw new Error(`Unknown dataset: ${value}`);
		_selectedDataset = value;
	},

	// Comparison mode
	get isComparisonMode() {
		return _comparisonMode;
	},
	set isComparisonMode(value: boolean) {
		_comparisonMode = value;
	},
	toggleComparisonMode() {
		_comparisonMode = !_comparisonMode;
	},

	// Comparison pair
	get pair() {
		return _comparisonPair;
	},
	set pair(value: ModelPair) {
		_comparisonPair = value;
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
