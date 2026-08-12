<!--
  ArbiterStatsCards Component
  
  Displays key statistics for arbiter evaluations as a grid of cards.
  Shows total evaluations, model preferences, and agreement rates.
-->
<script lang="ts">
	import type { ArbiterStatistics } from '$lib/stores';
	import { dec, num, pct } from '$lib/i18n/utils';
	import { datasetState } from '$lib/stores';
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
		const dataset = datasetState.available.find((d) => d.name === modelName);
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
		$dec(Math.abs(stats.modelAPercentage - stats.modelBPercentage), 1)
	);
</script>

<div class="stats-grid">
	<!-- Total Evaluations -->
	<div class="stat-card">
		<div class="stat-icon evaluations">
			<BarChart3Icon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.totalEvaluated)}</div>
			<div class="stat-label">{$t.arbiter.articlesEvaluated}</div>
		</div>
	</div>

	<!-- Model A Wins -->
	<div class="stat-card">
		<div class="stat-icon model-a">
			{#if modelALogo}
				<img src="{base}{modelALogo}" alt={modelAName} class="model-logo" />
			{/if}
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.modelAPreferred)}</div>
			<div class="stat-label">{modelAName} {$t.arbiter.preferred}</div>
			<div class="stat-percentage">{$pct(stats.modelAPercentage / 100, 1)}</div>
		</div>
	</div>

	<!-- Model B Wins -->
	<div class="stat-card">
		<div class="stat-icon model-b">
			{#if modelBLogo}
				<img src="{base}{modelBLogo}" alt={modelBName} class="model-logo" />
			{/if}
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.modelBPreferred)}</div>
			<div class="stat-label">{modelBName} {$t.arbiter.preferred}</div>
			<div class="stat-percentage">{$pct(stats.modelBPercentage / 100, 1)}</div>
		</div>
	</div>

	<!-- Both Equal -->
	<div class="stat-card">
		<div class="stat-icon equal">
			<ScaleIcon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.bothEqual)}</div>
			<div class="stat-label">{$t.arbiter.bothEqual}</div>
			<div class="stat-percentage">{$pct(stats.bothPercentage / 100, 1)}</div>
		</div>
	</div>

	<!-- Neither Accurate -->
	<div class="stat-card">
		<div class="stat-icon neither">
			<CheckCircle2Icon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.neitherAccurate)}</div>
			<div class="stat-label">{$t.arbiter.neitherAccurate}</div>
			<div class="stat-percentage">{$pct(stats.neitherPercentage / 100, 1)}</div>
		</div>
	</div>
</div>

<!-- Overall Lead Indicator -->
{#if leadingModel && Number(leadPercentage) > 1}
	{@const leadingLogo = getModelLogo(leadingModel)}
	<div class="lead-indicator mt-4">
		{#if leadingLogo}
			<img src="{base}{leadingLogo}" alt={leadingModel} class="lead-logo" />
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
						<img src="{base}{modelALogo}" alt={modelAName} class="comparison-logo" />
					{/if}
					<span>{modelAName}</span>
					<strong>{$pct(modelAPercent / 100, 1)}</strong>
				</div>
				<div class="model-label model-b-label">
					<strong>{$pct(modelBPercent / 100, 1)}</strong>
					<span>{modelBName}</span>
					{#if modelBLogo}
						<img src="{base}{modelBLogo}" alt={modelBName} class="comparison-logo" />
					{/if}
				</div>
			</div>
			<div class="comparison-bar">
				<div
					class="bar-segment model-a-segment"
					style="width: {modelAPercent}%"
					title="{modelAName}: {stats.overallModelAWins} ({$pct(modelAPercent / 100, 1)})"
				></div>
				<div
					class="bar-segment model-b-segment"
					style="width: {modelBPercent}%"
					title="{modelBName}: {stats.overallModelBWins} ({$pct(modelBPercent / 100, 1)})"
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
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	.stat-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--pad-card-compact);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.stat-card:hover {
		border-color: var(--border-hover);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		flex-shrink: 0;
	}

	.stat-icon.evaluations {
		background: var(--sentiment-polarity-neutral-bg);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}

	.stat-icon.model-a {
		background: var(--sentiment-polarity-very-positive-bg);
		color: var(--sentiment-polarity-very-positive);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
	}

	.stat-icon.model-b {
		background: var(--sentiment-subjectivity-3-bg);
		color: var(--sentiment-subjectivity-3);
		border: 1px solid var(--sentiment-subjectivity-3-border);
	}

	.stat-icon.equal {
		background: var(--sentiment-arbiter-bg);
		color: var(--sentiment-arbiter-light);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.stat-icon.neither {
		background: var(--sentiment-polarity-na-bg);
		color: var(--sentiment-polarity-na);
		border: 1px solid var(--sentiment-polarity-na-border);
	}

	.model-logo {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		object-fit: contain;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 1.4rem + 1vw, 2.25rem);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		line-height: 1;
		letter-spacing: var(--tracking-tight);
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
		margin-top: var(--space-2);
	}

	.stat-percentage {
		font-size: var(--font-size-xs);
		color: var(--text-subtle);
		margin-top: var(--space-1);
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

	.lead-text strong {
		color: var(--sentiment-arbiter-light);
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
		color: var(--text-subtle);
	}

	.comparison-bar-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.comparison-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.model-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
	}

	/* The model's name is hidden until the card is wide enough to carry it;
	   the logo beside it identifies the model on its own until then. */
	.model-label span {
		display: none;
	}

	@media (min-width: 640px) {
		.model-label span {
			display: inline;
		}
	}

	.model-a-label {
		color: var(--sentiment-polarity-very-positive);
	}

	.model-a-label strong {
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
	}

	.model-b-label {
		color: var(--sentiment-subjectivity-3);
	}

	.model-b-label strong {
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-lg);
	}

	.comparison-logo {
		width: 18px;
		height: 18px;
		object-fit: contain;
	}

	.comparison-bar {
		display: flex;
		height: var(--size-icon-md);
		border-radius: var(--radius-panel);
		overflow: hidden;
		background: var(--surface-muted);
	}

	.bar-segment {
		height: 100%;
		transition: width var(--timing-normal) var(--easing-default);
		position: relative;
	}

	.bar-segment:first-child {
		border-radius: var(--radius-panel) 0 0 var(--radius-panel);
	}

	.bar-segment:last-child {
		border-radius: 0 var(--radius-panel) var(--radius-panel) 0;
	}

	.model-a-segment {
		background: var(--sentiment-polarity-very-positive);
	}

	.model-b-segment {
		background: var(--sentiment-subjectivity-3);
	}

	.comparison-counts {
		display: flex;
		justify-content: space-between;
	}

	.count {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.model-a-count {
		color: color-mix(
			in oklab,
			var(--sentiment-polarity-very-positive) 70%,
			var(--color-surface-50)
		);
	}

	.model-b-count {
		color: color-mix(in oklab, var(--sentiment-subjectivity-3) 70%, var(--color-surface-50));
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		}

		.stat-card {
			padding: var(--pad-card);
		}

		.model-logo {
			width: var(--size-icon-lg);
			height: var(--size-icon-lg);
		}

		.comparison-section {
			padding: var(--pad-card);
		}

		.comparison-bar {
			height: var(--size-icon-lg);
		}

		.comparison-logo {
			width: var(--size-icon-md);
			height: var(--size-icon-md);
		}
	}
</style>
