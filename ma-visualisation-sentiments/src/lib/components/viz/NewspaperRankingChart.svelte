<!--
  NewspaperRankingChart Component

  Newspapers ranked by mean sentiment, with 95% confidence intervals.

  The per-newspaper chart on the Charts view stacks absolute counts for all 56
  titles alphabetically, so it reads mostly as a volume chart: Sidwaya's 1,167
  articles dwarf everything regardless of what any title actually says. Ranking
  by a mean index answers the question the dashboard implicitly promises —
  "which papers cover Islam most favourably?" — and the whiskers are what keep
  that honest, since the most extreme means come from the smallest samples.

  Drawn as a dot plot rather than bars: bars imply a magnitude measured from
  zero, and on the 1-5 subjectivity/centrality scales zero is not on the axis.

  Two families of measure. The means of ordinal codes (the default) treat the
  steps of the scale as equal distances; the share measures (positive,
  negative, net) do not. Whiskers read `low`/`high`, so the asymmetric Wilson
  interval of a share is drawn as computed. The reading note under the chart
  says what no interval can: order within overlapping intervals is not
  interpretable, and the order is one model's.
-->
<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import Chart from './CitableChart.svelte';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import { init } from '#lib/utils/echartsSetup.js';
	import type { EChartsOption } from 'echarts';
	import { isCompactWidth } from '#lib/utils/viewport.svelte.js';
	import { useChartCardHeading } from '#lib/components/ui/chartCardHeading.svelte.js';
	import ChartHeading from './ChartHeading.svelte';

	import { articleState } from '#lib/stores/index.js';
	import { t } from '#lib/i18n/index.js';
	import {
		rankNewspapers,
		countExcludedNewspapers,
		isProportionMeasure,
		MEASURE_SCALES,
		type RankingMeasure
	} from '#lib/utils/newspaperRanking.js';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import {
		polarityColors,
		subjectivityColors,
		centralityColors,
		chartColors,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle
	} from '#lib/utils/chartTheme.js';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import CrosshairIcon from '@lucide/svelte/icons/crosshair';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import ScaleIcon from '@lucide/svelte/icons/scale';

	interface NewspaperRankingChartProps {
		/** Minimum rated articles for a newspaper to be plotted. */
		minArticles?: number;
	}

	let { minArticles = 30 }: NewspaperRankingChartProps = $props();

	// Compact layout follows the chart's own width, not the window's.
	let containerWidth = $state<number>();
	let isMobile = $derived(isCompactWidth(containerWidth));

	let measureOptions = $derived([
		{ value: 'polarity', label: $t.filters.polarity, icon: SmileIcon },
		{ value: 'subjectivity', label: $t.filters.subjectivity, icon: PenLineIcon },
		{ value: 'centrality', label: $t.filters.centrality, icon: CrosshairIcon }
	]);
	let shareOptions = $derived([
		{ value: 'positive', label: $t.ranking.positiveShare, icon: PlusIcon },
		{ value: 'negative', label: $t.ranking.negativeShare, icon: MinusIcon },
		{ value: 'net', label: $t.ranking.netShare, icon: ScaleIcon }
	]);
	let isShare = $derived(isProportionMeasure(viewOptionsState.rankingMeasure));
	let valueFormat = $derived(
		isShare ? { format: 'percent' as const, digits: 1 } : { format: 'decimal' as const, digits: 3 }
	);

	/** A value on the selected measure, as the reader should see it. */
	function formatValue(value: number, digits: number): string {
		return isShare ? $pct(value, 1) : $dec(value, digits);
	}

	let ranks = $derived(
		rankNewspapers(articleState.filtered, viewOptionsState.rankingMeasure, minArticles)
	);
	let excluded = $derived(
		countExcludedNewspapers(articleState.filtered, viewOptionsState.rankingMeasure, minArticles)
	);

	/** Colour a point by where its mean sits on the selected measure's own scale. */
	function pointColor(mean: number): string {
		const measure = viewOptionsState.rankingMeasure;
		if (measure === 'positive') return polarityColors['Positif'];
		if (measure === 'negative') return polarityColors['Négatif'];
		if (measure === 'net') {
			if (mean <= -0.5) return polarityColors['Très négatif'];
			if (mean < -0.1) return polarityColors['Négatif'];
			if (mean <= 0.1) return polarityColors['Neutre'];
			if (mean < 0.5) return polarityColors['Positif'];
			return polarityColors['Très positif'];
		}
		if (measure === 'polarity') {
			if (mean <= -1) return polarityColors['Très négatif'];
			if (mean < -0.2) return polarityColors['Négatif'];
			if (mean <= 0.2) return polarityColors['Neutre'];
			if (mean < 1) return polarityColors['Positif'];
			return polarityColors['Très positif'];
		}
		if (viewOptionsState.rankingMeasure === 'subjectivity') {
			const step = Math.min(5, Math.max(1, Math.round(mean)));
			return subjectivityColors[step as 1 | 2 | 3 | 4 | 5];
		}
		const step = Math.min(5, Math.max(1, Math.round(mean)));
		return [
			centralityColors['Non abordé'],
			centralityColors['Marginal'],
			centralityColors['Secondaire'],
			centralityColors['Central'],
			centralityColors['Très central']
		][step - 1];
	}

	const measureLabel = $derived(
		{
			polarity: $t.ranking.netPolarity,
			subjectivity: $t.ranking.meanSubjectivity,
			centrality: $t.ranking.meanCentrality,
			positive: $t.ranking.positiveShare,
			negative: $t.ranking.negativeShare,
			net: $t.ranking.netShare
		}[viewOptionsState.rankingMeasure]
	);
	const headingTitle = $derived(`${$t.ranking.chartTitle} — ${measureLabel}`);
	const headingSubtitle = $derived(
		(isShare ? $t.ranking.proportionSubtitle : $t.ranking.chartSubtitle).replace(
			'{min}',
			String(minArticles)
		)
	);
	const heading = useChartCardHeading(() => ({ title: headingTitle, subtitle: headingSubtitle }));

	let options = $derived.by(() => {
		const currentT = $t;
		const scale = MEASURE_SCALES[viewOptionsState.rankingMeasure];
		const names = ranks.map((r) => r.newspaper);
		const axisLabel = {
			...getAxisLabelStyle(isMobile),
			formatter: (value: number) => (isShare ? $pct(value, 0) : String(value))
		};

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			tooltip: {
				...tooltipConfig,
				trigger: 'item',
				formatter: (params: unknown) => {
					const p = params as { dataIndex?: number };
					const rank = ranks[p.dataIndex ?? 0];
					if (!rank) return '';

					const low = formatValue(rank.low, 3);
					const high = formatValue(rank.high, 3);

					return `<div style="min-width:230px;">
						<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${rank.newspaper}</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${measureLabel}:</span><strong>${formatValue(rank.mean, 3)}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.ranking.confidenceInterval}:</span><strong>${low} – ${high}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.common.articles}:</span><strong>${$num(rank.n)}</strong>
						</div>
					</div>`;
				}
			},
			grid: {
				top: isMobile ? 36 : 28,
				bottom: isMobile ? 40 : 44,
				left: '2%',
				right: isMobile ? '8%' : '6%',
				containLabel: true
			},
			// Two identical value axes, top and bottom. The plot runs 30+ rows tall,
			// so a single bottom axis scrolls out of view exactly when the reader is
			// looking at the titles they care about.
			xAxis: [
				{
					type: 'value',
					min: scale.min,
					max: scale.max,
					axisLabel,
					axisLine: getAxisLineStyle(),
					splitLine: getSplitLineStyle()
				},
				{
					type: 'value',
					position: 'top',
					min: scale.min,
					max: scale.max,
					axisLabel,
					axisLine: getAxisLineStyle(),
					splitLine: { show: false }
				}
			],
			yAxis: {
				type: 'category',
				data: names,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					fontSize: isMobile ? 8 : 10
				},
				axisLine: getAxisLineStyle(),
				axisTick: { show: false }
			},
			series: [
				{
					// Whiskers first so the dots sit on top of them.
					name: currentT.ranking.confidenceInterval,
					type: 'custom',
					renderItem: (
						params: { dataIndex: number },
						api: {
							value: (i: number) => number;
							coord: (p: [number, number]) => [number, number];
							size: (p: [number, number]) => [number, number];
						}
					) => {
						const rank = ranks[params.dataIndex];
						if (!rank || rank.high - rank.low === 0) return { type: 'group', children: [] };

						const y = api.coord([0, params.dataIndex])[1];
						const left = api.coord([rank.low, params.dataIndex])[0];
						const right = api.coord([rank.high, params.dataIndex])[0];
						const cap = 4;

						const stroke = { stroke: chartColors.text.faint, lineWidth: 1 };
						return {
							type: 'group',
							children: [
								{ type: 'line', shape: { x1: left, y1: y, x2: right, y2: y }, style: stroke },
								{
									type: 'line',
									shape: { x1: left, y1: y - cap, x2: left, y2: y + cap },
									style: stroke
								},
								{
									type: 'line',
									shape: { x1: right, y1: y - cap, x2: right, y2: y + cap },
									style: stroke
								}
							]
						};
					},
					data: ranks.map((r) => [r.mean, r.newspaper]),
					silent: true,
					z: 1
				},
				{
					name: measureLabel,
					type: 'scatter',
					symbolSize: isMobile ? 8 : 10,
					data: ranks.map((r) => ({
						value: [r.mean, r.newspaper],
						itemStyle: { color: pointColor(r.mean) }
					})),
					// Reference line at the scale's midpoint — the reader needs to know
					// where "neither favourable nor unfavourable" actually is. A one-sided
					// share has no such point, so it draws none.
					markLine: {
						silent: true,
						symbol: 'none',
						lineStyle: { color: chartColors.text.faint, type: 'dashed', width: 1 },
						label: {
							show: !isMobile,
							formatter: currentT.ranking.neutralLine,
							color: chartColors.text.muted,
							fontFamily: '"JetBrains Mono", ui-monospace, monospace',
							fontSize: 10
						},
						data:
							viewOptionsState.rankingMeasure === 'positive' ||
							viewOptionsState.rankingMeasure === 'negative'
								? []
								: [{ xAxis: scale.neutral }]
					},
					z: 2
				}
			]
		} as EChartsOption;
	});

	// Height scales with the number of titles so rows never crush together.
	let chartHeight = $derived(Math.max(280, ranks.length * (isMobile ? 20 : 24) + 72));
</script>

{#if !heading.inCard}
	<ChartHeading title={headingTitle} subtitle={headingSubtitle} />
{/if}
<!-- Outside the `{#if}`: a measure with no title above the threshold must
     still offer the toggle back to one that has some. -->
<div class="chart-toolbar">
	<DatasetBadge size="sm" />
	<ChartTypeToggle
		options={measureOptions}
		value={viewOptionsState.rankingMeasure}
		onChange={(value) => (viewOptionsState.rankingMeasure = value as RankingMeasure)}
		ariaLabel={$t.ranking.chartTitle}
	/>
	<ChartTypeToggle
		options={shareOptions}
		value={viewOptionsState.rankingMeasure}
		onChange={(value) => (viewOptionsState.rankingMeasure = value as RankingMeasure)}
		ariaLabel={`${$t.ranking.chartTitle} — ${$t.ranking.measureGroup}`}
	/>
</div>
{#if ranks.length > 0}
	<div
		style="height: {chartHeight}px; position: relative;"
		class="chart-container"
		bind:clientWidth={containerWidth}
		role="img"
		aria-label={$t.ranking.chartTitle}
	>
		<Chart chartId="newspaper-ranking-chart" {init} {options} />
	</div>

	<ChartDataTable
		columns={[
			{ label: $t.chartData.newspaper },
			{ label: $t.chartData.mean, ...valueFormat },
			{ label: $t.chartData.ciLow, ...valueFormat },
			{ label: $t.chartData.ciHigh, ...valueFormat },
			{ label: $t.chartData.articles, format: 'integer' }
		]}
		rows={[...ranks]
			.reverse()
			.map((rank) => [rank.newspaper, rank.mean, rank.low, rank.high, rank.n])}
		filenamePrefix="iwac-newspaper-ranking"
		caption={$t.chartData.rankingCaption}
	/>

	<p class="chart-note">{$t.ranking.readingNote}</p>

	{#if excluded > 0}
		<p class="chart-note">
			{$t.ranking.excludedNote
				.replace('{count}', String(excluded))
				.replace('{min}', String(minArticles))}
		</p>
	{/if}
{:else}
	<p class="chart-empty">{$t.ranking.noneAboveThreshold.replace('{min}', String(minArticles))}</p>
{/if}
