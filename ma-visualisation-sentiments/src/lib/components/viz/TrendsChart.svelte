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
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';
	import { aggregateByYearAndDimension, computeDimensionShares } from '$lib/utils/chartAggregators';
	import HashIcon from '@lucide/svelte/icons/hash';
	import PercentIcon from '@lucide/svelte/icons/percent';

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
		getShareYAxis,
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

	/**
	 * Count vs share. Corpus volume runs from ~20 articles a year in the 1960s to
	 * several hundred in the 2010s, so in count mode every series traces the
	 * publication-volume curve and composition changes are invisible. Share mode
	 * renders each year as a 100% stacked band, which is what actually answers
	 * "did coverage get more negative over time?".
	 */
	let displayMode = $state<'count' | 'share'>('count');
	let isShare = $derived(displayMode === 'share');

	let displayModeOptions = $derived([
		{ value: 'count', label: $t.charts.countMode, icon: HashIcon },
		{ value: 'share', label: $t.charts.shareMode, icon: PercentIcon }
	]);

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

		// Percentage shares are only needed in share mode; each datum carries its
		// raw count so the tooltip can read "34.2% (58)".
		const shares = isShare ? computeDimensionShares(yearlyCounts, years, frenchLabels) : null;

		const series = frenchLabels.map((frenchLabel, index) => {
			const color = getColor(frenchLabel, index);
			const lineStyle = getLineSeriesStyle(isMobile, color);
			return {
				name: seriesLabels[index],
				type: 'line' as const,
				emphasis: getEmphasisConfig(),
				data: years.map((year) =>
					shares ? shares[year][frenchLabel] : yearlyCounts[year][frenchLabel] || 0
				),
				color,
				...lineStyle,
				smooth: true,
				// Share mode stacks into contiguous bands; count mode stays as
				// independent lines so series can cross and be compared directly.
				...(isShare
					? {
							stack: 'share',
							areaStyle: { color, opacity: 0.75 },
							// Flat bands read better than wobbling splines when the eye is
							// tracking band thickness rather than a single line's path.
							smooth: false,
							symbol: 'none' as const
						}
					: {})
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
					getTotalLabel: () => currentT.common.total,
					share: () => isShare
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
			yAxis: isShare ? getShareYAxis(isMobile) : getCountYAxis(isMobile),
			series: series,
			dataZoom: getDataZoomConfig(isMobile)
		} as EChartsOption;
	});
</script>

{#if articleState.filtered.length > 0}
	<div class="chart-toolbar mb-4">
		<DatasetBadge size="sm" />
		<ChartTypeToggle
			options={displayModeOptions}
			value={displayMode}
			onChange={(value) => (displayMode = value as 'count' | 'share')}
			{ariaLabel}
		/>
	</div>

	<div
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
		role="img"
		aria-label={isShare ? `${ariaLabel} — ${$t.charts.shareMode}` : ariaLabel}
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
