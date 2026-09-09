<!--
  DimensionDistributionChart Component

  Shared distribution chart for a sentiment dimension (polarity or
  subjectivity): stacked bars by newspaper, or a globally-aggregated pie,
  with a chart-type toggle. SentimentChart and SubjectivityChart are thin
  wrappers that supply the dimension configuration.
-->
<script lang="ts">
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import Chart from './CitableChart.svelte';

	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption, SeriesOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import type { Article } from '$lib/types/data';
	import { aggregateByJournalAndDimension } from '$lib/utils/chartAggregators';
	import { t, currentLanguage } from '$lib/i18n';
	import { formatNumber } from '$lib/i18n/utils';
	import ChartDataTable from '../common/ChartDataTable.svelte';
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
	const chartKey = $derived(seriesIdPrefix === 'sentiment' ? 'polarityChart' : 'subjectivityChart');
	const groupingKey = $derived(
		seriesIdPrefix === 'sentiment' ? 'polarityGrouping' : 'subjectivityGrouping'
	);
	const aggregate = $derived(
		aggregateByJournalAndDimension(articleState.filtered, frenchLabels, getKey)
	);
	const totals = $derived(
		frenchLabels.map((label) =>
			aggregate.newspaperList.reduce(
				(sum, journal) => sum + (aggregate.newspaperCounts[journal]?.[label] ?? 0),
				0
			)
		)
	);
	const tableColumns = $derived(
		viewOptionsState[groupingKey] === 'global'
			? [
					{ label: seriesName },
					{ label: $t.audit.count, format: 'integer' as const },
					{ label: $t.audit.share, format: 'percent' as const, digits: 1 }
				]
			: [
					{ label: $t.audit.journal },
					...translatedLabels.map((label) => ({ label, format: 'integer' as const }))
				]
	);
	const tableRows = $derived(
		viewOptionsState[groupingKey] === 'global'
			? totals.map((count, i) => [
					translatedLabels[i],
					count,
					aggregate.articlesAnalyzed ? count / aggregate.articlesAnalyzed : null
				])
			: aggregate.newspaperList.map((journal) => [
					journal,
					...frenchLabels.map((label) => aggregate.newspaperCounts[journal][label] ?? 0)
				])
	);

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		const currentT = $t; // Capture current translations for reactive updates
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		const ranked = [...aggregate.newspaperList].sort(
			(a, b) =>
				Object.values(aggregate.newspaperCounts[b]).reduce((x, y) => x + y, 0) -
					Object.values(aggregate.newspaperCounts[a]).reduce((x, y) => x + y, 0) ||
				a.localeCompare(b)
		);
		const newspaperList = ranked.slice(0, 6);
		const newspaperCounts = { ...aggregate.newspaperCounts };
		if (ranked.length > 6) {
			newspaperList.push(currentT.audit.other);
			newspaperCounts[currentT.audit.other] = Object.fromEntries(
				frenchLabels.map((label) => [
					label,
					ranked.slice(6).reduce((sum, j) => sum + (aggregate.newspaperCounts[j][label] ?? 0), 0)
				])
			);
		}
		if (viewOptionsState[groupingKey] === 'global' && viewOptionsState[chartKey] === 'bar') {
			return {
				backgroundColor: 'transparent',
				grid: { left: isMobile ? 112 : 150, right: 55, top: 20, bottom: 40 },
				tooltip: { ...getTooltipConfig(isMobile), trigger: 'item' },
				xAxis: getCountYAxis(isMobile),
				yAxis: {
					type: 'category',
					data: translatedLabels,
					inverse: true,
					axisLine: getAxisLineStyle(),
					axisLabel: getAxisLabelStyle(isMobile)
				},
				series: [
					{
						type: 'bar',
						name: seriesName,
						data: totals.map((value, i) => ({
							value,
							itemStyle: { color: getColor(frenchLabels[i]) }
						})),
						label: {
							show: true,
							position: 'right',
							color: chartColors.text.primary,
							formatter: (p: { value: unknown }) => formatNumber(Number(p.value), currentLang)
						}
					}
				]
			} as EChartsOption;
		}

		if (viewOptionsState[groupingKey] === 'global' && viewOptionsState[chartKey] === 'pie') {
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
				.map((label, index) => ({
					name: label,
					value: totalByLabel[label],
					itemStyle: { color: getColor(frenchLabels[index]) }
				}))
				.filter((item) => item.value > 0);

			const pieStyle = getPieSeriesStyle(isMobile);
			const tooltipConfig = getTooltipConfig(isMobile);

			return {
				backgroundColor: 'transparent',
				tooltip: {
					...tooltipConfig,
					trigger: 'item',
					formatter: createPieTooltipFormatter({
						formatValue: (n) => formatNumber(n, currentLang),
						lang: () => currentLang
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
						lang: () => currentLang,
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
		<ChartTypeToggle
			options={[
				{ value: 'global', label: $t.audit.globalAll },
				{ value: 'journal', label: $t.audit.byJournal }
			]}
			value={viewOptionsState[groupingKey]}
			onChange={(value) => (viewOptionsState[groupingKey] = value as 'global' | 'journal')}
			ariaLabel={$t.audit.scope}
		/>

		{#if viewOptionsState[groupingKey] === 'global'}
			<ChartTypeToggle
				options={[
					{ value: 'bar', label: $t.charts.bars, icon: BarChart3Icon },
					{ value: 'pie', label: $t.charts.pie, icon: PieChartIcon }
				]}
				value={viewOptionsState[chartKey]}
				onChange={(value) => (viewOptionsState[chartKey] = value as 'bar' | 'pie')}
				ariaLabel={title}
			/>
		{/if}
	</div>
	<h2 class="chart-heading">{title}</h2>
	{#if viewOptionsState[groupingKey] === 'journal'}<p class="chart-note">
			{$t.audit.topJournals}
		</p>{/if}
	<div
		style="height: {isMobile ? '350px' : '450px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={ariaLabel}
	>
		{#key `${viewOptionsState[groupingKey]}-${viewOptionsState[chartKey]}`}<Chart
				chartId={seriesIdPrefix}
				{init}
				{options}
			/>{/key}
	</div>
	<p class="chart-note">
		{$t.audit.included}: {formatNumber(aggregate.articlesAnalyzed, $currentLanguage)} · {$t.audit
			.excluded}: {formatNumber(
			articleState.filtered.length - aggregate.articlesAnalyzed,
			$currentLanguage
		)}
	</p>
	<ChartDataTable
		columns={tableColumns}
		rows={tableRows}
		caption={title}
		filenamePrefix={seriesIdPrefix}
	/>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	.chart-heading {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		margin-block: var(--space-4);
	}
	.chart-note {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-block: var(--space-3);
	}
</style>
