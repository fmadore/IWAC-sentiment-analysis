<!--
  ArbiterStatsCards Component
  
  Displays key statistics for arbiter evaluations as a grid of cards.
  Shows total evaluations, model preferences, and agreement rates.

  The lead is kept as a number and formatted only for display: it used to be
  the locale-formatted string itself, and `Number("12,3")` is NaN, so the lead
  line never rendered in French, the default language.
-->
<script lang="ts">
	import type { ArbiterStatistics } from '#lib/stores/index.js';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import { datasetState } from '#lib/stores/datasets.svelte.js';
	import ShareBar from '#lib/components/common/ShareBar.svelte';
	import StatCard from '#lib/components/common/StatCard.svelte';
	import { leadPoints } from '#lib/utils/arbiter.js';
	import { t } from '#lib/i18n/index.js';
	import { asset } from '$app/paths';
	import type { AssetPath } from '$app/types';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';

	interface ArbiterStatsCardsProps {
		stats: ArbiterStatistics;
		modelAName: string;
		modelBName: string;
	}

	let { stats, modelAName, modelBName }: ArbiterStatsCardsProps = $props();

	// Get model logo from datasets
	function getModelLogo(modelName: string): AssetPath | null {
		const dataset = datasetState.available.find((d) => d.name === modelName);
		return dataset?.logo ?? null;
	}

	function getModelColor(modelName: string): string | undefined {
		return datasetState.available.find((d) => d.name === modelName)?.color;
	}

	// Derived model logos
	const modelALogo = $derived(getModelLogo(modelAName));
	const modelBLogo = $derived(getModelLogo(modelBName));

	// Calculate who is winning overall
	const leadingModel = $derived(
		stats.modelAPreferred > stats.modelBPreferred
			? modelAName
			: stats.modelBPreferred > stats.modelAPreferred
				? modelBName
				: null
	);

	/** Percentage points between the two preference shares; numeric, formatted at render. */
	const lead = $derived(leadPoints(stats.modelAPercentage, stats.modelBPercentage));
</script>

<div class="stats-grid">
	<StatCard
		layout="inline"
		label={$t.arbiter.articlesEvaluated}
		value={$num(stats.totalEvaluated)}
		accent="neutral"
	>
		{#snippet icon()}<BarChart3Icon size={20} />{/snippet}
	</StatCard>

	<StatCard
		layout="inline"
		label="{modelAName} {$t.arbiter.preferred}"
		value={$num(stats.modelAPreferred)}
		detail={$pct(stats.modelAPercentage / 100, 1)}
		accent="neutral"
		iconAccent="positive"
	>
		{#snippet icon()}
			{#if modelALogo}<img src={asset(modelALogo)} alt={modelAName} />{/if}
		{/snippet}
	</StatCard>

	<StatCard
		layout="inline"
		label="{modelBName} {$t.arbiter.preferred}"
		value={$num(stats.modelBPreferred)}
		detail={$pct(stats.modelBPercentage / 100, 1)}
		accent="neutral"
		iconAccent="alternate"
	>
		{#snippet icon()}
			{#if modelBLogo}<img src={asset(modelBLogo)} alt={modelBName} />{/if}
		{/snippet}
	</StatCard>

	<StatCard
		layout="inline"
		label={$t.arbiter.bothEqual}
		value={$num(stats.bothEqual)}
		detail={$pct(stats.bothPercentage / 100, 1)}
		accent="neutral"
		iconAccent="arbiter"
	>
		{#snippet icon()}<ScaleIcon size={20} />{/snippet}
	</StatCard>

	<StatCard
		layout="inline"
		label={$t.arbiter.neitherAccurate}
		value={$num(stats.neitherAccurate)}
		detail={$pct(stats.neitherPercentage / 100, 1)}
		accent="neutral"
		iconAccent="muted"
	>
		{#snippet icon()}<CheckCircle2Icon size={20} />{/snippet}
	</StatCard>
</div>

<!-- Overall Lead Indicator -->
{#if leadingModel && lead > 1}
	{@const leadingLogo = getModelLogo(leadingModel)}
	<div class="lead-indicator mt-4">
		{#if leadingLogo}
			<img src={asset(leadingLogo)} alt="" class="lead-logo" />
		{/if}
		<span class="lead-text">
			{$t.arbiter.leadNote.replace('{model}', leadingModel).replace('{points}', $dec(lead, 1))}
		</span>
	</div>
{/if}

<!-- Head-to-Head Comparison Bar (based on overall_winner per article) -->
{#if stats.overallModelAWins + stats.overallModelBWins > 0}
	<div class="comparison-section mt-4">
		<div class="comparison-header">
			<span class="comparison-title">{$t.arbiter.headToHead}</span>
			<span class="comparison-subtitle">{$t.arbiter.excludingTies}</span>
		</div>
		<ShareBar
			label={$t.arbiter.headToHead}
			segments={[
				{
					key: 'model-a',
					label: `${modelAName} — ${$t.arbiter.wins}`,
					count: stats.overallModelAWins,
					color: getModelColor(modelAName)
				},
				{
					key: 'model-b',
					label: `${modelBName} — ${$t.arbiter.wins}`,
					count: stats.overallModelBWins,
					color: getModelColor(modelBName)
				}
			]}
		/>
	</div>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	.lead-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.lead-logo {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		object-fit: contain;
	}

	.lead-text {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
	}

	.comparison-section {
		padding: var(--pad-card-compact);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.comparison-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.comparison-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.comparison-subtitle {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		}

		.comparison-section {
			padding: var(--pad-card);
		}
	}
</style>
