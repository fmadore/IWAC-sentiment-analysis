<!--
  AgreementMatrix Component

  Cross-tabulation of two models' labels for one dimension, as a heatmap.

  Shading is ROW-relative, not relative to the grand total: the finding is
  "of everything ChatGPT called Très central, Mistral called 79% of it
  Central", which a total-relative scale would flatten into one bright cell
  and a lot of dark ones. The diagonal is outlined so a systematic one-notch
  offset reads as a band sitting just beside it.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { num, pct } from '$lib/i18n/utils';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import type { ConfusionMatrix } from '$lib/utils/agreement';
	import type { AgreementDimension } from '$lib/stores/agreement.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import {
		centralityColors,
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		chartColors
	} from '$lib/utils/chartTheme';

	interface AgreementMatrixProps {
		matrix: ConfusionMatrix;
		dimension: AgreementDimension;
		modelAName: string;
		modelBName: string;
	}

	let { matrix, dimension, modelAName, modelBName }: AgreementMatrixProps = $props();

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	/**
	 * Subjectivity categories are numeric strings ('1'..'5') that carry no
	 * meaning on an axis; the other two dimensions store French labels the i18n
	 * layer already knows how to translate.
	 */
	let axisLabels = $derived(
		dimension === 'subjectivity'
			? matrix.categories.map(
					(score) =>
						({
							'1': $t.filters.veryObjectiveScore,
							'2': $t.filters.ratherObjectiveScore,
							'3': $t.filters.mixedScore,
							'4': $t.filters.ratherSubjectiveScore,
							'5': $t.filters.verySubjectiveScore
						})[score] ?? score
				)
			: matrix.categories.map((category) => translateSentimentValue(category, $currentLanguage))
	);

	let options = $derived.by(() => {
		const labels = axisLabels;
		const currentT = $t;

		// ECharts heatmap wants [x, y, value]; y is inverted so the first
		// category sits at the TOP-left, matching how the table above reads.
		const k = matrix.categories.length;
		const data = matrix.cells.map((cell) => [
			cell.columnIndex,
			k - 1 - cell.rowIndex,
			cell.rowPercent
		]);

		const countByKey = new Map(
			matrix.cells.map((cell) => [`${cell.columnIndex}:${k - 1 - cell.rowIndex}`, cell.count])
		);

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${currentT.agreement.matrixTitle} (${$num(matrix.n)} ${currentT.common.articles})`,
				subtext: `${currentT.agreement.rowsAre} ${modelAName} · ${currentT.agreement.columnsAre} ${modelBName}`,
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
				position: 'top',
				formatter: (params: unknown) => {
					const p = params as { data?: [number, number, number] };
					if (!p.data) return '';

					const [x, y, percent] = p.data;
					const count = countByKey.get(`${x}:${y}`) ?? 0;
					const rowLabel = labels[k - 1 - y];
					const columnLabel = labels[x];

					return `<div style="min-width:200px;">
						<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">
							${modelAName}: ${rowLabel}<br/>${modelBName}: ${columnLabel}
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.common.articles}:</span><strong>${$num(count)}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.agreement.ofRow}:</span><strong>${$pct(percent / 100, 1)}</strong>
						</div>
					</div>`;
				}
			},
			grid: {
				top: isMobile ? '20%' : '16%',
				bottom: isMobile ? '22%' : '16%',
				left: isMobile ? 46 : 64,
				right: isMobile ? '6%' : '4%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				name: modelBName,
				nameLocation: 'middle',
				nameGap: isMobile ? 58 : 42,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				data: labels,
				splitArea: {
					show: true,
					areaStyle: { color: [chartColors.background.stripe, 'transparent'] }
				},
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					rotate: isMobile ? 45 : 20
				},
				axisLine: getAxisLineStyle()
			},
			yAxis: {
				type: 'category',
				name: modelAName,
				nameLocation: 'middle',
				nameGap: isMobile ? 86 : 108,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 10 : 12,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				// Reversed so category 0 is the top row.
				data: [...labels].reverse(),
				splitArea: {
					show: true,
					areaStyle: { color: [chartColors.background.stripe, 'transparent'] }
				},
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle()
			},
			visualMap: {
				min: 0,
				max: 100,
				calculable: false,
				orient: 'horizontal',
				left: 'center',
				bottom: isMobile ? '1%' : '2%',
				itemWidth: isMobile ? 10 : 14,
				itemHeight: isMobile ? 70 : 110,
				text: ['100%', '0%'],
				textStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 9 : 11,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				inRange: {
					// Sequential ramp on the editorial amber; reuses the centrality
					// scale tokens so "more" reads the same way across the app.
					color: [
						chartColors.background.stripe,
						centralityColors['Non abordé'],
						centralityColors['Marginal'],
						centralityColors['Secondaire'],
						centralityColors['Central'],
						centralityColors['Très central']
					]
				}
			},
			series: [
				{
					name: currentT.agreement.matrixTitle,
					type: 'heatmap',
					data,
					label: {
						show: !isMobile,
						formatter: (params: { data: [number, number, number] }) => {
							const percent = params.data[2];
							// Sub-1% cells would be visual noise at this density.
							return percent >= 1 ? `${Math.round(percent)}%` : '';
						},
						fontFamily: '"JetBrains Mono", ui-monospace, monospace',
						fontSize: 10,
						color: chartColors.text.primary,
						textBorderColor: 'rgba(0,0,0,0.55)',
						textBorderWidth: 2
					},
					itemStyle: {
						borderColor: chartColors.background.dark,
						borderWidth: 1
					},
					emphasis: {
						itemStyle: {
							borderColor: chartColors.border.strong,
							borderWidth: 2
						}
					}
				},
				{
					// Diagonal reference: a second, transparent series drawing only the
					// perfect-agreement cells with a visible outline. Cheaper and more
					// robust than markLine on a category heatmap.
					type: 'heatmap',
					data: matrix.categories.map((_, i) => [i, k - 1 - i, 0]),
					silent: true,
					label: { show: false },
					itemStyle: {
						color: 'transparent',
						borderColor: chartColors.chrome.accent,
						borderWidth: 2
					}
				}
			]
		} as EChartsOption;
	});
</script>

{#if matrix.n > 0}
	<div
		style="height: {isMobile ? '460px' : '560px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label="{$t.agreement.matrixTitle} — {modelAName} / {modelBName}"
	>
		<Chart {init} {options} />
	</div>

	<ChartDataTable
		columns={[
			{ label: `${modelAName} (${$t.chartData.modelALabel})` },
			{ label: `${modelBName} (${$t.chartData.modelBLabel})` },
			{ label: $t.chartData.count, format: 'integer' },
			{ label: $t.chartData.rowPercent, format: 'percent', digits: 1 }
		]}
		rows={matrix.cells
			.filter((cell) => cell.count > 0)
			.map((cell) => [
				axisLabels[cell.rowIndex],
				axisLabels[cell.columnIndex],
				cell.count,
				cell.rowPercent / 100
			])}
		filenamePrefix="iwac-agreement-matrix"
		caption={$t.chartData.matrixCaption}
	/>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}
