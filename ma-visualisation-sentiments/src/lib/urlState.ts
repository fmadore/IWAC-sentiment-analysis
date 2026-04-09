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
	clearSelectedComparison
} from './stores/url';
