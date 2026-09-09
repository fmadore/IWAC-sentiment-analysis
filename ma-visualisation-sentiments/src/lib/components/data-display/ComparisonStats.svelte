<script lang="ts">
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { comparisonState, arbiterStatistics, datasetState } from '$lib/stores';
	import { dec, num, pct } from '$lib/i18n/utils';
	import { getPairModelNames } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
	import InfoTooltip from '../common/InfoTooltip.svelte';
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

	// State for arbiter summary visibility
</script>

<div class="stats-grid">
	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container comparison-icon">
				<GitCompareArrowsIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison.totalArticles}</span>
		</div>
		<div class="stat-value comparison-stat-value">{$num(stats.totalArticles)}</div>
		<div class="stat-detail">{$t.comparison.articlesAnalyzed}</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container discrepancy-icon">
				<AlertCircleIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison.totalDiscrepancies}</span>
			<InfoTooltip ariaLabel={dynamicTooltips.totalDiscrepancies}
				><p>{dynamicTooltips.totalDiscrepancies}</p></InfoTooltip
			>
		</div>
		<div class="stat-value discrepancy-stat-value">{$num(stats.totalDiscrepancies)}</div>
		<div class="stat-detail">
			{$t.comparison.articlesWithDifferences}
		</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container success-icon">
				<TrendingUpIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison.averageDiscrepancy}</span>
			<InfoTooltip ariaLabel={$t.comparison.averageDiscrepancyExplanation}
				><p>{$t.comparison.averageDiscrepancyExplanation}</p></InfoTooltip
			>
		</div>
		<div class="stat-value">{$dec(stats.averageDiscrepancy, 2)}</div>
		<div class="stat-detail">{$t.comparison.pointsPerArticle}</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container conflict-icon">
				<BarChart3Icon size={24} />
			</div>
			<span class="stat-label">{$t.comparison.highConflicts}</span>
			<InfoTooltip ariaLabel={dynamicTooltips.significantDifferences}
				><p>{dynamicTooltips.significantDifferences}</p></InfoTooltip
			>
		</div>
		<div class="stat-value conflict-stat-value">{$num(stats.highConflictArticles)}</div>
		<div class="stat-detail">
			{$t.comparison.significantDifferences}
		</div>
	</div>
</div>

<!-- Breakdown by dimension -->
<div class="breakdown-section comparison-breakdown mt-6">
	<h4 class="mb-3 breakdown-title">
		{$t.comparison.breakdownByDimension}
	</h4>

	<div class="breakdown-grid">
		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {stats.polarityConflicts / stats.totalArticles || 0}"
			>
				<div class="breakdown-fill polarity"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison.polarity}</span>
				<span class="breakdown-value"
					>{$num(stats.polarityConflicts)} ({$pct(
						stats.polarityConflicts / stats.totalArticles || 0,
						1
					)})</span
				>
			</div>
		</div>

		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {stats.subjectivityConflicts / stats.totalArticles || 0}"
			>
				<div class="breakdown-fill subjectivity"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison.subjectivity}</span>
				<span class="breakdown-value"
					>{$num(stats.subjectivityConflicts)} ({$pct(
						stats.subjectivityConflicts / stats.totalArticles || 0,
						1
					)})</span
				>
			</div>
		</div>

		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {stats.centralityConflicts / stats.totalArticles || 0}"
			>
				<div class="breakdown-fill centrality"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison.centrality}</span>
				<span class="breakdown-value"
					>{$num(stats.centralityConflicts)} ({$pct(
						stats.centralityConflicts / stats.totalArticles || 0,
						1
					)})</span
				>
			</div>
		</div>
	</div>
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
					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.modelAPercentage / 100}">
							<div class="arbiter-stat-fill model-a"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label"
								>{arbiterStats.modelAName} {$t.arbiter.preferred}</span
							>
							<span class="arbiter-stat-value"
								>{$num(arbiterStats.modelAPreferred)} ({$pct(
									arbiterStats.modelAPercentage / 100,
									1
								)})</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.modelBPercentage / 100}">
							<div class="arbiter-stat-fill model-b"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label"
								>{arbiterStats.modelBName} {$t.arbiter.preferred}</span
							>
							<span class="arbiter-stat-value"
								>{$num(arbiterStats.modelBPreferred)} ({$pct(
									arbiterStats.modelBPercentage / 100,
									1
								)})</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.bothPercentage / 100}">
							<div class="arbiter-stat-fill equal"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label">{$t.arbiter.bothEqual}</span>
							<span class="arbiter-stat-value"
								>{$num(arbiterStats.bothEqual)} ({$pct(arbiterStats.bothPercentage / 100, 1)})</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div
							class="arbiter-stat-bar"
							style="--progress: {arbiterStats.neitherPercentage / 100}"
						>
							<div class="arbiter-stat-fill neither"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label">{$t.arbiter.neitherAccurate}</span>
							<span class="arbiter-stat-value"
								>{$num(arbiterStats.neitherAccurate)} ({$pct(
									arbiterStats.neitherPercentage / 100,
									1
								)})</span
							>
						</div>
					</div>
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

	.stat-card {
		position: relative;
		padding: var(--space-4);
	}

	.comparison-stat-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.comparison-stat-card:hover {
		border-color: var(--border-hover);
	}

	.stat-icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		flex-shrink: 0;
		border: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}

	/* Lucide strokes with currentColor, so each wrapper tints its own glyph.
	   These replace four Tailwind palette utilities that set the icon to a
	   colour the token layer had no say in. */
	.comparison-icon {
		background: var(--sentiment-comparison-bg);
		border-color: var(--sentiment-comparison-border);
		color: var(--sentiment-comparison-accent);
	}

	.discrepancy-icon {
		background: color-mix(in oklab, var(--sentiment-discrepancy-light) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-discrepancy-light) 28%, transparent);
		color: var(--sentiment-discrepancy-light);
	}

	.success-icon {
		background: color-mix(in oklab, var(--sentiment-polarity-very-positive) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-polarity-very-positive) 28%, transparent);
		color: var(--sentiment-polarity-very-positive);
	}

	.conflict-icon {
		background: color-mix(in oklab, var(--sentiment-comparison-accent) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison-accent) 28%, transparent);
		color: var(--sentiment-comparison-accent);
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: clamp(2rem, 1.5rem + 1.5vw, 2.75rem);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: var(--space-1);
		letter-spacing: var(--tracking-tight);
	}

	.comparison-stat-value {
		color: var(--sentiment-comparison-light);
	}

	.discrepancy-stat-value {
		color: var(--sentiment-discrepancy-light);
	}

	.conflict-stat-value {
		color: var(--sentiment-comparison-accent);
	}

	.stat-detail {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
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

	.breakdown-fill.polarity {
		background: var(--sentiment-polarity-neutral);
	}

	.breakdown-fill.subjectivity {
		background: var(--sentiment-subjectivity-3);
	}

	.breakdown-fill.centrality {
		background: var(--sentiment-centrality-very-central);
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

	.arbiter-stat-fill.model-a {
		background: var(--sentiment-polarity-very-positive);
	}

	.arbiter-stat-fill.model-b {
		background: var(--sentiment-comparison-light);
	}

	.arbiter-stat-fill.equal {
		background: var(--sentiment-arbiter);
	}

	.arbiter-stat-fill.neither {
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
