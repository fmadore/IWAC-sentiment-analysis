/**
 * URL State (Re-exports)
 * 
 * This file re-exports from the modular URL state implementation
 * for backward compatibility. New code should import directly from
 * '$lib/stores/url' or individual modules.
 * 
 * @deprecated Import from '$lib/stores/url' for new code
 */

// Re-export everything from the modular implementation
export {
  // Types
  type URLState,
  type PendingArticleSelection,
  type ValidView,
  type ValidDataset,
  type URLParamKey,
  
  // Constants
  VALID_VIEWS,
  VALID_DATASETS,
  VALID_PAIRS,
  URL_PARAMS,
  
  // Parser
  parseURLState,
  
  // Builder
  buildURLSearchParams,
  
  // State (Svelte 5 runes)
  pendingArticleState,
  pendingComparisonArticleState,
  getCurrentState,
  
  // Actions
  applyURLState,
  updateURL,
  initializeURLState,
  clearAllFilters,
  clearSelectedArticle,
  clearSelectedArticleOnly,
  handlePendingArticleSelection,
  handlePendingComparisonArticleSelection,
  clearSelectedComparison,
  
  // Utilities object
  urlStateUtils
} from './stores/url';

// Legacy compatibility: writable store for pending comparison article selection
// This creates a store-like interface for code that still uses the old pattern
import { pendingComparisonArticleState } from './stores/url';
import { writable } from 'svelte/store';

/**
 * @deprecated Use pendingComparisonArticleState instead
 * 
 * Legacy store interface for pending comparison article selection.
 * Provides a Svelte store-compatible interface that wraps the new runes-based state.
 */
function createLegacyPendingComparisonStore() {
  const { subscribe, set } = writable<string | number | null>(null);
  
  return {
    subscribe,
    set: (value: string | number | null) => {
      pendingComparisonArticleState.current = value;
      set(value);
    }
  };
}

export const pendingComparisonArticleSelection = createLegacyPendingComparisonStore(); 