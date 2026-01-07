<!--
  ArbiterConfidenceChart Component
  
  Displays the distribution of arbiter confidence levels (high, medium, low)
  as a pie or bar chart.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init, use } from 'echarts/core';
	import { PieChart } from 'echarts/charts';
	import {
		TitleComponent,
		TooltipComponent,
		LegendComponent
	} from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer]);

	import { arbiterEvaluations } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { getTooltipConfig, getLegendConfig } from '$lib/utils/chartTheme';

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Colors for confidence levels
	const confidenceColors = {
		high: '#22C55E',
		medium: '#FBBF24',
		low: '#EF4444'
	};

	// Compute confidence distribution
	const confidenceData = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations || [];

		const counts = {
			high: 0,
			medium: 0,
			low: 0
		};

		for (const evaluation of evaluations) {
			const level = evaluation.arbiter.confidence_level as 'high' | 'medium' | 'low';
			if (level in counts) {
				counts[level]++;
			}
		}

		return [
			{
				name: $t.arbiter.confidenceHigh,
				value: counts.high,
				itemStyle: { color: confidenceColors.high }
			},
			{
				name: $t.arbiter.confidenceMedium,
				value: counts.medium,
				itemStyle: { color: confidenceColors.medium }
			},
			{
				name: $t.arbiter.confidenceLow,
				value: counts.low,
				itemStyle: { color: confidenceColors.low }
			}
		].filter((d) => d.value > 0);
	});

	// Chart options
	const options = $derived.by((): EChartsOption => {
		const currentT = $t;

		return {
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'item',
				formatter: (params: unknown) => {
					const p = params as { name: string; value: number; percent: number };
					return `
						<div style="font-weight: 600; margin-bottom: 4px;">${p.name}</div>
						<div style="color: rgba(255,255,255,0.7);">
							${p.value} evaluations (${p.percent.toFixed(1)}%)
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
					radius: isMobile ? ['40%', '65%'] : ['45%', '70%'],
					center: ['50%', '45%'],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 8,
						borderColor: 'rgba(15, 23, 42, 0.9)',
						borderWidth: 2
					},
					label: {
						show: !isMobile,
						position: 'outside',
						color: 'rgba(255, 255, 255, 0.85)',
						fontSize: 11,
						formatter: (params: unknown) => {
							const p = params as { name: string; percent: number };
							return `${p.name}\n${p.percent.toFixed(1)}%`;
						}
					},
					labelLine: {
						show: !isMobile,
						lineStyle: {
							color: 'rgba(255, 255, 255, 0.3)'
						}
					},
					emphasis: {
						itemStyle: {
							shadowBlur: 20,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.4)'
						},
						label: {
							show: true,
							fontSize: 14,
							fontWeight: 'bold'
						}
					},
					data: confidenceData
				}
			]
		};
	});
</script>

<div class="chart-container">
	<Chart {options} {init} />
</div>

<style>
	.chart-container {
		width: 100%;
		height: 350px;
	}

	@media (max-width: 768px) {
		.chart-container {
			height: 300px;
		}
	}
</style>
