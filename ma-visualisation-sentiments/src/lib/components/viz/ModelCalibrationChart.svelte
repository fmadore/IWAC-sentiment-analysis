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
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import Chart from './CitableChart.svelte';
	import { num, pct } from '#lib/i18n/utils.js';
	import { init } from '#lib/utils/echartsSetup.js';
	import type { EChartsOption } from 'echarts';
	import { isCompactWidth } from '#lib/utils/viewport.svelte.js';
	import { useChartCardHeading } from '#lib/components/ui/chartCardHeading.svelte.js';
	import ChartHeading from './ChartHeading.svelte';

	import { t } from '#lib/i18n/index.js';
	import { sentimentLabel } from '#lib/i18n/utils.js';
	import { getModelDisplayName } from '#lib/utils/format.js';
	import { datasetState } from '#lib/stores/index.js';
	import { modelSeriesColor } from '#lib/stores/datasets.svelte.js';
	import type { DatasetId } from '#lib/types/data.js';
	import type { AgreementDimension, ModelMarginals } from '#lib/stores/index.js';
	import {
		getTooltipConfig,
		getLegendConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getGridConfig,
		getEmphasisConfig,
		seriesDecal,
		chartColors
	} from '#lib/utils/chartTheme.js';

	interface ModelCalibrationChartProps {
		marginals: ModelMarginals[];
		dimension: AgreementDimension;
		categories: string[];
	}

	let { marginals, dimension, categories }: ModelCalibrationChartProps = $props();

	// Compact layout follows the chart's own width, not the window's.
	let containerWidth = $state<number>();
	let isMobile = $derived(isCompactWidth(containerWidth));

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
			: categories.map((category) => $sentimentLabel(category))
	);

	const heading = useChartCardHeading(() => ({
		title: $t.agreement.calibrationTitle,
		subtitle: $t.agreement.calibrationSubtitle
	}));

	let options = $derived.by(() => {
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
			// One colour per model from the single source; within each category the
			// bars also keep legend order, a positional cue that does not need hue.
			// …and a texture per model (seriesDecal), repeated in the legend, so six
			// close hues are never the only key.
			itemStyle: {
				color: modelSeriesColor(marginal.modelId as DatasetId),
				decal: seriesDecal(index),
				borderRadius: 0
			},
			emphasis: getEmphasisConfig()
		}));

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
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
								<strong>${$pct((item.data?.value ?? 0) / 100, 1)}</strong>
								<span style="opacity:0.65;">(${$num(item.data?.rawCount ?? 0)})</span>
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
				top: 0
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

{#if !heading.inCard}
	<ChartHeading title={$t.agreement.calibrationTitle} subtitle={$t.agreement.calibrationSubtitle} />
{/if}
{#if marginals.length > 0}
	<div
		style="height: {isMobile ? '420px' : '480px'}; position: relative;"
		class="chart-container"
		bind:clientWidth={containerWidth}
		role="img"
		aria-label={$t.agreement.calibrationTitle}
	>
		<Chart chartId="model-calibration-chart" {init} {options} />
	</div>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
<ChartDataTable
	columns={[
		{ label: $t.viewMeta.model },
		{ label: $t.audit.category },
		{ label: $t.audit.count, format: 'integer' },
		{ label: $t.audit.share, format: 'percent' }
	]}
	rows={marginals.flatMap((m) =>
		categories.map((_, i) => [
			getModelDisplayName(m.modelId, datasetState.available),
			categoryLabels[i],
			m.counts[i],
			m.percentages[i] / 100
		])
	)}
	caption={$t.agreement.calibrationTitle}
	filenamePrefix="ModelCalibrationChart"
/>
