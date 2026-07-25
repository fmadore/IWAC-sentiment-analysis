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
const _currentExtremeAnalysisRune = $derived(_extremeAnalysisData[datasetState.selected] || null);

/** Filtered extreme analysis (respects country filters only) */
const _filteredExtremeAnalysisRune = $derived.by(() =>
	filterExtremeAnalysisData(_currentExtremeAnalysisRune, filterState.countries, [])
);

// ============================================
// Data Loading
// ============================================

/**
 * In-flight dedup: two effects can request the same dataset in one tick.
 *
 * Deliberately a plain Map, not a SvelteMap. This is internal plumbing that is
 * never rendered, and it is READ from inside `$effect`s — Svelte tracks reads
 * transitively through synchronous calls, so a reactive map would make every
 * caller depend on it. Each `set()` and `delete()` would then invalidate the
 * very effects that triggered them, and the effect would call again. Measured
 * on the extremes view: 14 loader entries per page load with SvelteMap, 6 with
 * a plain Map.
 */
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- see above: reactivity here causes an effect loop
const extremeInFlight = new Map<string, Promise<void>>();

/** Load extreme analysis data for the current dataset */
export const loadCurrentExtremeAnalysis = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasetId = datasetState.selected;

	if (_extremeAnalysisData[currentDatasetId]) {
		return;
	}

	const inFlight = extremeInFlight.get(currentDatasetId);
	if (inFlight) {
		return inFlight;
	}

	const load = (async () => {
		uiState.isLoadingExtremeAnalysis = true;
		try {
			const data = await loadExtremeAnalysisData(currentDatasetId, fetchFunction);
			extremeState.updateData(currentDatasetId, data);
		} catch (error) {
			console.error(`Failed to load extreme analysis data for ${currentDatasetId}:`, error);
			extremeState.updateData(currentDatasetId, null);
		} finally {
			uiState.isLoadingExtremeAnalysis = false;
		}
	})().finally(() => {
		extremeInFlight.delete(currentDatasetId);
	});
	extremeInFlight.set(currentDatasetId, load);
	return load;
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
