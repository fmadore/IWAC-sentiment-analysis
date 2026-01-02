/**
 * URL State Management
 * 
 * Svelte 5 runes-based state for pending selections and current URL state.
 */

import { currentLanguage } from '$lib/i18n';
import { get } from 'svelte/store';
import type { URLState, PendingArticleSelection } from './types';

// Import directly from individual store modules to avoid circular dependencies
// (importing from '$lib/stores' would create a cycle since stores/index.ts re-exports from url/)
import {
  countryFilters,
  journalFilters,
  polarityFilters,
  subjectivityFilters,
  centralityFilters,
  discrepancyFilters
} from '../filters.svelte';
import {
  selectedDataset,
  comparisonMode,
  comparisonPair
} from '../datasets.svelte';
import { selectedArticle } from '../articles.svelte';
import { selectedComparison } from '../comparison.svelte';

// ============================================
// Svelte 5 Runes State
// ============================================

// Pending article selection from URL (when dataset isn't loaded yet)
let _pendingArticleSelection = $state<PendingArticleSelection | null>(null);

// Pending comparison article selection from URL (when comparison data isn't loaded yet)
let _pendingComparisonArticleSelection = $state<string | number | null>(null);

/**
 * Pending article selection state accessor
 * 
 * Usage:
 * - Read: pendingArticleState.current
 * - Write: pendingArticleState.current = { articleId, dataset }
 * - Clear: pendingArticleState.clear()
 */
export const pendingArticleState = {
  get current() {
    return _pendingArticleSelection;
  },
  set current(value: PendingArticleSelection | null) {
    _pendingArticleSelection = value;
  },
  clear() {
    _pendingArticleSelection = null;
  }
};

/**
 * Pending comparison article selection state accessor
 * 
 * Usage:
 * - Read: pendingComparisonArticleState.current
 * - Write: pendingComparisonArticleState.current = articleId
 * - Clear: pendingComparisonArticleState.clear()
 */
export const pendingComparisonArticleState = {
  get current() {
    return _pendingComparisonArticleSelection;
  },
  set current(value: string | number | null) {
    _pendingComparisonArticleSelection = value;
  },
  clear() {
    _pendingComparisonArticleSelection = null;
  }
};

/**
 * Get current application state from stores
 * 
 * Reads all filter and selection stores to build the current URL state.
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
    // Always include diffMin/diffMax for the general comparison view
    // (they will be conditionally excluded when a specific article is selected in buildURLSearchParams)
    state.diffMin = filters.minDifference;
    state.diffMax = filters.maxDifference;

    // Include selected comparison article ID if there is one
    const currentComparison = get(selectedComparison);
    if (currentComparison) {
      state.comparisonArticleId = currentComparison.article['o:id'];
    }
  }

  return state;
}
