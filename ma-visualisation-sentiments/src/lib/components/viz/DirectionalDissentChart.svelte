<!--
  DirectionalDissentChart Component

  When a model stands alone, does it grade above the other two or below?

  This is the single clearest statement the dataset makes about how the models
  differ, and it is invisible everywhere else in the app: the pairwise views can
  show that two models disagree, and the calibration chart can show that their
  distributions differ, but neither can say which model moved. A model whose
  bars sit almost entirely on one side is not disagreeing at random — it is
  placing the scale's boundaries somewhere else.

  Deliberately shows all three dimensions at once rather than following the
  section's dimension selector: the roles rotate between dimensions (on v2 the
  model that reads articles as most subjective is not the one that reads them
  most favourably), and that rotation is the finding. Seeing one dimension at a
  time would hide it.

  Up and down share a stack per dimension, so they meet at the axis; the three
  dimensions are three stacks side by side.
-->
<script lang="ts">
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import { Chart } from 'svelte-echarts';
	import { pct } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t } from '$lib/i18n';
	import { getModelDisplayNames } from '$lib/utils/format';
	import { tooltipHeader, tooltipPanel, tooltipSeriesRow } from '$lib/utils/chartFormatters';
	import { datasetState } from '$lib/stores';
	import { profileDissent } from '$lib/utils/consensus';
	import {
		seriesColorPalette,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getEmphasisConfig
	} from '$lib/utils/chartTheme';

	interface DirectionalDissentChartProps {
		profiles: ReturnType<typeof profileDissent>[];
		models: readonly string[];
	}

	let { profiles, models }: DirectionalDissentChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let modelNames = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));

	let dimensionLabels = $derived<Record<string, string>>({
		polarity: $t.filters.polarity,
		subjectivity: $t.filters.subjectivity,
		centrality: $t.filters.centrality
	});

	let options = $derived.by(() => {
		const currentT = $t;

		// Percentages of each dimension's own n: the three dimensions drop
		// different numbers of rows (a declined subjectivity score is common), so
		// raw counts between them would not be comparable.
		const share = (count: number, total: number) => (total > 0 ? (count / total) * 100 : 0);

		const series = profiles.flatMap((profile, dimensionIndex) => {
			const color = seriesColorPalette[dimensionIndex % seriesColorPalette.length];
			const label = dimensionLabels[profile.dimension];

			return [
				{
					name: `${label} · ${currentT.agreement.directionAbove}`,
					type: 'bar' as const,
					stack: profile.dimension,
					data: profile.dissent.map((entry) => share(entry.up, profile.n)),
					itemStyle: { color, borderRadius: 0 },
					emphasis: getEmphasisConfig()
				},
				{
					name: `${label} · ${currentT.agreement.directionBelow}`,
					type: 'bar' as const,
					stack: profile.dimension,
					// Negative so it renders below the axis; the tooltip un-negates it.
					data: profile.dissent.map((entry) => -share(entry.down, profile.n)),
					itemStyle: { color, opacity: 0.45, borderRadius: 0 },
					emphasis: getEmphasisConfig()
				}
			];
		});

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.directionTitle,
				subtext: currentT.agreement.directionSubtitle,
				left: 'center',
				top: '1%',
				textStyle: getTitleStyle(isMobile),
				subtextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace',
					width: isMobile ? 300 : 620,
					overflow: 'break'
				}
			},
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: chartColors.axis.pointerShadowNeutral }
				},
				formatter: (params: unknown) => {
					const list = (Array.isArray(params) ? params : [params]) as {
						seriesName?: string;
						color?: string;
						value?: number;
						axisValue?: string;
					}[];
					if (list.length === 0) return '';

					return tooltipPanel(
						280,
						tooltipHeader(String(list[0].axisValue ?? '')),
						list
							.filter((item) => Math.abs(item.value ?? 0) > 0)
							.map((item) =>
								// Un-negated: the sign encodes the direction, which the series
								// name already states in words.
								tooltipSeriesRow(
									item.color,
									item.seriesName,
									$pct(Math.abs(item.value ?? 0) / 100, 1)
								)
							)
							.join('')
					);
				}
			},
			legend: {
				...getLegendConfig(isMobile),
				top: isMobile ? '20%' : '15%'
			},
			grid: {
				top: isMobile ? '38%' : '30%',
				bottom: isMobile ? '8%' : '6%',
				left: isMobile ? '6%' : '4%',
				right: isMobile ? '6%' : '4%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: modelNames,
				axisLabel: { ...getAxisLabelStyle(isMobile), interval: 0 },
				axisLine: getAxisLineStyle(),
				axisTick: { alignWithLabel: true, lineStyle: { color: chartColors.axis.tickLine } }
			},
			yAxis: {
				type: 'value',
				name: `↑ ${currentT.agreement.directionAbove} / ↓ ${currentT.agreement.directionBelow}`,
				nameLocation: 'middle',
				nameGap: 46,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 9 : 11,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					formatter: (value: number) => `${Math.abs(value)}%`
				},
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			series
		} as EChartsOption;
	});
</script>

{#if profiles.some((profile) => profile.n > 0)}
	<div
		style="height: {isMobile ? '460px' : '520px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.agreement.directionTitle}
	>
		<Chart {init} {options} />
	</div>

	<p class="chart-note">{$t.agreement.directionNote}</p>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
<ChartDataTable
	columns={[
		{ label: $t.audit.category },
		{ label: $t.viewMeta.model },
		{ label: $t.agreement.directionAbove, format: 'integer' },
		{ label: $t.agreement.directionBelow, format: 'integer' },
		{ label: $t.audit.count, format: 'integer' },
		{ label: $t.agreement.directionAbove + ' (%)', format: 'percent' },
		{ label: $t.agreement.directionBelow + ' (%)', format: 'percent' }
	]}
	rows={profiles.flatMap((p) =>
		p.dissent.map((d, i) => [
			dimensionLabels[p.dimension],
			modelNames[i],
			d.up,
			d.down,
			p.n,
			p.n ? d.up / p.n : 0,
			p.n ? d.down / p.n : 0
		])
	)}
	caption={$t.agreement.directionTitle}
	filenamePrefix="DirectionalDissentChart"
/>
