/**
 * URL State Module
 * 
 * Barrel export for URL state management.
 * Provides Svelte 5 runes-based state management for URL synchronization.
 */

// Types
export type { URLState, PendingArticleSelection } from './types';

// Constants
export { 
  VALID_VIEWS, 
  VALID_DATASETS, 
  VALID_PAIRS, 
  URL_PARAMS,
  type ValidView,
  type ValidDataset,
  type URLParamKey
} from './constants';

// Parser
export { parseURLState } from './parser.svelte';

// Builder
export { buildURLSearchParams } from './builder.svelte';

// State (Svelte 5 runes)
export { 
  pendingArticleState, 
  pendingComparisonArticleState, 
  getCurrentState 
} from './state.svelte';

// Actions
export {
  applyURLState,
  updateURL,
  initializeURLState,
  clearAllFilters,
  clearSelectedArticle,
  clearSelectedArticleOnly,
  handlePendingArticleSelection,
  handlePendingComparisonArticleSelection,
  clearSelectedComparison
} from './actions.svelte';

/**
 * URL state utilities object for convenient access
 */
export const urlStateUtils = {
  // Re-export as object for backward compatibility
  get parseURLState() { return parseURLState; },
  get buildURLSearchParams() { return buildURLSearchParams; },
  get getCurrentState() { return getCurrentState; },
  get applyURLState() { return applyURLState; },
  get updateURL() { return updateURL; },
  get initializeURLState() { return initializeURLState; },
  get clearAllFilters() { return clearAllFilters; },
  get clearSelectedArticle() { return clearSelectedArticle; },
  get handlePendingArticleSelection() { return handlePendingArticleSelection; },
  get handlePendingComparisonArticleSelection() { return handlePendingComparisonArticleSelection; },
  get clearSelectedComparison() { return clearSelectedComparison; },
  get VALID_VIEWS() { return VALID_VIEWS; }
};

// Import functions for the getter references
import { parseURLState } from './parser.svelte';
import { buildURLSearchParams } from './builder.svelte';
import { getCurrentState } from './state.svelte';
import {
  applyURLState,
  updateURL,
  initializeURLState,
  clearAllFilters,
  clearSelectedArticle,
  handlePendingArticleSelection,
  handlePendingComparisonArticleSelection,
  clearSelectedComparison
} from './actions.svelte';
import { VALID_VIEWS } from './constants';
