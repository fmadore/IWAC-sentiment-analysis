<script lang="ts">
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import Chart from './CitableChart.svelte';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { dec, num, translateSentimentValue } from '$lib/i18n/utils';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import {
		aggregateCentralityHeatmap,
		HEATMAP_CENTRALITY_VALUES,
		HEATMAP_CENTRALITY_MIN,
		HEATMAP_CENTRALITY_MAX
	} from '$lib/utils/centralityHeatmap';

	// Import centralized chart theme
	import {
		centralityColors,
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getVisualMapConfig,
		chartColors
	} from '$lib/utils/chartTheme';

	const heatmapColors = HEATMAP_CENTRALITY_VALUES.map((label) => centralityColors[label]);
	const centralityLabels = $derived(
		HEATMAP_CENTRALITY_VALUES.map((label) => translateSentimentValue(label, $currentLanguage))
	);
	let isMobile = $derived((innerWidth.current ?? 1024) < 768);
	const aggregate = $derived(
		aggregateCentralityHeatmap(articleState.filtered, viewOptionsState.heatmapMinCount)
	);
	let options = $derived.by(() => {
		const { countries, years, heatmapData, articlesAnalyzed } = aggregate;
		const currentTranslations = $t;
		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: `${$t.charts.centralityHeatmap} (${$num(articlesAnalyzed)} ${$t.charts.articlesAnalyzed})`,
				left: 'center',
				top: '2%',
				textStyle: getTitleStyle(isMobile)
			},
			tooltip: {
				...tooltipConfig,
				position: 'top',
				formatter: function (params: unknown) {
					const p = params as { data?: [number, number, number, number] };
					if (!p.data || p.data.length < 3) {
						return `<div style="font-weight:600;">${currentTranslations.messages.noData}</div>`;
					}

					const [yearIndex, countryIndex, value, count] = p.data;
					const year = years[yearIndex];
					const country = countries[countryIndex];

					if (value === undefined || value === null) {
						return `<div style="min-width:140px;">
              <div style="font-weight:600;margin-bottom:4px;">${country} - ${year}</div>
              <div style="opacity:0.7;">${currentTranslations.messages.noData}</div>
            </div>`;
					}

					const centralityLabel =
						centralityLabels[Math.round(value) - HEATMAP_CENTRALITY_MIN] || 'N/A';

					return `<div style="min-width:160px;">
            <div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${country} - ${year}</div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span>${currentTranslations.filters.averageCentrality}:</span>
              <strong>${$dec(value, 2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span>${currentTranslations.audit.count} (n):</span>
              <strong>${$num(count)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span>${currentTranslations.filters.level}:</span>
              <strong>${centralityLabel}</strong>
            </div>
          </div>`;
				}
			},
			grid: {
				height: '55%',
				top: isMobile ? '18%' : '14%',
				left: isMobile ? '12%' : '8%',
				right: isMobile ? '8%' : '6%'
			},
			xAxis: {
				type: 'category',
				data: years,
				splitArea: {
					show: true,
					areaStyle: {
						color: [chartColors.background.stripe, 'transparent']
					}
				},
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					rotate: isMobile ? 45 : 0
				},
				axisLine: getAxisLineStyle()
			},
			yAxis: {
				type: 'category',
				data: countries,
				splitArea: {
					show: true,
					areaStyle: {
						color: [chartColors.background.stripe, 'transparent']
					}
				},
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle()
			},
			visualMap: {
				...getVisualMapConfig(
					isMobile,
					HEATMAP_CENTRALITY_MIN,
					HEATMAP_CENTRALITY_MAX,
					heatmapColors
				),
				dimension: 2,
				text: [centralityLabels.at(-1), centralityLabels[0]]
			},
			series: [
				{
					name: currentTranslations.filters.centrality,
					type: 'heatmap',
					data: heatmapData,
					label: {
						show: false
					},
					emphasis: {
						itemStyle: {
							shadowBlur: 15,
							shadowColor: 'rgba(0, 0, 0, 0.4)', // hover halo, between chartColors.shadow default/emphasis
							borderColor: chartColors.border.strong,
							borderWidth: 2
						}
					},
					itemStyle: {
						borderColor: 'rgba(15, 23, 42, 0.8)',
						borderWidth: 1,
						borderRadius: 2
					}
				}
			]
		} as EChartsOption;
	});
</script>

{#if articleState.filtered.length > 0}
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />
		<label class="sample-control">
			<span>{$t.heatmap.minimumCount}</span>
			<input
				type="number"
				min="0"
				max="1000"
				step="1"
				value={viewOptionsState.heatmapMinCount}
				onchange={(event) => {
					const value = event.currentTarget.valueAsNumber;
					if (Number.isInteger(value) && value >= 0 && value <= 1000) {
						viewOptionsState.heatmapMinCount = value;
					} else {
						event.currentTarget.value = String(viewOptionsState.heatmapMinCount);
					}
				}}
			/>
		</label>
	</div>
	<p class="heatmap-note">{$t.heatmap.scaleNote}</p>
	{#if aggregate.hiddenCellCount > 0}
		<p class="heatmap-note" role="status">
			{$t.heatmap.hiddenCells.replace('{count}', $num(aggregate.hiddenCellCount))}
		</p>
	{/if}

	<div
		style="height: {isMobile ? '500px' : '600px'}; position: relative;"
		class="chart-container p-2 sm:p-4"
		role="img"
		aria-label={$t.charts.centralityHeatmap}
	>
		<Chart chartId="centrality-heatmap" {init} {options} />
	</div>
	<ChartDataTable
		columns={[
			{ label: $t.filters.country },
			{ label: $t.audit.year },
			{ label: $t.filters.centrality, format: 'decimal', digits: 2 },
			{ label: $t.audit.count, format: 'integer' }
		]}
		rows={aggregate.cells.map((cell) => [cell.country, cell.year, cell.meanCentrality, cell.count])}
		caption={$t.filters.centrality}
		filenamePrefix="centrality-by-country-year"
	/>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	.sample-control {
		display: flex;
		align-items: center;
		gap: var(--gap-inline);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.sample-control input {
		width: 8ch;
		padding: var(--space-1) var(--space-2);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
		background: var(--surface-nested);
		color: var(--text-primary);
	}

	.heatmap-note {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		margin: var(--space-2) 0;
	}
</style>
