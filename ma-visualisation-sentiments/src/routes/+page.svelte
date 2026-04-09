<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		loadCurrentDataset,
		loadComparisonDatasets,
		loadCurrentExtremeAnalysis,
		loadArbiterEvaluations,
		uiState,
		datasetState,
		articleState,
		filterState
	} from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import type { Article } from '$lib';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';

	// Layout
	import { FiltersPanel, ViewContent } from '$lib/components/layout';

	// Data Display
	import { AnalysisInfo, ArbiterMethodology } from '$lib/components/data-display';

	// Common
	import { ArticleDetailModal, LoadingState } from '$lib/components/common';

	// Utilities
	import { SEOHead } from '$lib/components';
	import {
		initializeURLState,
		updateURL,
		clearSelectedArticle,
		clearSelectedArticleOnly,
		handlePendingArticleSelection
	} from '$lib/urlState';

	// Application state
	let detailedArticle: Article | null = $state(null);
	let showDetailsSidebar = $state(false);
	let isInitialized = $state(false);

	// Extreme analysis controls state
	let selectedCategory = $state<ExtremeCategory>('polarity_very_negative');
	let selectedKeywordType = $state<KeywordType>('subject');
	let showTopN = $state(10);

	// Derived state from stores
	let currentView = $derived(uiState.activeView);
	let isLoading = $derived(uiState.isLoadingDataset);
	let isComparisonMode = $derived(datasetState.isComparisonMode);
	let currentDatasetId = $derived(datasetState.selected);
	let currentArticles = $derived(articleState.datasets[currentDatasetId] || []);
	let currentSelectedArticle = $derived(articleState.selected);

	// Load extreme analysis when view is 'extremes' and dataset changes
	$effect(() => {
		if (currentView === 'extremes' && currentDatasetId && browser && isInitialized) {
			console.log('Loading extreme analysis for dataset:', currentDatasetId);
			loadCurrentExtremeAnalysis(fetch)
				.then(() => console.log('Extreme analysis loaded successfully for:', currentDatasetId))
				.catch((error) => console.error('Failed to load extreme analysis data:', error));
		}
	});

	// Load comparison data when comparison mode is enabled
	$effect(() => {
		if (isComparisonMode && browser && isInitialized) {
			console.log('Comparison mode enabled, loading comparison datasets...');
			loadComparisonDatasets(fetch)
				.then(() => console.log('Comparison datasets loaded successfully'))
				.catch((error) => console.error('Failed to load comparison datasets:', error));

			loadArbiterEvaluations(fetch)
				.then(() => console.log('Arbiter evaluations loaded (if available)'))
				.catch((error) => console.log('Arbiter evaluations not available:', error));
		}
	});

	// Update HTML lang attribute when language changes
	$effect(() => {
		const lang = $currentLanguage;
		if (browser && typeof document !== 'undefined') {
			document.documentElement.lang = lang;
		}
	});

	// React to filter changes and update URL
	$effect(() => {
		// Access filter state to track changes
		void filterState.countries;
		void filterState.journals;
		void filterState.polarities;
		void filterState.subjectivities;
		void filterState.centralities;
		void isComparisonMode;

		if (browser && isInitialized) {
			updateURL(currentView);
		}
	});

	// React to selectedArticle changes and show details if article is selected
	$effect(() => {
		if (currentSelectedArticle && !detailedArticle) {
			detailedArticle = currentSelectedArticle;
			showDetailsSidebar = true;
			console.log(
				`[Article Details] Showing details for article from URL: ${currentSelectedArticle['o:title']}`
			);
		}
	});

	// React to dataset changes to load new dataset and update URL
	$effect(() => {
		if (!browser || !isInitialized) return;

		const datasets = articleState.datasets;
		if (!datasets[currentDatasetId] || datasets[currentDatasetId].length === 0) {
			uiState.isLoadingDataset = true;
			loadCurrentDataset(fetch)
				.then(() => {
					setTimeout(() => handlePendingArticleSelection(), 100);
				})
				.catch((error) => {
					console.error('Failed to load dataset:', error);
				})
				.finally(() => {
					uiState.isLoadingDataset = false;
				});
		} else {
			articleState.current = datasets[currentDatasetId];
			setTimeout(() => handlePendingArticleSelection(), 100);
		}

		updateURL(currentView);
	});

	// React to activeView changes for side effects (loading data, toggling comparison mode)
	$effect(() => {
		if (!browser || !isInitialized) return;

		if (currentView === 'comparison') {
			if (!isComparisonMode) {
				datasetState.isComparisonMode = true;
			}

			loadComparisonDatasets(fetch).catch((error) => {
				console.error('Failed to load comparison datasets:', error);
			});
		} else if (currentView === 'extremes') {
			loadCurrentExtremeAnalysis(fetch).catch((error) => {
				console.error('Failed to load extreme analysis data:', error);
			});
		} else if (currentView === 'arbiter') {
			// Arbiter view needs comparison mode for model pair selection
			if (!isComparisonMode) {
				datasetState.isComparisonMode = true;
			}

			// Load arbiter data (handled by ArbiterView component but also preload here)
			loadArbiterEvaluations(fetch).catch((error) => {
				console.log('Arbiter evaluations not available:', error);
			});
		} else {
			if (isComparisonMode) {
				datasetState.isComparisonMode = false;
			}
		}
	});

	onMount(() => {
		// Initialize URL state management first
		const urlView = initializeURLState();
		if (urlView) {
			uiState.activeView = urlView;
		}

		// Load only the current dataset at startup (lazy loading)
		const loadData = async () => {
			uiState.isLoadingDataset = true;
			clearSelectedArticleOnly();

			try {
				await loadCurrentDataset(fetch);
				setTimeout(() => handlePendingArticleSelection(), 100);
			} catch (error) {
				console.error('Failed to load dataset:', error);
			} finally {
				uiState.isLoadingDataset = false;
				isInitialized = true;
			}
		};

		loadData();
	});

	// Handle showing article details
	function handleShowDetails(details: { article: Article; position: { x: number; y: number } }) {
		detailedArticle = details.article;
		showDetailsSidebar = true;
	}

	function closeDetails() {
		showDetailsSidebar = false;
		detailedArticle = null;
		clearSelectedArticle();
	}

	// Handlers for extreme analysis controls
	function handleCategoryChange(category: ExtremeCategory) {
		selectedCategory = category;
	}

	function handleKeywordTypeChange(type: KeywordType) {
		selectedKeywordType = type;
	}

	function handleTopNChange(value: number) {
		showTopN = value;
	}
</script>

<!-- Dynamic SEO Head -->
<SEOHead view={currentView} comparisonMode={isComparisonMode} />

<main
	class="main-container container {currentView === 'extremes'
		? 'max-w-7xl'
		: 'max-w-6xl'} mx-auto p-2 sm:p-4 md:p-6"
>
	{#if currentView === 'arbiter'}
		<ArbiterMethodology />
	{:else}
		<AnalysisInfo />
	{/if}

	{#if isLoading}
		<LoadingState />
	{:else if currentView === 'arbiter'}
		<!-- Arbiter view has its own internal filtering, no FiltersPanel needed -->
		<ViewContent
			activeView={currentView}
			{selectedCategory}
			{selectedKeywordType}
			{showTopN}
			onShowDetails={handleShowDetails}
		/>
	{:else if currentArticles.length > 0}
		<FiltersPanel
			activeView={currentView}
			{selectedCategory}
			{selectedKeywordType}
			{showTopN}
			onCategoryChange={handleCategoryChange}
			onKeywordTypeChange={handleKeywordTypeChange}
			onTopNChange={handleTopNChange}
		/>

		<ViewContent
			activeView={currentView}
			{selectedCategory}
			{selectedKeywordType}
			{showTopN}
			onShowDetails={handleShowDetails}
		/>
	{:else}
		<div class="alert alert-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
	{/if}
</main>

<!-- Article Details Modal -->
<ArticleDetailModal article={detailedArticle} open={showDetailsSidebar} onClose={closeDetails} />

<style>
	/* Main Container */
	.main-container {
		margin-top: 0;
		padding-top: 0.5rem;
	}

	@media (min-width: 640px) {
		.main-container {
			padding-top: 0.75rem;
		}
	}

	@media (min-width: 1024px) {
		.main-container {
			padding-top: 1rem;
		}
	}
</style>
