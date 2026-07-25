<!--
  DisagreementBreakdownChart Component

  Where two models disagree — by publication decade and by country.

  The comparison view can say how much two models disagree (a mean discrepancy
  in points) but never where. That matters: disagreement concentrated in the
  1970s-80s would point at OCR quality or archival text rather than at the
  models, and disagreement concentrated in one national press would point at
  register or vocabulary. A single corpus-wide average hides both.

  Bucketed by decade rather than year because the corpus runs from 22 articles
  in the 1960s to 4,360 in the 2010s; per-year means in the thin early years
  would swing on a handful of articles.
-->
<script lang="ts">
	import { Chart } from 'svelte-echarts';
	import { init } from '$lib/utils/echartsSetup';
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';

	import { comparisonState, datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { getPairModelNames } from '$lib/types/data';
	import ChartTypeToggle from './ChartTypeToggle.svelte';
	import { aggregateDisagreement, bucketDecade } from '$lib/utils/chartAggregators';
	import {
		seriesColorPalette,
		chartColors,
		getTitleStyle,
		getTooltipConfig,
		getAxisLineStyle,
		getAxisLabelStyle,
		getSplitLineStyle,
		getEmphasisConfig
	} from '$lib/utils/chartTheme';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import GlobeIcon from '@lucide/svelte/icons/globe';

	let isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let groupBy = $state<'decade' | 'country'>('decade');

	let groupOptions = $derived([
		{ value: 'decade', label: $t.comparison.byDecade, icon: CalendarIcon },
		{ value: 'country', label: $t.filters.country, icon: GlobeIcon }
	]);

	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	let buckets = $derived.by(() => {
		const noCountry = $t.messages.noData;

		const result = aggregateDisagreement(
			comparisonState.filtered.map((comparison) => ({
				key:
					groupBy === 'country'
						? comparison.article.Country || noCountry
						: bucketDecade(comparison.article.publication_date),
				totalDiff: comparison.discrepancies.totalDiff,
				hasConflict: comparison.discrepancies.hasConflict
			}))
		);

		// Decades read chronologically; countries read as a ranking.
		return groupBy === 'decade'
			? result.sort((a, b) => a.key.localeCompare(b.key))
			: result.sort((a, b) => b.meanTotal - a.meanTotal);
	});

	let options = $derived.by(() => {
		const currentT = $t;
		const keys = buckets.map((b) => b.key);

		const tooltipConfig = getTooltipConfig(isMobile);

		return {
			backgroundColor: 'transparent',
			title: {
				text: currentT.comparison.disagreementBreakdown,
				subtext: `${modelNames.modelAName} · ${modelNames.modelBName}`,
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
					const list = Array.isArray(params) ? params : [params];
					const i = (list[0] as { dataIndex?: number })?.dataIndex ?? 0;
					const bucket = buckets[i];
					if (!bucket) return '';

					return `<div style="min-width:220px;">
						<div style="font-weight:600;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${chartColors.border.light};">${bucket.key}</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.comparison.averageDiscrepancy}:</span><strong>${bucket.meanTotal.toFixed(2)}</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.comparison.highConflicts}:</span><strong>${bucket.conflictRate.toFixed(1)}%</strong>
						</div>
						<div style="display:flex;justify-content:space-between;padding:2px 0;">
							<span>${currentT.common.articles}:</span><strong>${bucket.n.toLocaleString()}</strong>
						</div>
					</div>`;
				}
			},
			legend: {
				show: false
			},
			grid: {
				top: isMobile ? '24%' : '20%',
				bottom: isMobile ? '18%' : '12%',
				left: isMobile ? '10%' : '6%',
				right: isMobile ? '10%' : '6%',
				containLabel: true
			},
			xAxis: {
				type: 'category',
				data: keys,
				axisLabel: {
					...getAxisLabelStyle(isMobile),
					interval: 0,
					rotate: isMobile ? 45 : 0
				},
				axisLine: getAxisLineStyle(),
				axisTick: { alignWithLabel: true, lineStyle: { color: chartColors.axis.tickLine } }
			},
			yAxis: {
				type: 'value',
				name: currentT.comparison.pointsPerArticle,
				nameLocation: 'middle',
				nameGap: 42,
				nameTextStyle: {
					color: chartColors.text.secondary,
					fontSize: isMobile ? 9 : 11,
					fontFamily: '"JetBrains Mono", ui-monospace, monospace'
				},
				axisLabel: getAxisLabelStyle(isMobile),
				axisLine: getAxisLineStyle(),
				splitLine: getSplitLineStyle()
			},
			series: [
				{
					name: currentT.comparison.averageDiscrepancy,
					type: 'bar',
					data: buckets.map((b) => b.meanTotal),
					itemStyle: { color: seriesColorPalette[0], borderRadius: 0 },
					emphasis: getEmphasisConfig()
				}
			]
		} as EChartsOption;
	});
</script>

{#if buckets.length > 0}
	<div class="chart-toolbar">
		<span class="toolbar-label">{$t.comparison.disagreementBreakdown}</span>
		<ChartTypeToggle
			options={groupOptions}
			value={groupBy}
			onChange={(value) => (groupBy = value as 'decade' | 'country')}
			ariaLabel={$t.comparison.disagreementBreakdown}
		/>
	</div>

	<div
		style="height: {isMobile ? '340px' : '400px'}; position: relative;"
		class="chart-container"
		role="img"
		aria-label={$t.comparison.disagreementBreakdown}
	>
		<Chart {init} {options} />
	</div>

	<p class="breakdown-note">{$t.comparison.disagreementBreakdownNote}</p>
{:else}
	<p class="chart-empty">{$t.table.noFilteredArticles}</p>
{/if}

<style>
	.toolbar-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.breakdown-note {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: var(--space-3) auto 0;
		padding-top: var(--space-3);
		border-top: 1px dashed var(--border-subtle);
	}
</style>
