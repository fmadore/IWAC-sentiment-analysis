<!--
  FilterChip Component

  A reusable toggle chip button for filter selections.
  Sentiment variants take their colours from the shared palette resolver in
  app.css (see utils/sentimentTokens.ts); the chip only decides *when* to wear
  them, which is when it is selected.

  Usage:
  <FilterChip
    label="Positif"
    selected={isSelected}
    onclick={() => toggle()}
    variant="polarity-positive"
  />
-->
<script lang="ts">
	import {
		isSentimentVariant,
		variantAttributes,
		type SentimentVariant
	} from '$lib/utils/sentimentTokens';

	/** Non-sentiment variants; they set the same three palette variables locally. */
	type UtilityVariant = 'comparison' | 'warning' | 'default';

	type ChipVariant = SentimentVariant | UtilityVariant;

	interface FilterChipProps {
		/** Text displayed on the chip */
		label: string;
		/** Whether the chip is selected */
		selected?: boolean;
		/** Semantic color variant */
		variant?: ChipVariant;
		/** Click handler */
		onclick?: () => void;
		/** Whether the chip is disabled */
		disabled?: boolean;
		/** Additional CSS class */
		class?: string;
	}

	let {
		label,
		selected = false,
		variant = 'default',
		onclick,
		disabled = false,
		class: className = ''
	}: FilterChipProps = $props();

	// Sentiment variants defer to the shared palette; the utility ones are
	// styled here, so they travel as data-variant instead.
	let paletteAttributes = $derived(
		isSentimentVariant(variant) ? variantAttributes(variant) : { 'data-variant': variant }
	);
</script>

<button
	class="filter-chip {className}"
	data-selected={selected}
	{...paletteAttributes}
	{onclick}
	{disabled}
	type="button"
	aria-pressed={selected}
>
	{label}
</button>

<style>
	.filter-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-snug);
		border-radius: var(--radius-sm);
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);

		/* Default unselected state */
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
	}

	/* Hover feedback is for chips you could still turn on. A selected chip keeps
	   its variant colour under the cursor — excluded explicitly because the
	   selected rule below is one component less specific than this one and
	   would otherwise lose to it. */
	.filter-chip:hover:not(:disabled, [data-selected='true']) {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.filter-chip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* The entire selected colour system, in one rule. app.css resolves the
	   three variables from the data-polarity / data-subjectivity /
	   data-centrality attribute; the utility variants below set them inline. */
	.filter-chip[data-selected='true'] {
		background: var(--sentiment-bg);
		border-color: var(--sentiment-border);
		color: var(--sentiment-fg);
	}

	/* ============================================
	   UTILITY VARIANTS
	   Not sentiment values, so their palettes live here rather than in the
	   shared resolver — but they feed the same three variables, which keeps
	   the rule above the only place a chip decides how to paint itself.
	   ============================================ */

	.filter-chip[data-variant='default'] {
		--sentiment-fg: var(--color-primary-300);
		--sentiment-bg: color-mix(in oklab, var(--color-primary-500) 16%, transparent);
		--sentiment-border: color-mix(in oklab, var(--color-primary-500) 42%, transparent);
	}

	.filter-chip[data-variant='comparison'] {
		--sentiment-fg: var(--sentiment-comparison-light);
		--sentiment-bg: var(--sentiment-comparison-bg);
		--sentiment-border: var(--sentiment-comparison-border);
	}

	.filter-chip[data-variant='warning'] {
		--sentiment-fg: var(--color-warning-300);
		--sentiment-bg: color-mix(in oklab, var(--color-warning-500) 18%, transparent);
		--sentiment-border: color-mix(in oklab, var(--color-warning-500) 45%, transparent);
	}

	/* Responsive */
	@media (max-width: 480px) {
		.filter-chip {
			padding: var(--space-1) var(--space-2-5);
			font-size: var(--font-size-xs);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.filter-chip {
			transition: none;
			transform: none !important;
		}
	}
</style>
