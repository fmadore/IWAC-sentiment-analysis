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
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import {
		rankNewspapers,
		countExcludedNewspapers,
		MEASURE_SCALES,
		type RankingMeasure
	} from '$lib/utils/newspaperRanking';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import {
		polarityColors,
		subjectivityColors,
		centralityColors,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle
	} from '$lib/utils/chartTheme';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import CrosshairIcon from '@lucide/svelte/icons/crosshair';

	interface NewspaperRankingChartProps {
		/** Minimum rated articles for a newspaper to be plotted. */
		minArticles?: number;
	}

	let { minArticles = 30 }: NewspaperRankingChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let measure = $state<RankingMeasure>('polarity');

	let measureOptions = $derived([
		{ value: 'polarity', label: $t.filters.polarity, icon: SmileIcon },
		{ value: 'subjectivity', label: $t.filters.subjectivity, icon: PenLineIcon },
		{ value: 'centrality', label: $t.filters.centrality, icon: CrosshairIcon }
	]);

	let ranks = $derived(rankNewspapers(articleState.filtered, measure, minArticles));
	let excluded = $derived(countExcludedNewspapers(articleState.filtered, measure, minArticles));

	/** Colour a point by where its mean sits on the measure's own scale. */
	function pointColor(mean: number): string {
		if (measure === 'polarity') {
			if (mean <= -1) return polarityColors['Très négatif'];
			if (mean < -0.2) return polarityColors['Négatif'];
			if (mean <= 0.2) return polarityColors['Neutre'];
			if (mean < 1) return polarityColors['Positif'];
			return polarityColors['Très positif'];
		}
		if (measure === 'subjectivity') {
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

	let options = $derived.by(() => {
		const currentT = $t;
		const scale = MEASURE_SCALES[measure];
		const names = ranks.map((r) => r.newspaper);

		const measureLabel = {
			polarity: currentT.ranking.netPolarity,
			subjectivity: currentT.ranking.meanSubjectivity,
			centrality: currentT.ranking.meanCentrality
		}[measure];

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${currentT.ranking.chartTitle} — ${measureLabel}`,
				subtext: currentT.ranking.chartSubtitle.replace('{min}', String(minArticles)),
				left: 'center',
				top: '1%',
				textStyle: getTitleStyle(isMobile),
				subtextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				}
			},
			tooltip: {
				...tooltipConfig,
				trigger: 'item',
				formatter: (params: unknown) => {
					const p = params as { dataIndex?: number };
					const rank = ranks[p.dataIndex ?? 0];
					if (!rank) return '';

					const low = (rank.mean - rank.confidence).toFixed(2);
					const high = (rank.mean + rank.confidence).toFixed(2);

					return `<div style="min-width:230px;">
						<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${rank.newspaper}</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${measureLabel}:</span><strong>${rank.mean.toFixed(3)}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.ranking.confidenceInterval}:</span><strong>${low} – ${high}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.common.articles}:</span><strong>${rank.n.toLocaleString()}</strong>
						</div>
					</div>`;
				}
			},
			grid: {
				top: isMobile ? 96 : 104,
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
					axisLabel: getAxisLabelStyle(isMobile),
					axisLine: getAxisLineStyle(),
					splitLine: getSplitLineStyle()
				},
				{
					type: 'value',
					position: 'top',
					min: scale.min,
					max: scale.max,
					axisLabel: getAxisLabelStyle(isMobile),
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
						if (!rank || rank.confidence === 0) return { type: 'group', children: [] };

						const y = api.coord([0, params.dataIndex])[1];
						const left = api.coord([rank.mean - rank.confidence, params.dataIndex])[0];
						const right = api.coord([rank.mean + rank.confidence, params.dataIndex])[0];
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
					// where "neither favourable nor unfavourable" actually is.
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
						data: [{ xAxis: scale.neutral }]
					},
					z: 2
				}
			]
		} as EChartsOption;
	});

	// Height scales with the number of titles so rows never crush together.
	let chartHeight = $derived(Math.max(320, ranks.length * (isMobile ? 20 : 24) + 140));
</script>

{#if ranks.length > 0}
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />
		<ChartTypeToggle
			options={measureOptions}
			value={measure}
			onChange={(value) => (measure = value as RankingMeasure)}
			ariaLabel={$t.ranking.chartTitle}
		/>
	</div>

	<div
		style="height: {chartHeight}px; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.ranking.chartTitle}
	>
		<Chart {init} {options} />
	</div>

	{#if excluded > 0}
		<p class="threshold-note">
			{$t.ranking.excludedNote
				.replace('{count}', String(excluded))
				.replace('{min}', String(minArticles))}
		</p>
	{/if}
{:else}
	<p class="chart-empty">{$t.ranking.noneAboveThreshold.replace('{min}', String(minArticles))}</p>
{/if}

<style>
	/* Says out loud what the threshold hid, rather than silently truncating. */
	.threshold-note {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: var(--space-3) auto 0;
		padding-top: var(--space-3);
		border-top: 1px dashed var(--border-subtle);
	}
</style>
