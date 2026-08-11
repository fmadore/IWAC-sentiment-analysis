<!--
  ViewContent Component
  
  Encapsulates the main content area that switches between different views
  (charts, trends, correlation, volume, heatmap, table, comparison, extremes).
  
  This component receives the active view and renders the appropriate content,
  keeping the main page cleaner and more focused on orchestration.
  
  Usage:
  <ViewContent 
    {activeView} 
    {selectedCategory} 
    {selectedKeywordType}
    {showTopN}
    onShowDetails={handleShowDetails} 
  />
-->
<script lang="ts">
	import type { Article, ViewId } from '$lib/types/data';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
	import { t } from '$lib/i18n';
	import { datasetState, articleState } from '$lib/stores';
	import { getModelDisplayName } from '$lib/utils/format';

	// UI
	import { CSVExportButton, ChartCard } from '$lib/components/ui';
	import LoadingState from '$lib/components/common/LoadingState.svelte';

	/**
	 * The map is the one view with a heavyweight dependency: MapLibre GL is
	 * ~250 kB gzipped, more than the entire rest of the vendor bundle put
	 * together. Importing it statically would make all twelve other views pay
	 * for it, so it is pulled in on first visit to `?view=map` and the promise
	 * memoized so switching away and back doesn't re-suspend.
	 */
	let mapModulePromise: Promise<typeof import('$lib/components/viz/SentimentMap.svelte')> | null =
		null;

	function loadMapModule() {
		mapModulePromise ??= import('$lib/components/viz/SentimentMap.svelte');
		return mapModulePromise;
	}

	const chartViews = import('$lib/components/views/ChartViews.svelte');
	const tableView = () => import('$lib/components/data-display/ArticleTable.svelte');
	const comparisonView = () => import('$lib/components/data-display/ComparisonView.svelte');
	const agreementView = () => import('$lib/components/data-display/AgreementView.svelte');
	const extremeView = () => import('$lib/components/views/ExtremeViewContent.svelte');
	// Two arbiter views, selected by generation rather than branched inside one
	// component: the v1 view is pairwise all the way down (pair picker,
	// `model_a_is_first`, two-way percentages) and has to stay stable for the
	// archive, while v2 asks one three-way question per article.
	const arbiterView = () => import('$lib/components/data-display/ArbiterView.svelte');
	const arbiterV2View = () => import('$lib/components/data-display/ArbiterV2View.svelte');

	interface ViewContentProps {
		/** Currently active view */
		activeView: ViewId;
		/** Selected extreme analysis category */
		selectedCategory: ExtremeCategory;
		/** Selected keyword type for extreme analysis */
		selectedKeywordType: KeywordType;
		/** Number of top items to show in extreme analysis */
		showTopN: number;
		/** Callback when article details should be shown */
		onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
	}

	let {
		activeView,
		selectedCategory,
		selectedKeywordType,
		showTopN,
		onShowDetails
	}: ViewContentProps = $props();

	// Methodology metadata for the eyebrow rule under each view title.
	// Uses the active dataset (model) and the corpus size — surface what's
	// most load-bearing for an academic reader at a glance.
	let modelLabel = $derived(getModelDisplayName(datasetState.selected, datasetState.available));
	let totalCount = $derived((articleState.datasets[datasetState.selected] || []).length);
	let filteredCount = $derived(articleState.filtered?.length ?? totalCount);
	let comparisonMode = $derived(datasetState.isComparisonMode);

	function formatNum(n: number): string {
		try {
			return n.toLocaleString();
		} catch {
			return String(n);
		}
	}

	let methodologyLine = $derived.by(() => {
		if (comparisonMode || activeView === 'agreement') {
			// Pair views (comparison, agreement) report their own sample sizes and
			// name both models; a single-model "Model · X" line would misdescribe
			// what is on screen. Suppress here.
			return null;
		}
		if (totalCount === 0) return null;
		const parts: string[] = [];
		parts.push(`Model · ${modelLabel}`);
		if (filteredCount === totalCount) {
			parts.push(`Sample · ${formatNum(totalCount)} articles`);
		} else {
			parts.push(`Sample · ${formatNum(filteredCount)} of ${formatNum(totalCount)} articles`);
		}
		return parts.join('  ·  ');
	});

	type ViewKey = Exclude<ViewId, 'arbiter'>;

	type ViewMeta = {
		eyebrow: string;
		title: string;
		lede: string;
	};

	let viewMeta = $derived<Record<ViewKey, ViewMeta>>({
		charts: {
			eyebrow: $t.nav.charts,
			title: $t.nav.charts,
			lede: $t.charts.subtitle
		},
		trends: {
			eyebrow: $t.nav.trends,
			title: $t.nav.trends,
			lede: $t.trends.subtitle
		},
		correlation: {
			eyebrow: $t.nav.distribution,
			title: $t.nav.distribution,
			lede: $t.correlation.subtitle
		},
		volume: {
			eyebrow: $t.nav.volume,
			title: $t.nav.volume,
			lede: $t.volume.subtitle
		},
		seasonality: {
			eyebrow: $t.nav.seasonality,
			title: $t.seasonality.title,
			lede: $t.seasonality.subtitle
		},
		heatmap: {
			eyebrow: $t.nav.heatmap,
			title: $t.nav.heatmap,
			lede: $t.heatmap.subtitle
		},
		ranking: {
			eyebrow: $t.nav.ranking,
			title: $t.ranking.title,
			lede: $t.ranking.subtitle
		},
		map: {
			eyebrow: $t.nav.map,
			title: $t.map.title,
			lede: $t.map.subtitle
		},
		table: {
			eyebrow: $t.table.title,
			title: $t.table.title,
			lede: $t.table.subtitle
		},
		agreement: {
			eyebrow: $t.nav.agreement,
			title: $t.agreement.title,
			lede: $t.agreement.subtitle
		},
		comparison: {
			eyebrow: $t.nav.comparison,
			title: $t.nav.comparison,
			lede: $t.comparison.subtitle
		},
		extremes: {
			eyebrow: $t.extremeAnalysis.title,
			title: $t.extremeAnalysis.title,
			lede: $t.extremeAnalysis.subtitle
		}
	});
</script>

{#snippet header(view: ViewKey, trail: import('svelte').Snippet | null = null)}
	{@const meta = viewMeta[view]}
	<header class="view-header">
		<div class="view-header-text">
			<p class="view-eyebrow">{meta.eyebrow}</p>
			<h1 class="view-title">{meta.title}</h1>
			<p class="view-lede">{meta.lede}</p>
			{#if methodologyLine}
				<p class="view-methodology">{methodologyLine}</p>
			{/if}
		</div>
		{#if trail}
			<div class="view-header-trail">{@render trail()}</div>
		{/if}
	</header>
{/snippet}

{#if activeView === 'charts'}
	<div class="view mb-6">
		{@render header('charts')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="charts" />
		{/await}
	</div>
{:else if activeView === 'trends'}
	<div class="view mb-6">
		{@render header('trends')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="trends" />
		{/await}
	</div>
{:else if activeView === 'correlation'}
	<div class="view mb-6">
		{@render header('correlation')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="correlation" />
		{/await}
	</div>
{:else if activeView === 'volume'}
	<div class="view mb-6">
		{@render header('volume')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="volume" />
		{/await}
	</div>
{:else if activeView === 'seasonality'}
	<div class="view mb-6">
		{@render header('seasonality')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="seasonality" />
		{/await}
	</div>
{:else if activeView === 'heatmap'}
	<div class="view mb-6">
		{@render header('heatmap')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="heatmap" />
		{/await}
	</div>
{:else if activeView === 'ranking'}
	<div class="view mb-6">
		{@render header('ranking')}
		{#await chartViews}<LoadingState />{:then module}
			{@const ChartViews = module.default}<ChartViews view="ranking" />
		{/await}
	</div>
{:else if activeView === 'map'}
	<div class="view mb-6">
		{@render header('map')}
		{#await loadMapModule()}
			<LoadingState />
		{:then module}
			{@const SentimentMap = module.default}
			<SentimentMap />
		{/await}
	</div>
{:else if activeView === 'table'}
	<div class="view mb-6">
		{#snippet tableTrail()}
			<CSVExportButton />
		{/snippet}
		{@render header('table', tableTrail)}
		{#await tableView()}<LoadingState />{:then module}
			{@const ArticleTable = module.default}
			<ChartCard variant="table"><ArticleTable {onShowDetails} /></ChartCard>
		{/await}
	</div>
{:else if activeView === 'comparison'}
	<div class="view comparison-view mb-6">
		{@render header('comparison')}
		{#await comparisonView()}<LoadingState />{:then module}
			{@const ComparisonView = module.default}<ComparisonView />
		{/await}
	</div>
{:else if activeView === 'agreement'}
	<div class="view agreement-view mb-6">
		{@render header('agreement')}
		{#await agreementView()}<LoadingState />{:then module}
			{@const AgreementView = module.default}<AgreementView />
		{/await}
	</div>
{:else if activeView === 'extremes'}
	<div class="view extreme-view mb-6">
		{@render header('extremes')}
		{#await extremeView()}<LoadingState />{:then module}
			{@const ExtremeView = module.default}
			<ExtremeView {selectedCategory} {selectedKeywordType} {showTopN} />
		{/await}
	</div>
{:else if activeView === 'arbiter'}
	{#if datasetState.generation === 'v2'}
		{#await arbiterV2View()}<LoadingState />{:then module}
			{@const ArbiterV2View = module.default}<ArbiterV2View />
		{/await}
	{:else}
		{#await arbiterView()}<LoadingState />{:then module}
			{@const ArbiterView = module.default}<ArbiterView />
		{/await}
	{/if}
{/if}

<style>
	/* Editorial view header — eyebrow + title + lede.
	   No icon tile, no gradient text, no per-view colour theme. The chart that
	   follows IS the colour signal. */
	.view {
		width: 100%;
	}

	.view-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		padding-bottom: var(--space-5);
		margin-bottom: var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}

	.view-header-text {
		min-width: 0;
		flex: 1;
	}

	.view-eyebrow {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		margin: 0 0 var(--space-2);
	}

	.view-title {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: 700;
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
		margin: 0 0 var(--space-3);
	}

	.view-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0 0 var(--space-3);
	}

	/* Methodology metadata rule — wire-service style. Single line, monospace,
	   tabular numerals (inherited from body), reads first to anyone looking for
	   the methodological grounding of the chart below. */
	.view-methodology {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: var(--tracking-normal);
		padding-top: var(--space-3);
		border-top: 1px dashed var(--border-subtle);
		margin: 0;
		max-width: var(--prose-width);
	}

	.view-header-trail {
		flex-shrink: 0;
	}

	.comparison-view,
	.agreement-view,
	.extreme-view {
		/* 200px ≈ header + view heading chrome above the chart area */
		min-height: calc(100dvh - 200px);
	}

	@media (min-width: 640px) {
		.view-header {
			flex-direction: row;
			gap: var(--space-6);
		}

		.view-title {
			font-size: var(--font-size-3xl);
		}

		.view-lede {
			font-size: var(--font-size-lg);
		}
	}
</style>
