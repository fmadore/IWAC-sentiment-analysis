<!--
  ArbiterPieChart Component

  Shared donut chart for arbiter distributions (verdicts, confidence levels).
  Uses the theme's flat pie style; callers supply pre-colored data and the
  translated count noun used in tooltips.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { pct } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import {
		getTooltipConfig,
		getLegendConfig,
		getPieSeriesStyle,
		chartColors
	} from '$lib/utils/chartTheme';

	interface PieDatum {
		name: string;
		value: number;
		itemStyle: { color: string };
	}

	interface ArbiterPieChartProps {
		data: PieDatum[];
		/** Translated noun shown after the count in tooltips (e.g. "evaluations") */
		countNoun: string;
		/** Accessible summary of the chart for screen readers */
		ariaLabel: string;
	}

	let { data, countNoun, ariaLabel }: ArbiterPieChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	const options = $derived.by((): EChartsOption => {
		const pieStyle = getPieSeriesStyle(isMobile);
		return {
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'item',
				formatter: (params: unknown) => {
					const p = params as { name: string; value: number; percent: number };
					return `
						<div style="font-weight: 600; margin-bottom: 4px;">${p.name}</div>
						<div style="color: ${chartColors.text.subtle};">
							${p.value} ${countNoun} (${$pct(p.percent / 100, 1)})
						</div>
					`;
				}
			},
			legend: {
				...getLegendConfig(isMobile),
				bottom: 10,
				left: 'center'
			},
			series: [
				{
					type: 'pie',
					...pieStyle,
					avoidLabelOverlap: true,
					label: {
						...pieStyle.label,
						show: !isMobile,
						position: 'outside',
						formatter: (params: unknown) => {
							const p = params as { name: string; percent: number };
							return `${p.name}\n${$pct(p.percent / 100, 1)}`;
						}
					},
					labelLine: {
						...pieStyle.labelLine,
						show: !isMobile
					},
					data
				}
			]
		};
	});
</script>

<div class="chart-container" role="img" aria-label={ariaLabel}>
	<Chart {options} {init} />
</div>

<style>
	.chart-container {
		width: 100%;
		height: 300px;
	}

	@media (min-width: 640px) {
		.chart-container {
			height: 350px;
		}
	}
</style>
