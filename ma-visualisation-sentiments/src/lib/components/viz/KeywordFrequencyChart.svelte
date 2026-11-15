<script lang="ts">
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import Chart from './CitableChart.svelte';
	import ChartHeading from './ChartHeading.svelte';
	import { num, dec, pct } from '#lib/i18n/utils.js';
	import { extremeState, retryCurrentExtremeAnalysis } from '#lib/stores/index.js';
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import ResourceLoadError from '#lib/components/common/ResourceLoadError.svelte';
	import { t } from '#lib/i18n/index.js';
	import Spinner from '#lib/components/common/Spinner.svelte';
	import type { ExtremeCategory, KeywordType } from '#lib/types/extremeAnalysis.js';
	import {
		getExtremeCategoryConfig,
		getTopKeywords,
		getDistinctiveKeywords,
		OPPOSITE_CATEGORY
	} from '#lib/utils/extremeAnalysis.js';
	import { useChartCardHeading } from '#lib/components/ui/chartCardHeading.svelte.js';
	import { isCompactWidth } from '#lib/utils/viewport.svelte.js';
	import {
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		chartColors
	} from '#lib/utils/chartTheme.js';

	// ECharts imports
	import { init } from '#lib/utils/echartsSetup.js';
	import type { EChartsOption } from 'echarts';

	// Component props
	interface Props {
		selectedCategory: ExtremeCategory;
		selectedKeywordType: KeywordType;
		showTopN: number;
	}

	let { selectedCategory, selectedKeywordType, showTopN }: Props = $props();

	// Measured on the chart's own container (it sits beside the filter rail).
	let containerWidth = $state<number>();
	let isMobile = $derived(isCompactWidth(containerWidth));

	// A failed load is its own state with a Retry action; only idle and loading spin.
	let loadState = $derived(extremeState.loadState);
	let isLoading = $derived(loadState.status === 'idle' || loadState.status === 'loading');

	let ranking = $derived(viewOptionsState.keywordRanking);
	let distinctive = $derived(ranking === 'distinctive');

	/** Category names, spelled out so every catalogue key is read literally. */
	let categoryLabels = $derived<Record<ExtremeCategory, string>>({
		subjectivity_extreme_high: $t.extremeAnalysis.categories.subjectivityHigh,
		subjectivity_extreme_low: $t.extremeAnalysis.categories.subjectivityLow,
		polarity_very_negative: $t.extremeAnalysis.categories.polarityNegative,
		polarity_very_positive: $t.extremeAnalysis.categories.polarityPositive,
		centrality_very_central: $t.extremeAnalysis.categories.centralityHigh,
		centrality_not_central: $t.extremeAnalysis.categories.centralityLow
	});
	const categoryLabel = (category: ExtremeCategory) => categoryLabels[category];

	// Derived data
	let categoryData = $derived(extremeState.filtered?.analysis[selectedCategory] ?? null);
	let oppositeCategory = $derived(OPPOSITE_CATEGORY[selectedCategory]);
	let oppositeData = $derived(extremeState.filtered?.analysis[oppositeCategory] ?? null);

	/** Category size and its share of the corpus (or of the filtered articles). */
	let categorySize = $derived(categoryData?.articles.length ?? 0);
	let corpusSize = $derived(extremeState.filtered?.statistics.total_articles ?? 0);
	let categoryShare = $derived(corpusSize > 0 ? categorySize / corpusSize : 0);

	function keywordsOf(data: typeof categoryData): Record<string, number> {
		if (!data) return {};
		return selectedKeywordType === 'subject' ? data.subject : data.spatial;
	}

	type Row = { keyword: string; count: number; contrastCount?: number; score?: number };
	const rows = $derived.by<Row[]>(() => {
		if (!categoryData) return [];
		if (distinctive && oppositeData) {
			return getDistinctiveKeywords(keywordsOf(categoryData), keywordsOf(oppositeData), showTopN);
		}
		return getTopKeywords(keywordsOf(categoryData), showTopN);
	});

	let chartTitle = $derived(
		distinctive ? $t.extremeAnalysis.distinctiveKeywords : $t.extremeAnalysis.topKeywords
	);
	let chartSubtitle = $derived(
		$t.extremeAnalysis.categorySize
			.replace('{category}', categoryLabel(selectedCategory))
			.replace('{count}', $num(categorySize))
			.replace('{share}', $pct(categoryShare, 0))
			.replace('{total}', $num(corpusSize))
	);
	const heading = useChartCardHeading(() => ({ title: chartTitle, subtitle: chartSubtitle }));

	// Chart options
	let options = $derived.by(() => {
		const data = categoryData;
		if (!data) return null;

		const categoryConfig = getExtremeCategoryConfig(selectedCategory);

		// Reverse for horizontal display (highest at top)
		const reversedData = [...rows].reverse();

		// Size the label column from the longest keyword rather than a large
		// percentage; containLabel already widens the grid to fit it.
		const longestLabelLength = reversedData.reduce((max, k) => Math.max(max, k.keyword.length), 0);
		const avgCharWidth = isMobile ? 6 : 7;
		const labelWidth = Math.min(
			Math.max(longestLabelLength * avgCharWidth, isMobile ? 90 : 140),
			isMobile ? 180 : 260
		);

		const tooltipConfig = getTooltipConfig(isMobile);
		const opposite = categoryLabel(oppositeCategory);
		const line = (label: string, value: string) =>
			`<div style="display:flex;justify-content:space-between;gap:12px;"><span>${label}</span><strong>${value}</strong></div>`;

		return {
			backgroundColor: 'transparent',
			tooltip: {
				...tooltipConfig,
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: chartColors.axis.pointerShadowNeutral }
				},
				formatter: (params: unknown) => {
					const point = (Array.isArray(params) ? params[0] : params) as { dataIndex: number };
					const row = reversedData[point.dataIndex];
					if (!row) return '';
					const lines = [line($t.extremeAnalysis.articleCount, $num(row.count))];
					if (row.score !== undefined) {
						lines.push(
							line(
								$t.extremeAnalysis.oppositeCount.replace('{category}', opposite),
								$num(row.contrastCount ?? 0)
							),
							line($t.extremeAnalysis.distinctiveScore, $dec(row.score, 1))
						);
					}
					return `<div style="min-width:160px;"><div style="font-weight:600;margin-bottom:6px;">${row.keyword}</div>${lines.join('')}</div>`;
				}
			},
			grid: {
				left: isMobile ? 8 : 12,
				right: isMobile ? '8%' : '10%',
				top: 16,
				bottom: 40,
				containLabel: true
			},
			xAxis: {
				type: 'value',
				name: distinctive ? $t.extremeAnalysis.distinctiveScore : $t.extremeAnalysis.articleCount,
				nameLocation: 'middle',
				nameGap: 28,
				nameTextStyle: { color: chartColors.text.muted },
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			yAxis: {
				type: 'category',
				data: reversedData.map((item) => item.keyword),
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					color: chartColors.text.secondary,
					interval: 0,
					formatter: (value: string) => {
						const maxChars = Math.floor(labelWidth / avgCharWidth);
						return value.length > maxChars
							? value.slice(0, Math.max(0, maxChars - 2)) + '…'
							: value;
					},
					margin: 12,
					overflow: 'truncate',
					width: labelWidth
				},
				axisLine: getAxisLineStyle(),
				axisTick: { show: false },
				splitLine: { show: false }
			},
			series: [
				{
					type: 'bar',
					barWidth: isMobile ? '50%' : '60%',
					data: reversedData.map((item) => ({
						value: distinctive ? Number((item.score ?? 0).toFixed(2)) : item.count,
						itemStyle: {
							color: categoryConfig?.color || chartColors.chrome.accent,
							borderRadius: 0
						}
					})),
					emphasis: {
						focus: 'series' as const,
						itemStyle: { borderColor: chartColors.text.primary, borderWidth: 1 }
					},
					animationDuration: 1000,
					animationEasing: 'cubicOut',
					animationDelay: (idx: number) => idx * 30
				}
			]
		} as EChartsOption;
	});

	let oppositeLabel = $derived(categoryLabel(oppositeCategory));
</script>

{#if !heading.inCard}
	<ChartHeading title={chartTitle} subtitle={chartSubtitle} />
{/if}
{#if loadState.status === 'error'}
	<ResourceLoadError error={loadState.error} onRetry={() => retryCurrentExtremeAnalysis(fetch)} />
{:else if isLoading}
	<!-- Loading State -->
	<div class="loading-container">
		<div class="chart-container extreme-chart-container p-4" style="min-height: 500px;">
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<Spinner
						size="2xl"
						decorative
						--spinner-track="var(--border-default)"
						--spinner-accent="var(--sentiment-extreme)"
					/>
					<p class="loading-note" role="status">{$t.messages.loading}</p>
				</div>
			</div>
		</div>
	</div>
{:else if extremeState.filtered && options}
	<!-- Category Description -->
	{#if selectedCategory}
		{@const descriptionKey = selectedCategory
			.replace('_extreme', '')
			.replace('polarity_very_', 'polarity')
			.replace('centrality_', 'centrality') as keyof typeof $t.extremeAnalysis.descriptions}
		{@const description = $t.extremeAnalysis.descriptions[descriptionKey]}
		{#if description && description.trim()}
			<div class="extreme-description-card">
				<p class="description-text">
					{description}
				</p>
			</div>
		{/if}
	{/if}

	<!-- Chart Container -->
	<div
		bind:clientWidth={containerWidth}
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container extreme-chart-container p-2 sm:p-4"
		role="img"
		aria-label="{chartTitle} — {chartSubtitle}"
	>
		{#if rows.length > 0}
			<Chart chartId="keyword-frequency-chart" {init} {options} />
		{:else}
			<p class="chart-empty">{$t.extremeAnalysis.noData}</p>
		{/if}
	</div>

	<p class="chart-note">
		{distinctive
			? $t.extremeAnalysis.distinctiveNote.replace('{opposite}', oppositeLabel)
			: $t.extremeAnalysis.countNote}
	</p>

	<!-- Statistics Card -->
	{#if categoryData}
		<div class="extreme-stats-card">
			<div class="statistics-row">
				<div class="stat-item">
					<span class="stat-label">{$t.common.total} {$t.common.articles}:</span>
					<span class="stat-value extreme-stat-value">{$num(categorySize)}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">{$t.extremeAnalysis.shareOfCorpus}:</span>
					<span class="stat-value extreme-stat-value">{$pct(categoryShare, 0)}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">{chartTitle}:</span>
					<span class="stat-value extreme-stat-value">{rows.length}</span>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<p class="chart-empty">{$t.messages.noData}</p>
{/if}

<ChartDataTable
	columns={distinctive
		? [
				{ label: chartTitle },
				{ label: $t.extremeAnalysis.articleCount, format: 'integer' },
				{
					label: $t.extremeAnalysis.oppositeCount.replace('{category}', oppositeLabel),
					format: 'integer'
				},
				{ label: $t.extremeAnalysis.distinctiveScore, format: 'decimal', digits: 2 }
			]
		: [{ label: chartTitle }, { label: $t.audit.count, format: 'integer' }]}
	rows={rows.map((k) =>
		distinctive ? [k.keyword, k.count, k.contrastCount ?? 0, k.score ?? 0] : [k.keyword, k.count]
	)}
	caption="{chartTitle} — {chartSubtitle}"
	filenamePrefix="keywords-{ranking}-{selectedCategory}-{selectedKeywordType}"
/>

<style>
	.loading-container {
		animation: fadeIn var(--timing-normal) ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Chart Container */
	.chart-container {
		background: var(--surface-muted);
		border: 1px solid var(--border-subtle);
	}

	.extreme-chart-container {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-extreme);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.extreme-chart-container:hover {
		border-color: var(--border-hover);
		border-top-color: var(--sentiment-extreme);
	}

	/* Description Card */
	.extreme-description-card {
		background: color-mix(in oklab, var(--sentiment-extreme) 6%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-extreme) 18%, transparent);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	/* Statistics Card */
	.extreme-stats-card {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		margin-top: var(--space-4);
	}

	/* Statistics Row */
	.statistics-row {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
		justify-content: center;
	}

	.stat-item {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		text-align: center;
	}

	.stat-label {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	.stat-value {
		color: var(--text-primary);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-base);
	}

	.extreme-stat-value {
		color: var(--sentiment-extreme-accent);
	}

	/* Mobile Responsiveness */
	@media (min-width: 640px) {
		.statistics-row {
			flex-direction: row;
			gap: var(--space-6);
		}

		.stat-item {
			text-align: left;
		}
	}

	@media (min-width: 1024px) {
		.statistics-row {
			gap: var(--space-8);
		}

		.stat-label {
			font-size: var(--font-size-base);
		}

		.stat-value {
			font-size: var(--font-size-lg);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.extreme-chart-container,
		.extreme-description-card,
		.extreme-stats-card {
			animation: none;
			transition: none;
		}
	}

	.loading-note {
		color: var(--text-secondary);
	}

	.description-text {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		margin: 0;
	}
</style>
