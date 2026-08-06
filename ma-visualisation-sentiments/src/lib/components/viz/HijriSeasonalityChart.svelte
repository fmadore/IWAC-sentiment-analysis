<!--
  HijriSeasonalityChart Component

  Coverage volume and mean centrality across the twelve Hijri months, on a
  polar axis (the calendar is a cycle, so a cycle is the honest shape).

  Every other temporal view in this app buckets by Gregorian year or month.
  On those axes IWAC coverage looks nearly flat across the year, because the
  Hijri year drifts ~11 days against the Gregorian one and smears any lunar
  pattern across all twelve Gregorian months over a 60-year corpus. Bucketed
  by Hijri month instead, coverage nearly doubles in Ramadan and the hajj
  months — and what gets published in them is also markedly more centred on
  Islam, which is why mean centrality rides on the same chart rather than a
  separate one.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { articleState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { centralityScores } from '$lib/stores/derivations';
	import { aggregateByHijriMonth } from '$lib/utils/chartAggregators';
	import { HIJRI_MONTH_KEYS } from '$lib/utils/hijri';
	import DatasetBadge from '../ui/DatasetBadge.svelte';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import {
		centralityColors,
		seriesColorPalette,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getLegendConfig,
		getAxisLabelStyle
	} from '$lib/utils/chartTheme';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	/**
	 * Polar reads the cycle; the bar layout is the accessible/precise fallback
	 * and is easier to compare month against month.
	 */
	let layout = $state<'polar' | 'bar'>('polar');

	let layoutOptions = $derived([
		{ value: 'polar', label: $t.seasonality.cycleLayout, icon: CircleIcon },
		{ value: 'bar', label: $t.charts.bars, icon: BarChart3Icon }
	]);

	let seasonality = $derived(aggregateByHijriMonth(articleState.filtered, centralityScores));

	let monthNames = $derived(HIJRI_MONTH_KEYS.map((key) => $t.seasonality.months[key]));

	/** Months carrying a major observance get a brighter fill and a legend note. */
	const OBSERVANCE_INDICES = new Set([8, 9, 11]); // Ramadan, Shawwal, Dhu al-Hijjah

	let options = $derived.by(() => {
		const currentT = $t;
		const { buckets, total } = seasonality;
		const names = monthNames;

		const barColor = (i: number) =>
			OBSERVANCE_INDICES.has(i) ? centralityColors['Très central'] : centralityColors['Secondaire'];

		const volumeData = buckets.map((bucket, i) => ({
			value: bucket.count,
			itemStyle: { color: barColor(i) }
		}));

		const centralityData = buckets.map((bucket) => bucket.meanCentrality ?? 0);

		const tooltipConfig = getTooltipConfig(isMobile);

		const tooltipFormatter = (params: unknown) => {
			const list = Array.isArray(params) ? params : [params];
			const first = list[0] as { dataIndex?: number };
			const i = first?.dataIndex ?? 0;
			const bucket = buckets[i];
			if (!bucket) return '';

			return `<div style="min-width:210px;">
				<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${names[i]}</div>
				<div style="display:flex;justify-content:space-between;padding:2px 0;">
					<span>${currentT.common.articles}:</span><strong>${bucket.count.toLocaleString()}</strong>
				</div>
				<div style="display:flex;justify-content:space-between;padding:2px 0;">
					<span>${currentT.seasonality.coverageIndex}:</span><strong>${bucket.index.toFixed(2)}×</strong>
				</div>
				<div style="display:flex;justify-content:space-between;padding:2px 0;">
					<span>${currentT.filters.averageCentrality}:</span><strong>${
						bucket.meanCentrality === null ? '—' : bucket.meanCentrality.toFixed(2)
					}</strong>
				</div>
			</div>`;
		};

		const title = {
			text: `${currentT.seasonality.chartTitle} (${total.toLocaleString()} ${currentT.common.articles})`,
			subtext: currentT.seasonality.chartSubtitle,
			left: 'center',
			top: '1%',
			textStyle: getTitleStyle(isMobile),
			subtextStyle: {
				color: chartColors.text.secondary,
				fontSize: isMobile ? 10 : 12,
				fontFamily: '"JetBrains Mono", ui-monospace, monospace'
			}
		};

		if (layout === 'polar') {
			return {
				backgroundColor: 'transparent',
				title,
				tooltip: { ...tooltipConfig, trigger: 'item', formatter: tooltipFormatter },
				polar: { radius: isMobile ? ['18%', '62%'] : ['20%', '68%'], center: ['50%', '56%'] },
				angleAxis: {
					type: 'category',
					data: names,
					startAngle: 90,
					// Calendars run clockwise; ECharts defaults to counter-clockwise.
					clockwise: true,
					axisLabel: {
						...getAxisLabelStyle(isMobile),
						fontSize: isMobile ? 8 : 10
					},
					axisLine: { lineStyle: { color: chartColors.border.subtle } },
					axisTick: { show: false }
				},
				radiusAxis: {
					// Radial tick labels sit right where the month names do and collide
					// with them. The rings still convey relative magnitude, the tooltip
					// gives exact counts, and the bar layout is one click away for
					// precise reading — so drop the labels rather than the readability.
					axisLabel: { show: false },
					axisLine: { show: false },
					splitLine: { lineStyle: { color: chartColors.border.subtle } }
				},
				series: [
					{
						name: currentT.common.articles,
						type: 'bar',
						coordinateSystem: 'polar',
						data: volumeData,
						itemStyle: { borderRadius: 0 }
					}
				]
			} as EChartsOption;
		}

		return {
			backgroundColor: 'transparent',
			title,
			tooltip: {
				...tooltipConfig,
				trigger: 'axis',
				axisPointer: {
					type: 'shadow',
					shadowStyle: { color: chartColors.axis.pointerShadowNeutral }
				},
				formatter: tooltipFormatter
			},
			legend: {
				...getLegendConfig(isMobile),
				data: [currentT.common.articles, currentT.filters.averageCentrality],
				top: isMobile ? '13%' : '10%'
			},
			grid: {
				top: isMobile ? '26%' : '22%',
				bottom: isMobile ? '20%' : '12%',
				left: isMobile ? '12%' : '7%',
				right: isMobile ? '12%' : '7%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: names,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					rotate: isMobile ? 60 : 30
				},
				axisLine: { lineStyle: { color: chartColors.border.subtle } },
				axisTick: { alignWithLabel: true, lineStyle: { color: chartColors.axis.tickLine } }
			},
			yAxis: [
				{
					type: 'value',
					name: currentT.common.articles,
					nameTextStyle: {
						color: chartColors.text.secondary,
						fontSize: isMobile ? 9 : 11,
						fontFamily: '"JetBrains Mono", ui-monospace, monospace'
					},
					axisLabel: getAxisLabelStyle(isMobile),
					splitLine: { lineStyle: { color: chartColors.border.subtle } }
				},
				{
					type: 'value',
					name: currentT.filters.averageCentrality,
					// Pinned to the actual 1-5 scale so the line can't be misread as
					// swinging wildly when it moves half a point.
					min: 1,
					max: 5,
					nameTextStyle: {
						color: chartColors.text.secondary,
						fontSize: isMobile ? 9 : 11,
						fontFamily: '"JetBrains Mono", ui-monospace, monospace'
					},
					axisLabel: getAxisLabelStyle(isMobile),
					splitLine: { show: false }
				}
			],
			series: [
				{
					name: currentT.common.articles,
					type: 'bar',
					// Series colour drives the legend swatch; the per-datum overrides
					// in volumeData still brighten the observance months.
					color: centralityColors['Secondaire'],
					data: volumeData,
					itemStyle: { borderRadius: 0 }
				},
				{
					name: currentT.filters.averageCentrality,
					type: 'line',
					yAxisIndex: 1,
					data: centralityData,
					smooth: false,
					symbolSize: 6,
					// Steel-blue, not the chrome amber the bars use — the line is a
					// different measure on a different axis and must not read as more
					// of the same series.
					color: seriesColorPalette[0],
					lineStyle: { width: 2 }
				}
			]
		} as EChartsOption;
	});
</script>

{#if articleState.filtered.length > 0}
	<div class="chart-toolbar">
		<DatasetBadge size="sm" />
		<ChartTypeToggle
			options={layoutOptions}
			value={layout}
			onChange={(value) => (layout = value as 'polar' | 'bar')}
			ariaLabel={$t.seasonality.chartTitle}
		/>
	</div>

	<div
		style="height: {isMobile ? '460px' : '560px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.seasonality.chartTitle}
	>
		{#key layout}
			<!-- ECharts merges successive setOption calls, so switching layouts
			     would otherwise leave the polar coordinate system behind and render
			     the cycle on top of the bars. Keying rebuilds the instance. -->
			<Chart {init} {options} />
		{/key}
	</div>

	<ChartDataTable
		columns={[
			$t.chartData.month,
			$t.chartData.articles,
			$t.chartData.coverageIndex,
			$t.chartData.meanCentrality
		]}
		rows={seasonality.buckets.map((bucket, i) => [
			monthNames[i],
			bucket.count.toLocaleString(),
			bucket.index.toFixed(2),
			bucket.meanCentrality === null ? '—' : bucket.meanCentrality.toFixed(2)
		])}
		filenamePrefix="iwac-hijri-seasonality"
		caption={$t.chartData.seasonalityCaption}
	/>

	<p class="calendar-note">{$t.seasonality.calendarNote}</p>

	{#if seasonality.undated > 0}
		<p class="calendar-note">
			{$t.seasonality.undatedNote.replace('{count}', seasonality.undated.toLocaleString())}
		</p>
	{/if}
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	/* Methodological footnote — the tabular-calendar caveat belongs next to the
	   chart, not buried in a tooltip (see .impeccable.md principle 3). */
	.calendar-note {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: var(--space-3) auto 0;
		padding-top: var(--space-3);
		border-top: 1px dashed var(--border-subtle);
	}
</style>
