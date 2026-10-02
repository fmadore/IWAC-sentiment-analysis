<script lang="ts">
	import { tick } from 'svelte';
	import { t } from '$lib/i18n';
	import { num, dec, pct } from '$lib/i18n/utils';
	import { datasetState } from '$lib/stores/datasets.svelte';
	import { analysisState } from '$lib/stores/analysis.svelte';
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import { modelPairAgreements } from '$lib/stores/agreement.svelte';
	import { datasetIdsOf, type ModelPair } from '$lib/domain/sentimentContract';
	import { getModelDisplayNames } from '$lib/utils/format';
	import { agreementMetricValue, type AgreementMetric } from '$lib/utils/agreementMetrics';
	import type { AgreementDimension } from '$lib/utils/agreementData';
	import SectionHead from '../common/SectionHead.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';

	let { dimension }: { dimension: AgreementDimension } = $props();
	const models = $derived(datasetIdsOf(datasetState.generation));
	const names = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));
	const pairs = $derived(modelPairAgreements.current?.[dimension] ?? []);
	const metric = $derived(viewOptionsState.agreementMetric);
	const metricLabels = $derived({
		exact: $t.agreement.exactAgreement,
		kappa: $t.agreement.kappa,
		weighted: $t.agreement.weightedKappa
	});
	const cells = $derived(
		models.map((a) =>
			models.map((b) => {
				const pair = pairs.find((entry) => entry.models.includes(a) && entry.models.includes(b));
				return a === b || !pair ? null : { ...agreementMetricValue(pair, metric), pair: pair.pair };
			})
		)
	);

	function formatValue(value: number): string {
		if (!Number.isFinite(value)) return '—';
		return metric === 'exact' ? $pct(value, 1) : $dec(value, 3);
	}
	async function openPair(pair: ModelPair) {
		datasetState.pair = pair;
		analysisState.scope = 'pair';
		await tick();
		document.getElementById('agreement-pair-detail')?.focus();
	}
</script>

<SectionHead title={$t.agreementResearch.overviewTitle} lede={$t.agreementResearch.overviewNote} />
<div class="chart-toolbar mb-4">
	<label class="toolbar-label" for="agreement-overview-metric">{$t.agreementResearch.metric}</label>
	<select
		id="agreement-overview-metric"
		class="select select-sm"
		value={metric}
		onchange={(event) =>
			(viewOptionsState.agreementMetric = event.currentTarget.value as AgreementMetric)}
	>
		{#each Object.entries(metricLabels) as [key, label] (key)}
			<option value={key}>{label}</option>
		{/each}
	</select>
</div>

<div class="matrix-wrap">
	<table class="model-matrix">
		<caption class="sr-only">{$t.agreementResearch.overviewTitle} — {metricLabels[metric]}</caption>
		<thead>
			<tr>
				<th scope="col">{$t.agreementResearch.models}</th>
				{#each names as name, index (models[index])}<th scope="col">{name}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each cells as row, i (models[i])}
				<tr>
					<th scope="row">{names[i]}</th>
					{#each row as cell, j (models[j])}
						<td>
							{#if cell}
								<button
									type="button"
									class="matrix-cell"
									style:--agreement-fill="{Number.isFinite(cell.value)
										? Math.max(0, cell.value) * 35
										: 0}%"
									aria-label="{$t.agreementResearch.openPair
										.replace('{modelA}', names[i])
										.replace('{modelB}', names[j])}: {metricLabels[metric]} {formatValue(
										cell.value
									)}, n = {$num(cell.n)}"
									onclick={() => openPair(cell.pair)}
								>
									<strong>{formatValue(cell.value)}</strong>
									<span>n = {$num(cell.n)}</span>
								</button>
							{:else}<span aria-hidden="true">—</span>{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
{#if metric === 'weighted'}
	<p class="chart-note">
		{dimension === 'polarity'
			? datasetState.generation === 'v1'
				? $t.agreementResearch.weightedLegacyNote
				: $t.agreementResearch.weightedApplicableNote
			: $t.agreementResearch.weightedAllNote}
	</p>
{/if}
<ChartDataTable
	columns={[
		{ label: $t.agreementResearch.pair },
		{ label: metricLabels[metric], format: metric === 'exact' ? 'percent' : 'decimal', digits: 3 },
		{ label: $t.agreementResearch.articles, format: 'integer' },
		{ label: $t.agreementResearch.method }
	]}
	rows={pairs.map((pair) => {
		const { value, n } = agreementMetricValue(pair, metric);
		return [
			pair.models.map((id) => names[models.indexOf(id)]).join(' / '),
			Number.isFinite(value) ? value : null,
			n,
			metric === 'weighted' ? pair.weightedMethod : 'categorical-v1'
		];
	})}
	caption={$t.agreementResearch.overviewTitle}
	filenamePrefix={`model-agreement-${datasetState.generation}-${dimension}-${metric}`}
/>

<style>
	.matrix-wrap {
		overflow-x: auto;
	}
	.model-matrix {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
		min-width: 40rem;
	}
	.model-matrix th {
		padding: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-align: left;
		overflow-wrap: anywhere;
	}
	.model-matrix td {
		padding: var(--space-1);
		text-align: center;
		border: 1px solid var(--border-subtle);
	}
	.matrix-cell {
		--agreement-fill: 0%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: var(--space-1);
		min-height: var(--size-control-lg);
		width: 100%;
		padding: var(--space-3) var(--space-2);
		border: 1px solid var(--border-subtle);
		background: color-mix(in oklab, var(--status-info) var(--agreement-fill), var(--surface-card));
		color: var(--text-primary);
		cursor: pointer;
		border-radius: var(--radius-panel);
	}
	.matrix-cell strong {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	.matrix-cell span {
		color: var(--text-secondary);
		font-size: var(--font-size-eyebrow);
	}
	.matrix-cell:hover {
		border-color: var(--border-hover);
	}
	.matrix-cell:focus-visible {
		box-shadow: var(--ring-focus);
	}
</style>
