<!--
  SectionHead Component

  The title-plus-lede that introduces a section inside a view. Three components
  carried byte-identical copies of the same three rules before this existed, and
  the agreement view was about to add a fourth.

  Deliberately an <h2>: these sit under the page's own <h1>, and a section that
  needs a different level needs a different component, not a prop that lets a
  caller break the heading order.
-->
<script lang="ts">
	interface SectionHeadProps {
		title: string;
		/** Optional standfirst under the title. */
		lede?: string;
	}

	let { title, lede }: SectionHeadProps = $props();
</script>

<div class="section-head">
	<h2 class="section-title">{title}</h2>
	{#if lede}
		<p class="section-lede">{lede}</p>
	{/if}
</div>

<style>
	.section-head {
		margin-bottom: var(--space-4);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.section-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}
</style>
