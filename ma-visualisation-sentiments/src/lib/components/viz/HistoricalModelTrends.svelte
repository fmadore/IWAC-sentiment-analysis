<script lang="ts">
	import type { EChartsOption, LineSeriesOption } from 'echarts';
	import { articleState } from '$lib/stores/articles.svelte';
	import { datasetState } from '$lib/stores/datasets.svelte';
	import { filterState } from '$lib/stores/filters.svelte';
	import { VIEW_OPTIONS, viewOptionsState } from '$lib/stores/view-options.svelte';
	import { datasetIdsOf } from '$lib/domain/sentimentContract';
	import { datasetReadiness } from '$lib/utils/datasetReadiness';
	import { historicalTrends, type HistoricalGroup } from '$lib/utils/researchTimeline';
	import { init } from '$lib/utils/echartsSetup';
	import { t } from '$lib/i18n';
	import { num, pct } from '$lib/i18n/utils';
	import {
		chartColors,
		seriesColorPalette,
		getAxisLabelStyle,
		getAxisLineStyle,
		getShareYAxis,
		getLegendConfig,
		getTooltipConfig
	} from '$lib/utils/chartTheme';
	import Chart from './CitableChart.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';
	import DatasetLoadError from '../common/DatasetLoadError.svelte';
	import LoadingState from '../common/LoadingState.svelte';

	const PAGE_SIZE = 6;
	const symbols = ['circle', 'rect', 'triangle', 'diamond', 'pin'];
	const dashes = ['solid', 'dashed', 'dotted'] as const;
	const modelIds = $derived(datasetIdsOf(datasetState.generation));
	const models = $derived(
		modelIds.map((id, index) => ({
			id,
			name: datasetState.getById(id)?.name ?? id,
			color:
				datasetState.getById(id)?.color ?? seriesColorPalette[index % seriesColorPalette.length]
		}))
	);
	const readiness = $derived(datasetReadiness(modelIds, articleState.loadStates));
	const result = $derived(
		historicalTrends(articleState.datasets, modelIds, {
			countries: filterState.countries,
			journals: filterState.journals,
			measure: viewOptionsState.historyMeasure,
			period: viewOptionsState.historyPeriod,
			facet: viewOptionsState.historyFacet,
			cohort: viewOptionsState.historyCohort,
			minimumCount: viewOptionsState.historyMinCount
		})
	);
	const pages = $derived(Math.max(1, Math.ceil(result.groups.length / PAGE_SIZE)));
	// Keep a restored URL page until data arrives; presentation clamps only once ready.
	const page = $derived(Math.max(1, Math.min(viewOptionsState.historyPage, pages)));
	const visibleGroups = $derived(result.groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
	const measureLabel = $derived($t.historyResearch[viewOptionsState.historyMeasure]);
	const support = $derived(
		$t.historyResearch.support
			.replace('{common}', $num(result.common))
			.replace('{total}', $num(result.collected))
			.replace('{undated}', $num(result.undated))
	);

	function resetPage() {
		// Event-driven: URL restoration must not be reset by a reactive effect.
		viewOptionsState.historyPage = 1;
	}

	function setMinimum(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const parsed = VIEW_OPTIONS.historyMinCount.parse(input.value);
		if (parsed !== undefined) {
			viewOptionsState.historyMinCount = parsed;
			resetPage();
		} else {
			input.value = String(viewOptionsState.historyMinCount);
		}
	}

	function groupName(group: HistoricalGroup): string {
		return viewOptionsState.historyFacet === 'all'
			? $t.historyResearch.all
			: group.key || $t.historyResearch.unknown;
	}

	function periodLabel(period: number): string {
		return viewOptionsState.historyPeriod === 'decade' ? `${period}–${period + 9}` : String(period);
	}

	function chartId(group: HistoricalGroup): string {
		// URL chart keys admit only short lowercase ASCII identifiers. Hash the
		// source name so accents, punctuation and re-sorting cannot break citations.
		let hash = 2166136261;
		for (let index = 0; index < group.key.length; index++) {
			hash = Math.imul(hash ^ group.key.charCodeAt(index), 16777619) >>> 0;
		}
		return `history-${datasetState.generation}-${viewOptionsState.historyFacet}-${hash.toString(36)}`;
	}

	function chartOptions(group: HistoricalGroup): EChartsOption {
		const series: LineSeriesOption[] = [
			{
				id: 'range-base',
				type: 'line',
				stack: 'model-range',
				data: group.buckets.map((bucket) =>
					bucket.minimum === null ? null : bucket.minimum * 100
				),
				symbol: 'none',
				lineStyle: { opacity: 0 },
				areaStyle: { opacity: 0 },
				silent: true,
				tooltip: { show: false },
				z: 1
			},
			{
				id: 'range-width',
				type: 'line',
				stack: 'model-range',
				data: group.buckets.map((bucket) =>
					bucket.minimum === null || bucket.maximum === null
						? null
						: (bucket.maximum - bucket.minimum) * 100
				),
				symbol: 'none',
				lineStyle: { opacity: 0 },
				areaStyle: { color: chartColors.text.muted, opacity: 0.12 },
				silent: true,
				tooltip: { show: false },
				z: 1
			},
			...models.map((model, index): LineSeriesOption => ({
				id: model.id,
				name: model.name,
				type: 'line',
				data: group.buckets.map((bucket) =>
					bucket.shares[index] === null ? null : bucket.shares[index]! * 100
				),
				connectNulls: false,
				smooth: false,
				symbol: symbols[index % symbols.length],
				symbolSize: 6,
				showSymbol: true,
				lineStyle: { color: model.color, width: 2, type: dashes[index % dashes.length] },
				itemStyle: { color: model.color },
				emphasis: { focus: 'series' },
				z: 3
			}))
		];
		return {
			animation: false,
			backgroundColor: 'transparent',
			legend: { ...getLegendConfig(true), data: models.map((model) => model.name), bottom: 0 },
			grid: { top: 12, bottom: 60, left: 8, right: 10, containLabel: true },
			xAxis: {
				type: 'category',
				data: group.buckets.map((bucket) => periodLabel(bucket.period)),
				axisLine: getAxisLineStyle(),
				axisLabel: { ...getAxisLabelStyle(true), hideOverlap: true },
				boundaryGap: false
			},
			yAxis: getShareYAxis(true),
			tooltip: {
				...getTooltipConfig(true),
				trigger: 'axis',
				renderMode: 'richText',
				confine: true,
				formatter: (raw: unknown) => {
					const entries = Array.isArray(raw) ? raw : [raw];
					const index = (entries[0] as { dataIndex?: number })?.dataIndex;
					const bucket = index === undefined ? undefined : group.buckets[index];
					if (!bucket) return '';
					return [
						periodLabel(bucket.period),
						`${$t.historyResearch.collected}: ${$num(bucket.collected)}`,
						...models.map(
							(model, i) =>
								`${model.name}: ${bucket.shares[i] === null ? '—' : $pct(bucket.shares[i]!, 1)} (${$num(bucket.target[i])}/${$num(bucket.n[i])})`
						),
						`${$t.historyResearch.range}: ${bucket.minimum === null || bucket.maximum === null ? '—' : `${$pct(bucket.minimum, 1)}–${$pct(bucket.maximum, 1)}`}`
					].join('\n');
				}
			},
			series
		};
	}

	function dataRows(group: HistoricalGroup): Array<Array<string | number | null>> {
		return group.buckets.flatMap((bucket) =>
			models.map((model, index) => [
				periodLabel(bucket.period),
				model.name,
				bucket.collected,
				bucket.n[index],
				bucket.target[index],
				bucket.shares[index],
				bucket.minimum,
				bucket.maximum
			])
		);
	}
</script>

<section class="historical-trends" aria-labelledby="historical-trends-title">
	<header class="history-header">
		<h2 id="historical-trends-title">{$t.historyResearch.title}</h2>
		<p>{$t.historyResearch.intro}</p>
		<p class="method-note">{$t.historyResearch.corpusFilters}</p>
	</header>

	<div class="history-controls">
		<label>
			<span>{$t.historyResearch.measure}</span>
			<select class="select-sm" bind:value={viewOptionsState.historyMeasure} onchange={resetPage}>
				<option value="negative">{$t.historyResearch.negative}</option>
				<option value="central">{$t.historyResearch.central}</option>
				<option value="subjective">{$t.historyResearch.subjective}</option>
			</select>
		</label>
		<label>
			<span>{$t.historyResearch.period}</span>
			<select class="select-sm" bind:value={viewOptionsState.historyPeriod} onchange={resetPage}>
				<option value="year">{$t.historyResearch.year}</option>
				<option value="decade">{$t.historyResearch.decade}</option>
			</select>
		</label>
		<label>
			<span>{$t.historyResearch.facet}</span>
			<select class="select-sm" bind:value={viewOptionsState.historyFacet} onchange={resetPage}>
				<option value="all">{$t.historyResearch.all}</option>
				<option value="country">{$t.historyResearch.country}</option>
				<option value="journal">{$t.historyResearch.journal}</option>
			</select>
		</label>
		<label class="cohort-control">
			<span>{$t.historyResearch.cohort}</span>
			<select class="select-sm" bind:value={viewOptionsState.historyCohort} onchange={resetPage}>
				<option value="common">{$t.historyResearch.common}</option>
				<option value="available">{$t.historyResearch.available}</option>
			</select>
		</label>
		<label>
			<span>{$t.historyResearch.minimum}</span>
			<input
				class="minimum-input"
				type="number"
				min="1"
				max="1000"
				step="1"
				value={viewOptionsState.historyMinCount}
				onchange={setMinimum}
			/>
		</label>
	</div>

	<p class="method-note">
		{viewOptionsState.historyCohort === 'common'
			? $t.historyResearch.commonNote
			: $t.historyResearch.availableNote}
	</p>
	<p class="method-note">{$t.historyResearch.minimumNote}</p>
	<p class="method-note">{$t.historyResearch.rangeBandNote}</p>

	{#if readiness.failed.length > 0}
		<DatasetLoadError ids={readiness.failed} />
	{:else if !readiness.ready}
		<LoadingState />
	{:else}
		<p class="support-note">{support}</p>
		{#if result.groups.length === 0}
			<p class="chart-empty">{$t.table.noFilteredArticles}</p>
		{:else}
			{#if pages > 1}
				<nav class="panel-pagination" aria-label={$t.historyResearch.facet}>
					<button
						class="page-button"
						disabled={page === 1}
						onclick={() => (viewOptionsState.historyPage = page - 1)}
						>{$t.historyResearch.previous}</button
					>
					<span aria-live="polite"
						>{$t.historyResearch.page
							.replace('{page}', $num(page))
							.replace('{pages}', $num(pages))}</span
					>
					<button
						class="page-button"
						disabled={page === pages}
						onclick={() => (viewOptionsState.historyPage = page + 1)}
						>{$t.historyResearch.next}</button
					>
				</nav>
			{/if}
			<div class="history-panels" data-faceted={viewOptionsState.historyFacet !== 'all'}>
				{#each visibleGroups as group (group.key)}
					<article class="history-panel">
						<h3>{groupName(group)}</h3>
						<p class="panel-count">{$t.historyResearch.collected}: {$num(group.collected)}</p>
						<div
							class="history-chart"
							role="img"
							aria-label={`${groupName(group)} — ${measureLabel}`}
						>
							<Chart chartId={chartId(group)} {init} options={chartOptions(group)} />
						</div>
						<ChartDataTable
							columns={[
								{ label: $t.historyResearch.period },
								{ label: $t.historyResearch.model },
								{ label: $t.historyResearch.collected, format: 'integer' },
								{ label: $t.historyResearch.rated, format: 'integer' },
								{ label: $t.historyResearch.target, format: 'integer' },
								{ label: `${$t.historyResearch.share} (%)`, format: 'percent' },
								{ label: `${$t.historyResearch.minimumShare} (%)`, format: 'percent' },
								{ label: `${$t.historyResearch.maximumShare} (%)`, format: 'percent' }
							]}
							rows={dataRows(group)}
							caption={`${$t.historyResearch.title} — ${groupName(group)} — ${measureLabel}`}
							filenamePrefix={`${chartId(group)}-${viewOptionsState.historyMeasure}-${viewOptionsState.historyCohort}`}
						/>
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</section>

<style>
	.historical-trends {
		min-width: 0;
	}
	.history-header {
		margin-bottom: var(--space-5);
	}
	.history-header h2 {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-3);
	}
	.history-header p {
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
		margin: 0 0 var(--space-3);
		max-width: var(--prose-width);
	}
	.history-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
		align-items: end;
	}
	.history-controls label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
		min-width: 0;
		max-width: 100%;
	}
	.history-controls label > span {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}
	.history-controls select {
		max-width: 100%;
		min-width: 0;
	}
	.cohort-control {
		flex: 1 1 20rem;
	}
	.minimum-input {
		width: 7rem;
		min-height: var(--size-control-lg);
		padding: var(--space-2) var(--space-3);
		background: var(--surface-muted);
		color: var(--text-primary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
		font: inherit;
	}
	.minimum-input:focus-visible,
	.page-button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.method-note {
		margin: var(--space-2) 0;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
	}
	.support-note {
		border-top: 1px dashed var(--border-subtle);
		padding-top: var(--space-3);
		margin: var(--space-4) 0;
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}
	.history-panels {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-5);
	}
	.history-panels[data-faceted='true'] {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--width-chart-min)), 1fr));
	}
	.history-panel {
		min-width: 0;
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-subtle);
	}
	.history-panel h3 {
		margin: 0 0 var(--space-1);
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}
	.panel-count {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin: 0 0 var(--space-3);
	}
	.history-chart {
		height: 340px;
		min-width: 0;
		width: 100%;
	}
	.panel-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin: var(--space-4) 0;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}
	.page-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--size-control-lg);
		padding: var(--space-2) var(--space-3);
		background: var(--surface-subtle);
		color: var(--text-primary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-panel);
		font: inherit;
		cursor: pointer;
	}
	.page-button:hover:not(:disabled) {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}
	.page-button:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
