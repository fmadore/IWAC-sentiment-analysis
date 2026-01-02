/**
 * Extreme Analysis State Module
 * 
 * Manages extreme analysis data using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable, derived, get } from 'svelte/store';
import type { ExtremeAnalysisData } from '$lib/types/extremeAnalysis';
import { loadExtremeAnalysisData, filterExtremeAnalysisData } from '$lib/utils/extremeAnalysis';
import { selectedDataset } from './datasets.svelte';
import { countryFilters } from './filters.svelte';
import { isLoadingExtremeAnalysis } from './ui.svelte';

// ============================================
// Svelte 5 Runes State
// ============================================

let _extremeAnalysisData = $state<Record<string, ExtremeAnalysisData | null>>({
    chatgpt: null,
    gemini: null,
    mistral: null
});

// ============================================
// Legacy Stores
// ============================================

/**
 * @deprecated Use extremeState.data instead
 */
export const extremeAnalysisData = writable<Record<string, ExtremeAnalysisData | null>>({
    chatgpt: null,
    gemini: null,
    mistral: null
});

// Sync legacy store to runes state
extremeAnalysisData.subscribe(value => { _extremeAnalysisData = value; });

// ============================================
// Derived Stores
// ============================================

/** Current extreme analysis for the selected dataset */
export const currentExtremeAnalysis = derived(
    [extremeAnalysisData, selectedDataset],
    ([$extremeAnalysisData, $selectedDataset]) => $extremeAnalysisData[$selectedDataset] || null
);

/** Filtered extreme analysis (respects country filters only) */
export const filteredExtremeAnalysis = derived(
    [currentExtremeAnalysis, countryFilters],
    ([$currentExtremeAnalysis, $countryFilters]) => {
        return filterExtremeAnalysisData($currentExtremeAnalysis, $countryFilters, []);
    }
);

// ============================================
// Data Loading
// ============================================

/** Load extreme analysis data for the current dataset */
export const loadCurrentExtremeAnalysis = async (fetchFunction: typeof fetch): Promise<void> => {
    const currentDatasetId = get(selectedDataset);
    const currentExtremeData = get(extremeAnalysisData);

    if (currentExtremeData[currentDatasetId]) {
        console.log(`Extreme analysis for ${currentDatasetId} already loaded`);
        return;
    }

    console.log(`Loading extreme analysis data for ${currentDatasetId}...`);

    isLoadingExtremeAnalysis.set(true);

    try {
        const data = await loadExtremeAnalysisData(
            currentDatasetId as 'chatgpt' | 'gemini',
            fetchFunction
        );
        extremeAnalysisData.update((current) => ({
            ...current,
            [currentDatasetId]: data
        }));
        console.log(`Successfully loaded extreme analysis data for ${currentDatasetId}`);
    } catch (error) {
        console.error(`Failed to load extreme analysis data for ${currentDatasetId}:`, error);
        extremeAnalysisData.update((current) => ({
            ...current,
            [currentDatasetId]: null
        }));
    } finally {
        isLoadingExtremeAnalysis.set(false);
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
    
    // Current dataset's extreme analysis (from derived store)
    get current() {
        return get(currentExtremeAnalysis);
    },
    
    // Filtered extreme analysis (from derived store)
    get filtered() {
        return get(filteredExtremeAnalysis);
    },
    
    // Update data for a dataset
    updateData(datasetId: string, data: ExtremeAnalysisData | null) {
        _extremeAnalysisData = { ..._extremeAnalysisData, [datasetId]: data };
        extremeAnalysisData.set(_extremeAnalysisData);
    }
};
