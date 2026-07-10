<!--
  TrendsChart Component

  Shared line chart of yearly counts per sentiment-dimension bucket.
  SentimentTrendsChart and SubjectivityTrendsChart are thin wrappers that
  supply the dimension configuration (buckets, colors, labels).
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';
	import { aggregateByYearAndDimension } from '$lib/utils/chartAggregators';

	// Import centralized chart theme
	import {
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisPointerConfig,
		getAxisLabelStyle,
		getGridConfig,
		getCountYAxis,
		getDataZoomConfig,
		getLineSeriesStyle,
		getEmphasisConfig
	} from '$lib/utils/chartTheme';

	interface TrendsChartProps {
		/** French dimension labels used as data-lookup keys, in series order */
		frenchLabels: string[];
		/** Translated series names (same order as frenchLabels) */
		seriesLabels: string[];
		/** Translated legend entries */
		legendData: string[];
		/** Resolve an article to its French dimension label, or null to skip it */
		getKey: (article: Article) => string | null;
		/** Line color for a French dimension label */
		getColor: (frenchLabel: string, index: number) => string;
		/** Translated chart title, e.g. t.charts.sentimentTrends */
		title: string;
		/** Accessible description of the rendered chart */
		ariaLabel: string;
	}

	let {
		frenchLabels,
		seriesLabels,
		legendData,
		getKey,
		getColor,
		title,
		ariaLabel
	}: TrendsChartProps = $props();

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		const articles = articleState.filtered; // Direct reactive dependency
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const { yearlyCounts, years, articlesAnalyzed } = aggregateByYearAndDimension(
			articles,
			frenchLabels,
			getKey
		);

		const series = frenchLabels.map((frenchLabel, index) => {
			const color = getColor(frenchLabel, index);
			const lineStyle = getLineSeriesStyle(isMobile, color);
			return {
				name: seriesLabels[index],
				type: 'line' as const,
				emphasis: getEmphasisConfig(),
				data: years.map((year) => yearlyCounts[year][frenchLabel] || 0),
				color,
				...lineStyle,
				smooth: true
			};
		});

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${title} ${currentT.charts.byYear} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
				left: 'center',
				top: '2%',
				textStyle: getTitleStyle(isMobile)
			},
			tooltip: {
				...tooltipConfig,
				trigger: 'axis',
				axisPointer: getAxisPointerConfig(),
				formatter: createTrendTooltipFormatter({
					getTotalLabel: () => currentT.common.total
				})
			},
			legend: {
				...getLegendConfig(isMobile),
				data: legendData,
				top: isMobile ? '12%' : '8%'
			},
			grid: getGridConfig(isMobile, { hasLegendTop: true, hasDataZoom: true }),
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: years,
				axisLine: getAxisLineStyle(),
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					rotate: isMobile ? 45 : 0
				}
			},
			yAxis: getCountYAxis(isMobile),
			series: series,
			dataZoom: getDataZoomConfig(isMobile)
		} as EChartsOption;
	});
</script>

{#if articleState.filtered.length > 0}
	<div class="mb-4">
		<DatasetBadge size="sm" />
	</div>

	<div
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
		role="img"
		aria-label={ariaLabel}
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if}
