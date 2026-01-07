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
	}
</style>
