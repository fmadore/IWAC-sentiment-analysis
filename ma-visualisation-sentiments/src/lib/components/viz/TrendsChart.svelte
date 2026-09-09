<!--
  TrendsChart Component

  Shared line chart of yearly counts per sentiment-dimension bucket.
  SentimentTrendsChart and SubjectivityTrendsChart are thin wrappers that
  supply the dimension configuration (buckets, colors, labels).
-->
<script lang="ts">
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import Chart from './CitableChart.svelte';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import ChartDataTable from '../common/ChartDataTable.svelte';
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
		stateKey: 'polarityTrend' | 'subjectivityTrend';
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
		stateKey,
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
	let isShare = $derived(viewOptionsState[stateKey] === 'share');

	let displayModeOptions = $derived([
		{ value: 'count', label: $t.charts.countMode, icon: HashIcon },
		{ value: 'share', label: $t.charts.shareMode, icon: PercentIcon }
	]);

	// Use $derived for proper reactivity in Svelte 5
	const aggregate = $derived(
		aggregateByYearAndDimension(articleState.filtered, frenchLabels, getKey)
	);
	const shareData = $derived(
		computeDimensionShares(aggregate.yearlyCounts, aggregate.years, frenchLabels)
	);
	let options = $derived.by(() => {
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const { yearlyCounts, years, articlesAnalyzed } = aggregate;

		// Percentage shares are only needed in share mode; each datum carries its
		// raw count so the tooltip can read "34.2% (58)".
		const shares = isShare ? shareData : null;

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
					lang: () => currentLang,
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
		<ChartTypeToggle
			options={displayModeOptions}
			value={viewOptionsState[stateKey]}
			onChange={(value) => (viewOptionsState[stateKey] = value as 'count' | 'share')}
			{ariaLabel}
		/>
	</div>

	<div
		style="height: {isMobile ? '400px' : '500px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
		role="img"
		aria-label={isShare ? `${ariaLabel} — ${$t.charts.shareMode}` : ariaLabel}
	>
		<Chart chartId={stateKey.replace('Trend', '-trend')} {init} {options} />
	</div>
	<ChartDataTable
		columns={[
			{ label: $t.audit.year },
			...seriesLabels.map((label) => ({
				label,
				format: isShare ? ('percent' as const) : ('integer' as const)
			}))
		]}
		rows={aggregate.years.map((year) => [
			year,
			...frenchLabels.map((label) =>
				isShare ? shareData[year][label].value / 100 : (aggregate.yearlyCounts[year][label] ?? 0)
			)
		])}
		caption={`${title} — ${isShare ? $t.charts.shareMode : $t.charts.countMode}`}
		filenamePrefix={`trends-${viewOptionsState[stateKey]}`}
	/>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
