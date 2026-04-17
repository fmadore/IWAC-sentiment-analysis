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

	// Charts
	import {
		SentimentChart,
		SentimentTrendsChart,
		SubjectivityChart,
		SubjectivityTrendsChart,
		CorrelationChart,
		VolumeChart,
		CentralityHeatmap,
		KeywordFrequencyChart
	} from '$lib/components/viz';

	// Data Display
	import { ArticleTable, ComparisonView, ArbiterView } from '$lib/components/data-display';

	// UI
	import { CSVExportButton, ChartCard } from '$lib/components/ui';

	// Icons
	import FlameIcon from '@lucide/svelte/icons/flame';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import GridIcon from '@lucide/svelte/icons/grid-3x3';
	import TableIcon from '@lucide/svelte/icons/table';
	import ScatterChartIcon from '@lucide/svelte/icons/scatter-chart';

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
</script>

{#if activeView === 'charts'}
	<div class="charts-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header charts-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon charts-icon">
					<BarChart3Icon size={32} class="text-blue-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title charts-title">
						{$t.nav.charts}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.charts?.subtitle ||
							'Visualize sentiment distribution across polarity and subjectivity dimensions.'}
					</p>
				</div>
			</div>
		</div>

		<div class="space-y-4 sm:space-y-6">
			<ChartCard variant="charts">
				<SentimentChart />
			</ChartCard>
			<ChartCard variant="charts">
				<SubjectivityChart />
			</ChartCard>
		</div>
	</div>
{:else if activeView === 'trends'}
	<div class="trends-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header trends-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon trends-icon">
					<TrendingUpIcon size={32} class="text-emerald-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title trends-title">
						{$t.nav.trends}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.trends?.subtitle || 'Track sentiment evolution over time across publications.'}
					</p>
				</div>
			</div>
		</div>

		<!-- Polarity Trends Chart -->
		<ChartCard variant="trends" class="mb-6">
			<SentimentTrendsChart />
		</ChartCard>

		<!-- Subjectivity Trends Chart -->
		<ChartCard variant="trends">
			<SubjectivityTrendsChart />
		</ChartCard>
	</div>
{:else if activeView === 'correlation'}
	<div class="correlation-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header correlation-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon correlation-icon">
					<ScatterChartIcon size={32} class="text-pink-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title correlation-title">
						{$t.nav.distribution}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.correlation?.subtitle ||
							'Analyze the relationship between polarity and subjectivity dimensions.'}
					</p>
				</div>
			</div>
		</div>

		<ChartCard variant="correlation">
			<CorrelationChart />
		</ChartCard>
	</div>
{:else if activeView === 'volume'}
	<div class="volume-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header volume-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon volume-icon">
					<ActivityIcon size={32} class="text-indigo-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title volume-title">
						{$t.nav.volume}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.volume?.subtitle ||
							'Analyze publication volume and temporal patterns in the corpus.'}
					</p>
				</div>
			</div>
		</div>

		<ChartCard variant="volume">
			<VolumeChart />
		</ChartCard>
	</div>
{:else if activeView === 'heatmap'}
	<div class="heatmap-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header heatmap-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon heatmap-icon">
					<GridIcon size={32} class="text-amber-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title heatmap-title">
						{$t.nav.heatmap}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.heatmap?.subtitle ||
							'Explore centrality patterns across countries and themes with interactive visualization.'}
					</p>
				</div>
			</div>
		</div>

		<ChartCard variant="heatmap">
			<CentralityHeatmap />
		</ChartCard>
	</div>
{:else if activeView === 'table'}
	<div class="table-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header table-header mb-6">
			<div class="flex items-start gap-4 flex-1">
				<div class="view-icon table-icon">
					<TableIcon size={32} class="text-slate-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title table-title">
						{$t.table.title}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.table?.subtitle || 'Browse and search all articles with detailed sentiment data.'}
					</p>
				</div>
			</div>
			<CSVExportButton />
		</div>

		<ChartCard variant="table">
			<ArticleTable {onShowDetails} />
		</ChartCard>
	</div>
{:else if activeView === 'comparison'}
	<div class="comparison-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header comparison-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon comparison-icon">
					<GitCompareArrowsIcon size={32} class="text-purple-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title comparison-title">
						{$t.nav.comparison}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.comparison.subtitle ||
							'Compare sentiment analyses between different AI models and identify significant discrepancies.'}
					</p>
				</div>
			</div>
		</div>

		<!-- Comparison Content -->
		<ComparisonView />
	</div>
{:else if activeView === 'extremes'}
	<div class="extreme-analysis-view mb-6">
		<!-- Header Section -->
		<div class="view-header extreme-header mb-6">
			<div class="flex items-start gap-4">
				<div class="view-icon extreme-icon">
					<FlameIcon size={32} class="text-orange-400" />
				</div>
				<div class="flex-1">
					<h1 class="h2 mb-2 text-white view-title extreme-title">
						{$t.extremeAnalysis.title}
					</h1>
					<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
						{$t.extremeAnalysis.subtitle}
					</p>
				</div>
			</div>
		</div>

		<!-- Chart Card -->
		<ChartCard variant="extreme">
			<KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
		</ChartCard>
	</div>
{:else if activeView === 'arbiter'}
	<ArbiterView />
{/if}

<style>
	/* Common View Header Styles */
	.view-header {
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: var(--space-6);
	}

	.view-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 14px;
	}

	.view-title {
		font-size: 1.75rem;
		font-weight: var(--font-weight-bold);
	}

	/* Charts View */
	.charts-analysis-view {
		width: 100%;
	}

	.charts-icon {
		background: var(--sentiment-charts-icon-bg);
		border: 1px solid var(--sentiment-charts-border);
	}

	.charts-title {
		background: var(--gradient-charts);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Trends View */
	.trends-analysis-view {
		width: 100%;
	}

	.trends-icon {
		background: var(--sentiment-trends-icon-bg);
		border: 1px solid var(--sentiment-trends-border);
	}

	.trends-title {
		background: var(--gradient-trends);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Volume View */
	.volume-analysis-view {
		width: 100%;
	}

	.volume-icon {
		background: var(--sentiment-volume-icon-bg);
		border: 1px solid var(--sentiment-volume-border);
	}

	.volume-title {
		background: var(--gradient-volume);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Heatmap View */
	.heatmap-analysis-view {
		width: 100%;
	}

	.heatmap-icon {
		background: var(--sentiment-heatmap-icon-bg);
		border: 1px solid var(--sentiment-heatmap-border);
	}

	.heatmap-title {
		background: var(--gradient-heatmap);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Correlation/Distribution View */
	.correlation-analysis-view {
		width: 100%;
	}

	.correlation-icon {
		background: var(--sentiment-correlation-icon-bg);
		border: 1px solid var(--sentiment-correlation-border);
	}

	.correlation-title {
		background: var(--gradient-correlation);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Table View */
	.table-analysis-view {
		width: 100%;
	}

	.table-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.table-icon {
		background: var(--sentiment-table-icon-bg);
		border: 1px solid var(--sentiment-table-border);
	}

	.table-title {
		background: var(--gradient-table);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Comparison Analysis View */
	.comparison-analysis-view {
		width: 100%;
		min-height: calc(100vh - 200px);
	}

	.comparison-icon {
		background: var(--sentiment-comparison-icon-bg);
		border: 1px solid var(--sentiment-comparison-border);
	}

	.comparison-title {
		background: var(--gradient-comparison);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Extreme Analysis View */
	.extreme-analysis-view {
		width: 100%;
		min-height: calc(100vh - 200px);
	}

	.extreme-icon {
		background: var(--sentiment-extreme-icon-bg);
		border: 1px solid var(--sentiment-extreme-border);
	}

	.extreme-title {
		background: var(--gradient-extreme);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	@media (max-width: 768px) {
		.view-title {
			font-size: var(--font-size-3xl);
		}

		.view-icon {
			width: 48px;
			height: 48px;
		}

		.table-header {
			flex-direction: column;
			align-items: stretch;
		}
	}

	@media (min-width: 1024px) {
		.view-title {
			font-size: 2rem;
		}
	}
</style>
