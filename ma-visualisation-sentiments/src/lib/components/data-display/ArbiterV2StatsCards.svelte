<!--
  ArbiterV2StatsCards

  Win shares for every generation-2 model, plus the two verdicts that name no
  single model ("several are equivalent", "none is accurate").

  Logos and brand colours are looked up **by dataset id**, not by matching the
  display-name string the way the v1 cards do. Two v2 models share a logo with
  an archived v1 model, and a name-string match is one rename away from
  attaching the wrong brand to a verdict.

  Nothing here counts the models: the grid auto-fits, the overall bar is one
  segment per model, and the legend wraps. The panel grew from three to five
  without this file changing, which is the property to preserve.
-->
<script lang="ts">
	import type { ArbiterV2Statistics } from '$lib/stores';
	import { num, pct } from '$lib/i18n/utils';
	import { datasetState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { base } from '$app/paths';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';

	interface ArbiterV2StatsCardsProps {
		stats: ArbiterV2Statistics;
	}

	let { stats }: ArbiterV2StatsCardsProps = $props();

	function datasetFor(modelId: string) {
		return datasetState.available.find((dataset) => dataset.id === modelId);
	}

	/** Overall verdicts that named exactly one model — the head-to-head base. */
	const decisive = $derived(stats.models.reduce((total, model) => total + model.overallWins, 0));
</script>

<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-icon evaluations">
			<BarChart3Icon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.totalEvaluated)}</div>
			<div class="stat-label">{$t.arbiterV2.articlesEvaluated}</div>
			<div class="stat-note">
				{$num(stats.totalVerdicts)}
				{$t.arbiterV2.dimensionVerdicts}
			</div>
		</div>
	</div>

	{#each stats.models as model (model.modelId)}
		{@const dataset = datasetFor(model.modelId)}
		<div class="stat-card">
			<div class="stat-icon model" style="--model-color: {dataset?.color ?? 'currentColor'}">
				{#if dataset?.logo}
					<img src="{base}{dataset.logo}" alt="" class="model-logo" />
				{/if}
			</div>
			<div class="stat-content">
				<div class="stat-value">{$num(model.overallWins)}</div>
				<div class="stat-label">{model.name} {$t.arbiterV2.preferred}</div>
				<div class="stat-percentage">{$pct(model.overallPercentage / 100, 1)}</div>
				<div class="stat-note">
					{$t.arbiterV2.blindLabel}
					{model.label.toUpperCase()} · {$num(model.dimensionWins)}
					{$t.arbiterV2.dimensionVerdicts}
				</div>
			</div>
		</div>
	{/each}

	<div class="stat-card">
		<div class="stat-icon equal">
			<ScaleIcon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.multiple)}</div>
			<div class="stat-label">{$t.arbiterV2.multiple}</div>
			<div class="stat-percentage">{$pct(stats.multiplePercentage / 100, 1)}</div>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon neither">
			<CircleSlashIcon size={20} />
		</div>
		<div class="stat-content">
			<div class="stat-value">{$num(stats.none)}</div>
			<div class="stat-label">{$t.arbiterV2.none}</div>
			<div class="stat-percentage">{$pct(stats.nonePercentage / 100, 1)}</div>
		</div>
	</div>
</div>

<p class="tie-note">{$t.arbiterV2.dimensionTieNote}</p>

{#if decisive > 0}
	<div class="overall-section mt-4">
		<div class="overall-header">
			<span class="overall-title">{$t.arbiterV2.overallVerdicts}</span>
			<span class="overall-subtitle">{$t.arbiterV2.overallVerdictsNote}</span>
		</div>
		<div class="overall-bar">
			{#each stats.models as model (model.modelId)}
				{@const dataset = datasetFor(model.modelId)}
				{#if model.overallWins > 0}
					<div
						class="bar-segment"
						style="width: {(model.overallWins / stats.totalEvaluated) *
							100}%; background: {dataset?.color ?? 'var(--sentiment-arbiter)'}"
						title="{model.name}: {model.overallWins}"
					></div>
				{/if}
			{/each}
			{#if stats.overallMultiple + stats.overallNone > 0}
				<div
					class="bar-segment tie-segment"
					style="width: {((stats.overallMultiple + stats.overallNone) / stats.totalEvaluated) *
						100}%"
					title="{$t.arbiterV2.multiple} / {$t.arbiterV2.none}: {stats.overallMultiple +
						stats.overallNone}"
				></div>
			{/if}
		</div>
		<ul class="overall-legend">
			{#each stats.models as model (model.modelId)}
				{@const dataset = datasetFor(model.modelId)}
				<li class="legend-item">
					<span
						class="legend-swatch"
						style="background: {dataset?.color ?? 'var(--sentiment-arbiter)'}"
					></span>
					<span class="legend-name">{model.name}</span>
					<strong class="legend-value">{$pct(model.overallPercentage / 100, 1)}</strong>
				</li>
			{/each}
			<li class="legend-item">
				<span class="legend-swatch tie-swatch"></span>
				<span class="legend-name">{$t.arbiterV2.multiple} / {$t.arbiterV2.none}</span>
				<strong class="legend-value">
					{$pct((stats.overallMultiple + stats.overallNone) / stats.totalEvaluated, 1)}
				</strong>
			</li>
		</ul>
	</div>
{/if}

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	/* Why the headline number is the overall verdict and not the per-dimension
	   one. Without it a reader compares two counts that do not mean the same
	   thing, and reads the smaller per-dimension tally as a weaker model. */
	.tie-note {
		margin-top: var(--space-3);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
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

	/* The brand colour arrives as an inline custom property rather than a
	   literal: chart-facing colours cannot come from CSS variables, but this is
	   plain DOM, so the registry value is the single source. */
	.stat-icon.model {
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-bottom: 2px solid var(--model-color);
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

	.stat-note {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wide);
		color: var(--text-subtle);
		margin-top: var(--space-1);
	}

	.overall-section {
		padding: var(--pad-card-compact);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.overall-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.overall-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.overall-subtitle {
		font-size: var(--font-size-xs);
		color: var(--text-subtle);
	}

	.overall-bar {
		display: flex;
		height: var(--size-icon-md);
		background: var(--surface-muted);
		overflow: hidden;
	}

	.bar-segment {
		height: 100%;
		transition: width var(--timing-normal) var(--easing-default);
	}

	.tie-segment {
		background: var(--surface-muted);
		border-left: 1px solid var(--border-subtle);
	}

	.overall-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3) var(--space-5);
		margin-top: var(--space-3);
		list-style: none;
		padding: 0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.legend-swatch {
		width: 10px;
		height: 10px;
		flex-shrink: 0;
	}

	.tie-swatch {
		background: var(--surface-muted);
		border: 1px solid var(--border-default);
	}

	.legend-value {
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
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

		.overall-section {
			padding: var(--pad-card);
		}

		.overall-bar {
			height: var(--size-icon-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-segment {
			transition: none;
		}
	}
</style>
