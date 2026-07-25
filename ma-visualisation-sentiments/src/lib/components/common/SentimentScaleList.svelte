<!--
  SentimentScaleList Component

  Renders a polarity/subjectivity/centrality evaluation-scale list as
  badge/label + description pairs.

  Variants:
  - "badge" (AnalysisInfo): a filled pill with an em-dash before each
    description and an optional bold label.
  - "chip" (ArbiterMethodology): compact colored chips; `chipKind` selects
    the chip shape (pill for sentiment/centrality, circle for subjectivity).

  Both take their colours from the shared palette resolver in app.css, keyed
  on each item's sentiment variant — see utils/sentimentTokens.ts.

  Usage:
  <SentimentScaleList items={[{ variant: 'polarity-positive', badge: 'Positif', description: '…' }]} />
-->
<script lang="ts" module>
	import type { SentimentVariant } from '$lib/utils/sentimentTokens';

	export interface ScaleItem {
		/** Which scale value this row describes; selects its colours */
		variant: SentimentVariant;
		/** Text rendered inside the badge/chip */
		badge: string;
		/** Optional bold label rendered between badge and description ("badge" variant) */
		label?: string;
		/** Description of the scale value */
		description: string;
	}
</script>

<script lang="ts">
	import { variantAttributes } from '$lib/utils/sentimentTokens';

	interface SentimentScaleListProps {
		items: ScaleItem[];
		variant?: 'badge' | 'chip';
		/** Chip shape for the "chip" variant */
		chipKind?: 'sentiment' | 'subjectivity' | 'centrality';
	}

	let { items, variant = 'badge', chipKind = 'sentiment' }: SentimentScaleListProps = $props();
</script>

<ul class="sentiment-list" data-variant={variant}>
	{#each items as item (item.badge)}
		<li>
			{#if variant === 'badge'}
				<span class="badge scale-badge" {...variantAttributes(item.variant)}>{item.badge}</span>
				{#if item.label}<strong class="item-label">{item.label}</strong>{/if}
				<span class="sentiment-desc">— {item.description}</span>
			{:else}
				<span class="scale-chip" data-kind={chipKind} {...variantAttributes(item.variant)}
					>{item.badge}</span
				>
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

	/* Colours resolved by app.css from the item's data-* attribute. */
	.scale-badge {
		background: var(--sentiment-bg);
		border: 1px solid var(--sentiment-border);
		color: var(--sentiment-fg);
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

	/* Same palette as the badge variant; only the shape differs. */
	.scale-chip {
		background: var(--sentiment-bg);
		border: 1px solid var(--sentiment-border);
		color: var(--sentiment-fg);
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
	}
	/* 28px kept — not a standard control size token */
</style>
