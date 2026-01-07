<!--
  ArbiterStatsCards Component
  
  Displays key statistics for arbiter evaluations as a grid of cards.
  Shows total evaluations, model preferences, and agreement rates.
-->
<script lang="ts">
	import type { ArbiterStatistics } from '$lib/stores';
	import { availableDatasets } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
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
	function getModelLogo(modelName: string): string | null {
		const dataset = $availableDatasets.find(d => d.name === modelName);
		return dataset?.logo ?? null;
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

	const leadPercentage = $derived(
		Math.abs(stats.modelAPercentage - stats.modelBPercentage).toFixed(1)
	);
</script>

<div class="stats-grid">
	<!-- Total Evaluations -->
	<div class="stat-card">
		<div class="stat-icon evaluations">
			<BarChart3Icon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{stats.totalEvaluated}</div>
			<div class="stat-label">{$t.arbiter.articlesEvaluated}</div>
		</div>
	</div>

	<!-- Model A Wins -->
	<div class="stat-card">
		<div class="stat-icon model-a">
			{#if modelALogo}
				<img src="{base}{modelALogo}" alt="{modelAName}" class="model-logo" />
			{/if}
		</div>
		<div class="stat-content">
			<div class="stat-value">{stats.modelAPreferred}</div>
			<div class="stat-label">{modelAName} {$t.arbiter.preferred}</div>
			<div class="stat-percentage">{stats.modelAPercentage.toFixed(1)}%</div>
		</div>
	</div>

	<!-- Model B Wins -->
	<div class="stat-card">
		<div class="stat-icon model-b">
			{#if modelBLogo}
				<img src="{base}{modelBLogo}" alt="{modelBName}" class="model-logo" />
			{/if}
		</div>
		<div class="stat-content">
			<div class="stat-value">{stats.modelBPreferred}</div>
			<div class="stat-label">{modelBName} {$t.arbiter.preferred}</div>
			<div class="stat-percentage">{stats.modelBPercentage.toFixed(1)}%</div>
		</div>
	</div>

	<!-- Both Equal -->
	<div class="stat-card">
		<div class="stat-icon equal">
			<ScaleIcon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{stats.bothEqual}</div>
			<div class="stat-label">{$t.arbiter.bothEqual}</div>
			<div class="stat-percentage">{stats.bothPercentage.toFixed(1)}%</div>
		</div>
	</div>

	<!-- Neither Accurate -->
	<div class="stat-card">
		<div class="stat-icon neither">
			<CheckCircle2Icon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{stats.neitherAccurate}</div>
			<div class="stat-label">{$t.arbiter.neitherAccurate}</div>
			<div class="stat-percentage">{stats.neitherPercentage.toFixed(1)}%</div>
		</div>
	</div>
</div>

<!-- Overall Lead Indicator -->
{#if leadingModel && Number(leadPercentage) > 1}
	{@const leadingLogo = getModelLogo(leadingModel)}
	<div class="lead-indicator mt-4">
		{#if leadingLogo}
			<img src="{base}{leadingLogo}" alt="{leadingModel}" class="lead-logo" />
		{/if}
		<span class="lead-text">
			<strong>{leadingModel}</strong> leads by <strong>{leadPercentage}%</strong> in overall preferences
		</span>
	</div>
{/if}

<!-- Head-to-Head Comparison Bar (based on overall_winner per article) -->
{#if stats.overallModelAWins + stats.overallModelBWins > 0}
	{@const totalDecisive = stats.overallModelAWins + stats.overallModelBWins}
	{@const modelAPercent = (stats.overallModelAWins / totalDecisive) * 100}
	{@const modelBPercent = (stats.overallModelBWins / totalDecisive) * 100}
	<div class="comparison-section mt-4">
		<div class="comparison-header">
			<span class="comparison-title">{$t.arbiter.headToHead}</span>
			<span class="comparison-subtitle">{$t.arbiter.excludingTies}</span>
		</div>
		<div class="comparison-bar-container">
			<div class="comparison-labels">
				<div class="model-label model-a-label">
					{#if modelALogo}
						<img src="{base}{modelALogo}" alt="{modelAName}" class="comparison-logo" />
					{/if}
					<span>{modelAName}</span>
					<strong>{modelAPercent.toFixed(1)}%</strong>
				</div>
				<div class="model-label model-b-label">
					<strong>{modelBPercent.toFixed(1)}%</strong>
					<span>{modelBName}</span>
					{#if modelBLogo}
						<img src="{base}{modelBLogo}" alt="{modelBName}" class="comparison-logo" />
					{/if}
				</div>
			</div>
			<div class="comparison-bar">
				<div 
					class="bar-segment model-a-segment" 
					style="width: {modelAPercent}%"
					title="{modelAName}: {stats.overallModelAWins} ({modelAPercent.toFixed(1)}%)"
				></div>
				<div 
					class="bar-segment model-b-segment" 
					style="width: {modelBPercent}%"
					title="{modelBName}: {stats.overallModelBWins} ({modelBPercent.toFixed(1)}%)"
				></div>
			</div>
			<div class="comparison-counts">
				<span class="count model-a-count">{stats.overallModelAWins} {$t.arbiter.wins}</span>
				<span class="count model-b-count">{stats.overallModelBWins} {$t.arbiter.wins}</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 0.875rem;
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		transition: all var(--timing-fast) var(--easing-default);
	}

	.stat-card:hover {
		border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
		transform: translateY(-2px);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		flex-shrink: 0;
	}

	.stat-icon.evaluations {
		background: linear-gradient(
			135deg,
			var(--sentiment-polarity-neutral-bg),
			color-mix(in oklab, var(--sentiment-polarity-neutral) 10%, transparent)
		);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}

	.stat-icon.model-a {
		background: linear-gradient(
			135deg,
			var(--sentiment-polarity-very-positive-bg),
			color-mix(in oklab, var(--sentiment-polarity-very-positive) 10%, transparent)
		);
		color: var(--sentiment-polarity-very-positive);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
	}

	.stat-icon.model-b {
		background: linear-gradient(
			135deg,
			var(--sentiment-subjectivity-3-bg),
			color-mix(in oklab, var(--sentiment-subjectivity-3) 10%, transparent)
		);
		color: var(--sentiment-subjectivity-3);
		border: 1px solid var(--sentiment-subjectivity-3-border);
	}

	.stat-icon.equal {
		background: linear-gradient(
			135deg,
			var(--sentiment-arbiter-bg),
			color-mix(in oklab, var(--sentiment-arbiter-light) 10%, transparent)
		);
		color: var(--sentiment-arbiter-light);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.stat-icon.neither {
		background: linear-gradient(
			135deg,
			var(--sentiment-polarity-na-bg),
			color-mix(in oklab, var(--sentiment-polarity-na) 10%, transparent)
		);
		color: var(--sentiment-polarity-na);
		border: 1px solid var(--sentiment-polarity-na-border);
	}

	.model-logo {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-surface-50);
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
		margin-top: 0.125rem;
	}

	.stat-percentage {
		font-size: 0.75rem;
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
		margin-top: 0.25rem;
	}

	.lead-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: color-mix(in oklab, var(--sentiment-arbiter) 10%, transparent);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.lead-logo {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	.lead-text {
		font-size: 0.875rem;
		color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
	}

	.lead-text strong {
		color: var(--sentiment-arbiter-light);
	}

	/* Head-to-Head Comparison Section */
	.comparison-section {
		padding: 1.25rem;
		border-radius: 0.875rem;
		background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
		backdrop-filter: blur(var(--glass-blur-md));
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.comparison-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.comparison-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-surface-50);
	}

	.comparison-subtitle {
		font-size: 0.75rem;
		color: color-mix(in oklab, var(--color-surface-50) 50%, transparent);
	}

	.comparison-bar-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.comparison-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.model-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.model-a-label {
		color: var(--sentiment-polarity-very-positive);
	}

	.model-a-label strong {
		font-weight: 700;
		font-size: 1rem;
	}

	.model-b-label {
		color: var(--sentiment-subjectivity-3);
	}

	.model-b-label strong {
		font-weight: 700;
		font-size: 1rem;
	}

	.comparison-logo {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	.comparison-bar {
		display: flex;
		height: 24px;
		border-radius: 12px;
		overflow: hidden;
		background: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
	}

	.bar-segment {
		height: 100%;
		transition: width var(--timing-normal) var(--easing-default);
		position: relative;
	}

	.bar-segment:first-child {
		border-radius: 12px 0 0 12px;
	}

	.bar-segment:last-child {
		border-radius: 0 12px 12px 0;
	}

	.model-a-segment {
		background: linear-gradient(
			90deg,
			var(--sentiment-polarity-very-positive),
			color-mix(in oklab, var(--sentiment-polarity-very-positive) 80%, var(--sentiment-polarity-positive))
		);
	}

	.model-b-segment {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, var(--sentiment-subjectivity-3) 80%, var(--sentiment-subjectivity-4)),
			var(--sentiment-subjectivity-3)
		);
	}

	.comparison-counts {
		display: flex;
		justify-content: space-between;
	}

	.count {
		font-size: 0.75rem;
		color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
	}

	.model-a-count {
		color: color-mix(in oklab, var(--sentiment-polarity-very-positive) 70%, var(--color-surface-50));
	}

	.model-b-count {
		color: color-mix(in oklab, var(--sentiment-subjectivity-3) 70%, var(--color-surface-50));
	}

	@media (max-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.stat-card {
			padding: 1rem;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.stat-icon {
			width: 36px;
			height: 36px;
		}

		.model-logo {
			width: 20px;
			height: 20px;
		}

		.comparison-section {
			padding: 1rem;
		}

		.model-label span {
			display: none;
		}

		.comparison-bar {
			height: 20px;
		}

		.comparison-logo {
			width: 18px;
			height: 18px;
		}
	}
</style>
