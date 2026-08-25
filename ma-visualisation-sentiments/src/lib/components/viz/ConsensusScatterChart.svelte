<!--
  ConsensusScatterChart Component

  Does disagreement track what a newspaper says, or is it independent of it?

  x is the consensus — the panel's models averaged — and y is how far apart they
  are. If the models mostly argued about the titles with the strongest views,
  the cloud would form a valley or a wedge.

  The answer is not a constant, which is why the note under the chart reports
  the number rather than asserting one: v1 polarity gives r ≈ −0.06, and the
  same measure on v2 gives ≈ +0.49. On v1 that supports reading the
  disagreement ranking on its own terms; on v2 it does not, and a reader is
  entitled to know which they are looking at. The correlation is computed over
  exactly the titles drawn, so it answers to the dimension selector, the
  declined-ratings toggle and the corpus facets like everything else here.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { dec, num } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t } from '$lib/i18n';
	import {
		dimensionScale,
		pearson,
		rankNewspaperDisagreement,
		type AgreementDimension,
		type ConsensusRow
	} from '$lib/utils/consensus';
	import { tooltipHeader, tooltipPanel, tooltipRow } from '$lib/utils/chartFormatters';
	import {
		seriesColorPalette,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle
	} from '$lib/utils/chartTheme';

	interface ConsensusScatterChartProps {
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
	}: ConsensusScatterChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let ranked = $derived(
		rankNewspaperDisagreement(rows, dimension, modelCount, { includeDeclined, minArticles })
	);

	let scale = $derived(dimensionScale(dimension, includeDeclined));

	let correlation = $derived(
		pearson(
			ranked.map((entry) => entry.consensusMean),
			ranked.map((entry) => entry.mean)
		)
	);

	let countries = $derived(
		[...new Set(ranked.map((entry) => entry.country || $t.messages.noData))].sort((a, b) =>
			a.localeCompare(b)
		)
	);

	let maxArticles = $derived(Math.max(1, ...ranked.map((entry) => entry.n)));

	let options = $derived.by(() => {
		const currentT = $t;
		const noCountry = currentT.messages.noData;

		const series = countries.map((country, index) => {
			const color = seriesColorPalette[index % seriesColorPalette.length];
			const members = ranked.filter((entry) => (entry.country || noCountry) === country);

			return {
				name: country,
				type: 'scatter' as const,
				// Area-proportional: a title with ten times the articles should not
				// read as a hundred times the weight.
				symbolSize: (value: number[]) =>
					(isMobile ? 6 : 8) + Math.sqrt(value[2] / maxArticles) * (isMobile ? 16 : 26),
				itemStyle: { color, opacity: 0.7, borderColor: chartColors.border.strong, borderWidth: 1 },
				data: members.map((entry) => ({
					value: [entry.consensusMean, entry.mean, entry.n],
					newspaper: entry.newspaper
				}))
			};
		});

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.scatterTitle,
				subtext: currentT.agreement.scatterSubtitle,
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
				...getTooltipConfig(isMobile),
				trigger: 'item',
				formatter: (params: unknown) => {
					const item = params as {
						seriesName?: string;
						value?: number[];
						data?: { newspaper?: string };
					};
					const [x, y, n] = item.value ?? [0, 0, 0];

					return tooltipPanel(
						230,
						tooltipHeader(`${item.data?.newspaper} · ${item.seriesName}`),
						tooltipRow(currentT.agreement.scatterX, $dec(x, 2)),
						tooltipRow(currentT.agreement.spread, $dec(y, 3)),
						tooltipRow(currentT.common.articles, $num(n))
					);
				}
			},
			legend: { ...getLegendConfig(isMobile), top: isMobile ? '14%' : '11%' },
			grid: {
				top: isMobile ? '30%' : '24%',
				bottom: isMobile ? '14%' : '12%',
				left: isMobile ? '6%' : '4%',
				right: isMobile ? '8%' : '5%',
				containLabel: true
			},
			xAxis: {
				type: 'value',
				// Pinned to the scale, not to the data: a cloud that occupies a third
				// of the axis is telling you the titles agree, and auto-scaling would
				// stretch that third across the whole width and hide it.
				min: Math.min(...scale.ordinals),
				max: Math.max(...scale.ordinals),
				name: currentT.agreement.scatterX,
				nameLocation: 'middle',
				nameGap: 30,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 9 : 11,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			yAxis: {
				type: 'value',
				min: 0,
				name: currentT.agreement.scatterY,
				nameLocation: 'middle',
				nameGap: 40,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 9 : 11,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			series
		} as EChartsOption;
	});
</script>

{#if ranked.length > 0}
	<div
		style="height: {isMobile ? '420px' : '520px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.agreement.scatterTitle}
	>
		<Chart {init} {options} />
	</div>

	<p class="chart-note">
		{$t.agreement.scatterNote.replace(
			'{r}',
			Number.isNaN(correlation) ? '—' : $dec(correlation, 3)
		)}
	</p>
{:else}
	<p class="chart-empty">
		{$t.agreement.disagreementEmpty.replace('{min}', String(minArticles))}
	</p>
{/if}
