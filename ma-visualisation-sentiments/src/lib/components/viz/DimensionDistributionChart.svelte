<!--
  DimensionDistributionChart Component

  Shared distribution chart for a sentiment dimension (polarity or
  subjectivity): stacked bars by newspaper, or a globally-aggregated pie,
  with a chart-type toggle. SentimentChart and SubjectivityChart are thin
  wrappers that supply the dimension configuration.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';

	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption, SeriesOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { aggregateByJournalAndDimension } from '$lib/utils/chartAggregators';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';
	import {
		createPieTooltipFormatter,
		createStackedBarTooltipFormatter
	} from '$lib/utils/chartFormatters';

	// Import centralized chart theme
	import {
		seriesColorPalette,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getGridConfig,
		getCountYAxis,
		getPieSeriesStyle,
		getEmphasisConfig,
		getUniversalTransitionConfig,
		getStaggeredAnimationDelay,
		chartColors
	} from '$lib/utils/chartTheme';

	interface DimensionDistributionChartProps {
		/** French dimension labels used as data-lookup keys, in display order */
		frenchLabels: string[];
		/** Translated labels for the current language (same order as frenchLabels) */
		translatedLabels: string[];
		/** Resolve an article to its French dimension label, or null to skip it */
		getKey: (article: Article) => string | null;
		/** Slice color for a French dimension label (pie mode) */
		getColor: (frenchLabel: string) => string;
		/** Translated dimension title, e.g. t.charts.polarityDistribution */
		title: string;
		/** Translated series name for the pie, e.g. t.filters.polarity */
		seriesName: string;
		/** Stable series-id prefix used for universal transitions */
		seriesIdPrefix: string;
		/** Accessible description of the rendered chart */
		ariaLabel: string;
	}

	let {
		frenchLabels,
		translatedLabels,
		getKey,
		getColor,
		title,
		seriesName,
		seriesIdPrefix,
		ariaLabel
	}: DimensionDistributionChartProps = $props();

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartType = $state<'bar' | 'pie'>('bar');

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		const articles = articleState.filtered; // Direct reactive dependency
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const { newspaperCounts, newspaperList, articlesAnalyzed } = aggregateByJournalAndDimension(
			articles,
			frenchLabels,
			getKey
		);

		if (chartType === 'pie') {
			// Pie chart: global aggregation by dimension label
			const totalByLabel: Record<string, number> = {};
			frenchLabels.forEach((frenchLabel, index) => {
				const translatedLabel = translatedLabels[index];
				totalByLabel[translatedLabel] = 0;
				newspaperList.forEach((journal) => {
					totalByLabel[translatedLabel] += newspaperCounts[journal]?.[frenchLabel] || 0;
				});
			});

			const pieData = translatedLabels
				.filter((label) => totalByLabel[label] > 0)
				.map((label, index) => ({
					name: label,
					value: totalByLabel[label],
					itemStyle: {
						color: getColor(frenchLabels[index])
					}
				}));

			const pieStyle = getPieSeriesStyle(isMobile);
			const tooltipConfig = getTooltipConfig(isMobile);

			return {
				backgroundColor: 'transparent',
				title: {
					text: `${currentT.charts.globalDistribution} ${title.toLowerCase()} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
					left: 'center',
					top: '2%',
					textStyle: getTitleStyle(isMobile)
				},
				tooltip: {
					...tooltipConfig,
					trigger: 'item',
					formatter: createPieTooltipFormatter({
						formatValue: (n) => formatNumber(n, currentLang)
					})
				},
				// The pie is aggregated globally by dimension, so a journal legend would
				// control nothing here; slice labels already name the categories.
				legend: {
					show: false
				},
				series: [
					{
						name: seriesName,
						type: 'pie',
						...pieStyle,
						...getUniversalTransitionConfig(),
						id: seriesIdPrefix,
						data: pieData
					}
				]
			} as EChartsOption;
		} else {
			// Bar chart (original)
			const seriesData: SeriesOption[] = newspaperList.map((journal, index) => {
				return {
					name: journal,
					type: 'bar',
					stack: 'total',
					emphasis: getEmphasisConfig(),
					...getUniversalTransitionConfig(),
					...getStaggeredAnimationDelay(),
					id: `${seriesIdPrefix}-${index}`,
					data: frenchLabels.map((frenchLabel) => newspaperCounts[journal]?.[frenchLabel] || 0),
					itemStyle: {
						color: seriesColorPalette[index % seriesColorPalette.length],
						borderRadius: 0
					}
				};
			});

			const tooltipConfig = getTooltipConfig(isMobile);

			return {
				backgroundColor: 'transparent',
				title: {
					text: isMobile
						? `${title} ${currentT.charts.byJournal}\n(${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`
						: `${title} ${currentT.charts.byJournal} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
					left: 'center',
					top: '1%',
					textStyle: {
						...getTitleStyle(isMobile),
						lineHeight: isMobile ? 16 : 20
					}
				},
				tooltip: {
					...tooltipConfig,
					trigger: 'axis',
					triggerOn: 'mousemove',
					enterable: true,
					axisPointer: {
						type: 'shadow',
						shadowStyle: {
							color: chartColors.axis.pointerShadow
						}
					},
					confine: true,
					formatter: createStackedBarTooltipFormatter({
						getTotalLabel: () => currentT.common.total,
						getIsMobile: () => isMobile,
						scrollableList: true
					})
				},
				legend: {
					...getLegendConfig(isMobile),
					data: newspaperList,
					// Mobile: anchor the horizontal legend to the bottom (the grid
					// reserves space for it). Desktop: keep it at the top. Both anchors
					// are explicit ('auto' neutralises the unused side) so the legend
					// repositions cleanly when the viewport crosses the 768px breakpoint.
					top: isMobile ? 'auto' : '8%',
					bottom: isMobile ? 0 : 'auto'
				},
				grid: getGridConfig(isMobile, {
					hasLegendTop: !isMobile,
					legendPosition: isMobile ? 'bottom' : 'top'
				}),
				xAxis: {
					type: 'category',
					data: translatedLabels,
					axisTick: {
						alignWithLabel: true,
						lineStyle: { color: chartColors.axis.tickLine }
					},
					axisLine: getAxisLineStyle(),
					axisLabel: {
						...getAxisLabelStyle(isMobile),
						rotate: isMobile ? 45 : 30,
						interval: 0
					}
				},
				yAxis: getCountYAxis(isMobile),
				series: seriesData
			} as EChartsOption;
		}
	});
</script>

{#if articleState.filtered.length > 0}
	<!-- Dataset badge + chart-type toggle -->
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />

		<ChartTypeToggle
			options={[
				{ value: 'bar', label: $t.charts.bars, icon: BarChart3Icon },
				{ value: 'pie', label: $t.charts.pie, icon: PieChartIcon }
			]}
			value={chartType}
			onChange={(value) => (chartType = value as 'bar' | 'pie')}
			ariaLabel={title}
		/>
	</div>

	<div
		style="height: {isMobile ? '350px' : '450px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={ariaLabel}
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="empty-state">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	.chart-toolbar {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	@media (min-width: 640px) {
		.chart-toolbar {
			flex-direction: row;
		}
	}

	.chart-container {
		background: transparent;
		padding: var(--space-2);
	}

	@media (min-width: 640px) {
		.chart-container {
			padding: var(--space-4);
		}
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8) 0;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}
</style>
