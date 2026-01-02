/**
 * URL State Actions
 * 
 * Functions for manipulating URL state and syncing with stores.
 */

import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { initializeLanguage } from '$lib/i18n';
import {
  countryFilters,
  journalFilters,
  polarityFilters,
  subjectivityFilters,
  centralityFilters,
  selectedDataset,
  comparisonMode,
  comparisonPair,
  discrepancyFilters,
  selectedArticle,
  datasetArticles,
  selectedComparison,
  comparisonData
} from '$lib/stores';

import { VALID_PAIRS } from './constants';
import type { URLState } from './types';
import { parseURLState } from './parser.svelte';
import { buildURLSearchParams } from './builder.svelte';
import { pendingArticleState, pendingComparisonArticleState, getCurrentState } from './state.svelte';

/**
 * Apply URL state to application stores
 */
export function applyURLState(state: URLState): string | undefined {
  // Initialize language first (this handles URL lang, localStorage, and browser detection)
  initializeLanguage(state.lang);

  if (state.countries) {
    countryFilters.set(state.countries);
  }

  if (state.journals) {
    journalFilters.set(state.journals);
  }

  if (state.polarities) {
    polarityFilters.set(state.polarities);
  }

  if (state.subjectivities) {
    subjectivityFilters.set(state.subjectivities);
  }

  if (state.centralities) {
    centralityFilters.set(state.centralities);
  }

  if (state.dataset) {
    selectedDataset.set(state.dataset);
  }

  if (state.compare === true) {
    comparisonMode.set(true);
  }

  if (state.pair && (VALID_PAIRS as readonly string[]).includes(state.pair)) {
    comparisonPair.set(state.pair);
  }

  if (state.diffMin !== undefined || state.diffMax !== undefined) {
    const currentFilters = get(discrepancyFilters);
    discrepancyFilters.set({
      ...currentFilters,
      minDifference: state.diffMin ?? currentFilters.minDifference,
      maxDifference: state.diffMax ?? currentFilters.maxDifference
    });
  }

  // Handle article selection from URL
  if (state.articleId !== undefined) {
    // Get the current dataset articles
    const currentDataset = state.dataset || get(selectedDataset);
    const allDatasetArticles = get(datasetArticles);
    const articlesForDataset = allDatasetArticles[currentDataset];

    if (articlesForDataset && articlesForDataset.length > 0) {
      // Find the article with matching ID
      const targetArticle = articlesForDataset.find(article =>
        article['o:id'] === state.articleId ||
        article['o:id'].toString() === state.articleId?.toString()
      );

      if (targetArticle) {
        selectedArticle.set(targetArticle);
        // Clear any pending selection since we found the article
        pendingArticleState.clear();
        console.log(`[URL] Selected article from URL: ${targetArticle['o:title']}`);
      } else {
        // Article not found, clear the selection
        selectedArticle.set(null);
        console.warn(`[URL] Article with ID ${state.articleId} not found in dataset ${currentDataset}`);
      }
    } else {
      // Dataset not loaded yet, store pending selection
      pendingArticleState.current = {
        articleId: state.articleId,
        dataset: currentDataset
      };
      console.log(`[URL] Will select article ${state.articleId} after dataset ${currentDataset} loads`);
    }
  }

  // Handle comparison article selection from URL
  if (state.comparisonArticleId !== undefined && state.compare === true) {
    // Try to find and select the comparison article
    const comparisons = get(comparisonData);

    if (comparisons && comparisons.length > 0) {
      const targetComparison = comparisons.find(comp =>
        comp.article['o:id'] === state.comparisonArticleId ||
        comp.article['o:id'].toString() === state.comparisonArticleId?.toString()
      );

      if (targetComparison) {
        selectedComparison.set(targetComparison);
        pendingComparisonArticleState.clear();
        console.log(`[URL] Selected comparison article from URL: ${targetComparison.article['o:title']}`);
      } else {
        // Article not found in current comparisons, store as pending
        pendingComparisonArticleState.current = state.comparisonArticleId;
        console.log(`[URL] Will select comparison article ${state.comparisonArticleId} after data loads`);
      }
    } else {
      // Comparison data not loaded yet, store as pending
      pendingComparisonArticleState.current = state.comparisonArticleId;
      console.log(`[URL] Will select comparison article ${state.comparisonArticleId} after comparison data loads`);
    }
  }

  return state.view;
}

/**
 * Update URL with current application state
 */
export function updateURL(currentView?: string, replaceState = false): void {
  if (!browser) return;

  const currentState = getCurrentState();
  if (currentView) {
    currentState.view = currentView;
  }

  const params = buildURLSearchParams(currentState);
  const url = params.toString() ? `?${params.toString()}` : window.location.pathname;

  goto(url, {
    replaceState,
    keepFocus: true,
    noScroll: true
  });
}

/**
 * Initialize URL state management
 * Should be called once when the app loads
 */
export function initializeURLState(): string | undefined {
  if (!browser) return;

  const currentPage = get(page);
  const urlState = parseURLState(currentPage.url.searchParams);

  return applyURLState(urlState);
}

/**
 * Clear all filters and update URL
 */
export function clearAllFilters(): void {
  countryFilters.set([]);
  journalFilters.set([]);
  polarityFilters.set([]);
  subjectivityFilters.set([]);
  centralityFilters.set([]);
  // Don't reset dataset selection or comparison mode when clearing filters

  updateURL(undefined, true);
}

/**
 * Clear selected article and update URL
 */
export function clearSelectedArticle(): void {
  selectedArticle.set(null);
  // Also clear any pending article selection
  pendingArticleState.clear();
  updateURL(undefined, true);
}

/**
 * Clear only the selected article without affecting pending selections or URL
 */
export function clearSelectedArticleOnly(): void {
  selectedArticle.set(null);
}

/**
 * Handle pending article selection after dataset is loaded
 */
export function handlePendingArticleSelection(): void {
  const pending = pendingArticleState.current;
  if (!pending) return;

  const allDatasetArticles = get(datasetArticles);
  const articlesForDataset = allDatasetArticles[pending.dataset];

  if (articlesForDataset && articlesForDataset.length > 0) {
    // Find the article with matching ID
    const targetArticle = articlesForDataset.find(article =>
      article['o:id'] === pending.articleId ||
      article['o:id'].toString() === pending.articleId.toString()
    );

    if (targetArticle) {
      selectedArticle.set(targetArticle);
      console.log(`[URL] Selected article ${pending.articleId} after dataset loading: ${targetArticle['o:title']}`);
    } else {
      console.warn(`[URL] Article with ID ${pending.articleId} not found in dataset ${pending.dataset}`);
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

  const comparisons = get(comparisonData);

  if (comparisons && comparisons.length > 0) {
    // Find the comparison with matching article ID
    const targetComparison = comparisons.find(comp =>
      comp.article['o:id'] === pending ||
      comp.article['o:id'].toString() === pending.toString()
    );

    if (targetComparison) {
      selectedComparison.set(targetComparison);
      console.log(`[URL] Selected comparison article ${pending} after data loading: ${targetComparison.article['o:title']}`);
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
  selectedComparison.set(null);
  pendingComparisonArticleState.clear();
  updateURL(undefined, true);
}
