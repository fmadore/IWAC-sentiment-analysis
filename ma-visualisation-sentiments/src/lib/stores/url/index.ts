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

