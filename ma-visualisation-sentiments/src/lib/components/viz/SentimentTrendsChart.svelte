<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib';
	import type { Article } from '$lib';
	import { t, currentLanguage } from '$lib/i18n';
	import { getSentimentLabels, formatNumber } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';

	// Import centralized chart theme
	import {
		polarityColors,
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
		getEmphasisConfig
	} from '$lib/utils/chartTheme';

	// Get polarity labels in current language
	let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));

	// French labels for data lookup (data is stored in French)
	const frenchPolarityLabels = [
		'Très positif',
		'Positif',
		'Neutre',
		'Négatif',
		'Très négatif'
	] as const;
	type PolarityType = (typeof frenchPolarityLabels)[number];

	// Reactive window width for responsive behavior
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	let chartContainer = $state<HTMLDivElement>();

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		const articles = articleState.filtered; // Direct reactive dependency
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates
		const yearlyData: Record<string, Record<PolarityType, number>> = {};
		let articlesAnalyzed = 0;

		articles.forEach((article: Article) => {
			if (article.publication_date && article.sentiment_analysis?.polarite) {
				const year = article.publication_date.substring(0, 4);
				const polarity = article.sentiment_analysis.polarite as PolarityType;

				if (frenchPolarityLabels.includes(polarity)) {
					if (!yearlyData[year]) {
						yearlyData[year] = Object.fromEntries(
							frenchPolarityLabels.map((l) => [l, 0])
						) as Record<PolarityType, number>;
					}
					yearlyData[year][polarity]++;
					articlesAnalyzed++;
				}
			}
		});

		const years = Object.keys(yearlyData).sort();

		const series = frenchPolarityLabels.map((frenchPolarity, index) => {
			const color = polarityColors[frenchPolarity as keyof typeof polarityColors];
			const lineStyle = getLineSeriesStyle(isMobile, color);
			return {
				name: polarityLabels[index],
				type: 'line' as const,
				emphasis: getEmphasisConfig(),
				data: years.map((year) => yearlyData[year][frenchPolarity] || 0),
				color,
				...lineStyle,
				smooth: true
			};
		});

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${currentT.charts.sentimentTrends} ${currentT.charts.byYear} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
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
				data: polarityLabels,
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

{#if articleState.filtered.length > 0}
	<div class="mb-4">
		<DatasetBadge size="sm" />
	</div>

	<div
		bind:this={chartContainer}
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if}
