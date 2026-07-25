<!--
  StatCard Component

  The single stat-card primitive. ComparisonStats and ArbiterStatsCards each
  carried their own copy of the .stat-card / .stat-value / .stat-label recipe
  with slightly drifted type scales and hover treatments; the agreement view
  needed a third. Two layouts cover every existing usage:

    stacked — icon + label on one row, then a large value, then a detail line
              (ComparisonStats, the agreement statistics)
    inline  — icon to the left of a value/label stack (ArbiterStatsCards)

  `accent` tints the icon tile and the value using the sentiment token family,
  so callers name a meaning rather than re-deriving a colour.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import InfoIcon from '@lucide/svelte/icons/info';

	export type StatCardAccent =
		'neutral' | 'comparison' | 'discrepancy' | 'positive' | 'accent' | 'arbiter' | 'muted';

	interface StatCardProps {
		/** Monospace eyebrow naming the measure. */
		label: string;
		/** The number itself; pre-formatted by the caller. */
		value: string | number;
		/** Optional supporting line under the value. */
		detail?: string;
		/** Optional explanatory text behind an info affordance. */
		tooltip?: string;
		accent?: StatCardAccent;
		layout?: 'stacked' | 'inline';
		/** Icon (or logo) rendered in the tile. */
		icon?: Snippet;
	}

	let {
		label,
		value,
		detail,
		tooltip,
		accent = 'neutral',
		layout = 'stacked',
		icon
	}: StatCardProps = $props();
</script>

<div class="stat-card" data-layout={layout} data-accent={accent}>
	{#if layout === 'stacked'}
		<div class="stat-header">
			{#if icon}
				<div class="stat-icon">{@render icon()}</div>
			{/if}
			<span class="stat-label">{label}</span>
			{#if tooltip}
				<span class="stat-info" title={tooltip}>
					<InfoIcon size={14} />
					<span class="sr-only">{tooltip}</span>
				</span>
			{/if}
		</div>
		<div class="stat-value">{value}</div>
		{#if detail}
			<div class="stat-detail">{detail}</div>
		{/if}
	{:else}
		{#if icon}
			<div class="stat-icon">{@render icon()}</div>
		{/if}
		<div class="stat-content">
			<div class="stat-value">{value}</div>
			<span class="stat-label">{label}</span>
			{#if detail}
				<div class="stat-detail">{detail}</div>
			{/if}
		</div>
		{#if tooltip}
			<span class="stat-info" title={tooltip}>
				<InfoIcon size={14} />
				<span class="sr-only">{tooltip}</span>
			</span>
		{/if}
	{/if}
</div>

<style>
	.stat-card {
		position: relative;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.stat-card:hover {
		border-color: var(--border-hover);
	}

	.stat-card[data-layout='stacked'] {
		padding: var(--space-4);
	}

	.stat-card[data-layout='inline'] {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-5);
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		flex-shrink: 0;
		border: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}

	.stat-content {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.stat-value {
		font-family: var(--font-display);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		line-height: 1;
		letter-spacing: var(--tracking-tight);
	}

	.stat-card[data-layout='stacked'] .stat-value {
		font-size: clamp(2rem, 1.5rem + 1.5vw, 2.75rem);
		margin-bottom: var(--space-1);
	}

	.stat-card[data-layout='inline'] .stat-value {
		font-size: clamp(1.75rem, 1.4rem + 1vw, 2.25rem);
	}

	.stat-detail {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.stat-info {
		display: flex;
		align-items: center;
		margin-left: auto;
		color: var(--text-muted);
		cursor: help;
	}

	.stat-info:hover {
		color: var(--text-secondary);
	}

	/* --- Accents: tint the icon tile and the value together ---------------- */
	.stat-card[data-accent='comparison'] .stat-icon {
		background: var(--sentiment-comparison-bg);
		border-color: var(--sentiment-comparison-border);
		color: var(--sentiment-comparison-light);
	}
	.stat-card[data-accent='comparison'] .stat-value {
		color: var(--sentiment-comparison-light);
	}

	.stat-card[data-accent='discrepancy'] .stat-icon {
		background: color-mix(in oklab, var(--sentiment-discrepancy-light) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-discrepancy-light) 28%, transparent);
		color: var(--sentiment-discrepancy-light);
	}
	.stat-card[data-accent='discrepancy'] .stat-value {
		color: var(--sentiment-discrepancy-light);
	}

	.stat-card[data-accent='positive'] .stat-icon {
		background: var(--sentiment-polarity-very-positive-bg);
		border-color: var(--sentiment-polarity-very-positive-border);
		color: var(--sentiment-polarity-very-positive);
	}
	.stat-card[data-accent='positive'] .stat-value {
		color: var(--sentiment-polarity-very-positive);
	}

	.stat-card[data-accent='accent'] .stat-icon {
		background: color-mix(in oklab, var(--sentiment-comparison-accent) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison-accent) 28%, transparent);
		color: var(--sentiment-comparison-accent);
	}
	.stat-card[data-accent='accent'] .stat-value {
		color: var(--sentiment-comparison-accent);
	}

	.stat-card[data-accent='arbiter'] .stat-icon {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
	}
	.stat-card[data-accent='arbiter'] .stat-value {
		color: var(--sentiment-arbiter-light);
	}

	.stat-card[data-accent='muted'] .stat-icon {
		background: var(--sentiment-polarity-na-bg);
		border-color: var(--sentiment-polarity-na-border);
		color: var(--sentiment-polarity-na);
	}

	.stat-card[data-accent='neutral'] .stat-icon {
		background: var(--sentiment-polarity-neutral-bg);
		border-color: var(--sentiment-polarity-neutral-border);
		color: var(--sentiment-polarity-neutral);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
