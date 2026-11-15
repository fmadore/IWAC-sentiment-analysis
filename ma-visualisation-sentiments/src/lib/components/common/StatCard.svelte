<!--
  StatCard Component

  The single stat-card primitive, used by the agreement and reliability
  sections, ComparisonStats, and both arbiter generations' headline cards.
  Two layouts cover every usage:

    stacked — icon + label on one row, then a large value, then detail lines
              (ComparisonStats, the agreement statistics)
    inline  — icon to the left of a value/label stack (the arbiter cards)

  `accent` tints the icon tile and the value using the sentiment token family,
  so callers name a meaning rather than re-deriving a colour. `iconAccent`
  retints the tile alone, for a card whose glyph and number carry different
  meanings (ComparisonStats' average, whose value stays neutral).

  The explanation behind the info affordance goes through the shared
  InfoTooltip, the app's one tooltip: a click/tap popover with a 44px target,
  reachable by keyboard and touch. `tooltip` takes a sentence or a snippet
  (several paragraphs); give a snippet a `tooltipLabel`.
-->
<script lang="ts" module>
	export type StatCardAccent =
		| 'neutral'
		| 'comparison'
		| 'discrepancy'
		| 'positive'
		| 'accent'
		| 'arbiter'
		| 'muted'
		| 'alternate';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import InfoTooltip from './InfoTooltip.svelte';

	interface StatCardProps {
		/** Monospace eyebrow naming the measure. */
		label: string;
		/** The number itself; pre-formatted by the caller. */
		value: string | number;
		/** Optional supporting line under the value. */
		detail?: string;
		/** Optional second supporting line (a share, a caveat). */
		note?: string;
		/** Explanation behind an info affordance: a sentence, or a snippet. */
		tooltip?: string | Snippet;
		/** Accessible name of the info button; defaults to the tooltip sentence. */
		tooltipLabel?: string;
		accent?: StatCardAccent;
		/** Tint for the icon tile alone; defaults to `accent`. */
		iconAccent?: StatCardAccent;
		layout?: 'stacked' | 'inline';
		/**
		 * Leave the label's own capitalisation alone. Set it whenever the label
		 * carries a mathematical symbol: the eyebrow is uppercased by default, and
		 * `text-transform` turns κ into Κ and ρ into Ρ — a different letter, and one
		 * that reads as a Latin P. CorrelationChart's ρ readout opts out of
		 * uppercasing for the same reason.
		 */
		preserveLabelCase?: boolean;
		/** Icon (or logo) rendered in the tile. */
		icon?: Snippet;
	}

	let {
		label,
		value,
		detail,
		note,
		tooltip,
		tooltipLabel,
		accent = 'neutral',
		iconAccent,
		layout = 'stacked',
		preserveLabelCase = false,
		icon
	}: StatCardProps = $props();

	const infoLabel = $derived(
		tooltipLabel ?? (typeof tooltip === 'string' ? `${label}: ${tooltip}` : label)
	);
</script>

{#snippet infoAffordance()}
	{#if tooltip}
		<span class="stat-info">
			<InfoTooltip ariaLabel={infoLabel}>
				{#if typeof tooltip === 'string'}
					<p class="stat-tooltip-text">{tooltip}</p>
				{:else}
					{@render tooltip()}
				{/if}
			</InfoTooltip>
		</span>
	{/if}
{/snippet}

{#snippet lines()}
	{#if detail}<div class="stat-detail">{detail}</div>{/if}
	{#if note}<div class="stat-detail stat-note">{note}</div>{/if}
{/snippet}

<div
	class="stat-card"
	data-layout={layout}
	data-accent={accent}
	data-label-case={preserveLabelCase ? 'preserve' : 'upper'}
>
	{#if layout === 'stacked'}
		<div class="stat-header">
			{#if icon}
				<div class="stat-icon" data-accent={iconAccent ?? accent}>{@render icon()}</div>
			{/if}
			<span class="stat-label">{label}</span>
			{@render infoAffordance()}
		</div>
		<div class="stat-value">{value}</div>
		{@render lines()}
	{:else}
		{#if icon}
			<div class="stat-icon" data-accent={iconAccent ?? accent}>{@render icon()}</div>
		{/if}
		<div class="stat-content">
			<div class="stat-value">{value}</div>
			<span class="stat-label">{label}</span>
			{@render lines()}
		</div>
		{@render infoAffordance()}
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
		padding: var(--pad-card-compact);
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

	/* A model logo in the tile (the arbiter cards). */
	.stat-icon :global(img) {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		object-fit: contain;
	}

	.stat-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	/* Labels carrying a mathematical symbol keep their own case — see the
	   `preserveLabelCase` prop. Everything else about the eyebrow (mono face,
	   tracking, muted colour) still reads as an eyebrow without the uppercasing. */
	.stat-card[data-label-case='preserve'] .stat-label {
		text-transform: none;
	}

	.stat-value {
		font-family: var(--font-display);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		line-height: 1;
		letter-spacing: var(--tracking-tight);
	}

	/* Fluid between two steps of the type scale (34 → 46px), not between two
	   literals: the endpoints are tokens, only the slope is the component's. */
	.stat-card[data-layout='stacked'] .stat-value {
		font-size: clamp(
			var(--font-size-3xl),
			calc(var(--font-size-2xl) + 1.5vw),
			var(--font-size-4xl)
		);
		margin-bottom: var(--space-1);
	}

	/* 26 → 34px. */
	.stat-card[data-layout='inline'] .stat-value {
		font-size: clamp(var(--font-size-2xl), calc(var(--font-size-xl) + 1vw), var(--font-size-3xl));
	}

	.stat-detail {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.stat-note {
		margin-top: var(--space-1);
	}

	/* The InfoTooltip trigger is a 44px target around a 16px glyph; pull it
	   back so it does not push the header taller than the icon tile. */
	.stat-info {
		display: flex;
		align-items: center;
		margin: calc(var(--space-2) * -1);
		margin-left: auto;
	}

	.stat-tooltip-text {
		margin: 0;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
	}

	@media (min-width: 640px) {
		.stat-card[data-layout='inline'] {
			padding: var(--pad-card);
		}
	}

	/* --- Accents: the value follows the card, the tile its own attribute --- */
	.stat-icon[data-accent='comparison'] {
		background: var(--sentiment-comparison-bg);
		border-color: var(--sentiment-comparison-border);
		color: var(--sentiment-comparison-light);
	}
	.stat-card[data-accent='comparison'] .stat-value {
		color: var(--sentiment-comparison-light);
	}

	.stat-icon[data-accent='discrepancy'] {
		background: color-mix(in oklab, var(--sentiment-discrepancy-light) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-discrepancy-light) 28%, transparent);
		color: var(--sentiment-discrepancy-light);
	}
	.stat-card[data-accent='discrepancy'] .stat-value {
		color: var(--sentiment-discrepancy-light);
	}

	.stat-icon[data-accent='positive'] {
		background: var(--sentiment-polarity-very-positive-bg);
		border-color: var(--sentiment-polarity-very-positive-border);
		color: var(--sentiment-polarity-very-positive);
	}
	.stat-card[data-accent='positive'] .stat-value {
		color: var(--sentiment-polarity-very-positive);
	}

	.stat-icon[data-accent='accent'] {
		background: color-mix(in oklab, var(--sentiment-comparison-accent) 12%, transparent);
		border-color: color-mix(in oklab, var(--sentiment-comparison-accent) 28%, transparent);
		color: var(--sentiment-comparison-accent);
	}
	.stat-card[data-accent='accent'] .stat-value {
		color: var(--sentiment-comparison-accent);
	}

	.stat-icon[data-accent='arbiter'] {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
	}
	.stat-card[data-accent='arbiter'] .stat-value {
		color: var(--sentiment-arbiter-light);
	}

	/* A second, distinct tile tint (the archived arbiter's second model). */
	.stat-icon[data-accent='alternate'] {
		background: var(--sentiment-subjectivity-3-bg);
		border-color: var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.stat-icon[data-accent='muted'] {
		background: var(--sentiment-polarity-na-bg);
		border-color: var(--sentiment-polarity-na-border);
		color: var(--sentiment-polarity-na);
	}

	.stat-icon[data-accent='neutral'] {
		background: var(--sentiment-polarity-neutral-bg);
		border-color: var(--sentiment-polarity-neutral-border);
		color: var(--sentiment-polarity-neutral);
	}

	@media (prefers-reduced-motion: reduce) {
		.stat-card {
			transition: none;
		}
	}
</style>
