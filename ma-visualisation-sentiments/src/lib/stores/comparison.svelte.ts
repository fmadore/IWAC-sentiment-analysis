/**
 * Comparison State Module
 *
 * Manages model comparison state and derived data using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable, derived, get } from 'svelte/store';
import type { ComparisonData } from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { comparisonMode, comparisonPair, datasetState } from './datasets.svelte';
import {
	discrepancyFilters,
	countryFilters,
	journalFilters,
	filterState
} from './filters.svelte';
import { isLoadingComparison } from './ui.svelte';
import { datasetArticles, loadSpecificDataset, articleState } from './articles.svelte';
import {
	buildComparisonData,
	filterComparisons,
	computeComparisonStatistics,
	type ComparisonStatistics
} from './derivations';

export type { ComparisonStatistics };

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedComparison = $state<ComparisonData | null>(null);

// ============================================
// Legacy Stores
// ============================================

/**
 * @deprecated Use comparisonState.selected instead
 */
export const selectedComparison = writable<ComparisonData | null>(null);

// Sync legacy store to runes state
selectedComparison.subscribe((value) => {
	_selectedComparison = value;
});

// ============================================
// Derived Stores (transitional legacy API)
// ============================================

/** Comparison data between two models */
export const comparisonData = derived(
	[datasetArticles, comparisonMode, comparisonPair],
	([$datasets, $isComparison, $pair]) => buildComparisonData($datasets, $isComparison, $pair)
);

/** Filtered comparisons based on discrepancy filters */
export const filteredComparisons = derived(
	[comparisonData, discrepancyFilters, countryFilters, journalFilters],
	([$comparisons, $filters, $countries, $journals]) =>
		filterComparisons($comparisons, $filters, $countries, $journals)
);

/** Comparison statistics */
export const comparisonStatistics = derived(
	[comparisonData, filteredComparisons, countryFilters, journalFilters],
	([$allComparisons, $filteredComparisons, $countries, $journals]) =>
		computeComparisonStatistics($allComparisons, $filteredComparisons, $countries, $journals)
);

// ============================================
// Runes-based mirrors (reactive via `comparisonState`)
// ============================================

const _comparisonDataRune = $derived.by(() =>
	buildComparisonData(articleState.datasets, datasetState.isComparisonMode, datasetState.pair)
);

const _filteredComparisonsRune = $derived.by(() =>
	filterComparisons(
		_comparisonDataRune,
		filterState.discrepancy,
		filterState.countries,
		filterState.journals
	)
);

const _comparisonStatisticsRune = $derived.by(() =>
	computeComparisonStatistics(
		_comparisonDataRune,
		_filteredComparisonsRune,
		filterState.countries,
		filterState.journals
	)
);

// ============================================
// Data Loading
// ============================================

/** Load datasets needed for comparison mode */
export const loadComparisonDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
	const currentDatasets = get(datasetArticles);
	const currentPair = get(comparisonPair);

	const [modelAId, modelBId] = getModelsFromPair(currentPair);
	const datasetsToLoad: string[] = [];

	if (!currentDatasets[modelAId] || currentDatasets[modelAId].length === 0) {
		datasetsToLoad.push(modelAId);
	}
	if (!currentDatasets[modelBId] || currentDatasets[modelBId].length === 0) {
		datasetsToLoad.push(modelBId);
	}

	if (datasetsToLoad.length > 0) {
		console.log(
			`Loading missing comparison datasets for ${currentPair}: ${datasetsToLoad.join(', ')}`
		);

		isLoadingComparison.set(true);

		try {
			// Use showLoading: false since we manage our own loading state (isLoadingComparison)
			await Promise.all(
				datasetsToLoad.map((datasetId) =>
					loadSpecificDataset(datasetId, fetchFunction, { showLoading: false })
				)
			);
			console.log('Comparison datasets loaded successfully');
		} finally {
			isLoadingComparison.set(false);
		}
	} else {
		console.log('All comparison datasets already loaded (likely from background prefetching)');
	}
};

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Comparison state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const data = comparisonState.data;
 *
 * // Write state
 * comparisonState.selected = comparison;
 *
 * // Get statistics
 * const stats = comparisonState.statistics;
 */
export const comparisonState = {
	// Selected comparison
	get selected() {
		return _selectedComparison;
	},
	set selected(value: ComparisonData | null) {
		_selectedComparison = value;
		selectedComparison.set(value);
	},

	// Comparison data (reactive runes-based derivation)
	get data() {
		return _comparisonDataRune;
	},

	// Filtered comparisons (reactive runes-based derivation)
	get filtered() {
		return _filteredComparisonsRune;
	},

	// Statistics (reactive runes-based derivation)
	get statistics() {
		return _comparisonStatisticsRune;
	}
};
