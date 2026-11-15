<!--
  PanelReliabilitySection Component

  The panel-scope statistics of the agreement view: how reliable the whole
  panel is on each dimension, how much that depends on which models were
  chosen, and how far the models agree on whether an article is about Islam
  at all.

  Krippendorff's ordinal alpha is the headline for the current generation: it
  keeps every article at least two models rated, where Fleiss' kappa keeps only
  complete cases — and the current panel's complete cases are not a random
  subset (Qwen declines more where Islam is peripheral). Fleiss stays beside
  it, labelled as complete-case, with the cohort note directly under it rather
  than a section further down.

  The archive keeps Fleiss as its published statistic; alpha is shown there as
  an additional figure only.

  Nothing here counts the models: every table reads the generation's own list.
-->
<script lang="ts">
	import { datasetState } from '#lib/stores/datasets.svelte.js';
	import {
		panelAgreement,
		panelApplicability,
		panelLeaveOneOut,
		AGREEMENT_DIMENSIONS,
		type AgreementDimension,
		type PanelReliability
	} from '#lib/stores/index.js';
	import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
	import { getModelDisplayNames } from '#lib/utils/format.js';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import { t } from '#lib/i18n/index.js';
	import StatCard from '#lib/components/common/StatCard.svelte';
	import StatCardGrid from '#lib/components/common/StatCardGrid.svelte';
	import SectionHead from '#lib/components/common/SectionHead.svelte';
	import ChartCard from '#lib/components/ui/ChartCard.svelte';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import TargetIcon from '@lucide/svelte/icons/target';
	import ShuffleIcon from '@lucide/svelte/icons/shuffle';

	let {
		dimension,
		dimensionLabels
	}: { dimension: AgreementDimension; dimensionLabels: Record<AgreementDimension, string> } =
		$props();

	const panel = $derived(panelAgreement.current);
	const loo = $derived(panelLeaveOneOut.current);
	const applicability = $derived(panelApplicability.current);
	const isArchive = $derived(datasetState.generation === 'v1');
	const models = $derived(datasetIdsOf(datasetState.generation));
	const names = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));

	function nameOf(id: string): string {
		return names[models.indexOf(id as (typeof models)[number])] ?? id;
	}

	function formatStat(value: number): string {
		return Number.isFinite(value) ? $dec(value, 3) : '—';
	}

	/**
	 * Models whose absence materially changes the complete-case base: leaving
	 * one out grows Fleiss' n by more than one per cent. Read live from the
	 * leave-one-out rows, so no model is named in code.
	 */
	const MATERIAL_SHARE = 0.01;
	const materialMissing = $derived.by(() => {
		if (!panel || !loo) return [];
		return AGREEMENT_DIMENSIONS.flatMap((d) => {
			const base = panel[d].fleiss.n;
			return loo[d]
				.filter((row) => base > 0 && (row.reliability.fleiss.n - base) / base > MATERIAL_SHARE)
				.map((row) => ({ dimension: d, row }));
		});
	});

	const looRows = $derived<{ label: string; reliability: PanelReliability }[]>(
		panel && loo
			? [
					{ label: $t.reliability.looAll, reliability: panel[dimension] },
					...loo[dimension].map((row) => ({
						label: nameOf(row.leftOut),
						reliability: row.reliability
					}))
				]
			: []
	);
</script>

{#snippet alphaCards()}
	<StatCardGrid class="mb-4">
		{#each AGREEMENT_DIMENSIONS as d (d)}
			{@const result = panel?.[d]}
			{#if result}
				<StatCard
					label={dimensionLabels[d]}
					value={formatStat(result.ordinalAlpha.alpha)}
					detail={$t.reliability.alphaDetail.replace('{count}', $num(result.ordinalAlpha.units))}
					tooltip={$t.reliability.alphaHelp}
					accent="comparison"
					layout="inline"
				>
					{#snippet icon()}<ScaleIcon size={20} />{/snippet}
				</StatCard>
			{/if}
		{/each}
	</StatCardGrid>
{/snippet}

{#snippet fleissCards()}
	<StatCardGrid class="mb-4">
		{#each AGREEMENT_DIMENSIONS as d (d)}
			{@const result = panel?.[d]}
			{#if result}
				<StatCard
					label="{dimensionLabels[d]} · {$t.reliability.completeCaseTitle}"
					value={formatStat(result.fleiss.kappa)}
					detail={$t.reliability.fleissDetail.replace('{count}', $num(result.fleiss.n))}
					tooltip={$t.agreement.fleissHelp}
					accent="arbiter"
					layout="inline"
					preserveLabelCase
				>
					{#snippet icon()}<UsersIcon size={20} />{/snippet}
				</StatCard>
			{/if}
		{/each}
	</StatCardGrid>
	{#if !isArchive}
		<div class="reading-note mb-6">
			<p>{$t.agreementResearch.cohortNote}</p>
			{#each materialMissing as entry (`${entry.dimension}-${entry.row.leftOut}`)}
				<p>
					{dimensionLabels[entry.dimension]} — {$t.reliability.materialMissing
						.replace('{model}', nameOf(entry.row.leftOut))
						.replace('{value}', formatStat(entry.row.reliability.fleiss.kappa))
						.replace('{count}', $num(entry.row.reliability.fleiss.n))}
				</p>
			{/each}
		</div>
	{/if}
{/snippet}

{#if panel}
	<SectionHead title={$t.agreement.panelTitle} lede={$t.agreement.panelLede} />

	{#if isArchive}
		{@render fleissCards()}
		<p class="chart-note mb-4">{$t.reliability.archiveAlphaNote}</p>
		{@render alphaCards()}
	{:else}
		{@render alphaCards()}
		<p class="chart-note mb-4">{$t.reliability.alphaPolarityNote}</p>
		{@render fleissCards()}
	{/if}

	{#if looRows.length > 1}
		<ChartCard variant="comparison" class="mb-6">
			<SectionHead title={$t.reliability.looTitle} lede={$t.reliability.looNote} />
			<div class="table-scroll">
				<table class="table reliability-table">
					<caption class="sr-only">{$t.reliability.looTitle} — {dimensionLabels[dimension]}</caption
					>
					<thead>
						<tr>
							<th scope="col">{$t.reliability.looModel}</th>
							<th scope="col">{$t.reliability.ordinalAlpha}</th>
							<th scope="col">{$t.reliability.looArticles}</th>
							<th scope="col">{$t.reliability.nominalAlpha}</th>
							<th scope="col">{$t.reliability.looArticles}</th>
							<th scope="col">{$t.reliability.completeCaseTitle}</th>
							<th scope="col">{$t.reliability.looArticles}</th>
						</tr>
					</thead>
					<tbody>
						{#each looRows as row, index (row.label)}
							<tr data-baseline={index === 0}>
								<th scope="row">{row.label}</th>
								<td>{formatStat(row.reliability.ordinalAlpha.alpha)}</td>
								<td>{$num(row.reliability.ordinalAlpha.units)}</td>
								<td>{formatStat(row.reliability.nominalAlpha.alpha)}</td>
								<td>{$num(row.reliability.nominalAlpha.units)}</td>
								<td>{formatStat(row.reliability.fleiss.kappa)}</td>
								<td>{$num(row.reliability.fleiss.n)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</ChartCard>
	{/if}
{/if}

{#if applicability}
	<ChartCard variant="comparison" class="mb-6">
		<SectionHead
			title={$t.reliability.applicabilityTitle}
			lede={$t.reliability.applicabilityLede}
		/>
		<StatCardGrid class="mb-4">
			<StatCard
				label={$t.reliability.applicabilityAlpha}
				value={formatStat(applicability.alpha.alpha)}
				detail={$t.reliability.applicabilityAlphaDetail.replace(
					'{count}',
					$num(applicability.alpha.units)
				)}
				accent="comparison"
				preserveLabelCase
			>
				{#snippet icon()}<TargetIcon size={20} />{/snippet}
			</StatCard>
			<StatCard
				label={$t.reliability.applicabilityMixed}
				value={$num(applicability.mixed)}
				detail={$t.reliability.applicabilityMixedDetail
					.replace('{count}', $num(applicability.mixed))
					.replace('{total}', $num(applicability.rated))}
				accent="discrepancy"
			>
				{#snippet icon()}<ShuffleIcon size={20} />{/snippet}
			</StatCard>
			<StatCard
				label={$t.reliability.applicabilityAllAddressed}
				value={applicability.rated > 0
					? $pct(applicability.allAddressed / applicability.rated, 1)
					: '—'}
				detail={$t.reliability.applicabilityShareDetail.replace(
					'{total}',
					$num(applicability.rated)
				)}
				accent="positive"
			>
				{#snippet icon()}<UsersIcon size={20} />{/snippet}
			</StatCard>
			<StatCard
				label={$t.reliability.applicabilityAllNotAddressed}
				value={applicability.rated > 0
					? $pct(applicability.allNotAddressed / applicability.rated, 1)
					: '—'}
				detail={$t.reliability.applicabilityShareDetail.replace(
					'{total}',
					$num(applicability.rated)
				)}
				accent="muted"
			>
				{#snippet icon()}<UserMinusIcon size={20} />{/snippet}
			</StatCard>
		</StatCardGrid>

		<div class="table-pair">
			<div class="table-scroll">
				<table class="table reliability-table">
					<caption class="sr-only">{$t.reliability.applicabilityTitle}</caption>
					<thead>
						<tr>
							<th scope="col">{$t.agreementResearch.pair}</th>
							<th scope="col">{$t.agreement.kappa}</th>
							<th scope="col">{$t.reliability.applicabilityDisagreements}</th>
							<th scope="col">{$t.reliability.looArticles}</th>
						</tr>
					</thead>
					<tbody>
						{#each applicability.pairs as pair (pair.pair)}
							<tr>
								<th scope="row">{pair.models.map(nameOf).join(' / ')}</th>
								<td>{formatStat(pair.kappa.kappa)}</td>
								<td>{$num(pair.disagreements)}</td>
								<td>{$num(pair.kappa.n)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="table-scroll">
				<table class="table reliability-table">
					<caption class="sr-only">{$t.reliability.applicabilityModels}</caption>
					<thead>
						<tr>
							<th scope="col">{$t.agreementResearch.models}</th>
							<th scope="col">{$t.reliability.applicabilityAddressed}</th>
							<th scope="col">{$t.reliability.applicabilityNotAddressed}</th>
							<th scope="col">{$t.reliability.applicabilityMissing}</th>
						</tr>
					</thead>
					<tbody>
						{#each applicability.perModel as entry (entry.modelId)}
							<tr>
								<th scope="row">{nameOf(entry.modelId)}</th>
								<td>{$num(entry.addressed)}</td>
								<td>{$num(entry.notAddressed)}</td>
								<td>{$num(entry.missing)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</ChartCard>
{/if}

<style>
	.reading-note {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-subtle);
		border-left: 2px solid var(--accent);
	}

	.table-scroll {
		overflow-x: auto;
	}

	.table-pair {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--gap-stack);
	}

	@media (min-width: 1024px) {
		.table-pair {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		}
	}

	.reliability-table {
		width: 100%;
	}

	.reliability-table td {
		font-family: var(--font-mono);
		text-align: right;
	}

	.reliability-table tr[data-baseline='true'] th,
	.reliability-table tr[data-baseline='true'] td {
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}
</style>
