<!--
  PanelRatingChip

  One model's rating on one dimension, as a row in a panel list: an optional
  letter slot, the model's name, an optional tag, then the rating — or a
  loading note while the model's dataset is still arriving.

  Shared by the panel arbiter's verdict (letters, preferred/match marks, the
  recused tag) and the article detail's whole-panel strip (the selected model
  highlighted). A rating the model never produced renders as the
  "not annotated" badge unless the host passes its own `unratedLabel`; it is
  never shown as "Non applicable", which is a verdict.

  The model's colour sits on the letter slot's underline and the chip's edge,
  never on text: series colours are not contrast-checked as type.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import SentimentBadge from './SentimentBadge.svelte';
	import type { SentimentFamily } from '#lib/utils/sentimentTokens.js';

	interface PanelRatingChipProps {
		name: string;
		/** The model's categorical (series) colour. */
		color: string;
		dimension: SentimentFamily;
		value: string | number | null;
		/** False while the model's dataset is still loading. */
		loaded: boolean;
		pendingLabel: string;
		/** Text for a null rating; omitted, the "not annotated" badge is shown. */
		unratedLabel?: string;
		/** A blind letter; `null` renders an empty, hidden slot; omitted, no slot. */
		letter?: string | null;
		/** A short tag after the name (e.g. "recused"). */
		tag?: string;
		tagTitle?: string;
		/** Dashed edge: a rating set beside a judgement rather than part of it. */
		variant?: 'default' | 'recused';
		preferred?: boolean;
		match?: boolean;
		/** Highlights the model the reader selected. */
		highlighted?: boolean;
		/** Trailing marks (the arbiter's tick and equals sign). */
		marks?: Snippet;
	}

	let {
		name,
		color,
		dimension,
		value,
		loaded,
		pendingLabel,
		unratedLabel,
		letter,
		tag,
		tagTitle,
		variant = 'default',
		preferred = false,
		match = false,
		highlighted = false,
		marks
	}: PanelRatingChipProps = $props();
</script>

<li
	class="panel-chip"
	data-variant={variant}
	data-preferred={preferred}
	data-match={match}
	data-highlighted={highlighted}
	style="--model-color: {color}"
>
	{#if letter !== undefined}
		<span class="chip-letter" aria-hidden={letter === null ? 'true' : undefined}>
			{letter ?? '–'}
		</span>
	{/if}
	<span class="chip-model">{name}</span>
	{#if tag}
		<span class="chip-tag" title={tagTitle}>{tag}</span>
	{/if}
	{#if !loaded}
		<span class="chip-note">{pendingLabel}</span>
	{:else if value === null && unratedLabel}
		<span class="chip-note">{unratedLabel}</span>
	{:else}
		<SentimentBadge type={dimension} {value} size="sm" />
	{/if}
	{@render marks?.()}
</li>

<style>
	.panel-chip {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		padding: var(--space-2) var(--space-3);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.panel-chip[data-match='true'] {
		border-color: var(--border-hover);
	}

	.panel-chip[data-preferred='true'] {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
	}

	/* The reader's own model: the accent edge, plus a weight change so the
	   highlight is not carried by colour alone. */
	.panel-chip[data-highlighted='true'] {
		border-color: var(--accent-border);
		box-shadow: inset 2px 0 0 var(--accent);
	}

	.panel-chip[data-highlighted='true'] .chip-model {
		color: var(--text-primary);
		font-weight: var(--font-weight-semibold);
	}

	/* The judge never read this analysis: a dashed edge instead of a solid one. */
	.panel-chip[data-variant='recused'] {
		border-style: dashed;
	}

	/* The letter the arbiter used, underlined in the model's colour. */
	.chip-letter {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--text-primary);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-bottom: 2px solid var(--model-color);
	}

	.chip-model {
		flex: 1;
		min-width: 0;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-left: 2px solid var(--model-color);
		padding-left: var(--space-2);
	}

	/* With a letter slot, its underline already carries the colour. */
	.chip-letter + .chip-model {
		border-left: 0;
		padding-left: 0;
	}

	.chip-tag {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.chip-note {
		font-size: var(--font-size-eyebrow);
		font-style: italic;
		color: var(--text-muted);
		white-space: nowrap;
	}
</style>
