<!--
  AgreementView Component

  Answers the question the comparison view structurally cannot: not "how far
  apart are these two models on this article?" but "what is the relationship
  between these two models?"

  The comparison view's scalar discrepancy score cannot separate a systematic
  recalibration from genuine disagreement. On this corpus that distinction is
  the headline: ChatGPT and Mistral agree on centrality only 40% of the time,
  yet nearly all their disagreement is Mistral labelling exactly one notch
  lower — kappa 0.25, weighted kappa 0.73. A mean discrepancy of 1.48 points
  describes that as noise. The matrix and the two kappas describe it correctly.

  The view answers at two scopes, and the toggle is explicit rather than implied.
  It used to be pair-framed throughout — a ModelPairPicker in the header, every
  panel below it pair-scoped — and the three-way section that has since grown
  underneath would have left that picker visually governing charts it has no
  effect on. So the picker renders only in pair scope.
-->
<script lang="ts">
	import { datasetState, articleState } from '$lib/stores';
	import { dec, num, pct } from '$lib/i18n/utils';
	import {
		pairAgreement,
		threeWayAgreement,
		modelMarginals,
		AGREEMENT_DIMENSIONS,
		DIMENSION_CATEGORIES,
		type AgreementDimension
	} from '$lib/stores/agreement.svelte';
	import { interpretKappa } from '$lib/utils/agreement';
	import { getPairModelNames } from '$lib/types/data';
	import { datasetIdsOf } from '$lib/domain/sentimentContract';
	import { t } from '$lib/i18n';
	import { StatCard, StatCardGrid, SectionHead } from '$lib/components/common';
	import ModelPairPicker from '$lib/components/ui/ModelPairPicker.svelte';
	import { CountryFilter, JournalFilter } from '$lib/components/filters';
	import { AgreementMatrix, ModelCalibrationChart } from '$lib/components/viz';
	import ChartTypeToggle from '$lib/components/viz/ChartTypeToggle.svelte';
	import ConsensusSection from './ConsensusSection.svelte';
	import ChartCard from '$lib/components/ui/ChartCard.svelte';
	import LoadingState from '$lib/components/common/LoadingState.svelte';
	import TargetIcon from '@lucide/svelte/icons/target';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import UsersIcon from '@lucide/svelte/icons/users';
	import GitCompareIcon from '@lucide/svelte/icons/git-compare';
	import NetworkIcon from '@lucide/svelte/icons/network';

	let selectedDimension = $state<AgreementDimension>('polarity');
	let scope = $state<'pair' | 'trio'>('pair');

	const scopeOptions = $derived([
		{ value: 'pair', label: $t.agreement.scopePair, icon: GitCompareIcon },
		{ value: 'trio', label: $t.agreement.scopeTrio, icon: NetworkIcon }
	]);

	const agreement = $derived(pairAgreement.current);
	const threeWay = $derived(threeWayAgreement.current);
	const marginals = $derived(modelMarginals.current);
	const modelNames = $derived(
		getPairModelNames(datasetState.pair, datasetState.availableInGeneration)
	);

	const active = $derived(agreement?.[selectedDimension] ?? null);

	const dimensionLabels = $derived<Record<AgreementDimension, string>>({
		polarity: $t.filters.polarity,
		subjectivity: $t.filters.subjectivity,
		centrality: $t.filters.centrality
	});

	/** Every model of the active generation present? One alone says nothing. */
	const ready = $derived(
		datasetIdsOf(datasetState.generation).every(
			(id) => (articleState.datasets[id]?.length ?? 0) > 0
		) && agreement !== null
	);

	function formatKappa(value: number): string {
		return Number.isNaN(value) ? '—' : $dec(value, 3);
	}

	function formatPercent(value: number): string {
		return $pct(value, 1);
	}

	/** Landis & Koch band, translated; null when kappa is undefined. */
	function strengthLabel(kappa: number): string | undefined {
		const strength = interpretKappa(kappa);
		return strength ? $t.agreement.strength[strength] : undefined;
	}
</script>

{#if !ready}
	<LoadingState />
{:else if active}
	<!-- Dimension selector -->
	<div class="dimension-tabs" role="tablist" aria-label={$t.agreement.dimensionSelector}>
		{#each AGREEMENT_DIMENSIONS as dimension (dimension)}
			<button
				role="tab"
				class="dimension-tab"
				data-active={selectedDimension === dimension}
				aria-selected={selectedDimension === dimension}
				onclick={() => (selectedDimension = dimension)}
			>
				{dimensionLabels[dimension]}
			</button>
		{/each}

		<div class="scope-controls">
			<ChartTypeToggle
				options={scopeOptions}
				value={scope}
				onChange={(value) => (scope = value as 'pair' | 'trio')}
				ariaLabel={$t.agreement.scopeLabel}
			/>
			<!--
				Only in pair scope: a picker sitting above charts it cannot affect
				reads as a control that is broken.
			-->
			{#if scope === 'pair'}
				<ModelPairPicker />
			{/if}
		</div>
	</div>

	<!--
		Corpus-scope facets only. Polarity/subjectivity/centrality filters are
		deliberately absent: selecting articles BY the label under comparison
		would make every agreement statistic below circular.
	-->
	<div class="agreement-facets mb-6">
		<CountryFilter />
		<JournalFilter />
	</div>

	{#if scope === 'pair'}
		<!-- Headline statistics for the active dimension -->
		<StatCardGrid>
			<StatCard
				label={$t.agreement.exactAgreement}
				value={formatPercent(active.matrix.exactAgreement)}
				detail="{$num(active.matrix.n)} {$t.agreement.articlesCompared}"
				tooltip={$t.agreement.exactAgreementHelp}
				accent="comparison"
			>
				{#snippet icon()}<TargetIcon size={20} />{/snippet}
			</StatCard>

			<StatCard
				label={$t.agreement.adjacentAgreement}
				value={formatPercent(active.matrix.adjacentAgreement)}
				detail={$t.agreement.adjacentDetail}
				tooltip={$t.agreement.adjacentAgreementHelp}
				accent="comparison"
			>
				{#snippet icon()}<LayersIcon size={20} />{/snippet}
			</StatCard>

			<StatCard
				label={$t.agreement.kappa}
				value={formatKappa(active.kappa.kappa)}
				detail={strengthLabel(active.kappa.kappa)}
				tooltip={$t.agreement.kappaHelp}
				accent="arbiter"
				preserveLabelCase
			>
				{#snippet icon()}<ScaleIcon size={20} />{/snippet}
			</StatCard>

			<StatCard
				label={$t.agreement.weightedKappa}
				value={formatKappa(active.weightedKappa.kappa)}
				detail={strengthLabel(active.weightedKappa.kappa)}
				tooltip={$t.agreement.weightedKappaHelp}
				accent="arbiter"
				preserveLabelCase
			>
				{#snippet icon()}<ScaleIcon size={20} />{/snippet}
			</StatCard>
		</StatCardGrid>

		<!--
		The gap between the two kappas IS the finding when it is large, so say so
		in words rather than leaving the reader to notice two numbers differ.
	-->
		{#if !Number.isNaN(active.kappa.kappa) && !Number.isNaN(active.weightedKappa.kappa)}
			{@const gap = active.weightedKappa.kappa - active.kappa.kappa}
			{#if gap >= 0.2}
				<p class="reading-note">
					{$t.agreement.systematicOffsetNote
						.replace('{modelA}', modelNames.modelAName)
						.replace('{modelB}', modelNames.modelBName)}
				</p>
			{/if}
		{/if}

		<ChartCard variant="comparison">
			<AgreementMatrix
				matrix={active.matrix}
				dimension={selectedDimension}
				modelAName={modelNames.modelAName}
				modelBName={modelNames.modelBName}
			/>
		</ChartCard>
	{:else}
		<!--
			Trio scope. The Fleiss cards and the calibration chart were already
			three-way, so they move here rather than being rebuilt — this is where
			they always belonged.
		-->
		{#if threeWay}
			<SectionHead title={$t.agreement.threeWayTitle} lede={$t.agreement.threeWayLede} />

			<StatCardGrid class="mb-6">
				{#each AGREEMENT_DIMENSIONS as dimension (dimension)}
					{@const result = threeWay[dimension]}
					<StatCard
						label={dimensionLabels[dimension]}
						value={formatKappa(result.kappa)}
						detail="{$t.agreement.fleissKappa} · {$num(result.n)} {$t.common.articles}"
						tooltip={$t.agreement.fleissHelp}
						accent="arbiter"
						layout="inline"
					>
						{#snippet icon()}<UsersIcon size={20} />{/snippet}
					</StatCard>
				{/each}
			</StatCardGrid>
		{/if}

		{#if marginals}
			<ChartCard variant="comparison" class="mb-6">
				<ModelCalibrationChart
					marginals={marginals[selectedDimension]}
					dimension={selectedDimension}
					categories={DIMENSION_CATEGORIES[selectedDimension]}
				/>
			</ChartCard>
		{/if}

		<ConsensusSection dimension={selectedDimension} />
	{/if}
{/if}

<style>
	.dimension-tabs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
	}

	.dimension-tab {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		padding: var(--space-2) var(--space-4);
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border-subtle);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.dimension-tab:hover:not([data-active='true']) {
		color: var(--text-primary);
		background: var(--surface-hover);
	}

	.dimension-tab[data-active='true'] {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in oklab, var(--accent) 40%, transparent);
	}

	/* Scope toggle and, in pair scope, the picker it governs. */
	.scope-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-left: 0;
		width: 100%;
	}

	@media (min-width: 640px) {
		.scope-controls {
			margin-left: auto;
			width: auto;
		}
	}

	.agreement-facets {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	@media (min-width: 1024px) {
		.agreement-facets {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Plain-language reading of the two kappas when they diverge sharply. */
	.reading-note {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-5);
		background: var(--surface-subtle);
		border-left: 2px solid var(--accent);
	}
</style>
