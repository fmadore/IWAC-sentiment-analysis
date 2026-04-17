<script lang="ts">
	import {
		comparisonStatistics,
		arbiterStatistics,
		comparisonPair,
		availableDatasets
	} from '$lib/stores';
	import { getModelsFromPair } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import GitCompareArrowsIcon from '@lucide/svelte/icons/git-compare-arrows';
	import InfoIcon from '@lucide/svelte/icons/info';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

	const stats = $derived($comparisonStatistics);
	const arbiterStats = $derived(arbiterStatistics.current);

	// Get dynamic model names from current comparison pair
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair($comparisonPair);
		const datasets = $availableDatasets;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

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
	<div class="stat-card comparison-stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<div class="stat-icon-container comparison-icon">
				<GitCompareArrowsIcon size={24} class="text-purple-400" />
			</div>
			<span class="stat-label">{$t.comparison?.totalArticles || 'Total Articles'}</span>
		</div>
		<div class="stat-value comparison-stat-value">{stats.totalArticles}</div>
		<div class="stat-detail">{$t.comparison?.articlesAnalyzed || 'Articles analyzed'}</div>
	</div>

	<div class="stat-card comparison-stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<div class="stat-icon-container discrepancy-icon">
				<AlertCircleIcon size={24} class="text-amber-400" />
			</div>
			<span class="stat-label">{$t.comparison?.totalDiscrepancies || 'Total Discrepancies'}</span>
			<div class="info-tooltip" title={dynamicTooltips.totalDiscrepancies}>
				<InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
			</div>
		</div>
		<div class="stat-value discrepancy-stat-value">{stats.totalDiscrepancies}</div>
		<div class="stat-detail">
			{$t.comparison?.articlesWithDifferences || 'Articles with differences'}
		</div>
	</div>

	<div class="stat-card comparison-stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<div class="stat-icon-container success-icon">
				<TrendingUpIcon size={24} class="text-green-400" />
			</div>
			<span class="stat-label">{$t.comparison?.averageDiscrepancy || 'Average Discrepancy'}</span>
			<div
				class="info-tooltip"
				title={$t.comparison?.averageDiscrepancyExplanation ||
					'Average total difference points per article across all three dimensions (polarity + subjectivity + centrality)'}
			>
				<InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
			</div>
		</div>
		<div class="stat-value">{stats.averageDiscrepancy.toFixed(2)}</div>
		<div class="stat-detail">{$t.comparison?.pointsPerArticle || 'Points per article'}</div>
	</div>

	<div class="stat-card comparison-stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<div class="stat-icon-container conflict-icon">
				<BarChart3Icon size={24} class="text-pink-400" />
			</div>
			<span class="stat-label">{$t.comparison?.highConflicts || 'High Conflicts'}</span>
			<div class="info-tooltip" title={dynamicTooltips.significantDifferences}>
				<InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
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
	<h4 class="h5 mb-3 text-white">
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
				<GavelIcon size={20} class="text-amber-400" />
				<h4 class="h5 text-white">{$t.arbiter?.summaryTitle || 'Arbiter Evaluation Summary'}</h4>
				<span class="badge variant-soft-warning"
					>{arbiterStats.totalEvaluated}
					{$t.arbiter?.articlesEvaluated || 'articles evaluated'}</span
				>
			</div>
			{#if showArbiterSummary}
				<ChevronUpIcon size={20} class="text-white/60" />
			{:else}
				<ChevronDownIcon size={20} class="text-white/60" />
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
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.stat-card {
		position: relative;
		overflow: hidden;
	}

	/* Stat cards with neutral glass style */
	.comparison-stat-card {
		background: var(--surface-card-hover);
		border: 1px solid var(--border-default);
		backdrop-filter: blur(var(--glass-blur-md));
		transition:
			border-color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
	}

	.comparison-stat-card:hover {
		border-color: var(--border-hover);
		transform: translateY(-2px);
	}

	/* Icon containers */
	.stat-icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-lg);
		flex-shrink: 0;
	}

	.comparison-icon {
		background: var(--sentiment-comparison-icon-bg);
		border: 1px solid var(--sentiment-comparison-border);
	}

	.discrepancy-icon {
		background: color-mix(in oklab, var(--sentiment-discrepancy-light) 15%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-discrepancy-light) 30%, transparent);
	}

	.success-icon {
		background: color-mix(in oklab, #22c55e 15%, transparent);
		border: 1px solid color-mix(in oklab, #22c55e 30%, transparent);
	}

	.conflict-icon {
		background: color-mix(in oklab, var(--sentiment-comparison-accent) 15%, transparent);
		border: 1px solid color-mix(in oklab, var(--sentiment-comparison-accent) 30%, transparent);
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
	}

	.stat-label {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.stat-value {
		font-size: var(--font-size-4xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-primary);
		line-height: var(--line-height-tight);
		margin-bottom: var(--space-1);
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
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Breakdown section */
	.breakdown-section {
		background: var(--surface-card-elevated);
		backdrop-filter: blur(var(--glass-blur-md));
		border-radius: var(--radius-xl);
		padding: var(--space-6);
		border: 1px solid var(--border-default);
		box-shadow: var(--elevation-card);
	}

	.comparison-breakdown {
		background: var(--surface-card-hover);
		border: 1px solid var(--border-default);
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
		height: 8px;
		background: var(--surface-hover);
		border-radius: var(--radius-xs);
		overflow: hidden;
	}

	.breakdown-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--progress);
		border-radius: var(--radius-xs);
		transition: width var(--timing-slow) var(--easing-default);
	}

	.breakdown-fill.polarity {
		background: linear-gradient(
			90deg,
			var(--sentiment-polarity-neutral),
			color-mix(in oklab, var(--sentiment-polarity-neutral) 70%, white)
		);
	}

	.breakdown-fill.subjectivity {
		background: linear-gradient(
			90deg,
			var(--sentiment-subjectivity-3),
			color-mix(in oklab, var(--sentiment-subjectivity-3) 70%, white)
		);
	}

	.breakdown-fill.centrality {
		background: linear-gradient(
			90deg,
			var(--sentiment-centrality-very-central),
			var(--sentiment-centrality-central)
		);
	}

	.breakdown-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.breakdown-label {
		font-size: var(--font-size-base);
		color: var(--text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.breakdown-value {
		font-size: var(--font-size-base);
		color: var(--text-muted);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: var(--font-size-3xl);
		}

		.breakdown-section {
			padding: var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.breakdown-fill,
		.arbiter-stat-fill {
			transition: none;
		}
	}

	/* Arbiter section */
	.arbiter-section {
		background: var(--surface-card-elevated);
		backdrop-filter: blur(var(--glass-blur-md));
		border-radius: var(--radius-xl);
		border: 1px solid color-mix(in oklab, var(--color-warning-500) 20%, transparent);
		box-shadow: var(--elevation-card);
		overflow: hidden;
	}

	.arbiter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-4) var(--space-6);
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
		gap: var(--space-3);
	}

	.arbiter-content {
		padding: 0 var(--space-6) var(--space-6);
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
		height: 8px;
		background: var(--surface-hover);
		border-radius: var(--radius-xs);
		overflow: hidden;
	}

	.arbiter-stat-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--progress);
		border-radius: var(--radius-xs);
		transition: width var(--timing-slow) var(--easing-default);
	}

	.arbiter-stat-fill.model-a {
		background: linear-gradient(90deg, var(--color-success-500), var(--color-success-400));
	}

	.arbiter-stat-fill.model-b {
		background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
	}

	.arbiter-stat-fill.equal {
		background: linear-gradient(90deg, var(--color-secondary-500), var(--color-secondary-400));
	}

	.arbiter-stat-fill.neither {
		background: linear-gradient(
			90deg,
			var(--sentiment-polarity-na),
			color-mix(in oklab, var(--sentiment-polarity-na) 70%, white)
		);
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
		background: color-mix(in oklab, var(--color-warning-500) 8%, transparent);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-warning-500);
	}

	@media (max-width: 640px) {
		.arbiter-header {
			padding: var(--space-3-5) var(--space-4);
		}

		.arbiter-content {
			padding: 0 var(--space-4) var(--space-4);
		}

		.arbiter-header-content {
			flex-wrap: wrap;
			gap: var(--space-2);
		}
	}
</style>
