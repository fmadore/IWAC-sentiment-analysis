<!--
  DimensionDistributionChart Component

  Shared distribution chart for a sentiment dimension (polarity, subjectivity
  or centrality): a global bar or pie, or one 100% bar per newspaper stacked
  by category, with a chart-type toggle. SentimentChart, SubjectivityChart and
  CentralityChart are thin wrappers that supply the dimension configuration.
-->
<script lang="ts" module>
	/** Newspapers drawn individually in the by-newspaper profile; the rest pool as one row. */
	export const PROFILE_TOP_N = 10;

	export interface NewspaperProfile {
		name: string;
		/** Rated articles in this row: the denominator of its shares. */
		n: number;
		/** Raw counts per category, in `frenchLabels` order. */
		counts: number[];
		/** Number of newspapers pooled in this row (1 except for the remainder). */
		pooled: number;
	}

	/**
	 * One profile per newspaper, largest first, so every bar can be normalised
	 * to its own total: raw stacked counts let the largest title dominate and
	 * hide the composition of the rest. Newspapers beyond `topN` are pooled into
	 * a single `otherLabel` row.
	 */
	export function newspaperProfiles(
		newspaperCounts: Record<string, Record<string, number>>,
		frenchLabels: string[],
		otherLabel: string,
		topN = PROFILE_TOP_N
	): NewspaperProfile[] {
		const rows = Object.keys(newspaperCounts).map((name) => {
			const counts = frenchLabels.map((label) => newspaperCounts[name]?.[label] ?? 0);
			return { name, counts, n: counts.reduce((a, b) => a + b, 0), pooled: 1 };
		});
		rows.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
		const top = rows.slice(0, topN);
		const rest = rows.slice(topN);
		if (rest.length > 0) {
			const counts = frenchLabels.map((_, i) => rest.reduce((sum, row) => sum + row.counts[i], 0));
			top.push({
				name: otherLabel,
				counts,
				n: counts.reduce((a, b) => a + b, 0),
				pooled: rest.length
			});
		}
		return top;
	}
</script>

<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import Chart from './CitableChart.svelte';

	import { init } from '#lib/utils/echartsSetup.js';
	import type { EChartsOption, SeriesOption } from 'echarts';
	import { isCompactWidth } from '#lib/utils/viewport.svelte.js';
	import { useChartCardHeading } from '#lib/components/ui/chartCardHeading.svelte.js';
	import ChartHeading from './ChartHeading.svelte';

	import { articleState } from '#lib/stores/index.js';
	import type { Article } from '#lib/types/data.js';
	import { aggregateByJournalAndDimension } from '#lib/utils/chartAggregators.js';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { formatNumber, formatPercent } from '#lib/i18n/utils.js';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';
	import {
		createPieTooltipFormatter,
		polarityGlyphKeys,
		tooltipHeader,
		tooltipPanel,
		tooltipSeriesRow
	} from '#lib/utils/chartFormatters.js';

	// Import centralized chart theme
	import {
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getCountYAxis,
		getShareYAxis,
		getPieSeriesStyle,
		getEmphasisConfig,
		getUniversalTransitionConfig,
		getStaggeredAnimationDelay,
		chartColors
	} from '#lib/utils/chartTheme.js';

	interface DimensionDistributionChartProps {
		/** Which dimension: selects the `…Chart` / `…Grouping` URL options */
		dimension: 'polarity' | 'subjectivity' | 'centrality';
		/** French dimension labels used as data-lookup keys, in display order */
		frenchLabels: string[];
		/** Translated labels for the current language (same order as frenchLabels) */
		translatedLabels: string[];
		/** Resolve an article to its French dimension label, or null to skip it */
		getKey: (article: Article) => string | null;
		/** Fill colour for a French dimension label */
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
		dimension,
		frenchLabels,
		translatedLabels,
		getKey,
		getColor,
		title,
		seriesName,
		seriesIdPrefix,
		ariaLabel
	}: DimensionDistributionChartProps = $props();

	// Compact layout follows the chart's own width, not the window's.
	let containerWidth = $state<number>();
	let isMobile = $derived(isCompactWidth(containerWidth));
	const chartKey = $derived(`${dimension}Chart` as const);
	const groupingKey = $derived(`${dimension}Grouping` as const);
	const heading = useChartCardHeading(() => ({ title }));
	/**
	 * Series and slices are named with translated labels, so the tooltip swatch
	 * is told which stored key each name stands for. Polarity only: centrality
	 * and subjectivity keep their plain colour chips.
	 */
	const glyphKeys = $derived(
		dimension === 'polarity' ? polarityGlyphKeys(translatedLabels, frenchLabels) : undefined
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
	const profiles = $derived(
		newspaperProfiles(aggregate.newspaperCounts, frenchLabels, $t.audit.other)
	);
	const profileLabels = $derived(
		profiles.map(
			(row) =>
				`${row.pooled > 1 ? `${row.name} (${formatNumber(row.pooled, $currentLanguage)})` : row.name} · n = ${formatNumber(row.n, $currentLanguage)}`
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
					...translatedLabels.map((label) => ({ label, format: 'integer' as const })),
					{ label: 'n', format: 'integer' as const }
				]
	);
	const tableRows = $derived(
		viewOptionsState[groupingKey] === 'global'
			? totals.map((count, i) => [
					translatedLabels[i],
					count,
					aggregate.articlesAnalyzed ? count / aggregate.articlesAnalyzed : null
				])
			: aggregate.newspaperList.map((journal) => {
					const counts = frenchLabels.map(
						(label) => aggregate.newspaperCounts[journal][label] ?? 0
					);
					return [journal, ...counts, counts.reduce((a, b) => a + b, 0)];
				})
	);

	// Use $derived for proper reactivity in Svelte 5
	let options = $derived.by(() => {
		void $t; // Re-derive when the language changes
		const currentLang = $currentLanguage; // Capture current language for reactive updates

		if (viewOptionsState[groupingKey] === 'global' && viewOptionsState[chartKey] === 'bar') {
			return {
				backgroundColor: 'transparent',
				grid: { left: isMobile ? 112 : 150, right: 55, top: 20, bottom: 40 },
				tooltip: {
					...getTooltipConfig(isMobile),
					trigger: 'item',
					// What the default item tooltip showed (series name, category,
					// count), plus the glyph swatch and the share the pie and the
					// data table give for the same totals.
					formatter: (params: unknown) => {
						const p = params as { name?: string; value?: unknown; color?: string };
						const value = Number(p.value ?? 0);
						const share = aggregate.articlesAnalyzed
							? ` (${formatPercent(value / aggregate.articlesAnalyzed, 1, currentLang)})`
							: '';
						return tooltipPanel(
							180,
							tooltipHeader(seriesName),
							tooltipSeriesRow(
								p.color,
								p.name,
								`${formatNumber(value, currentLang)}${share}`,
								glyphKeys
							)
						);
					}
				},
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
			const pieData = translatedLabels
				.map((label, index) => ({
					name: label,
					value: totals[index],
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
						lang: () => currentLang,
						glyphKeys: () => glyphKeys
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
			// By newspaper: one bar per newspaper, stacked by category and
			// normalised to 100% of that newspaper's rated articles, so profiles
			// compare directly whatever each title's size. n sits in the label.
			const seriesData: SeriesOption[] = frenchLabels.map((frenchLabel, index) => ({
				name: translatedLabels[index],
				type: 'bar',
				stack: 'share',
				barMaxWidth: 28,
				emphasis: getEmphasisConfig(),
				...getUniversalTransitionConfig(),
				...getStaggeredAnimationDelay(),
				id: `${seriesIdPrefix}-${index}`,
				data: profiles.map((row) => ({
					value: row.n ? (row.counts[index] / row.n) * 100 : 0,
					rawCount: row.counts[index]
				})),
				itemStyle: { color: getColor(frenchLabel), borderRadius: 0 }
			}));

			return {
				backgroundColor: 'transparent',
				tooltip: {
					...getTooltipConfig(isMobile),
					trigger: 'axis',
					axisPointer: { type: 'shadow', shadowStyle: { color: chartColors.axis.pointerShadow } },
					confine: true,
					formatter: (params: unknown) => {
						const items = params as Array<{
							dataIndex: number;
							seriesName: string;
							color: string;
							data: { value: number; rawCount: number };
						}>;
						if (!Array.isArray(items) || items.length === 0) return '';
						const row = profiles[items[0].dataIndex];
						return tooltipPanel(
							200,
							tooltipHeader(`${row.name} · n = ${formatNumber(row.n, currentLang)}`),
							...items
								.filter((item) => item.data.rawCount > 0)
								.map((item) =>
									tooltipSeriesRow(
										item.color,
										item.seriesName,
										`${formatPercent(item.data.value / 100, 1, currentLang)} (${formatNumber(item.data.rawCount, currentLang)})`,
										glyphKeys
									)
								)
						);
					}
				},
				legend: {
					...getLegendConfig(isMobile),
					data: translatedLabels,
					top: 0
				},
				grid: {
					left: isMobile ? 8 : 12,
					right: isMobile ? 16 : 24,
					top: isMobile ? 48 : 36,
					bottom: 24,
					containLabel: true
				},
				xAxis: getShareYAxis(isMobile),
				yAxis: {
					type: 'category',
					data: profileLabels,
					inverse: true,
					axisLine: getAxisLineStyle(),
					axisTick: { show: false },
					axisLabel: {
						...getAxisLabelStyle(isMobile),
						width: isMobile ? 130 : 220,
						overflow: 'truncate'
					}
				},
				series: seriesData
			} as EChartsOption;
		}
	});
</script>

{#if !heading.inCard}
	<ChartHeading {title} />
{/if}
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
	{#if viewOptionsState[groupingKey] === 'journal'}<p class="chart-note">
			{$t.audit.topJournals}
		</p>{/if}
	<div
		style="height: {viewOptionsState[groupingKey] === 'journal'
			? `${profiles.length * (isMobile ? 32 : 36) + 90}px`
			: isMobile
				? '350px'
				: '450px'}; position: relative;"
		class="chart-container"
		bind:clientWidth={containerWidth}
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
	.chart-note {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-block: var(--space-3);
	}
</style>
