<!--
  FilterChip Component
  
  A reusable toggle chip button for filter selections.
  Supports semantic color variants for sentiment values.
  
  Usage:
  <FilterChip 
    label="Positif"
    selected={isSelected}
    onclick={() => toggle()}
    variant="polarity-positive"
  />
-->
<script lang="ts">
	type SemanticVariant =
		// Polarity variants
		| 'polarity-very-positive'
		| 'polarity-positive'
		| 'polarity-neutral'
		| 'polarity-negative'
		| 'polarity-very-negative'
		| 'polarity-na'
		// Subjectivity variants
		| 'subjectivity-1'
		| 'subjectivity-2'
		| 'subjectivity-3'
		| 'subjectivity-4'
		| 'subjectivity-5'
		// Centrality variants
		| 'centrality-very-central'
		| 'centrality-central'
		| 'centrality-secondary'
		| 'centrality-marginal'
		| 'centrality-not-addressed'
		// Default
		| 'default';

	interface FilterChipProps {
		/** Text displayed on the chip */
		label: string;
		/** Whether the chip is selected */
		selected?: boolean;
		/** Semantic color variant */
		variant?: SemanticVariant;
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
</script>

<button
	class="filter-chip {variant} {className}"
	data-selected={selected}
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

	.filter-chip:hover:not(:disabled) {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.filter-chip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Default selected state */
	.filter-chip.default[data-selected='true'] {
		background: color-mix(in oklab, var(--color-primary-500) 16%, transparent);
		border-color: color-mix(in oklab, var(--color-primary-500) 42%, transparent);
		color: var(--color-primary-300);
	}

	/* ============================================
     POLARITY VARIANTS
     Using CSS variables from app.postcss
     ============================================ */

	.filter-chip.polarity-very-positive[data-selected='true'] {
		background: var(--sentiment-polarity-very-positive-bg);
		border-color: var(--sentiment-polarity-very-positive-border);
		color: var(--sentiment-polarity-very-positive);
	}

	.filter-chip.polarity-positive[data-selected='true'] {
		background: var(--sentiment-polarity-positive-bg);
		border-color: var(--sentiment-polarity-positive-border);
		color: var(--sentiment-polarity-positive);
	}

	.filter-chip.polarity-neutral[data-selected='true'] {
		background: var(--sentiment-polarity-neutral-bg);
		border-color: var(--sentiment-polarity-neutral-border);
		color: var(--sentiment-polarity-neutral);
	}

	.filter-chip.polarity-negative[data-selected='true'] {
		background: var(--sentiment-polarity-negative-bg);
		border-color: var(--sentiment-polarity-negative-border);
		color: var(--sentiment-polarity-negative);
	}

	.filter-chip.polarity-very-negative[data-selected='true'] {
		background: var(--sentiment-polarity-very-negative-bg);
		border-color: var(--sentiment-polarity-very-negative-border);
		color: var(--sentiment-polarity-very-negative);
	}

	.filter-chip.polarity-na[data-selected='true'] {
		background: var(--sentiment-polarity-na-bg);
		border-color: var(--sentiment-polarity-na-border);
		color: var(--sentiment-polarity-na);
	}

	/* ============================================
     SUBJECTIVITY VARIANTS
     ============================================ */

	.filter-chip.subjectivity-1[data-selected='true'] {
		background: var(--sentiment-subjectivity-1-bg);
		border-color: var(--sentiment-subjectivity-1-border);
		color: var(--sentiment-subjectivity-1);
	}

	.filter-chip.subjectivity-2[data-selected='true'] {
		background: var(--sentiment-subjectivity-2-bg);
		border-color: var(--sentiment-subjectivity-2-border);
		color: var(--sentiment-subjectivity-2);
	}

	.filter-chip.subjectivity-3[data-selected='true'] {
		background: var(--sentiment-subjectivity-3-bg);
		border-color: var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.filter-chip.subjectivity-4[data-selected='true'] {
		background: var(--sentiment-subjectivity-4-bg);
		border-color: var(--sentiment-subjectivity-4-border);
		color: var(--sentiment-subjectivity-4);
	}

	.filter-chip.subjectivity-5[data-selected='true'] {
		background: var(--sentiment-subjectivity-5-bg);
		border-color: var(--sentiment-subjectivity-5-border);
		color: var(--sentiment-subjectivity-5);
	}

	/* ============================================
     CENTRALITY VARIANTS
     ============================================ */

	.filter-chip.centrality-very-central[data-selected='true'] {
		background: var(--sentiment-centrality-very-central-bg);
		border-color: var(--sentiment-centrality-very-central-border);
		color: var(--sentiment-centrality-very-central);
	}

	.filter-chip.centrality-central[data-selected='true'] {
		background: var(--sentiment-centrality-central-bg);
		border-color: var(--sentiment-centrality-central-border);
		color: var(--sentiment-centrality-central);
	}

	.filter-chip.centrality-secondary[data-selected='true'] {
		background: var(--sentiment-centrality-secondary-bg);
		border-color: var(--sentiment-centrality-secondary-border);
		color: var(--sentiment-centrality-secondary);
	}

	.filter-chip.centrality-marginal[data-selected='true'] {
		background: var(--sentiment-centrality-marginal-bg);
		border-color: var(--sentiment-centrality-marginal-border);
		color: var(--sentiment-centrality-marginal);
	}

	.filter-chip.centrality-not-addressed[data-selected='true'] {
		background: var(--sentiment-centrality-not-addressed-bg);
		border-color: var(--sentiment-centrality-not-addressed-border);
		color: var(--sentiment-centrality-not-addressed);
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
