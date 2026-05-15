/**
 * Extreme Analysis State Module
 *
 * Manages extreme analysis data using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import type { ExtremeAnalysisData } from '$lib/types/extremeAnalysis';
import { loadExtremeAnalysisData, filterExtremeAnalysisData } from '$lib/utils/extremeAnalysis';
import { datasetState } from './datasets.svelte';
import { filterState } from './filters.svelte';
import { uiState } from './ui.svelte';

// ============================================
// Svelte 5 Runes State
// ============================================

let _extremeAnalysisData = $state<Record<string, ExtremeAnalysisData | null>>({
	chatgpt: null,
	gemini: null,
	mistral: null
});

// ============================================
// Derived State (reactive runes)
// ============================================

/** Current extreme analysis for the selected dataset */
const _currentExtremeAnalysisRune = $derived(
	_extremeAnalysisData[datasetState.selected] || null
);

/** Filtered extreme analysis (respects country filters only) */
const _filteredExtremeAnalysisRune = $derived.by(() =>
	filterExtremeAnalysisData(_currentExtremeAnalysisRune, filterState.countries, [])
);

// ============================================
// Data Loading
// ============================================

/** Load extreme analysis data for the current dataset */
export const loadCurrentExtremeAnalysis = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasetId = datasetState.selected;

	if (_extremeAnalysisData[currentDatasetId]) {
		console.log(`Extreme analysis for ${currentDatasetId} already loaded`);
		return;
	}

	console.log(`Loading extreme analysis data for ${currentDatasetId}...`);

	uiState.isLoadingExtremeAnalysis = true;

	try {
		const data = await loadExtremeAnalysisData(
			currentDatasetId as 'chatgpt' | 'gemini' | 'mistral',
			fetchFunction
		);
		extremeState.updateData(currentDatasetId, data);
		console.log(`Successfully loaded extreme analysis data for ${currentDatasetId}`);
	} catch (error) {
		console.error(`Failed to load extreme analysis data for ${currentDatasetId}:`, error);
		extremeState.updateData(currentDatasetId, null);
	} finally {
		uiState.isLoadingExtremeAnalysis = false;
	}
};

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Extreme analysis state object with reactive getters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const data = extremeState.data;
 * const current = extremeState.current;
 * const filtered = extremeState.filtered;
 */
export const extremeState = {
	// All extreme analysis data by dataset
	get data() {
		return _extremeAnalysisData;
	},

	// Current dataset's extreme analysis (reactive runes-based derivation)
	get current() {
		return _currentExtremeAnalysisRune;
	},

	// Filtered extreme analysis (reactive runes-based derivation)
	get filtered() {
		return _filteredExtremeAnalysisRune;
	},

	// Update data for a dataset
	updateData(datasetId: string, data: ExtremeAnalysisData | null) {
		_extremeAnalysisData = { ..._extremeAnalysisData, [datasetId]: data };
	}
};
