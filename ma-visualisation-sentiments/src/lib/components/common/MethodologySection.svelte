<!--
  MethodologySection

  One titled block inside a methodology accordion: an `h4` (the accordion item
  is an `h3`) over a paragraph, or over whatever the `children` snippet
  renders (a numbered list, a scale). Shared by both arbiter cards, which had
  each carried this block's CSS — the archived one with a hand-mixed text
  colour where the panel one used the text tokens.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface MethodologySectionProps {
		title: string;
		/** A single paragraph; ignored when `children` is given. */
		text?: string;
		children?: Snippet;
	}

	let { title, text, children }: MethodologySectionProps = $props();
</script>

<div class="methodology-section">
	<h4 class="section-title">{title}</h4>
	{#if children}
		{@render children()}
	{:else if text}
		<p class="section-text">{text}</p>
	{/if}
</div>

<style>
	.methodology-section {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-radius: var(--radius-panel);
	}

	.section-title {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
	}

	.section-text,
	.methodology-section :global(.section-text) {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
	}

	.methodology-section :global(ol) {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding-left: var(--space-5);
		list-style: decimal;
	}

	.methodology-section :global(ol > li) {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-snug);
	}
</style>
