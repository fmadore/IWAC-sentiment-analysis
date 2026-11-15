<!--
  ArticleCard

  The card layout every article table falls back to on a narrow screen: the
  title as a RowDetailButton, a meta line (newspaper • date), then the table's
  own body through the `children` snippet — sentiment badges, a verdict, the
  comparison grid. The four tables used to carry four card shells, two of them
  `<div role="button">` with a hand-written keydown.

  The whole card is clickable for a mouse; it carries no role, because the
  keyboard and assistive-technology path is the title button.

  `accent` picks the hover border of the table's family. The root is an `<li>`:
  render the cards inside a `<ul>`, so they are announced as a set.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import RowDetailButton from './RowDetailButton.svelte';

	interface ArticleCardProps {
		title: string;
		/** Accessible name of the title button. */
		label: string;
		/** "Newspaper • date", already formatted. */
		meta?: string;
		onselect: (event: MouseEvent) => void;
		accent?: 'primary' | 'neutral' | 'arbiter';
		children?: Snippet;
	}

	let { title, label, meta, onselect, accent = 'primary', children }: ArticleCardProps = $props();
</script>

<!-- Mouse convenience only: the title button is the accessible control. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<li class="article-card" data-accent={accent} onclick={onselect}>
	<div class="card-head">
		<RowDetailButton {label} onclick={onselect} clamp>{title}</RowDetailButton>
		{#if meta}<p class="card-meta">{meta}</p>{/if}
	</div>
	{#if children}
		<div class="card-body">{@render children()}</div>
	{/if}
</li>

<style>
	.article-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		height: 100%;
		padding: var(--pad-card-compact);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.article-card:hover {
		background: var(--surface-card-hover);
		border-color: var(--border-hover);
	}

	.article-card[data-accent='arbiter']:hover {
		border-color: var(--sentiment-arbiter-border);
	}

	.card-head {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
	}

	.card-meta {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	@media (prefers-reduced-motion: reduce) {
		.article-card {
			transition: none;
		}
	}
</style>
