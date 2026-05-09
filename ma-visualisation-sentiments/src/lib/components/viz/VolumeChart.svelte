<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init, use } from 'echarts/core';
	import { LineChart } from 'echarts/charts';
	import {
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent,
		DataZoomComponent
	} from 'echarts/components';
	import { UniversalTransition } from 'echarts/features';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';
	import { SvelteSet } from 'svelte/reactivity';

	use([
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent,
		LineChart,
		UniversalTransition,
		CanvasRenderer,
		DataZoomComponent
	]);

	import { filteredArticles } from '$lib';
	import type { Article } from '$lib';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import AreaChartIcon from '@lucide/svelte/icons/area-chart';
	import LineChartIcon from '@lucide/svelte/icons/line-chart';
	import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';

	// Import centralized chart theme
	import {
		seriesColorPalette,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisPointerConfig,
		getAxisLabelStyle,
		getSplitLineStyle,
		getGridConfig,
		getDataZoomConfig,
		getLineSeriesStyle,
		getEmphasisConfig,
		getUniversalTransitionConfig
	} from '$lib/utils/chartTheme';

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartContainer = $state<HTMLDivElement>();
	let chartType = $state<'area' | 'line'>('area');

	let options = $derived.by(() => {
		const articles = $filteredArticles;
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates
		const countryYearData: Record<string, Record<string, number>> = {};
		let articlesAnalyzed = 0;

		articles.forEach((article: Article) => {
			if (article.publication_date && article.Country) {
				const year = article.publication_date.substring(0, 4);
				const country = article.Country;

				if (!countryYearData[country]) {
					countryYearData[country] = {};
				}
				if (!countryYearData[country][year]) {
					countryYearData[country][year] = 0;
				}
				countryYearData[country][year]++;
				articlesAnalyzed++;
			}
		});

		const countries = Object.keys(countryYearData);
		const allYears = new SvelteSet<string>();

		// Collecter toutes les années
		countries.forEach((country) => {
			Object.keys(countryYearData[country]).forEach((year) => {
				allYears.add(year);
			});
		});

		const years = Array.from(allYears).sort();

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
				data: years.map((year) => countryYearData[country][year] || 0),
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
			yAxis: {
				type: 'value',
				minInterval: 1,
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle(),
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					formatter: (value: number) => Math.floor(value).toString()
				}
			},
			series: series,
			dataZoom: getDataZoomConfig(isMobile)
		} as EChartsOption;
	});
</script>

{#if $filteredArticles.length > 0}
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />

		<div class="chart-type-toggle" role="group" aria-label={$t.charts.lines}>
			<button
				class="chart-type-btn"
				data-active={chartType === 'area'}
				onclick={() => (chartType = 'area')}
				aria-pressed={chartType === 'area'}
			>
				<AreaChartIcon size={14} />
				<span>{$t.charts.stackedAreas}</span>
			</button>
			<button
				class="chart-type-btn"
				data-active={chartType === 'line'}
				onclick={() => (chartType = 'line')}
				aria-pressed={chartType === 'line'}
			>
				<LineChartIcon size={14} />
				<span>{$t.charts.lines}</span>
			</button>
		</div>
	</div>

	<div
		bind:this={chartContainer}
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container"
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

	.chart-type-toggle {
		display: inline-flex;
		gap: 1px;
		padding: 2px;
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
	}

	.chart-type-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.chart-type-btn:hover:not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.chart-type-btn[data-active='true'] {
		color: var(--accent);
		background: var(--accent-soft);
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
