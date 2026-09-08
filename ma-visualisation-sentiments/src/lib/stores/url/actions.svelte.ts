/**
 * URL State Actions
 *
 * Functions for manipulating URL state and syncing with stores.
 */

import { tick } from 'svelte';
import { analysisState, ANALYSIS_DIMENSIONS } from '../analysis.svelte';
import { uiState } from '../ui.svelte';
import {
	CURRENT_GENERATION,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	TOTAL_DISCREPANCY_MAXIMUM
} from '$lib/domain/sentimentContract';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { initializeLanguage } from '$lib/i18n';

// Import directly from individual store modules to avoid circular dependencies
// (importing from '$lib/stores' would create a cycle since stores/index.ts re-exports from url/)
import { filterState } from '../filters.svelte';
import { datasetState } from '../datasets.svelte';
import { articleState } from '../articles.svelte';
import { comparisonState } from '../comparison.svelte';

import { type ValidView } from './constants';
import type { URLState } from './types';
import { parseURLState } from './parser.svelte';
import { buildURLSearchParams } from './builder.svelte';
import {
	pendingArticleState,
	pendingComparisonArticleState,
	getCurrentState
} from './state.svelte';

/**
 * Apply URL state to application stores
 */
export function applyURLState(state: URLState): ValidView | undefined {
	// Restore a complete snapshot, not a patch: absent fields mean defaults.
	filterState.countries = state.countries ?? [];
	filterState.journals = state.journals ?? [];
	filterState.polarities = state.polarities ?? [];
	filterState.subjectivities = state.subjectivities ?? [];
	filterState.centralities = state.centralities ?? [];
	datasetState.isComparisonMode = false;
	datasetState.selected =
		state.dataset ??
		(state.pair ? getPairModels(state.pair)[0] : defaultDatasetOf(CURRENT_GENERATION));
	datasetState.pair = state.pair ?? defaultPairOf(generationOf(datasetState.selected));
	datasetState.isComparisonMode =
		state.view === 'comparison' || state.view === 'arbiter' || state.compare === true;
	filterState.discrepancy = {
		minDifference: state.diffMin ?? 0,
		maxDifference: state.diffMax ?? TOTAL_DISCREPANCY_MAXIMUM,
		dimensions: state.dimensions ?? [...ANALYSIS_DIMENSIONS],
		excludeNonApplicable: state.excludeNA ?? true
	};
	analysisState.scope = state.scope ?? 'pair';
	analysisState.dimension = state.dimension ?? 'polarity';
	analysisState.includeDeclined = state.declined ?? false;
	articleState.selected = null;
	comparisonState.selected = null;
	pendingArticleState.clear();
	pendingComparisonArticleState.clear();
	uiState.activeView = state.view ?? 'charts';
	// Initialize language first (this handles URL lang, localStorage, and browser detection)
	initializeLanguage(state.lang);

	// Handle article selection from URL
	if (state.articleId !== undefined) {
		// Get the current dataset articles
		const currentDataset = state.dataset || datasetState.selected;
		const articlesForDataset = articleState.datasets[currentDataset];

		if (articlesForDataset && articlesForDataset.length > 0) {
			// Find the article with matching ID
			const targetArticle = articlesForDataset.find(
				(article) =>
					article['o:id'] === state.articleId ||
					article['o:id'].toString() === state.articleId?.toString()
			);

			if (targetArticle) {
				articleState.selected = targetArticle;
				// Clear any pending selection since we found the article
				pendingArticleState.clear();
				console.log(`[URL] Selected article from URL: ${targetArticle['o:title']}`);
			} else {
				// Article not found, clear the selection
				articleState.selected = null;
				console.warn(
					`[URL] Article with ID ${state.articleId} not found in dataset ${currentDataset}`
				);
			}
		} else {
			// Dataset not loaded yet, store pending selection
			pendingArticleState.current = {
				articleId: state.articleId,
				dataset: currentDataset
			};
			console.log(
				`[URL] Will select article ${state.articleId} after dataset ${currentDataset} loads`
			);
		}
	}

	// Handle comparison article selection from URL
	if (state.comparisonArticleId !== undefined && state.compare === true) {
		// Try to find and select the comparison article
		const comparisons = comparisonState.data;

		if (comparisons && comparisons.length > 0) {
			const targetComparison = comparisons.find(
				(comp) =>
					comp.article['o:id'] === state.comparisonArticleId ||
					comp.article['o:id'].toString() === state.comparisonArticleId?.toString()
			);

			if (targetComparison) {
				comparisonState.selected = targetComparison;
				pendingComparisonArticleState.clear();
				console.log(
					`[URL] Selected comparison article from URL: ${targetComparison.article['o:title']}`
				);
			} else {
				// Article not found in current comparisons, store as pending
				pendingComparisonArticleState.current = state.comparisonArticleId;
				console.log(
					`[URL] Will select comparison article ${state.comparisonArticleId} after data loads`
				);
			}
		} else {
			// Comparison data not loaded yet, store as pending
			pendingComparisonArticleState.current = state.comparisonArticleId;
			console.log(
				`[URL] Will select comparison article ${state.comparisonArticleId} after comparison data loads`
			);
		}
	}

	return state.view;
}

/**
 * Update URL with current application state
 */
let restoring = false;
let scheduled = false;
let replacePending = true;

/** Popstate restoration suppresses effects writing the old URL back. */
export async function restoreURLState(params: URLSearchParams): Promise<void> {
	restoring = true;
	try {
		applyURLState(parseURLState(params));
		await tick();
	} finally {
		restoring = false;
	}
}

export function updateURL(currentView?: ValidView, replaceState = false): void {
	if (!browser || restoring) return;
	// Read dependencies synchronously, even when a write is already scheduled.
	const state = getCurrentState();
	if (currentView) state.view = currentView;
	void buildURLSearchParams(state);
	replacePending = replacePending && replaceState;
	if (scheduled) return;
	scheduled = true;
	queueMicrotask(() => {
		scheduled = false;
		const replace = replacePending;
		replacePending = true;
		if (restoring) return;
		const query = buildURLSearchParams(getCurrentState()).toString();
		if (window.location.search.slice(1) === query) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/')}?${query}`, {
			replaceState: replace,
			keepFocus: true,
			noScroll: true
		});
	});
}

/**
 * Initialize URL state management
 * Should be called once when the app loads
 */
export function initializeURLState(): ValidView | undefined {
	if (!browser) return;

	const currentPage = get(page);
	const urlState = parseURLState(currentPage.url.searchParams);

	return applyURLState(urlState);
}

/**
 * Clear all filters and update URL
 */
export function clearAllFilters(): void {
	filterState.countries = [];
	filterState.journals = [];
	filterState.polarities = [];
	filterState.subjectivities = [];
	filterState.centralities = [];
	// Don't reset dataset selection or comparison mode when clearing filters

	updateURL(undefined, true);
}

/**
 * Clear selected article and update URL
 */
export function clearSelectedArticle(): void {
	articleState.selected = null;
	// Also clear any pending article selection
	pendingArticleState.clear();
	updateURL(undefined, true);
}

/**
 * Clear only the selected article without affecting pending selections or URL
 */
export function clearSelectedArticleOnly(): void {
	articleState.selected = null;
}

/**
 * Handle pending article selection after dataset is loaded
 */
export function handlePendingArticleSelection(): void {
	const pending = pendingArticleState.current;
	if (!pending) return;

	const articlesForDataset = articleState.datasets[pending.dataset];

	if (articlesForDataset && articlesForDataset.length > 0) {
		// Find the article with matching ID
		const targetArticle = articlesForDataset.find(
			(article) =>
				article['o:id'] === pending.articleId ||
				article['o:id'].toString() === pending.articleId.toString()
		);

		if (targetArticle) {
			articleState.selected = targetArticle;
			console.log(
				`[URL] Selected article ${pending.articleId} after dataset loading: ${targetArticle['o:title']}`
			);
		} else {
			console.warn(
				`[URL] Article with ID ${pending.articleId} not found in dataset ${pending.dataset}`
			);
		}

		// Clear the pending selection
		pendingArticleState.clear();
	}
}

/**
 * Handle pending comparison article selection after comparison data is loaded
 */
export function handlePendingComparisonArticleSelection(): void {
	const pending = pendingComparisonArticleState.current;
	if (!pending) return;

	const comparisons = comparisonState.data;

	if (comparisons && comparisons.length > 0) {
		// Find the comparison with matching article ID
		const targetComparison = comparisons.find(
			(comp) =>
				comp.article['o:id'] === pending || comp.article['o:id'].toString() === pending.toString()
		);

		if (targetComparison) {
			comparisonState.selected = targetComparison;
			console.log(
				`[URL] Selected comparison article ${pending} after data loading: ${targetComparison.article['o:title']}`
			);
		} else {
			console.warn(`[URL] Comparison article with ID ${pending} not found`);
		}

		// Clear the pending selection
		pendingComparisonArticleState.clear();
	}
}

/**
 * Clear selected comparison article and update URL
 */
export function clearSelectedComparison(): void {
	comparisonState.selected = null;
	pendingComparisonArticleState.clear();
	updateURL(undefined, true);
}
