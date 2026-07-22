<!--
  SentimentScaleList Component

  Renders a polarity/subjectivity/centrality evaluation-scale list as
  badge/label + description pairs.

  Variants:
  - "badge" (AnalysisInfo): global `.badge` classes from app.css
    (.sentiment-*, .subjectivity-*, .centrality-*) with an em-dash before
    each description and an optional bold label.
  - "chip" (ArbiterMethodology): compact colored chips; `chipKind` selects
    the chip shape (pill for sentiment/centrality, circle for subjectivity).

  Usage:
  <SentimentScaleList items={[{ badgeClass: 'sentiment-positive', badge: 'Positif', description: '…' }]} />
-->
<script lang="ts" module>
	export interface ScaleItem {
		/** Sentiment class: global badge class ("badge" variant) or chip color modifier ("chip" variant) */
		badgeClass: string;
		/** Text rendered inside the badge/chip */
		badge: string;
		/** Optional bold label rendered between badge and description ("badge" variant) */
		label?: string;
		/** Description of the scale value */
		description: string;
	}
</script>

<script lang="ts">
	interface SentimentScaleListProps {
		items: ScaleItem[];
		variant?: 'badge' | 'chip';
		/** Chip shape/coloring for the "chip" variant */
		chipKind?: 'sentiment' | 'subjectivity' | 'centrality';
	}

	let { items, variant = 'badge', chipKind = 'sentiment' }: SentimentScaleListProps = $props();
</script>

<ul class="sentiment-list" data-variant={variant}>
	{#each items as item (item.badge)}
		<li>
			{#if variant === 'badge'}
				<span class="badge {item.badgeClass}">{item.badge}</span>
				{#if item.label}<strong class="item-label">{item.label}</strong>{/if}
				<span class="sentiment-desc">— {item.description}</span>
			{:else}
				<span class="scale-chip {item.badgeClass}" data-kind={chipKind}>{item.badge}</span>
				<span class="sentiment-desc">{item.description}</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	/* ==========================================================================
	   BADGE VARIANT (AnalysisInfo)
	   ========================================================================== */
	.sentiment-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2-5);
	}

	.sentiment-list li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2-5);
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
	}

	.sentiment-desc {
		color: var(--text-muted);
	}

	.item-label {
		color: var(--text-primary);
		font-weight: var(--font-weight-medium);
	}

	/* ==========================================================================
	   CHIP VARIANT (ArbiterMethodology)
	   ========================================================================== */
	.sentiment-list[data-variant='chip'] {
		gap: var(--space-2);
	}

	.sentiment-list[data-variant='chip'] li {
		align-items: center;
		gap: var(--space-3);
		font-size: var(--font-size-sm);
		line-height: inherit;
	}

	[data-variant='chip'] .sentiment-desc {
		color: var(--color-surface-50);
		opacity: 0.7;
	}

	.scale-chip[data-kind='sentiment'],
	.scale-chip[data-kind='centrality'] {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-xs);
		min-width: 90px;
		text-align: center;
	}

	.scale-chip[data-kind='subjectivity'] {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		border-radius: var(--radius-full);
		background: var(--sentiment-subjectivity-3-bg);
		color: var(--sentiment-subjectivity-3);
		border: 1px solid var(--sentiment-subjectivity-3-border);
	}
	/* 28px kept — not a standard control size token */

	/* --- Chip colors: polarity --- */
	.scale-chip.very-positive {
		background: var(--sentiment-polarity-very-positive-bg);
		color: var(--sentiment-polarity-very-positive);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
	}
	.scale-chip.positive {
		background: var(--sentiment-polarity-positive-bg);
		color: var(--sentiment-polarity-positive);
		border: 1px solid var(--sentiment-polarity-positive-border);
	}
	.scale-chip.neutral {
		background: var(--sentiment-polarity-neutral-bg);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}
	.scale-chip.negative {
		background: var(--sentiment-polarity-negative-bg);
		color: var(--sentiment-polarity-negative);
		border: 1px solid var(--sentiment-polarity-negative-border);
	}
	.scale-chip.very-negative {
		background: var(--sentiment-polarity-very-negative-bg);
		color: var(--sentiment-polarity-very-negative);
		border: 1px solid var(--sentiment-polarity-very-negative-border);
	}

	/* --- Chip colors: centrality --- */
	.scale-chip.very-central {
		background: var(--sentiment-centrality-very-central-bg);
		color: var(--sentiment-centrality-very-central);
		border: 1px solid var(--sentiment-centrality-very-central-border);
	}
	.scale-chip.central {
		background: var(--sentiment-centrality-central-bg);
		color: var(--sentiment-centrality-central);
		border: 1px solid var(--sentiment-centrality-central-border);
	}
	.scale-chip.secondary {
		background: var(--sentiment-centrality-secondary-bg);
		color: var(--sentiment-centrality-secondary);
		border: 1px solid var(--sentiment-centrality-secondary-border);
	}
	.scale-chip.marginal {
		background: var(--sentiment-centrality-marginal-bg);
		color: var(--sentiment-centrality-marginal);
		border: 1px solid var(--sentiment-centrality-marginal-border);
	}
	.scale-chip.not-addressed {
		background: var(--sentiment-centrality-not-addressed-bg);
		color: var(--sentiment-centrality-not-addressed);
		border: 1px solid var(--sentiment-centrality-not-addressed-border);
	}
</style>
