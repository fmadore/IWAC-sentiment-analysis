<!--
  NewspaperDisagreementChart Component

  Newspapers ranked by how far apart the three models are, with 95% CIs.

  Deliberately the mirror image of NewspaperRankingChart: same dot plot, same
  30-article threshold, same interval treatment, same "n titles omitted" note —
  but the axis is cross-model spread instead of mean sentiment. Reading the two
  side by side is the point, because a title can be unremarkable in what it says
  and an outlier in how much the models argue about it.

  It cannot live in the ranking view, tempting as that is. That view carries the
  shared filter rail, so the polarity/subjectivity/centrality facets would select
  articles BY the label being measured and every number here would be circular.
  The agreement view is self-contained and already enforces the corpus-facets-only
  rule; that is why this sits here.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { dec, num, pct } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t } from '$lib/i18n';
	import {
		rankNewspaperDisagreement,
		countExcludedTitles,
		dimensionScale,
		type AgreementDimension,
		type ConsensusRow
	} from '$lib/utils/consensus';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import { tooltipHeader, tooltipPanel, tooltipRow } from '$lib/utils/chartFormatters';
	import {
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle
	} from '$lib/utils/chartTheme';

	interface NewspaperDisagreementChartProps {
		rows: ConsensusRow[];
		modelCount: number;
		dimension: AgreementDimension;
		includeDeclined: boolean;
		minArticles?: number;
	}

	let {
		rows,
		modelCount,
		dimension,
		includeDeclined,
		minArticles = 30
	}: NewspaperDisagreementChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let ranks = $derived(
		rankNewspaperDisagreement(rows, dimension, modelCount, { includeDeclined, minArticles })
	);
	let excluded = $derived(countExcludedTitles(rows, dimension, { includeDeclined, minArticles }));

	// The axis runs the full width the scale allows, not the width the data
	// happens to reach: a corpus where nobody disagrees much should look like one.
	let maxSpread = $derived.by(() => {
		const { ordinals } = dimensionScale(dimension, includeDeclined);
		return Math.max(...ordinals) - Math.min(...ordinals);
	});

	let options = $derived.by(() => {
		const currentT = $t;
		const names = ranks.map((rank) => rank.newspaper);
		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.disagreementTitle,
				subtext: currentT.agreement.disagreementSubtitle.replace('{min}', String(minArticles)),
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
					const rank = ranks[(params as { dataIndex?: number }).dataIndex ?? 0];
					if (!rank) return '';

					const low = $dec(rank.mean - rank.confidence, 2);
					const high = $dec(rank.mean + rank.confidence, 2);

					return tooltipPanel(
						250,
						tooltipHeader(rank.newspaper),
						tooltipRow(currentT.agreement.spread, $dec(rank.mean, 3)),
						tooltipRow(currentT.ranking.confidenceInterval, `${low} – ${high}`),
						tooltipRow(currentT.agreement.unanimityRate, $pct(rank.unanimity, 1)),
						tooltipRow(currentT.agreement.declinedShare, $pct(rank.declinedShare, 1)),
						tooltipRow(
							currentT.agreement.medianYear,
							rank.medianYear === null ? '—' : String(rank.medianYear)
						),
						tooltipRow(currentT.common.articles, $num(rank.n))
					);
				}
			},
			grid: {
				top: isMobile ? 96 : 104,
				bottom: isMobile ? 40 : 44,
				left: '2%',
				right: isMobile ? '8%' : '6%',
				containLabel: true
			},
			// Twin axes top and bottom: the plot runs 30+ rows tall, so a single
			// bottom axis scrolls out of view exactly when it is needed.
			xAxis: [
				{
					type: 'value',
					min: 0,
					max: maxSpread,
					name: isMobile ? undefined : currentT.agreement.disagreementAxis,
					nameLocation: 'middle',
					nameGap: 30,
					nameTextStyle: {
						color: chartColors.text.secondary,
						fontSize: 11,
						fontFamily: '"JetBrains Mono", ui-monospace, monospace'
					},
					axisLabel: getAxisLabelStyle(isMobile),
					axisLine: getAxisLineStyle(),
					splitLine: getSplitLineStyle()
				},
				{
					type: 'value',
					position: 'top',
					min: 0,
					max: maxSpread,
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
						api: { coord: (point: [number, number]) => [number, number] }
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
					data: ranks.map((rank) => [rank.mean, rank.newspaper]),
					silent: true,
					z: 1
				},
				{
					name: currentT.agreement.spread,
					type: 'scatter',
					symbolSize: isMobile ? 8 : 10,
					// One colour throughout: spread has no pole and no midpoint, so a
					// diverging ramp would imply a direction the measure does not have.
					itemStyle: { color: chartColors.chrome.accent },
					data: ranks.map((rank) => [rank.mean, rank.newspaper]),
					z: 2
				}
			]
		} as EChartsOption;
	});

	let chartHeight = $derived(Math.max(320, ranks.length * (isMobile ? 20 : 24) + 140));
</script>

{#if ranks.length > 0}
	<div
		style="height: {chartHeight}px; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.agreement.disagreementTitle}
	>
		<Chart {init} {options} />
	</div>

	<ChartDataTable
		columns={[
			{ label: $t.chartData.newspaper },
			{ label: $t.chartData.spread, format: 'decimal', digits: 3 },
			{ label: $t.chartData.ciLow, format: 'decimal', digits: 3 },
			{ label: $t.chartData.ciHigh, format: 'decimal', digits: 3 },
			{ label: $t.chartData.unanimity, format: 'percent', digits: 1 },
			{ label: $t.chartData.declined, format: 'percent', digits: 1 },
			{ label: $t.chartData.medianYear },
			{ label: $t.chartData.articles, format: 'integer' }
		]}
		rows={[...ranks]
			.reverse()
			.map((rank) => [
				rank.newspaper,
				rank.mean,
				rank.mean - rank.confidence,
				rank.mean + rank.confidence,
				rank.unanimity,
				rank.declinedShare,
				rank.medianYear,
				rank.n
			])}
		filenamePrefix="iwac-newspaper-disagreement"
		caption={$t.chartData.disagreementCaption}
	/>

	<p class="chart-note">{$t.agreement.disagreementNote}</p>

	{#if excluded > 0}
		<p class="chart-note">
			{$t.agreement.disagreementExcluded
				.replace('{count}', String(excluded))
				.replace('{min}', String(minArticles))}
		</p>
	{/if}
{:else}
	<p class="chart-empty">
		{$t.agreement.disagreementEmpty.replace('{min}', String(minArticles))}
	</p>
{/if}
