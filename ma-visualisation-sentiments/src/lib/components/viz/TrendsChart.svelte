<!--
  TrendsChart Component

  Shared line chart of yearly counts per sentiment-dimension bucket.
  SentimentTrendsChart and SubjectivityTrendsChart are thin wrappers that
  supply the dimension configuration (buckets, colors, labels).
-->
<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import Chart from './CitableChart.svelte';
	import { init } from '#lib/utils/echartsSetup.js';
	import type { EChartsOption } from 'echarts';
	import { isCompactWidth } from '#lib/utils/viewport.svelte.js';
	import { useChartCardHeading } from '#lib/components/ui/chartCardHeading.svelte.js';
	import ChartHeading from './ChartHeading.svelte';

	import { articleState } from '#lib/stores/index.js';
	import type { Article } from '#lib/types/data.js';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { formatNumber } from '#lib/i18n/utils.js';
	import { isLowN, LOW_N_THRESHOLD } from '#lib/utils/stats.js';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import { createTrendTooltipFormatter } from '#lib/utils/chartFormatters.js';
	import {
		aggregateByYearAndDimension,
		computeDimensionShares
	} from '#lib/utils/chartAggregators.js';
	import HashIcon from '@lucide/svelte/icons/hash';
	import PercentIcon from '@lucide/svelte/icons/percent';

	// Import centralized chart theme
	import {
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
		getEmphasisConfig,
		chartColors
	} from '#lib/utils/chartTheme.js';

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

	// Compact layout follows the chart's own width, not the window's.
	let containerWidth = $state<number>();
	let isMobile = $derived(isCompactWidth(containerWidth));

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

	const headingTitle = $derived(`${title} ${$t.charts.byYear}`);
	const headingSubtitle = $derived(
		`${formatNumber(aggregate.articlesAnalyzed, $currentLanguage)} ${$t.charts.articlesAnalyzed}`
	);
	const heading = useChartCardHeading(() => ({ title: headingTitle, subtitle: headingSubtitle }));

	/**
	 * Years whose share bands rest on fewer rated articles than the shared
	 * low-n floor. The 1960s hold ~20 articles a year, so a 100% stack there
	 * swings by five points per article; those years are shaded in share mode
	 * (not hidden, and no URL default changes) and the tooltip gives their n.
	 */
	const lowSampleYears = $derived(
		aggregate.years.filter((year) =>
			isLowN(
				frenchLabels.reduce((sum, label) => sum + (aggregate.yearlyCounts[year]?.[label] ?? 0), 0)
			)
		)
	);
	/** Contiguous runs of low-n years, as [first, last] pairs for markArea. */
	function lowSampleRanges(years: string[], low: string[]): Array<[string, string]> {
		const ranges: Array<[string, string]> = [];
		let start: string | null = null;
		let previous: string | null = null;
		for (const year of years) {
			if (low.includes(year)) {
				start ??= year;
				previous = year;
			} else if (start !== null && previous !== null) {
				ranges.push([start, previous]);
				start = null;
			}
		}
		if (start !== null && previous !== null) ranges.push([start, previous]);
		return ranges;
	}

	let options = $derived.by(() => {
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const { yearlyCounts, years } = aggregate;

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
				// Straight segments: a spline invents values between years that do not exist.
				smooth: false,
				// Share mode stacks into contiguous bands; count mode stays as
				// independent lines so series can cross and be compared directly.
				...(isShare
					? {
							stack: 'share',
							areaStyle: { color, opacity: 0.75 },
							symbol: 'none' as const
						}
					: {}),
				// One overlay, on the first series only: a dark veil over every
				// low-n year, which reads as reduced opacity on the bands beneath.
				...(isShare && index === 0 && lowSampleYears.length > 0
					? {
							markArea: {
								silent: true,
								itemStyle: { color: chartColors.background.dark, opacity: 0.55 },
								label: {
									show: !isMobile,
									position: 'insideTop' as const,
									color: chartColors.text.muted,
									fontSize: 10,
									formatter: currentT.trends.lowSampleBand.replace(
										'{min}',
										formatNumber(LOW_N_THRESHOLD, currentLang)
									)
								},
								data: lowSampleRanges(years, lowSampleYears).map(([from, to]) => [
									{ xAxis: from },
									{ xAxis: to }
								])
							},
							z: 5
						}
					: {})
			};
		});

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
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
				top: 0
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

{#if !heading.inCard}
	<ChartHeading title={headingTitle} subtitle={headingSubtitle} />
{/if}
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
		bind:clientWidth={containerWidth}
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
		caption={`${headingTitle} — ${isShare ? $t.charts.shareMode : $t.charts.countMode}`}
		filenamePrefix={`trends-${viewOptionsState[stateKey]}`}
	/>
	{#if isShare && lowSampleYears.length > 0}
		<p class="chart-note">
			{$t.trends.lowSampleNote.replace('{min}', formatNumber(LOW_N_THRESHOLD, $currentLanguage))}
		</p>
	{/if}
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
