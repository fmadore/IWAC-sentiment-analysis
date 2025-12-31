import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';
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
} from './stores';
import type { ModelPair } from './types/data';
import { writable, get as storeGet } from 'svelte/store';

// Store to track pending article selection from URL
const pendingArticleSelection = writable<{ articleId: string | number, dataset: string } | null>(null);

// Store to track pending comparison article selection from URL
// This is used when comparison data isn't loaded yet when URL is parsed
export const pendingComparisonArticleSelection = writable<string | number | null>(null);
import { currentLanguage, type Language, LANGUAGES, initializeLanguage } from './i18n/index.js';

// Types for URL state
export interface URLState {
  view?: string;
  countries?: string[];
  journals?: string[];
  polarities?: string[];
  subjectivities?: string[];
  centralities?: string[];
  lang?: Language;
  dataset?: string;
  compare?: boolean;
  pair?: ModelPair;  // Comparison model pair
  diffMin?: number;
  diffMax?: number;
  articleId?: string | number;
  comparisonArticleId?: string | number; // ID of selected comparison article for modal
}

// Valid views that can be set in URL
const VALID_VIEWS = ['charts', 'trends', 'correlation', 'volume', 'heatmap', 'table', 'comparison', 'extremes'];
const VALID_DATASETS = ['chatgpt', 'gemini', 'mistral'];
const VALID_PAIRS: ModelPair[] = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral'];

// URL parameter names
const URL_PARAMS = {
  view: 'view',
  countries: 'countries',
  journals: 'journals',
  polarities: 'polarities',
  subjectivities: 'subjectivities',
  centralities: 'centralities',
  lang: 'lang',
  dataset: 'dataset',
  compare: 'compare',
  pair: 'pair',
  diffMin: 'diffMin',
  diffMax: 'diffMax',
  articleId: 'articleId',
  comparisonArticleId: 'comparisonArticleId'
} as const;

/**
 * Parse URL search parameters into application state
 */
export function parseURLState(searchParams: URLSearchParams): URLState {
  const state: URLState = {};

  // Parse view
  const view = searchParams.get(URL_PARAMS.view);
  if (view && VALID_VIEWS.includes(view)) {
    state.view = view;
  }

  // Parse language
  const lang = searchParams.get(URL_PARAMS.lang) as Language;
  if (lang && lang in LANGUAGES) {
    state.lang = lang;
  }

  // Parse dataset
  const dataset = searchParams.get(URL_PARAMS.dataset);
  if (dataset && VALID_DATASETS.includes(dataset)) {
    state.dataset = dataset;
  }

  // Parse comparison mode
  const compare = searchParams.get(URL_PARAMS.compare);
  if (compare === 'true') {
    state.compare = true;
  }

  // Parse comparison pair
  const pair = searchParams.get(URL_PARAMS.pair) as ModelPair;
  if (pair && VALID_PAIRS.includes(pair)) {
    state.pair = pair;
  }

  // Parse discrepancy filters
  const diffMin = searchParams.get(URL_PARAMS.diffMin);
  if (diffMin) {
    const min = parseInt(diffMin, 10);
    if (!isNaN(min) && min >= 0 && min <= 5) {
      state.diffMin = min;
    }
  }

  const diffMax = searchParams.get(URL_PARAMS.diffMax);
  if (diffMax) {
    const max = parseInt(diffMax, 10);
    if (!isNaN(max) && max >= 0 && max <= 5) {
      state.diffMax = max;
    }
  }

  // Parse article ID
  const articleId = searchParams.get(URL_PARAMS.articleId);
  if (articleId) {
    // Try to parse as number first, fallback to string
    const numericId = parseInt(articleId, 10);
    state.articleId = !isNaN(numericId) ? numericId : articleId;

    // If articleId is present but no view is specified, default to table view
    if (!state.view) {
      state.view = 'table';
    }
  }

  // Parse comparison article ID (for full-screen comparison modal)
  const comparisonArticleId = searchParams.get(URL_PARAMS.comparisonArticleId);
  if (comparisonArticleId) {
    const numericId = parseInt(comparisonArticleId, 10);
    state.comparisonArticleId = !isNaN(numericId) ? numericId : comparisonArticleId;

    // If comparisonArticleId is present, ensure comparison mode is enabled
    if (state.compare !== true) {
      state.compare = true;
    }
    // Default to comparison view if no view specified
    if (!state.view) {
      state.view = 'comparison';
    }
  }

  // Parse array parameters
  const countries = searchParams.get(URL_PARAMS.countries);
  if (countries) {
    state.countries = countries.split(',').filter(Boolean);
  }

  const journals = searchParams.get(URL_PARAMS.journals);
  if (journals) {
    state.journals = journals.split(',').filter(Boolean);
  }

  const polarities = searchParams.get(URL_PARAMS.polarities);
  if (polarities) {
    state.polarities = polarities.split(',').filter(Boolean);
  }

  const subjectivities = searchParams.get(URL_PARAMS.subjectivities);
  if (subjectivities) {
    state.subjectivities = subjectivities.split(',').filter(Boolean);
  }

  const centralities = searchParams.get(URL_PARAMS.centralities);
  if (centralities) {
    state.centralities = centralities.split(',').filter(Boolean);
  }

  return state;
}

/**
 * Convert application state to URL search parameters
 */
export function buildURLSearchParams(state: URLState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.view && VALID_VIEWS.includes(state.view)) {
    params.set(URL_PARAMS.view, state.view);
  }

  if (state.lang && state.lang in LANGUAGES) {
    params.set(URL_PARAMS.lang, state.lang);
  }

  if (state.dataset && VALID_DATASETS.includes(state.dataset)) {
    params.set(URL_PARAMS.dataset, state.dataset);
  }

  if (state.compare === true) {
    params.set(URL_PARAMS.compare, 'true');
  }

  if (state.pair && VALID_PAIRS.includes(state.pair) && state.compare === true) {
    params.set(URL_PARAMS.pair, state.pair);
  }

  if (state.diffMin !== undefined && state.compare === true) {
    params.set(URL_PARAMS.diffMin, state.diffMin.toString());
  }

  if (state.diffMax !== undefined && state.compare === true) {
    params.set(URL_PARAMS.diffMax, state.diffMax.toString());
  }

  if (state.articleId !== undefined) {
    params.set(URL_PARAMS.articleId, state.articleId.toString());
  }

  // Include comparison article ID when in comparison mode
  if (state.comparisonArticleId !== undefined && state.compare === true) {
    params.set(URL_PARAMS.comparisonArticleId, state.comparisonArticleId.toString());
  }

  if (state.countries && state.countries.length > 0) {
    params.set(URL_PARAMS.countries, state.countries.join(','));
  }

  if (state.journals && state.journals.length > 0) {
    params.set(URL_PARAMS.journals, state.journals.join(','));
  }

  if (state.polarities && state.polarities.length > 0) {
    params.set(URL_PARAMS.polarities, state.polarities.join(','));
  }

  if (state.subjectivities && state.subjectivities.length > 0) {
    params.set(URL_PARAMS.subjectivities, state.subjectivities.join(','));
  }

  if (state.centralities && state.centralities.length > 0) {
    params.set(URL_PARAMS.centralities, state.centralities.join(','));
  }

  return params;
}

/**
 * Get current application state from stores
 */
export function getCurrentState(): URLState {
  const filters = get(discrepancyFilters);
  const isComparisonMode = get(comparisonMode);
  const currentArticle = get(selectedArticle);

  const state: URLState = {
    countries: get(countryFilters),
    journals: get(journalFilters),
    polarities: get(polarityFilters),
    subjectivities: get(subjectivityFilters),
    centralities: get(centralityFilters),
    lang: get(currentLanguage),
    dataset: get(selectedDataset)
  };

  // Include selected article ID if there is one
  if (currentArticle) {
    state.articleId = currentArticle['o:id'];
  }

  // Only include comparison-related parameters when in comparison mode
  if (isComparisonMode) {
    state.compare = true;
    state.pair = get(comparisonPair);
    state.diffMin = filters.minDifference;
    state.diffMax = filters.maxDifference;

    // Include selected comparison article ID if there is one
    const currentComparison = storeGet(selectedComparison);
    if (currentComparison) {
      state.comparisonArticleId = currentComparison.article['o:id'];
    }
  }

  return state;
}

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

  if (state.pair && VALID_PAIRS.includes(state.pair)) {
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
        pendingArticleSelection.set(null);
        console.log(`[URL] Selected article from URL: ${targetArticle['o:title']}`);
      } else {
        // Article not found, clear the selection
        selectedArticle.set(null);
        console.warn(`[URL] Article with ID ${state.articleId} not found in dataset ${currentDataset}`);
      }
    } else {
      // Dataset not loaded yet, store pending selection
      pendingArticleSelection.set({
        articleId: state.articleId,
        dataset: currentDataset
      });
      console.log(`[URL] Will select article ${state.articleId} after dataset ${currentDataset} loads`);
    }
  }

  // Handle comparison article selection from URL
  if (state.comparisonArticleId !== undefined && state.compare === true) {
    // Try to find and select the comparison article
    const comparisons = storeGet(comparisonData);

    if (comparisons && comparisons.length > 0) {
      const targetComparison = comparisons.find(comp =>
        comp.article['o:id'] === state.comparisonArticleId ||
        comp.article['o:id'].toString() === state.comparisonArticleId?.toString()
      );

      if (targetComparison) {
        selectedComparison.set(targetComparison);
        pendingComparisonArticleSelection.set(null);
        console.log(`[URL] Selected comparison article from URL: ${targetComparison.article['o:title']}`);
      } else {
        // Article not found in current comparisons, store as pending
        pendingComparisonArticleSelection.set(state.comparisonArticleId);
        console.log(`[URL] Will select comparison article ${state.comparisonArticleId} after data loads`);
      }
    } else {
      // Comparison data not loaded yet, store as pending
      pendingComparisonArticleSelection.set(state.comparisonArticleId);
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
  pendingArticleSelection.set(null);
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
  const pending = get(pendingArticleSelection);
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
    pendingArticleSelection.set(null);
  }
}

/**
 * Handle pending comparison article selection after comparison data is loaded
 */
export function handlePendingComparisonArticleSelection(): void {
  const pending = storeGet(pendingComparisonArticleSelection);
  if (!pending) return;

  const comparisons = storeGet(comparisonData);

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
    pendingComparisonArticleSelection.set(null);
  }
}

/**
 * Clear selected comparison article and update URL
 */
export function clearSelectedComparison(): void {
  selectedComparison.set(null);
  pendingComparisonArticleSelection.set(null);
  updateURL(undefined, true);
}

/**
 * Export utility functions for components
 */
export const urlStateUtils = {
  parseURLState,
  buildURLSearchParams,
  getCurrentState,
  applyURLState,
  updateURL,
  initializeURLState,
  clearAllFilters,
  clearSelectedArticle,
  handlePendingArticleSelection,
  handlePendingComparisonArticleSelection,
  clearSelectedComparison,
  VALID_VIEWS
}; 