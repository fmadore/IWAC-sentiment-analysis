<!--
  ModelCalibrationChart Component

  Every model's own label distribution for one dimension, on a shared axis.

  This is the calibration signature, and it is only legible side by side:
  Gemini reaches for 'Très positif' 3.8x more often than ChatGPT, and Mistral
  puts 79% of its subjectivity judgements in a single score. Switching the
  dataset picker and comparing remembered bar heights could never show that.

  Bars are percentages rather than counts because the point is *where a model
  puts its mass*, and the corpus size is identical across models anyway.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { getModelDisplayName } from '$lib/utils/format';
	import { datasetState } from '$lib/stores';
	import type { AgreementDimension, ModelMarginals } from '$lib/stores/agreement.svelte';
	import {
		seriesColorPalette,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getGridConfig,
		getEmphasisConfig,
		chartColors
	} from '$lib/utils/chartTheme';

	interface ModelCalibrationChartProps {
		marginals: ModelMarginals[];
		dimension: AgreementDimension;
		categories: string[];
	}

	let { marginals, dimension, categories }: ModelCalibrationChartProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let categoryLabels = $derived(
		dimension === 'subjectivity'
			? categories.map(
					(score) =>
						({
							'1': $t.filters.veryObjectiveScore,
							'2': $t.filters.ratherObjectiveScore,
							'3': $t.filters.mixedScore,
							'4': $t.filters.ratherSubjectiveScore,
							'5': $t.filters.verySubjectiveScore
						})[score] ?? score
				)
			: categories.map((category) => translateSentimentValue(category, $currentLanguage))
	);

	let options = $derived.by(() => {
		const currentT = $t;
		const labels = categoryLabels;

		const modelNames = marginals.map((m) => getModelDisplayName(m.modelId, datasetState.available));

		const series = marginals.map((marginal, index) => ({
			name: modelNames[index],
			type: 'bar' as const,
			// Percentages on the axis, raw counts carried for the tooltip.
			data: marginal.percentages.map((percent, i) => ({
				value: percent,
				rawCount: marginal.counts[i]
			})),
			itemStyle: {
				color: seriesColorPalette[index % seriesColorPalette.length],
				borderRadius: 0
			},
			emphasis: getEmphasisConfig()
		}));

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.agreement.calibrationTitle,
				subtext: currentT.agreement.calibrationSubtitle,
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
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: chartColors.axis.pointerShadowNeutral }
				},
				formatter: (params: unknown) => {
					if (!Array.isArray(params) || params.length === 0) return '';
					const items = params as {
						seriesName?: string;
						color?: string;
						axisValue?: string;
						data?: { value: number; rawCount: number };
					}[];

					const rows = items
						.map(
							(item) => `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
								<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};"></span>
								<span style="flex:1;">${item.seriesName}</span>
								<strong>${(item.data?.value ?? 0).toFixed(1)}%</strong>
								<span style="opacity:0.65;">(${(item.data?.rawCount ?? 0).toLocaleString()})</span>
							</div>`
						)
						.join('');

					return `<div style="min-width:220px;">
						<div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${items[0].axisValue}</div>
						${rows}
					</div>`;
				}
			},
			legend: {
				...getLegendConfig(isMobile),
				data: modelNames,
				top: isMobile ? '13%' : '10%'
			},
			grid: getGridConfig(isMobile, { hasLegendTop: true }),
			xAxis: {
				type: 'category',
				data: labels,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					rotate: isMobile ? 45 : 15
				},
				axisLine: getAxisLineStyle(),
				axisTick: { alignWithLabel: true, lineStyle: { color: chartColors.axis.tickLine } }
			},
			yAxis: {
				type: 'value',
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					formatter: (value: number) => `${value}%`
				},
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			series
		} as EChartsOption;
	});
</script>

{#if marginals.length > 0}
	<div
		style="height: {isMobile ? '420px' : '480px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.agreement.calibrationTitle}
	>
		<Chart {init} {options} />
	</div>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
