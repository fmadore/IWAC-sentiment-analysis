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
	const arbiterStats = $derived($arbiterStatistics);

	// Get dynamic model names from current comparison pair
	const modelNames = $derived(() => {
		const [modelAId, modelBId] = getModelsFromPair($comparisonPair);
		const datasets = $availableDatasets;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

	// Create dynamic tooltip text with actual model names
	const dynamicTooltips = $derived(() => {
		const { modelAName, modelBName } = modelNames();
		return {
			totalDiscrepancies: `Number of articles where ${modelAName} and ${modelBName} provide different analyses (any difference > 0 points)`,
			significantDifferences: `Articles where any dimension (polarity, subjectivity, or centrality) differs by 3+ points between ${modelAName} and ${modelBName} analyses`
		};
	});

	// State for arbiter summary visibility
	let showArbiterSummary = $state(false);
</script>

<div class="stats-grid">
	<div class="stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<GitCompareArrowsIcon size={24} class="text-blue-400" />
			<span class="stat-label">{$t.comparison?.totalArticles || 'Total Articles'}</span>
		</div>
		<div class="stat-value">{stats.totalArticles}</div>
		<div class="stat-detail">{$t.comparison?.articlesAnalyzed || 'Articles analyzed'}</div>
	</div>

	<div class="stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<AlertCircleIcon size={24} class="text-yellow-400" />
			<span class="stat-label">{$t.comparison?.totalDiscrepancies || 'Total Discrepancies'}</span>
			<div class="info-tooltip" title={dynamicTooltips().totalDiscrepancies}>
				<InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
			</div>
		</div>
		<div class="stat-value">{stats.totalDiscrepancies}</div>
		<div class="stat-detail">
			{$t.comparison?.articlesWithDifferences || 'Articles with differences'}
		</div>
	</div>

	<div class="stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<TrendingUpIcon size={24} class="text-green-400" />
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

	<div class="stat-card card variant-glass p-4 hover-lift">
		<div class="stat-header">
			<BarChart3Icon size={24} class="text-purple-400" />
			<span class="stat-label">{$t.comparison?.highConflicts || 'High Conflicts'}</span>
			<div class="info-tooltip" title={dynamicTooltips().significantDifferences}>
				<InfoIcon size={14} class="text-white/50 hover:text-white/80 cursor-help" />
			</div>
		</div>
		<div class="stat-value">{stats.highConflictArticles}</div>
		<div class="stat-detail">
			{$t.comparison?.significantDifferences || 'Significant differences'}
		</div>
	</div>
</div>

<!-- Breakdown by dimension -->
<div class="breakdown-section mt-6">
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
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		position: relative;
		overflow: hidden;
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, var(--color-primary-500), var(--color-secondary-500));
		opacity: 0.8;
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.info-tooltip {
		margin-left: auto;
		display: flex;
		align-items: center;
	}

	.stat-label {
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		font-weight: 500;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-surface-50);
		line-height: 1.2;
		margin-bottom: 0.25rem;
	}

	.stat-detail {
		font-size: 0.75rem;
		color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
	}

	/* Breakdown section */
	.breakdown-section {
		background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border-radius: 0.875rem;
		padding: 1.5rem;
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		box-shadow:
			0 4px 16px color-mix(in oklab, black 8%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
	}

	.breakdown-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.breakdown-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.breakdown-bar {
		position: relative;
		height: 8px;
		background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		border-radius: 4px;
		overflow: hidden;
	}

	.breakdown-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--progress);
		border-radius: 4px;
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
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		font-weight: 500;
	}

	.breakdown-value {
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.breakdown-section {
			padding: 1rem;
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
		background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border-radius: 0.875rem;
		border: 1px solid color-mix(in oklab, var(--color-warning-500) 20%, transparent);
		box-shadow:
			0 4px 16px color-mix(in oklab, black 8%, transparent),
			inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
		overflow: hidden;
	}

	.arbiter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem 1.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background var(--timing-fast) var(--easing-default);
	}

	.arbiter-header:hover {
		background: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
	}

	.arbiter-header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.arbiter-content {
		padding: 0 1.5rem 1.5rem;
		border-top: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
	}

	.arbiter-stats-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.arbiter-stat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.arbiter-stat-bar {
		position: relative;
		height: 8px;
		background: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		border-radius: 4px;
		overflow: hidden;
	}

	.arbiter-stat-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--progress);
		border-radius: 4px;
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
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
		font-weight: 500;
	}

	.arbiter-stat-value {
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
	}

	.arbiter-note {
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		font-size: 0.8rem;
		color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
		background: color-mix(in oklab, var(--color-warning-500) 8%, transparent);
		border-radius: 0.5rem;
		border-left: 3px solid var(--color-warning-500);
	}

	@media (max-width: 640px) {
		.arbiter-header {
			padding: 0.875rem 1rem;
		}

		.arbiter-content {
			padding: 0 1rem 1rem;
		}

		.arbiter-header-content {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
