/**
 * Stores Index
 *
 * Central export point for all store modules.
 * Re-exports both new state accessors and legacy compatibility exports.
 */

// ============================================
// New Runes-based State (Recommended)
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
// Legacy Compatibility Exports
// ============================================

// Filters
export {
	countryFilters,
	journalFilters,
	polarityFilters,
	subjectivityFilters,
	centralityFilters,
	discrepancyFilters
} from './filters.svelte';

// UI State
export {
	sidebarExpanded,
	activeView,
	mobileMenuOpen,
	isLoadingDataset,
	isLoadingExtremeAnalysis,
	isLoadingComparison,
	isLoadingArbiter
} from './ui.svelte';

// Dataset State
export {
	availableDatasets,
	selectedDataset,
	comparisonMode,
	comparisonPair
} from './datasets.svelte';

// Article State
export {
	datasetArticles,
	currentDatasetArticles,
	selectedArticle,
	filteredArticles,
	availableJournals,
	loadDatasetArticles,
	loadSpecificDataset,
	loadAllDatasets,
	loadCurrentDataset
} from './articles.svelte';

// Comparison State
export {
	selectedComparison,
	comparisonData,
	filteredComparisons,
	comparisonStatistics,
	loadComparisonDatasets
} from './comparison.svelte';

// Arbiter State
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

// Extreme Analysis State
export {
	extremeAnalysisData,
	currentExtremeAnalysis,
	filteredExtremeAnalysis,
	loadCurrentExtremeAnalysis
} from './extreme-analysis.svelte';
