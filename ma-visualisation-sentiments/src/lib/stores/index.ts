/**
 * Stores Index
 *
 * Central export point for all store modules. State is exposed exclusively
 * through the runes-based accessor objects (filterState, datasetState, …);
 * data-loading functions are re-exported alongside them.
 */

// ============================================
// Runes-based State Accessors
// ============================================

export { filterState } from './filters.svelte';
export { uiState } from './ui.svelte';
export { datasetState } from './datasets.svelte';
export { articleState } from './articles.svelte';
export { comparisonState } from './comparison.svelte';
export { arbiterState, type ArbiterStatistics } from './arbiter.svelte';
export { extremeState } from './extreme-analysis.svelte';

// URL State (New modular implementation)
export {
	pendingArticleState,
	pendingComparisonArticleState,
	getCurrentState,
	parseURLState,
	buildURLSearchParams,
	applyURLState,
	updateURL,
	initializeURLState,
	clearAllFilters,
	clearSelectedArticle,
	clearSelectedArticleOnly,
	handlePendingArticleSelection,
	handlePendingComparisonArticleSelection,
	clearSelectedComparison,
	VALID_VIEWS,
	VALID_DATASETS,
	VALID_PAIRS,
	URL_PARAMS,
	type URLState,
	type PendingArticleSelection,
	type ValidView,
	type ValidDataset,
	type URLParamKey
} from './url';

// ============================================
// Data-loading Functions
// ============================================

export {
	loadDatasetArticles,
	loadSpecificDataset,
	loadAllDatasets,
	loadCurrentDataset
} from './articles.svelte';

export { loadComparisonDatasets } from './comparison.svelte';

export { loadCurrentExtremeAnalysis } from './extreme-analysis.svelte';

// ============================================
// Arbiter Accessors (already runes-based)
// ============================================

export {
	arbiterEvaluations,
	currentArbiterPair,
	arbiterModelAIsFirst,
	getArbiterForArticle,
	arbiterStatistics,
	getActualModelName,
	loadArbiterEvaluations,
	setupArbiterPairReactivity
} from './arbiter.svelte';
