<script lang="ts">
	import DetailLinkNotice from '$lib/components/common/DetailLinkNotice.svelte';
	import { pendingArticleState } from '$lib/stores/url';
	import { onMount, untrack } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { restoreURLState, reconcileSelectionContext } from '$lib/stores/url/actions.svelte';
	import { getCurrentState, buildURLSearchParams } from '$lib/stores/url';
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import { browser } from '$app/environment';
	import {
		loadCurrentDataset,
		dataRequirements,
		ensureDataRequirements,
		uiState,
		datasetState,
		articleState
	} from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { hasFilterRail } from '$lib/types/data';
	import type { Article } from '$lib/types/data';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';

	// Layout
	import { FiltersPanel, ViewContent } from '$lib/components/layout';

	// Data Display
	import AnalysisInfo from '$lib/components/data-display/AnalysisInfo.svelte';
	import ArbiterMethodology from '$lib/components/data-display/ArbiterMethodology.svelte';
	import ArbiterV2Methodology from '$lib/components/data-display/ArbiterV2Methodology.svelte';

	// Common
	import { ArchiveNotice, ArticleDetailModal, LoadingState } from '$lib/components/common';

	// Utilities
	import SEOHead from '$lib/components/SEOHead.svelte';
	import {
		initializeURLState,
		updateURL,
		clearSelectedArticle,
		handlePendingArticleSelection
	} from '$lib/stores/url';

	afterNavigate(({ type, to }) => {
		if (
			to &&
			type !== 'enter' &&
			(type === 'popstate' ||
				to.url.searchParams.toString() !== buildURLSearchParams(getCurrentState()).toString())
		) {
			void restoreURLState(to.url.searchParams);
		}
	});
	// Application state
	// Raw: the article is the corpus's own object, whose prose is merged in place
	// (see articles.svelte.ts). A deep-state proxy would cache the empty prose.
	let detailedArticle = $state.raw<Article | null>(null);
	let showDetailsSidebar = $state(false);
	let isInitialized = $state(false);

	// Derived state from stores
	let currentView = $derived(uiState.activeView);
	let isLoading = $derived(uiState.isLoadingDataset);
	let isComparisonMode = $derived(datasetState.isComparisonMode);
	let currentDatasetId = $derived(datasetState.selected);
	let currentArticles = $derived(articleState.datasets[currentDatasetId] || []);
	let currentSelectedArticle = $derived(articleState.selected);
	let currentLoadState = $derived(articleState.currentLoadState);

	// Close the mobile filters drawer whenever the active view changes (e.g. the
	// user picks another view from the sidebar while the drawer is open).
	$effect(() => {
		void currentView;
		uiState.filtersDrawerOpen = false;
	});

	// Everything the screen needs, derived from what is on it (see
	// dataRequirements.ts). This one effect is the only request site for page
	// data: it depends on the requirements alone — the loaders run untracked —
	// and every loader is idempotent, so a re-run never double-fetches.
	const requirements = $derived(
		dataRequirements({
			view: currentView,
			dataset: currentDatasetId,
			pair: datasetState.pair,
			comparisonMode: isComparisonMode,
			generation: datasetState.generation
		})
	);
	$effect(() => {
		if (!browser || !isInitialized) return;
		const needs = requirements;
		untrack(() => ensureDataRequirements(needs, fetch));
	});

	// Update HTML lang attribute when language changes
	$effect(() => {
		const lang = $currentLanguage;
		if (browser && typeof document !== 'undefined') {
			document.documentElement.lang = lang;
		}
	});

	// One subscriber owns URL writes for every filter, view control and selection.
	let hasSyncedURL = false;
	$effect(() => {
		if (!browser || !isInitialized) return;
		reconcileSelectionContext();
		updateURL(undefined, !hasSyncedURL);
		hasSyncedURL = true;
	});

	// React to selectedArticle changes and show details if article is selected
	$effect(() => {
		detailedArticle = currentSelectedArticle;
		showDetailsSidebar = currentSelectedArticle !== null;
	});

	// Drain any pending article selection (from a shared URL) as soon as its
	// dataset is available. handlePendingArticleSelection reads both the pending
	// state and articleState.datasets, so this effect re-runs exactly when
	// either changes — no setTimeout guessing about when a load has "settled".
	$effect(() => {
		if (!browser) return;
		handlePendingArticleSelection();
	});

	/**
	 * Comparison mode follows the view: the comparison view and the archived
	 * pairwise arbiter work in terms of a model pair, every other view does not.
	 * State only — what the mode needs loaded is in `requirements` above.
	 */
	$effect(() => {
		if (!browser || !isInitialized) return;

		const wantsPair =
			currentView === 'comparison' ||
			(currentView === 'arbiter' && datasetState.generation === 'v1');
		if (wantsPair !== isComparisonMode) datasetState.isComparisonMode = wantsPair;
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

	function retryDataset() {
		untrack(() => loadCurrentDataset(fetch)).catch((error) =>
			console.error('Failed to retry dataset:', error)
		);
	}

	// Handlers for extreme analysis controls
	function handleCategoryChange(category: ExtremeCategory) {
		viewOptionsState.category = category;
	}

	function handleKeywordTypeChange(type: KeywordType) {
		viewOptionsState.keywordType = type;
	}

	function handleTopNChange(value: number) {
		viewOptionsState.topN = value;
	}
</script>

<!-- Dynamic SEO Head -->
<SEOHead view={currentView} comparisonMode={isComparisonMode} />

<section class="main-container" data-layout={hasFilterRail(currentView) ? 'rail' : 'full'}>
	<!-- Renders nothing unless the archived generation is on screen. -->
	<ArchiveNotice />
	{#if pendingArticleState.current && currentLoadState.status === 'ready'}
		<DetailLinkNotice onClose={clearSelectedArticle} />
	{/if}

	<!-- The arbiter card is generation-specific: the two runs used different
	     judges, different selection rules and different article text. -->
	{#if currentView === 'arbiter'}
		{#if datasetState.generation === 'v2'}
			<ArbiterV2Methodology />
		{:else}
			<ArbiterMethodology />
		{/if}
	{:else}
		<AnalysisInfo />
	{/if}

	{#if isLoading}
		<LoadingState />
	{:else if currentLoadState.status === 'error'}
		<div class="alert alert-error p-4 mb-4 sm:mb-6" role="alert">
			<p>{$t.messages.dataLoadError}</p>
			<details>
				<summary>{$t.messages.error}</summary>
				<code>{currentLoadState.error.message}</code>
			</details>
			<button type="button" class="retry-button mt-3" onclick={retryDataset}
				>{$t.messages.retry}</button
			>
		</div>
	{:else if !hasFilterRail(currentView)}
		<!-- Self-contained views: each owns its internal filters, so no standard
		     FiltersPanel and no filter rail. Arbiter has its own controls;
		     ComparisonView carries Country/Journal/Discrepancy filters itself. -->
		<ViewContent
			activeView={currentView}
			selectedCategory={viewOptionsState.category}
			selectedKeywordType={viewOptionsState.keywordType}
			showTopN={viewOptionsState.topN}
			onShowDetails={handleShowDetails}
		/>
	{:else if currentArticles.length > 0}
		<div class="content-layout">
			<FiltersPanel
				activeView={currentView}
				selectedCategory={viewOptionsState.category}
				selectedKeywordType={viewOptionsState.keywordType}
				showTopN={viewOptionsState.topN}
				onCategoryChange={handleCategoryChange}
				onKeywordTypeChange={handleKeywordTypeChange}
				onTopNChange={handleTopNChange}
			/>

			<div class="content-col">
				<ViewContent
					activeView={currentView}
					selectedCategory={viewOptionsState.category}
					selectedKeywordType={viewOptionsState.keywordType}
					showTopN={viewOptionsState.topN}
					onShowDetails={handleShowDetails}
				/>
			</div>
		</div>
	{:else}
		<div class="alert alert-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
	{/if}
</section>

<!-- Article Details Modal -->
<ArticleDetailModal article={detailedArticle} open={showDetailsSidebar} onClose={closeDetails} />

<style>
	/* Main Container. Rail views drop the old narrow `max-w-6xl` and run wide
	   (the rail reclaims the left gutter); the self-contained full-width views
	   (arbiter, comparison) keep the prior, more readable cap so their text and
	   methodology don't stretch. */
	/* All padding lives here, not split between Tailwind utilities in the class
	   attribute and this block. It used to be set twice, in two systems, at two
	   different breakpoint sets. */
	.main-container {
		margin-top: 0;
		padding: var(--space-2);
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
			padding: var(--space-4);
			padding-top: var(--space-3);
		}
	}

	@media (min-width: 1024px) {
		.main-container {
			padding: var(--space-6);
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

	.retry-button {
		background: color-mix(in oklab, var(--status-error) 18%, var(--surface-card));
		border: 1px solid var(--color-error-500);
		border-radius: var(--radius-panel);
		color: var(--status-error);
		cursor: pointer;
		font: inherit;
		font-weight: 600;
		padding: var(--space-2) var(--space-4);
	}

	.retry-button:hover {
		background: color-mix(in oklab, var(--status-error) 28%, var(--surface-card));
	}

	.retry-button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (min-width: 1024px) {
		.content-layout {
			grid-template-columns: 20rem minmax(0, 1fr);
			gap: var(--space-6);
			align-items: start;
		}
	}
</style>
