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
	import type { Article } from '$lib/types/data';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
	import { t } from '$lib/i18n';
	import { datasetState, articleState } from '$lib/stores';
	import { getModelDisplayName } from '$lib/utils/format';

	// Charts
	import {
		SentimentChart,
		SentimentTrendsChart,
		SubjectivityChart,
		SubjectivityTrendsChart,
		CorrelationChart,
		VolumeChart,
		CentralityHeatmap,
		KeywordFrequencyChart,
		HijriSeasonalityChart,
		NewspaperRankingChart
	} from '$lib/components/viz';

	// Data Display
	import {
		ArticleTable,
		ComparisonView,
		ArbiterView,
		AgreementView
	} from '$lib/components/data-display';

	// UI
	import { CSVExportButton, ChartCard } from '$lib/components/ui';

	interface ViewContentProps {
		/** Currently active view */
		activeView: string;
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

	type ViewKey =
		| 'charts'
		| 'trends'
		| 'correlation'
		| 'volume'
		| 'seasonality'
		| 'heatmap'
		| 'ranking'
		| 'table'
		| 'comparison'
		| 'agreement'
		| 'extremes';

	type ViewMeta = {
		eyebrow: string;
		title: string;
		lede: string;
	};

	let viewMeta = $derived<Record<ViewKey, ViewMeta>>({
		charts: {
			eyebrow: $t.nav.charts,
			title: $t.nav.charts,
			lede:
				$t.charts?.subtitle ||
				'Visualize sentiment distribution across polarity and subjectivity dimensions.'
		},
		trends: {
			eyebrow: $t.nav.trends,
			title: $t.nav.trends,
			lede: $t.trends?.subtitle || 'Track sentiment evolution over time across publications.'
		},
		correlation: {
			eyebrow: $t.nav.distribution,
			title: $t.nav.distribution,
			lede:
				$t.correlation?.subtitle ||
				'Analyze the relationship between polarity and subjectivity dimensions.'
		},
		volume: {
			eyebrow: $t.nav.volume,
			title: $t.nav.volume,
			lede: $t.volume?.subtitle || 'Analyze publication volume and temporal patterns in the corpus.'
		},
		seasonality: {
			eyebrow: $t.nav.seasonality,
			title: $t.seasonality.title,
			lede: $t.seasonality.subtitle
		},
		heatmap: {
			eyebrow: $t.nav.heatmap,
			title: $t.nav.heatmap,
			lede:
				$t.heatmap?.subtitle ||
				'Explore centrality patterns across countries and themes with interactive visualization.'
		},
		ranking: {
			eyebrow: $t.nav.ranking,
			title: $t.ranking.title,
			lede: $t.ranking.subtitle
		},
		table: {
			eyebrow: $t.table.title,
			title: $t.table.title,
			lede: $t.table?.subtitle || 'Browse and search all articles with detailed sentiment data.'
		},
		agreement: {
			eyebrow: $t.nav.agreement,
			title: $t.agreement.title,
			lede: $t.agreement.subtitle
		},
		comparison: {
			eyebrow: $t.nav.comparison,
			title: $t.nav.comparison,
			lede:
				$t.comparison.subtitle ||
				'Compare sentiment analyses between different AI models and identify significant discrepancies.'
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
		<div class="space-y-4 sm:space-y-6">
			<ChartCard variant="charts"><SentimentChart /></ChartCard>
			<ChartCard variant="charts"><SubjectivityChart /></ChartCard>
		</div>
	</div>
{:else if activeView === 'trends'}
	<div class="view mb-6">
		{@render header('trends')}
		<ChartCard variant="trends" class="mb-6"><SentimentTrendsChart /></ChartCard>
		<ChartCard variant="trends"><SubjectivityTrendsChart /></ChartCard>
	</div>
{:else if activeView === 'correlation'}
	<div class="view mb-6">
		{@render header('correlation')}
		<ChartCard variant="correlation"><CorrelationChart /></ChartCard>
	</div>
{:else if activeView === 'volume'}
	<div class="view mb-6">
		{@render header('volume')}
		<ChartCard variant="volume"><VolumeChart /></ChartCard>
	</div>
{:else if activeView === 'seasonality'}
	<div class="view mb-6">
		{@render header('seasonality')}
		<ChartCard variant="volume"><HijriSeasonalityChart /></ChartCard>
	</div>
{:else if activeView === 'heatmap'}
	<div class="view mb-6">
		{@render header('heatmap')}
		<ChartCard variant="heatmap"><CentralityHeatmap /></ChartCard>
	</div>
{:else if activeView === 'ranking'}
	<div class="view mb-6">
		{@render header('ranking')}
		<ChartCard variant="charts"><NewspaperRankingChart /></ChartCard>
	</div>
{:else if activeView === 'table'}
	<div class="view mb-6">
		{#snippet tableTrail()}
			<CSVExportButton />
		{/snippet}
		{@render header('table', tableTrail)}
		<ChartCard variant="table"><ArticleTable {onShowDetails} /></ChartCard>
	</div>
{:else if activeView === 'comparison'}
	<div class="view comparison-view mb-6">
		{@render header('comparison')}
		<ComparisonView />
	</div>
{:else if activeView === 'agreement'}
	<div class="view agreement-view mb-6">
		{@render header('agreement')}
		<AgreementView />
	</div>
{:else if activeView === 'extremes'}
	<div class="view extreme-view mb-6">
		{@render header('extremes')}
		<ChartCard variant="extreme">
			<KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
		</ChartCard>
	</div>
{:else if activeView === 'arbiter'}
	<ArbiterView />
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
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-6);
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
		font-size: var(--font-size-3xl);
		font-weight: 700;
		line-height: var(--line-height-tight);
		letter-spacing: var(--tracking-tight);
		color: var(--text-primary);
		margin: 0 0 var(--space-3);
	}

	.view-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-lg);
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

	@media (max-width: 768px) {
		.view-header {
			flex-direction: column;
			gap: var(--space-3);
		}

		.view-title {
			font-size: var(--font-size-2xl);
		}

		.view-lede {
			font-size: var(--font-size-base);
		}
	}
</style>
