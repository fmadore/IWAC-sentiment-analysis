<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { comparisonState, arbiterStatistics, datasetState } from '#lib/stores/index.js';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import { getPairModelNames } from '#lib/types/data.js';
	import { t } from '#lib/i18n/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import DiffIcon from '@lucide/svelte/icons/diff';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
	import StatCard from '../common/StatCard.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

	const stats = $derived(comparisonState.statistics);
	const arbiterStats = $derived(arbiterStatistics.current);

	// Get dynamic model names from current comparison pair
	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	// Create dynamic tooltip text with actual model names
	const dynamicTooltips = $derived.by(() => {
		const { modelAName, modelBName } = modelNames;
		return {
			totalDiscrepancies: $t.audit.differentHelp
				.replace('{a}', modelAName)
				.replace('{b}', modelBName),
			significantDifferences: $t.audit.significantHelp
				.replace('{a}', modelAName)
				.replace('{b}', modelBName)
		};
	});

	type BarRow = { variant: string; label: string; count: number; share: number };

	function rows(entries: Omit<BarRow, 'share'>[], total: number): BarRow[] {
		return entries.map((entry) => ({ ...entry, share: total > 0 ? entry.count / total : 0 }));
	}

	const breakdownRows = $derived(
		rows(
			[
				{ variant: 'polarity', label: $t.comparison.polarity, count: stats.polarityConflicts },
				{
					variant: 'subjectivity',
					label: $t.comparison.subjectivity,
					count: stats.subjectivityConflicts
				},
				{ variant: 'centrality', label: $t.comparison.centrality, count: stats.centralityConflicts }
			],
			stats.totalArticles
		)
	);

	/*
	 * Which dimension made each sharp disagreement sharp, counted live. The flag
	 * rule is unchanged; subjectivity alone accounts for much of it.
	 */
	const conflictRows = $derived(
		rows(
			[
				{
					variant: 'polarity',
					label: $t.comparison.polarity,
					count: stats.highConflictBy.polarity
				},
				{
					variant: 'subjectivity',
					label: $t.comparison.subjectivity,
					count: stats.highConflictBy.subjectivity
				},
				{
					variant: 'centrality',
					label: $t.comparison.centrality,
					count: stats.highConflictBy.centrality
				},
				{
					variant: 'subjectivity-only',
					label: $t.reliability.flagsSubjectivityOnly,
					count: stats.highConflictBy.subjectivityOnly
				}
			],
			stats.highConflictArticles
		)
	);

	const arbiterRows = $derived<BarRow[]>([
		{
			variant: 'model-a',
			label: `${arbiterStats.modelAName} ${$t.arbiter.preferred}`,
			count: arbiterStats.modelAPreferred,
			share: arbiterStats.modelAPercentage / 100
		},
		{
			variant: 'model-b',
			label: `${arbiterStats.modelBName} ${$t.arbiter.preferred}`,
			count: arbiterStats.modelBPreferred,
			share: arbiterStats.modelBPercentage / 100
		},
		{
			variant: 'equal',
			label: $t.arbiter.bothEqual,
			count: arbiterStats.bothEqual,
			share: arbiterStats.bothPercentage / 100
		},
		{
			variant: 'neither',
			label: $t.arbiter.neitherAccurate,
			count: arbiterStats.neitherAccurate,
			share: arbiterStats.neitherPercentage / 100
		}
	]);
</script>

{#snippet breakdownBar(row: BarRow)}
	<div class="breakdown-item">
		<div class="breakdown-bar" style:--progress={row.share}>
			<div class="breakdown-fill" data-variant={row.variant}></div>
		</div>
		<div class="breakdown-info">
			<span class="breakdown-label">{row.label}</span>
			<span class="breakdown-value">{$num(row.count)} ({$pct(row.share, 1)})</span>
		</div>
	</div>
{/snippet}

{#snippet arbiterBar(row: BarRow)}
	<div class="arbiter-stat">
		<div class="arbiter-stat-bar" style:--progress={row.share}>
			<div class="arbiter-stat-fill" data-variant={row.variant}></div>
		</div>
		<div class="arbiter-stat-info">
			<span class="arbiter-stat-label">{row.label}</span>
			<span class="arbiter-stat-value">{$num(row.count)} ({$pct(row.share, 1)})</span>
		</div>
	</div>
{/snippet}

{#snippet averageHelp()}
	<p class="tooltip-text">{$t.comparison.averageDiscrepancyExplanation}</p>
	<p class="tooltip-text">{$t.reliability.totalDifferenceCaveat}</p>
{/snippet}

<div class="stats-grid">
	<StatCard
		label={$t.comparison.totalArticles}
		value={$num(stats.totalArticles)}
		detail={$t.comparison.articlesAnalyzed}
		accent="comparison"
		iconAccent="accent"
	>
		{#snippet icon()}<GitCompareArrowsIcon size={24} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.comparison.totalDiscrepancies}
		value={$num(stats.totalDiscrepancies)}
		detail={$t.comparison.articlesWithDifferences}
		tooltip={dynamicTooltips.totalDiscrepancies}
		tooltipLabel={dynamicTooltips.totalDiscrepancies}
		accent="discrepancy"
	>
		{#snippet icon()}<DiffIcon size={24} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.comparison.averageDiscrepancy}
		value={$dec(stats.averageDiscrepancy, 2)}
		detail={$t.comparison.pointsPerArticle}
		tooltip={averageHelp}
		tooltipLabel="{$t.comparison.averageDiscrepancyExplanation} {$t.reliability
			.totalDifferenceCaveat}"
		accent="neutral"
		iconAccent="positive"
	>
		{#snippet icon()}<TrendingUpIcon size={24} />{/snippet}
	</StatCard>

	<StatCard
		label={$t.comparison.highConflicts}
		value={$num(stats.highConflictArticles)}
		detail={$t.comparison.significantDifferences}
		tooltip={dynamicTooltips.significantDifferences}
		tooltipLabel={dynamicTooltips.significantDifferences}
		accent="accent"
	>
		{#snippet icon()}<BarChart3Icon size={24} />{/snippet}
	</StatCard>
</div>

<!-- Breakdown by dimension -->
<div class="breakdown-section comparison-breakdown mt-6">
	<h4 class="mb-3 breakdown-title">
		{$t.comparison.breakdownByDimension}
	</h4>

	<div class="breakdown-grid">
		{#each breakdownRows as row (row.variant)}{@render breakdownBar(row)}{/each}
	</div>

	{#if stats.highConflictArticles > 0}
		<h4 class="mt-6 mb-3 breakdown-title">{$t.reliability.conflictBreakdownTitle}</h4>
		<div class="breakdown-grid">
			{#each conflictRows as row (row.variant)}{@render breakdownBar(row)}{/each}
		</div>
		<p class="chart-note mt-3">{$t.reliability.flagsSubjectivityNote}</p>
	{/if}
</div>

<!-- Arbiter Summary Section -->
{#if arbiterStats.totalEvaluated > 0}
	<div class="arbiter-section mt-6">
		<button
			class="arbiter-header"
			onclick={() => (viewOptionsState.arbiterSummary = !viewOptionsState.arbiterSummary)}
			aria-expanded={viewOptionsState.arbiterSummary}
		>
			<div class="arbiter-header-content">
				<span class="arbiter-glyph"><GavelIcon size={20} /></span>
				<h4 class="arbiter-summary-title">
					{$t.arbiter.summaryTitle}
				</h4>
				<span class="badge badge-count"
					>{$num(arbiterStats.totalEvaluated)}
					{$t.arbiter.articlesEvaluated}</span
				>
			</div>
			{#if viewOptionsState.arbiterSummary}
				<span class="toggle-chevron"><ChevronUpIcon size={20} /></span>
			{:else}
				<span class="toggle-chevron"><ChevronDownIcon size={20} /></span>
			{/if}
		</button>

		{#if viewOptionsState.arbiterSummary}
			<div class="arbiter-content">
				<div class="arbiter-stats-grid">
					{#each arbiterRows as row (row.variant)}{@render arbiterBar(row)}{/each}
				</div>

				<p class="arbiter-note">
					<InfoIcon size={14} class="inline-block mr-1" />
					{$t.arbiter.blindEvaluationNote}
				</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.tooltip-text {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
	}

	.tooltip-text:last-child {
		margin-bottom: 0;
	}

	.breakdown-section {
		background: var(--surface-card);
		padding: var(--space-4);
		border: 1px solid var(--border-subtle);
	}

	.comparison-breakdown {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.breakdown-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.breakdown-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.breakdown-bar {
		position: relative;
		height: 6px;
		background: var(--surface-subtle);
		overflow: hidden;
	}

	.breakdown-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		transform: scaleX(var(--progress));
		transform-origin: left center;
		transition: transform var(--timing-slow) var(--easing-default);
	}

	.breakdown-fill[data-variant='polarity'] {
		background: var(--sentiment-polarity-neutral);
	}

	.breakdown-fill[data-variant='subjectivity'] {
		background: var(--sentiment-subjectivity-3);
	}

	.breakdown-fill[data-variant='centrality'] {
		background: var(--sentiment-centrality-very-central);
	}

	.breakdown-fill[data-variant='subjectivity-only'] {
		background: var(--status-caution);
	}

	.breakdown-info {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.breakdown-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.breakdown-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		}

		.breakdown-section {
			padding: var(--space-6);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.breakdown-fill,
		.arbiter-stat-fill {
			transition: none;
		}
	}

	.arbiter-section {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--color-warning-500);
		overflow: hidden;
	}

	.arbiter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-3-5) var(--space-4);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.arbiter-header:hover {
		background: var(--surface-muted);
	}

	.arbiter-header-content {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	@media (min-width: 640px) {
		.arbiter-header-content {
			flex-wrap: nowrap;
			gap: var(--space-3);
		}
	}

	.arbiter-content {
		padding: 0 var(--space-4) var(--space-4);
		border-top: 1px solid var(--border-subtle);
	}

	.arbiter-stats-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-top: var(--space-4);
	}

	.arbiter-stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.arbiter-stat-bar {
		position: relative;
		height: 6px;
		background: var(--surface-subtle);
		overflow: hidden;
	}

	.arbiter-stat-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		transform: scaleX(var(--progress));
		transform-origin: left center;
		transition: transform var(--timing-slow) var(--easing-default);
	}

	.arbiter-stat-fill[data-variant='model-a'] {
		background: var(--sentiment-polarity-very-positive);
	}

	.arbiter-stat-fill[data-variant='model-b'] {
		background: var(--sentiment-comparison-light);
	}

	.arbiter-stat-fill[data-variant='equal'] {
		background: var(--sentiment-arbiter);
	}

	.arbiter-stat-fill[data-variant='neither'] {
		background: var(--sentiment-polarity-na);
	}

	.arbiter-stat-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.arbiter-stat-label {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.arbiter-stat-value {
		font-size: var(--font-size-base);
		color: var(--text-muted);
	}

	.arbiter-note {
		margin-top: var(--space-5);
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		background: color-mix(in oklab, var(--color-warning-500) 6%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-warning-500) 22%, transparent);
	}

	@media (min-width: 640px) {
		.arbiter-header {
			padding: var(--space-4) var(--space-6);
		}

		.arbiter-content {
			padding: 0 var(--space-6) var(--space-6);
		}
	}

	/* ---- Text roles, replacing Tailwind colour utilities. ---- */
	.breakdown-title,
	.arbiter-summary-title {
		font-size: var(--font-size-lg);
		color: var(--text-primary);
	}

	.arbiter-glyph,
	.toggle-chevron {
		display: inline-flex;
		align-items: center;
	}

	.arbiter-glyph {
		color: var(--sentiment-arbiter);
	}

	.toggle-chevron {
		color: var(--text-muted);
	}

	/* Was a Skeleton v2 badge variant class that no stylesheet in this project
	   defines any more — the count badge had been rendering unstyled. */
	.badge-count {
		background: color-mix(in oklab, var(--status-warning) 15%, transparent);
		border: 1px solid color-mix(in oklab, var(--status-warning) 30%, transparent);
		color: var(--status-warning);
	}
</style>
