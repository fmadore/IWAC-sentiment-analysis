<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { innerWidth } from 'svelte/reactivity/window';
	import { t } from '$lib/i18n';
	import { num } from '$lib/i18n/utils';
	import { articleState } from '$lib/stores/articles.svelte';
	import { datasetState } from '$lib/stores/datasets.svelte';
	import { filterState } from '$lib/stores/filters.svelte';
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import { corpusSlice, newspaperTimeline } from '$lib/utils/researchTimeline';
	import { init } from '$lib/utils/echartsSetup';
	import {
		chartColors,
		seriesColorPalette,
		getAxisLabelStyle,
		getAxisLineStyle,
		getTooltipConfig,
		getVisualMapConfig
	} from '$lib/utils/chartTheme';
	import Chart from './CitableChart.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import SectionHead from '../common/SectionHead.svelte';

	const perPage = 12;
	const mobile = $derived((innerWidth.current ?? 1024) < 768);
	const corpus = $derived(
		corpusSlice(articleState.datasets[datasetState.selected] ?? [], filterState)
	);
	const timeline = $derived(newspaperTimeline(corpus, viewOptionsState.newspaperPeriod));
	const rows = $derived(
		viewOptionsState.newspaperOrder === 'name'
			? [...timeline.rows].sort((a, b) => a.journal.localeCompare(b.journal))
			: timeline.rows
	);
	const pages = $derived(Math.max(1, Math.ceil(rows.length / perPage)));
	const page = $derived(Math.min(viewOptionsState.newspaperPage, pages));
	const shown = $derived(rows.slice((page - 1) * perPage, page * perPage));
	const maximum = $derived(Math.max(1, ...timeline.rows.flatMap((row) => row.counts)));
	const options = $derived.by((): EChartsOption => ({
		backgroundColor: 'transparent',
		tooltip: {
			...getTooltipConfig(mobile),
			renderMode: 'richText',
			formatter: (params: unknown) => {
				const item = params as { value?: number[] };
				const [x, y, count] = item.value ?? [];
				return `${shown[y]?.journal ?? ''}\n${timeline.periods[x] ?? ''}: ${$num(count ?? 0)} ${$t.common.articles}`;
			}
		},
		grid: { top: 16, left: mobile ? 100 : 175, right: 12, bottom: 100 },
		xAxis: {
			type: 'category',
			data: timeline.periods.map(String),
			axisLine: getAxisLineStyle(),
			axisLabel: { ...getAxisLabelStyle(mobile), rotate: 45 }
		},
		yAxis: {
			type: 'category',
			inverse: true,
			data: shown.map((row) => row.journal),
			axisLine: getAxisLineStyle(),
			axisLabel: { ...getAxisLabelStyle(mobile), width: mobile ? 90 : 160, overflow: 'truncate' }
		},
		visualMap: {
			...getVisualMapConfig(mobile, 0, maximum, [
				chartColors.background.dark,
				seriesColorPalette[0]
			]),
			min: 0,
			max: maximum,
			calculable: false,
			text: [$num(maximum), '0'],
			bottom: 5
		},
		series: [
			{
				type: 'heatmap',
				name: $t.historyResearch.timelineLegend,
				data: shown.flatMap((row, y) =>
					row.counts.flatMap((count, x) => (count > 0 ? [[x, y, count]] : []))
				),
				itemStyle: { borderColor: chartColors.background.dark, borderWidth: 1 },
				emphasis: { itemStyle: { borderColor: chartColors.border.strong, borderWidth: 2 } }
			}
		]
	}));
	function selectJournal(journal: string) {
		filterState.journals = [journal];
		viewOptionsState.newspaperPage = 1;
	}
	function selectCell(event: unknown) {
		const value = (event as { value?: number[] }).value;
		if (value && shown[value[1]]) selectJournal(shown[value[1]].journal);
	}
</script>

<section aria-label={$t.historyResearch.timelineTitle}>
	<SectionHead title={$t.historyResearch.timelineTitle} lede={$t.historyResearch.timelineIntro} />
	<p class="note">{$t.historyResearch.timelineFilters}</p>
	<div class="controls">
		<label
			>{$t.historyResearch.period}
			<select
				bind:value={viewOptionsState.newspaperPeriod}
				onchange={() => (viewOptionsState.newspaperPage = 1)}
			>
				<option value="year">{$t.historyResearch.year}</option>
				<option value="decade">{$t.historyResearch.decade}</option>
			</select>
		</label>
		<label
			>{$t.historyResearch.order}
			<select
				bind:value={viewOptionsState.newspaperOrder}
				onchange={() => (viewOptionsState.newspaperPage = 1)}
			>
				<option value="count">{$t.historyResearch.countOrder}</option>
				<option value="name">{$t.historyResearch.nameOrder}</option>
			</select>
		</label>
	</div>
	<p class="support">
		{$t.historyResearch.timelineSupport
			.replace('{total}', $num(timeline.total))
			.replace('{undated}', $num(timeline.undated))}
	</p>
	{#if shown.length}
		<div
			class="chart"
			style:height={`${shown.length * 32 + 160}px`}
			role="img"
			aria-label={$t.historyResearch.timelineTitle}
		>
			<Chart chartId="newspaper-timeline" {init} {options} onclick={selectCell} />
		</div>
		<p class="note">{$t.historyResearch.timelineHint}</p>
		<div class="journal-buttons" role="group" aria-label={$t.historyResearch.filterNewspaper}>
			{#each shown as row (row.journal)}
				<button type="button" onclick={() => selectJournal(row.journal)}
					>{row.journal} ({$num(row.total)})</button
				>
			{/each}
		</div>
		<div class="pagination">
			<button
				type="button"
				disabled={page === 1}
				onclick={() => (viewOptionsState.newspaperPage = page - 1)}
				>{$t.historyResearch.previous}</button
			>
			<span aria-live="polite"
				>{$t.historyResearch.timelinePage
					.replace('{start}', $num((page - 1) * perPage + 1))
					.replace('{end}', $num(Math.min(page * perPage, rows.length)))
					.replace('{total}', $num(rows.length))}</span
			>
			<button
				type="button"
				disabled={page === pages}
				onclick={() => (viewOptionsState.newspaperPage = page + 1)}
				>{$t.historyResearch.next}</button
			>
		</div>
		<ChartDataTable
			caption={$t.historyResearch.timelineTitle}
			filenamePrefix="iwac-newspaper-timeline"
			columns={[
				{ label: $t.filters.journal },
				{ label: $t.historyResearch.period },
				{ label: $t.historyResearch.collected, format: 'integer' }
			]}
			rows={rows.flatMap((row) =>
				timeline.periods.map((period, i) => [row.journal, String(period), row.counts[i]])
			)}
		/>
	{:else}
		<p class="note">{$t.messages.noData}</p>
	{/if}
</section>

<style>
	.controls,
	.pagination,
	.journal-buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}
	.controls {
		margin-block: var(--space-4);
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}
	select,
	button {
		background: var(--surface-card);
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-sm);
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	button:hover:not(:disabled) {
		background: var(--surface-card-hover);
	}
	button:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.note {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		margin-block: var(--space-3);
	}
	.support,
	.pagination {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		margin-block: var(--space-4);
	}
	.pagination {
		justify-content: space-between;
	}
	.chart {
		min-width: 0;
		width: 100%;
	}
</style>
