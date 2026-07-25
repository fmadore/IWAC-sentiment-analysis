<!--
  VolumeChart Component

  Yearly article volume per country, as stacked areas or plain lines.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import AreaChartIcon from '@lucide/svelte/icons/area-chart';
	import LineChartIcon from '@lucide/svelte/icons/line-chart';
	import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';
	import { aggregateByCountryAndYear } from '$lib/utils/chartAggregators';

	// Import centralized chart theme
	import {
		seriesColorPalette,
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
		getEmphasisConfig,
		getUniversalTransitionConfig
	} from '$lib/utils/chartTheme';

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartType = $state<'area' | 'line'>('area');

	let options = $derived.by(() => {
		const articles = articleState.filtered;
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const { countryYearCounts, countries, years, articlesAnalyzed } =
			aggregateByCountryAndYear(articles);

		const series = countries.map((country, index) => {
			const color = seriesColorPalette[index % seriesColorPalette.length];
			const lineStyle = getLineSeriesStyle(isMobile, color);
			return {
				name: country,
				type: 'line' as const,
				stack: chartType === 'area' ? 'total' : undefined,
				areaStyle:
					chartType === 'area'
						? {
								opacity: 0.4
							}
						: undefined,
				emphasis: getEmphasisConfig(),
				...getUniversalTransitionConfig(),
				id: `volume-${index}`,
				data: years.map((year) => countryYearCounts[country][year] || 0),
				color,
				...lineStyle,
				smooth: true
			};
		});

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${currentT.charts.volumeByCountry} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
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
					sort: true
				})
			},
			legend: {
				...getLegendConfig(isMobile),
				data: countries,
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
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />

		<ChartTypeToggle
			options={[
				{ value: 'area', label: $t.charts.stackedAreas, icon: AreaChartIcon },
				{ value: 'line', label: $t.charts.lines, icon: LineChartIcon }
			]}
			value={chartType}
			onChange={(value) => (chartType = value as 'area' | 'line')}
			ariaLabel={$t.charts.volumeByCountry}
		/>
	</div>

	<div
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.charts.volumeByCountry}
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
</style>
