/**
 * Extreme Analysis State Module
 * 
 * Manages extreme analysis data.
 * Uses writable/derived stores for proper Svelte reactivity.
 */

import { writable, derived, get } from 'svelte/store';
import type { ExtremeAnalysisData } from '$lib/types/extremeAnalysis';
import { loadExtremeAnalysisData, filterExtremeAnalysisData } from '$lib/utils/extremeAnalysis';
import { selectedDataset } from './datasets.svelte';
import { countryFilters } from './filters.svelte';
import { isLoadingExtremeAnalysis } from './ui.svelte';

// ============================================
// Extreme Analysis Stores
// ============================================

/** Extreme analysis data per dataset */
export const extremeAnalysisData = writable<Record<string, ExtremeAnalysisData | null>>({
    chatgpt: null,
    gemini: null,
    mistral: null
});

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
// Modern State Accessors (for gradual migration)
// ============================================

export const extremeState = {
    get extremeAnalysisData() {
        return get(extremeAnalysisData);
    },
    get currentExtremeAnalysis() {
        return get(currentExtremeAnalysis);
    },
    get filteredExtremeAnalysis() {
        return get(filteredExtremeAnalysis);
    }
};
