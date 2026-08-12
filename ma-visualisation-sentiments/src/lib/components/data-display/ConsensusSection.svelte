<!--
  ConsensusSection Component

  The "all three models at once" half of the agreement view.

  Split out rather than appended to AgreementView for the reason ArbiterView was
  split into ArbiterStatsCards / ArbiterCoverage / ArbiterArticleTable: the
  parent was already 310 lines of pair-scoped markup, and five more charts would
  have put it near 700 — the shape AnalysisInfo.svelte is a warning about.

  Owns the declined-ratings setting because every chart below has to answer to
  the same one; the dimension comes from the parent's selector, which governs
  both scopes.
-->
<script lang="ts">
	import { consensusRows, consensusModels } from '$lib/stores';
	import { dec, num, pct } from '$lib/i18n/utils';
	import type { AgreementDimension } from '$lib/stores/agreement.svelte';
	import { profileDissent, usableValues } from '$lib/utils/consensus';
	import { t } from '$lib/i18n';
	import { StatCard, StatCardGrid, SectionHead } from '$lib/components/common';
	import ChartCard from '$lib/components/ui/ChartCard.svelte';
	import ChartTypeToggle from '$lib/components/viz/ChartTypeToggle.svelte';
	import {
		NewspaperDisagreementChart,
		DissentProfileChart,
		DirectionalDissentChart,
		LabelFlowChart,
		ConsensusScatterChart
	} from '$lib/components/viz';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import ShuffleIcon from '@lucide/svelte/icons/shuffle';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';

	interface ConsensusSectionProps {
		dimension: AgreementDimension;
	}

	let { dimension }: ConsensusSectionProps = $props();

	/**
	 * Declined ratings are out by default. A model answering "Non applicable"
	 * sits below the bottom of the scale, so counting it as a rating makes an
	 * abstention look like maximal disagreement — and it does so hardest on the
	 * titles whose articles are only marginally about Islam, which is a different
	 * finding wearing this one's clothes.
	 */
	let includeDeclined = $state(false);

	let declinedOptions = $derived([
		{ value: 'exclude', label: $t.agreement.declinedExclude, icon: EyeOffIcon },
		{ value: 'include', label: $t.agreement.declinedInclude, icon: EyeIcon }
	]);

	const rows = $derived(consensusRows.current);
	const models = $derived(consensusModels.current);

	const profile = $derived(profileDissent(rows, dimension, models.length, includeDeclined));

	/** Mean of (max − min) over the rows the current setting keeps. */
	const meanSpread = $derived.by(() => {
		const usable = usableValues(rows, dimension, includeDeclined);
		if (usable.length === 0) return Number.NaN;

		const total = usable.reduce(
			(sum, { values }) => sum + (Math.max(...values) - Math.min(...values)),
			0
		);
		return total / usable.length;
	});

	const majorityCount = $derived(profile.dissent.reduce((sum, entry) => sum + entry.total, 0));

	function share(count: number): string {
		return profile.n > 0 ? $pct(count / profile.n, 1) : '—';
	}
</script>

<SectionHead title={$t.agreement.consensusTitle} lede={$t.agreement.consensusLede} />

<div class="consensus-toolbar">
	<span class="toolbar-label">{$t.agreement.declinedToggle}</span>
	<ChartTypeToggle
		options={declinedOptions}
		value={includeDeclined ? 'include' : 'exclude'}
		onChange={(value) => (includeDeclined = value === 'include')}
		ariaLabel={$t.agreement.declinedToggle}
	/>
</div>

<p class="reading-note">
	{#if includeDeclined}
		{$t.agreement.declinedIncludedNote}
	{:else}
		{$t.agreement.declinedNote.replace('{count}', $num(profile.declinedExcluded))}
	{/if}
</p>

<StatCardGrid>
	<StatCard
		label={$t.agreement.unanimous}
		value={share(profile.unanimous)}
		detail="{$num(profile.n)} {$t.agreement.articlesCompared}"
		tooltip={$t.agreement.unanimousHelp}
		accent="positive"
	>
		{#snippet icon()}<UsersIcon size={20} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.agreement.majoritySplit}
		value={share(majorityCount)}
		tooltip={$t.agreement.majoritySplitHelp}
		accent="comparison"
	>
		{#snippet icon()}<UserMinusIcon size={20} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.agreement.allDiffer}
		value={share(profile.split)}
		tooltip={$t.agreement.allDifferHelp}
		accent="discrepancy"
	>
		{#snippet icon()}<ShuffleIcon size={20} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.agreement.meanSpread}
		value={Number.isNaN(meanSpread) ? '—' : $dec(meanSpread, 2)}
		tooltip={$t.agreement.meanSpreadHelp}
		accent="arbiter"
	>
		{#snippet icon()}<RulerIcon size={20} />{/snippet}
	</StatCard>
</StatCardGrid>

<ChartCard variant="comparison" class="mb-6">
	<DirectionalDissentChart {rows} {models} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<NewspaperDisagreementChart {rows} modelCount={models.length} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<DissentProfileChart {rows} {models} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<LabelFlowChart {rows} {models} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison">
	<ConsensusScatterChart {rows} modelCount={models.length} {dimension} {includeDeclined} />
</ChartCard>

<style>
	/* .toolbar-label is global chart chrome; this only positions the row. */
	.consensus-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

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
