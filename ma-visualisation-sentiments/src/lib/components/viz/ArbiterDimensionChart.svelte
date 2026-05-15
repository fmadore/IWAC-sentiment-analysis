<!--
  ArbiterDimensionChart Component
  
  Displays the breakdown of arbiter verdicts by dimension (polarity, subjectivity, centrality)
  as a stacked or grouped bar chart.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { arbiterEvaluations, arbiterModelAIsFirst } from '$lib/stores';
	import { t } from '$lib/i18n';
	import {
		getTooltipConfig,
		getLegendConfig,
		getGridConfig,
		getAxisLabelStyle,
		getAxisLineStyle,
		getSplitLineStyle,
		getStaggeredAnimationDelay,
		arbiterVerdictColors
	} from '$lib/utils/chartTheme';

	interface ArbiterDimensionChartProps {
		modelAName: string;
		modelBName: string;
	}

	let { modelAName, modelBName }: ArbiterDimensionChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	// Dimension labels
	const dimensionLabels = $derived({
		polarity: $t.arbiter.polarity,
		subjectivity: $t.arbiter.subjectivity,
		centrality: $t.arbiter.centrality
	});

	// Compute data for each dimension
	const dimensionData = $derived.by(() => {
		const evaluations = arbiterEvaluations.current?.evaluations || [];
		const modelAIsFirst = arbiterModelAIsFirst.current;

		const dimensions = ['polarity', 'subjectivity', 'centrality'] as const;
		const result: Record<
			string,
			{ model_a: number; model_b: number; both: number; neither: number }
		> = {};

		for (const dim of dimensions) {
			result[dim] = { model_a: 0, model_b: 0, both: 0, neither: 0 };
		}

		for (const evaluation of evaluations) {
			const arbiter = evaluation.arbiter;
			for (const dim of dimensions) {
				const preferred = arbiter[dim]?.preferred_model as
					| 'model_a'
					| 'model_b'
					| 'both'
					| 'neither';
				if (preferred && result[dim]) {
					result[dim][preferred]++;
				}
			}
		}

		// CRITICAL: Map arbiter verdicts to pair order (first/second model in pair name)
		// - arbiter_model_a = what arbiter saw as "Model A" (could be ChatGPT or Gemini)
		// - arbiterModelAIsFirst = true when arbiter_model_a matches pair_first_model
		// - This swapping ensures UI always shows first model in pair as "modelA" for consistency
		return dimensions.map((dim) => ({
			dimension: dimensionLabels[dim],
			modelA: modelAIsFirst ? result[dim].model_a : result[dim].model_b,
			modelB: modelAIsFirst ? result[dim].model_b : result[dim].model_a,
			both: result[dim].both,
			neither: result[dim].neither
		}));
	});

	// Chart options
	const options = $derived.by((): EChartsOption => {
		const currentT = $t;

		return {
			tooltip: {
				...getTooltipConfig(isMobile),
				trigger: 'axis',
				axisPointer: {
					type: 'shadow'
				}
			},
			legend: {
				...getLegendConfig(isMobile),
				data: [
					modelAName,
					modelBName,
					currentT.arbiter.bothEqual,
					currentT.arbiter.neitherAccurate
				],
				top: 0
			},
			grid: {
				...getGridConfig(isMobile),
				top: 60,
				bottom: 40
			},
			xAxis: {
				type: 'category',
				data: dimensionData.map((d) => d.dimension),
				axisLine: getAxisLineStyle(),
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0
				}
			},
			yAxis: {
				type: 'value',
				axisLine: getAxisLineStyle(),
				axisLabel: getAxisLabelStyle(isMobile),
				splitLine: getSplitLineStyle()
			},
			series: [
				{
					name: modelAName,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					...getStaggeredAnimationDelay(),
					itemStyle: {
						color: arbiterVerdictColors.model_a,
						borderRadius: [0, 0, 0, 0]
					},
					data: dimensionData.map((d) => d.modelA)
				},
				{
					name: modelBName,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					...getStaggeredAnimationDelay(),
					itemStyle: {
						color: arbiterVerdictColors.model_b,
						borderRadius: [0, 0, 0, 0]
					},
					data: dimensionData.map((d) => d.modelB)
				},
				{
					name: currentT.arbiter.bothEqual,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					...getStaggeredAnimationDelay(),
					itemStyle: {
						color: arbiterVerdictColors.both,
						borderRadius: [0, 0, 0, 0]
					},
					data: dimensionData.map((d) => d.both)
				},
				{
					name: currentT.arbiter.neitherAccurate,
					type: 'bar',
					stack: 'total',
					emphasis: { focus: 'series' },
					...getStaggeredAnimationDelay(),
					itemStyle: {
						color: arbiterVerdictColors.neither,
						borderRadius: 0
					},
					data: dimensionData.map((d) => d.neither)
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
