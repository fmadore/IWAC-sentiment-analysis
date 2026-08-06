<script lang="ts">
	import { comparisonState, arbiterStatistics, datasetState } from '$lib/stores';
	import { getPairModelNames } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
	import InfoIcon from '@lucide/svelte/icons/info';
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
			totalDiscrepancies: `Number of articles where ${modelAName} and ${modelBName} provide different analyses (any difference > 0 points)`,
			significantDifferences: `Articles where any dimension (polarity, subjectivity, or centrality) differs by 3+ points between ${modelAName} and ${modelBName} analyses`
		};
	});

	// State for arbiter summary visibility
	let showArbiterSummary = $state(false);
</script>

<div class="stats-grid">
	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container comparison-icon">
				<GitCompareArrowsIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison?.totalArticles || 'Total Articles'}</span>
		</div>
		<div class="stat-value comparison-stat-value">{stats.totalArticles}</div>
		<div class="stat-detail">{$t.comparison?.articlesAnalyzed || 'Articles analyzed'}</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container discrepancy-icon">
				<AlertCircleIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison?.totalDiscrepancies || 'Total Discrepancies'}</span>
			<div class="info-tooltip" title={dynamicTooltips.totalDiscrepancies}>
				<InfoIcon size={14} />
			</div>
		</div>
		<div class="stat-value discrepancy-stat-value">{stats.totalDiscrepancies}</div>
		<div class="stat-detail">
			{$t.comparison?.articlesWithDifferences || 'Articles with differences'}
		</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container success-icon">
				<TrendingUpIcon size={24} />
			</div>
			<span class="stat-label">{$t.comparison?.averageDiscrepancy || 'Average Discrepancy'}</span>
			<div
				class="info-tooltip"
				title={$t.comparison?.averageDiscrepancyExplanation ||
					'Average total difference points per article across all three dimensions (polarity + subjectivity + centrality)'}
			>
				<InfoIcon size={14} />
			</div>
		</div>
		<div class="stat-value">{stats.averageDiscrepancy.toFixed(2)}</div>
		<div class="stat-detail">{$t.comparison?.pointsPerArticle || 'Points per article'}</div>
	</div>

	<div class="stat-card comparison-stat-card">
		<div class="stat-header">
			<div class="stat-icon-container conflict-icon">
				<BarChart3Icon size={24} />
			</div>
			<span class="stat-label">{$t.comparison?.highConflicts || 'High Conflicts'}</span>
			<div class="info-tooltip" title={dynamicTooltips.significantDifferences}>
				<InfoIcon size={14} />
			</div>
		</div>
		<div class="stat-value conflict-stat-value">{stats.highConflictArticles}</div>
		<div class="stat-detail">
			{$t.comparison?.significantDifferences || 'Significant differences'}
		</div>
	</div>
</div>

<!-- Breakdown by dimension -->
<div class="breakdown-section comparison-breakdown mt-6">
	<h4 class="mb-3 breakdown-title">
		{$t.comparison?.breakdownByDimension || 'Breakdown by Dimension'}
	</h4>

	<div class="breakdown-grid">
		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {(stats.polarityConflicts / stats.totalArticles) * 100 || 0}%"
			>
				<div class="breakdown-fill polarity"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison?.polarity || 'Polarity'}</span>
				<span class="breakdown-value"
					>{stats.polarityConflicts} ({(
						(stats.polarityConflicts / stats.totalArticles) * 100 || 0
					).toFixed(1)}%)</span
				>
			</div>
		</div>

		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {(stats.subjectivityConflicts / stats.totalArticles) * 100 || 0}%"
			>
				<div class="breakdown-fill subjectivity"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
				<span class="breakdown-value"
					>{stats.subjectivityConflicts} ({(
						(stats.subjectivityConflicts / stats.totalArticles) * 100 || 0
					).toFixed(1)}%)</span
				>
			</div>
		</div>

		<div class="breakdown-item">
			<div
				class="breakdown-bar"
				style="--progress: {(stats.centralityConflicts / stats.totalArticles) * 100 || 0}%"
			>
				<div class="breakdown-fill centrality"></div>
			</div>
			<div class="breakdown-info">
				<span class="breakdown-label">{$t.comparison?.centrality || 'Centrality'}</span>
				<span class="breakdown-value"
					>{stats.centralityConflicts} ({(
						(stats.centralityConflicts / stats.totalArticles) * 100 || 0
					).toFixed(1)}%)</span
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
			onclick={() => (showArbiterSummary = !showArbiterSummary)}
			aria-expanded={showArbiterSummary}
		>
			<div class="arbiter-header-content">
				<span class="arbiter-glyph"><GavelIcon size={20} /></span>
				<h4 class="arbiter-summary-title">
					{$t.arbiter?.summaryTitle || 'Arbiter Evaluation Summary'}
				</h4>
				<span class="badge badge-count"
					>{arbiterStats.totalEvaluated}
					{$t.arbiter?.articlesEvaluated || 'articles evaluated'}</span
				>
			</div>
			{#if showArbiterSummary}
				<span class="toggle-chevron"><ChevronUpIcon size={20} /></span>
			{:else}
				<span class="toggle-chevron"><ChevronDownIcon size={20} /></span>
			{/if}
		</button>

		{#if showArbiterSummary}
			<div class="arbiter-content">
				<div class="arbiter-stats-grid">
					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.modelAPercentage}%">
							<div class="arbiter-stat-fill model-a"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label"
								>{arbiterStats.modelAName} {$t.arbiter?.preferred || 'preferred'}</span
							>
							<span class="arbiter-stat-value"
								>{arbiterStats.modelAPreferred} ({arbiterStats.modelAPercentage.toFixed(1)}%)</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.modelBPercentage}%">
							<div class="arbiter-stat-fill model-b"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label"
								>{arbiterStats.modelBName} {$t.arbiter?.preferred || 'preferred'}</span
							>
							<span class="arbiter-stat-value"
								>{arbiterStats.modelBPreferred} ({arbiterStats.modelBPercentage.toFixed(1)}%)</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.bothPercentage}%">
							<div class="arbiter-stat-fill equal"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label">{$t.arbiter?.bothEqual || 'Both equal'}</span>
							<span class="arbiter-stat-value"
								>{arbiterStats.bothEqual} ({arbiterStats.bothPercentage.toFixed(1)}%)</span
							>
						</div>
					</div>

					<div class="arbiter-stat">
						<div class="arbiter-stat-bar" style="--progress: {arbiterStats.neitherPercentage}%">
							<div class="arbiter-stat-fill neither"></div>
						</div>
						<div class="arbiter-stat-info">
							<span class="arbiter-stat-label"
								>{$t.arbiter?.neitherAccurate || 'Neither accurate'}</span
							>
							<span class="arbiter-stat-value"
								>{arbiterStats.neitherAccurate} ({arbiterStats.neitherPercentage.toFixed(1)}%)</span
							>
						</div>
					</div>
				</div>

				<p class="arbiter-note">
					<InfoIcon size={14} class="inline-block mr-1" />
					{$t.arbiter?.blindEvaluationNote ||
						`Evaluations were conducted blind - the arbiter model did not know which analysis came from ${arbiterStats.modelAName} or ${arbiterStats.modelBName}.`}
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

	.info-tooltip {
		margin-left: auto;
		display: flex;
		align-items: center;
		color: var(--text-subtle);
		cursor: help;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.info-tooltip:hover {
		color: var(--text-secondary);
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
		width: var(--progress);
		transition: width var(--timing-slow) var(--easing-default);
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
		width: var(--progress);
		transition: width var(--timing-slow) var(--easing-default);
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
