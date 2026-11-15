<!--
  EmptyState Component

  Shared "nothing selected" placeholder used by the detail views
  (ArticleDetail, ComparisonDetail): centered icon + title + lede.
  Renders a document icon by default; pass an `icon` snippet to override.

  The title is a strongly styled paragraph by default: an empty state sits
  wherever its caller does, and a fixed <h4> skipped levels in most of them.
  Pass `headingLevel` when the title really does head a section.

  Usage:
  <EmptyState title="No article selected" lede="Select an article to see details" />
  <EmptyState title="…" lede="…" headingLevel={3} />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface EmptyStateProps {
		/** Heading text */
		title: string;
		/** Supporting text under the heading */
		lede: string;
		/** Optional icon override (defaults to a document icon) */
		icon?: Snippet;
		/** Render the title as a heading of this level; a paragraph otherwise */
		headingLevel?: 2 | 3 | 4 | 5 | 6;
	}

	let { title, lede, icon, headingLevel }: EmptyStateProps = $props();
</script>

<div class="empty-state">
	<div class="empty-icon" aria-hidden="true">
		{#if icon}
			{@render icon()}
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		{/if}
	</div>
	{#if headingLevel}
		<div class="empty-title" role="heading" aria-level={headingLevel}>{title}</div>
	{:else}
		<p class="empty-title">{title}</p>
	{/if}
	<p class="empty-lede">{lede}</p>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		padding: var(--space-8);
		text-align: center;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.empty-icon {
		width: 3rem;
		height: 3rem;
		color: var(--text-faint);
		margin-bottom: var(--space-3);
	}

	.empty-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.empty-title {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.empty-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		max-width: 40ch;
		margin: 0 auto;
	}
</style>
