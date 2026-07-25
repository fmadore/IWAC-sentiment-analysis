<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		loadCurrentDataset,
		loadAllDatasets,
		loadComparisonDatasets,
		loadCurrentExtremeAnalysis,
		loadArbiterEvaluations,
		uiState,
		datasetState,
		articleState,
		filterState
	} from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import type { Article } from '$lib/types/data';
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
	} from '$lib/stores/url';

	/**
	 * Views that own their internal filters and run full-width, so the page
	 * renders no shared filter rail for them.
	 */
	const SELF_CONTAINED_VIEWS = new Set(['arbiter', 'comparison', 'agreement']);

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

	// Close the mobile filters drawer whenever the active view changes (e.g. the
	// user picks another view from the sidebar while the drawer is open).
	$effect(() => {
		void currentView;
		uiState.filtersDrawerOpen = false;
	});

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

	// Drain any pending article selection (from a shared URL) as soon as its
	// dataset is available. handlePendingArticleSelection reads both the pending
	// state and articleState.datasets, so this effect re-runs exactly when
	// either changes — no setTimeout guessing about when a load has "settled".
	$effect(() => {
		if (!browser) return;
		handlePendingArticleSelection();
	});

	// React to dataset changes: load the dataset if needed (loadCurrentDataset
	// is idempotent and dedups in-flight fetches) and reflect it in the URL.
	$effect(() => {
		if (!browser || !isInitialized) return;

		void currentDatasetId;
		loadCurrentDataset(fetch).catch((error) => {
			console.error('Failed to load dataset:', error);
		});

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
		} else if (currentView === 'agreement') {
			// Agreement compares every model against every other, so it needs all
			// three datasets rather than just the selected one. Idempotent.
			loadAllDatasets(fetch).catch((error) => {
				console.error('Failed to load datasets for agreement view:', error);
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

		// Load only the current dataset at startup (lazy loading). Pending
		// article selection is drained reactively by the effect above once the
		// dataset lands in the store.
		const loadData = async () => {
			clearSelectedArticleOnly();

			try {
				await loadCurrentDataset(fetch);
			} catch (error) {
				console.error('Failed to load dataset:', error);
			} finally {
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
	class="main-container p-2 sm:p-4 md:p-6"
	data-layout={currentView === 'arbiter' || currentView === 'comparison' ? 'full' : 'rail'}
>
	{#if currentView === 'arbiter'}
		<ArbiterMethodology />
	{:else}
		<AnalysisInfo />
	{/if}

	{#if isLoading}
		<LoadingState />
	{:else if SELF_CONTAINED_VIEWS.has(currentView)}
		<!-- Self-contained views: each owns its internal filters, so no standard
		     FiltersPanel and no filter rail. Arbiter has its own controls;
		     ComparisonView carries Country/Journal/Discrepancy filters itself. -->
		<ViewContent
			activeView={currentView}
			{selectedCategory}
			{selectedKeywordType}
			{showTopN}
			onShowDetails={handleShowDetails}
		/>
	{:else if currentArticles.length > 0}
		<div class="content-layout">
			<FiltersPanel
				activeView={currentView}
				{selectedCategory}
				{selectedKeywordType}
				{showTopN}
				onCategoryChange={handleCategoryChange}
				onKeywordTypeChange={handleKeywordTypeChange}
				onTopNChange={handleTopNChange}
			/>

			<div class="content-col">
				<ViewContent
					activeView={currentView}
					{selectedCategory}
					{selectedKeywordType}
					{showTopN}
					onShowDetails={handleShowDetails}
				/>
			</div>
		</div>
	{:else}
		<div class="alert alert-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
	{/if}
</main>

<!-- Article Details Modal -->
<ArticleDetailModal article={detailedArticle} open={showDetailsSidebar} onClose={closeDetails} />

<style>
	/* Main Container. Rail views drop the old narrow `max-w-6xl` and run wide
	   (the rail reclaims the left gutter); the self-contained full-width views
	   (arbiter, comparison) keep the prior, more readable cap so their text and
	   methodology don't stretch. */
	.main-container {
		margin-top: 0;
		padding-top: var(--space-2);
		margin-inline: auto;
	}

	.main-container[data-layout='rail'] {
		max-width: 105rem;
	}

	.main-container[data-layout='full'] {
		max-width: 72rem;
	}

	@media (min-width: 640px) {
		.main-container {
			padding-top: var(--space-3);
		}
	}

	@media (min-width: 1024px) {
		.main-container {
			padding-top: var(--space-4);
		}
	}

	/* Filter rail + content. Single column on small screens (the rail is an
	   off-canvas drawer, removed from flow); two columns from 1024px up. */
	.content-layout {
		display: grid;
		grid-template-columns: 1fr;
	}

	.content-col {
		/* Allow charts/tables to shrink within the grid track instead of
		   overflowing it (ECharts canvases otherwise force the column wider). */
		min-width: 0;
	}

	@media (min-width: 1024px) {
		.content-layout {
			grid-template-columns: 20rem minmax(0, 1fr);
			gap: var(--space-6);
			align-items: start;
		}
	}
</style>
