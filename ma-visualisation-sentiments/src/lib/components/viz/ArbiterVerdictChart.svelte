<!--
  ArbiterVerdictChart Component
  
  Displays the distribution of arbiter verdicts (which model is preferred)
  as a pie or donut chart. Supports filtering by dimension.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init, use } from 'echarts/core';
	import { PieChart, BarChart } from 'echarts/charts';
	import {
		TitleComponent,
		TooltipComponent,
		LegendComponent
	} from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	use([TitleComponent, TooltipComponent, LegendComponent, PieChart, BarChart, CanvasRenderer]);

	import { arbiterEvaluations, arbiterModelAIsFirst } from '$lib/stores';
	import { t } from '$lib/i18n';
	import {
		getTooltipConfig,
		getLegendConfig
	} from '$lib/utils/chartTheme';

	interface ArbiterVerdictChartProps {
		dimension: 'polarity' | 'subjectivity' | 'centrality' | null;
		modelAName: string;
		modelBName: string;
	}

	let { dimension, modelAName, modelBName }: ArbiterVerdictChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Colors for verdict types
	const verdictColors = {
		model_a: '#22C55E', // Green for model A
		model_b: '#8B5CF6', // Purple for model B
		both: '#FBBF24', // Amber for both equal
		neither: '#6B7280' // Gray for neither
	};

	// Compute verdict counts based on dimension filter
	const verdictData = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations || [];
		const modelAIsFirst = arbiterModelAIsFirst.current;

		const counts = {
			model_a: 0,
			model_b: 0,
			both: 0,
			neither: 0
		};

		for (const evaluation of evaluations) {
			const arbiter = evaluation.arbiter;
			const dimensions = dimension
				? [dimension]
				: (['polarity', 'subjectivity', 'centrality'] as const);

			for (const dim of dimensions) {
				const preferred = arbiter[dim]?.preferred_model as
					| 'model_a'
					| 'model_b'
					| 'both'
					| 'neither';
				if (preferred in counts) {
					counts[preferred]++;
				}
			}
		}

		// CRITICAL: Map arbiter verdicts to pair order (first/second model in pair name)
		// - arbiter_model_a = what arbiter saw as "Model A" (could be ChatGPT or Gemini)
		// - arbiterModelAIsFirst = true when arbiter_model_a matches pair_first_model
		// - This swapping ensures UI always shows first model in pair as "modelA" for consistency
		const firstModelPreferred = modelAIsFirst ? counts.model_a : counts.model_b;
		const secondModelPreferred = modelAIsFirst ? counts.model_b : counts.model_a;

		return [
			{
				name: modelAName,
				value: firstModelPreferred,
				itemStyle: { color: verdictColors.model_a }
			},
			{
				name: modelBName,
				value: secondModelPreferred,
				itemStyle: { color: verdictColors.model_b }
			},
			{
				name: $t.arbiter.bothEqual,
				value: counts.both,
				itemStyle: { color: verdictColors.both }
			},
			{
				name: $t.arbiter.neitherAccurate,
				value: counts.neither,
				itemStyle: { color: verdictColors.neither }
			}
		].filter((d) => d.value > 0);
	});

	// Chart options
	const options = $derived.by((): EChartsOption => {
		const currentT = $t;
		const total = verdictData.reduce((sum, d) => sum + d.value, 0);

		return {
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'item',
				formatter: (params: unknown) => {
					const p = params as { name: string; value: number; percent: number };
					return `
						<div style="font-weight: 600; margin-bottom: 4px;">${p.name}</div>
						<div style="color: rgba(255,255,255,0.7);">
							${p.value} verdicts (${p.percent.toFixed(1)}%)
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
					data: verdictData
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
