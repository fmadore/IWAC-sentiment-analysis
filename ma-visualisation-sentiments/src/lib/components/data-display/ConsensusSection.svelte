<!--
  ConsensusSection Component

  The "whole panel at once" half of the agreement view.

  Split out rather than appended to AgreementView for the reason ArbiterView was
  split into ArbiterStatsCards / ArbiterCoverage / ArbiterArticleTable: the
  parent was already 310 lines of pair-scoped markup, and five more charts would
  have put it near 700 — the shape AnalysisInfo.svelte is a warning about.

  Nothing here counts the models: every chart takes `models` or `models.length`,
  so the section served a three-model panel, then a five-model one, and now
  a six-model one, unchanged.

  Owns the declined-ratings setting because every chart below has to answer to
  the same one; the dimension comes from the parent's selector, which governs
  both scopes.
-->
<script lang="ts">
	import { analysisState } from '#lib/stores/analysis.svelte.js';
	import { datasetState } from '#lib/stores/datasets.svelte.js';
	import { consensusRows, consensusModels } from '#lib/stores/index.js';
	import { panelFlags } from '#lib/stores/index.js';
	import { SIGNIFICANT_SPREAD_THRESHOLD } from '#lib/domain/sentimentContract.js';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import type { AgreementDimension } from '#lib/stores/index.js';
	import { AGREEMENT_DIMENSIONS } from '#lib/stores/index.js';
	import { profileDissent, usableValues } from '#lib/utils/consensus.js';
	import { t } from '#lib/i18n/index.js';
	import StatCard from '#lib/components/common/StatCard.svelte';
	import StatCardGrid from '#lib/components/common/StatCardGrid.svelte';
	import SectionHead from '#lib/components/common/SectionHead.svelte';
	import ChartCard from '#lib/components/ui/ChartCard.svelte';
	import ChartTypeToggle from '#lib/components/viz/ChartTypeToggle.svelte';
	import LabelPatternExplorer from '#lib/components/viz/LabelPatternExplorer.svelte';
	import NewspaperDisagreementChart from '#lib/components/viz/NewspaperDisagreementChart.svelte';
	import DissentProfileChart from '#lib/components/viz/DissentProfileChart.svelte';
	import DirectionalDissentChart from '#lib/components/viz/DirectionalDissentChart.svelte';
	import LabelFlowChart from '#lib/components/viz/LabelFlowChart.svelte';
	import ConsensusScatterChart from '#lib/components/viz/ConsensusScatterChart.svelte';
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
	let includeDeclined = $derived(analysisState.includeDeclined);

	let declinedOptions = $derived([
		{ value: 'exclude', label: $t.agreement.declinedExclude, icon: EyeOffIcon },
		{ value: 'include', label: $t.agreement.declinedInclude, icon: EyeIcon }
	]);

	const rows = $derived(consensusRows.current);
	const models = $derived(consensusModels.current);

	const profiles = $derived(
		AGREEMENT_DIMENSIONS.map((d) => profileDissent(rows, d, models.length, includeDeclined))
	);
	const profile = $derived(profiles[AGREEMENT_DIMENSIONS.indexOf(dimension)]);

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

	/*
	 * The reader-facing discrepancy flag, broken down by the dimension that
	 * tripped it. Counted live over the filtered rows; the flag rule and its
	 * contract key are untouched.
	 */
	const flags = $derived(panelFlags.current);
	const flagBars = $derived(
		flags
			? [
					{ key: 'polarity', label: $t.filters.polarity, count: flags.polarity },
					{ key: 'centrality', label: $t.filters.centrality, count: flags.centrality },
					{ key: 'subjectivity', label: $t.filters.subjectivity, count: flags.subjectivity },
					{
						key: 'subjectivity-only',
						label: $t.reliability.flagsSubjectivityOnly,
						count: flags.subjectivityOnly
					}
				]
			: []
	);

	const majorityCount = $derived(profile.dissent.reduce((sum, entry) => sum + entry.total, 0));

	function share(count: number): string {
		return profile.n > 0 ? $pct(count / profile.n, 1) : '—';
	}
</script>

<SectionHead title={$t.agreement.consensusTitle} lede={$t.agreement.consensusLede} />

{#if datasetState.generation === 'v2'}
	<p class="reading-note">{$t.agreementResearch.cohortNote}</p>
{/if}

<div class="consensus-toolbar">
	<span class="toolbar-label">{$t.agreement.declinedToggle}</span>
	<ChartTypeToggle
		options={declinedOptions}
		value={includeDeclined ? 'include' : 'exclude'}
		onChange={(value) => (analysisState.includeDeclined = value === 'include')}
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

{#if flags && flags.flagged > 0}
	<section class="flag-breakdown mb-6" aria-labelledby="panel-flags-title">
		<h3 id="panel-flags-title" class="flag-title">{$t.reliability.flagsTitle}</h3>
		<p class="chart-note">
			{$t.reliability.flagsLede.replace('{threshold}', $num(SIGNIFICANT_SPREAD_THRESHOLD))}
		</p>
		<p class="flag-total">
			<span class="flag-total-label">{$t.reliability.flagsFlagged}</span>
			<strong>{$num(flags.flagged)}</strong>
			<span>
				{$t.reliability.flagsDetail
					.replace('{count}', $num(flags.flagged))
					.replace('{total}', $num(flags.comparable))}
			</span>
		</p>
		<dl class="flag-bars" aria-label={$t.reliability.flagsBy}>
			{#each flagBars as bar (bar.key)}
				<div class="flag-bar" data-emphasis={bar.key === 'subjectivity-only'}>
					<dt>{bar.label}</dt>
					<dd>
						<span class="flag-track" aria-hidden="true"
							><span class="flag-fill" style:--progress={bar.count / flags.flagged}></span></span
						>
						<span class="flag-value">{$num(bar.count)} ({$pct(bar.count / flags.flagged, 1)})</span>
					</dd>
				</div>
			{/each}
		</dl>
		<p class="chart-note">{$t.reliability.flagsSubjectivityNote}</p>
	</section>
{/if}

<ChartCard variant="comparison" class="mb-6">
	<DirectionalDissentChart {profiles} {models} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<NewspaperDisagreementChart {rows} modelCount={models.length} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<DissentProfileChart {rows} {models} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<LabelPatternExplorer {rows} {models} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison" class="mb-6">
	<LabelFlowChart {rows} {models} {dimension} {includeDeclined} />
</ChartCard>

<ChartCard variant="comparison">
	<ConsensusScatterChart {rows} modelCount={models.length} {dimension} {includeDeclined} />
</ChartCard>

<style>
	.flag-breakdown {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-top: var(--space-6);
		padding: var(--pad-card);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
	}

	.flag-title {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.flag-total {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--gap-inline);
		color: var(--text-secondary);
	}

	.flag-total strong {
		font-family: var(--font-mono);
		font-size: var(--font-size-xl);
		color: var(--text-primary);
	}

	.flag-total-label,
	.flag-bar dt {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.flag-bars {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--gap-stack);
	}

	.flag-bar dd {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin: var(--space-1) 0 0;
	}

	.flag-track {
		display: block;
		height: var(--space-2);
		background: var(--surface-nested);
		overflow: hidden;
	}

	.flag-fill {
		--progress: 0;
		display: block;
		height: 100%;
		background: var(--status-info);
		transform: scaleX(var(--progress));
		transform-origin: left;
	}

	.flag-bar[data-emphasis='true'] .flag-fill {
		background: var(--status-caution);
	}

	.flag-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

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
