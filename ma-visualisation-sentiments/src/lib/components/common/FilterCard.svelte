<!--
  FilterCard Component
  
  A reusable glass morphism card wrapper for filter sections.
  Provides consistent styling across all filter components.
  
  Usage:
  <FilterCard title={$t.filters.polarity}>
    {#snippet chips()}
      <FilterChip ... />
    {/snippet}
    
    {#snippet footer()}
      <Legend ... />
    {/snippet}
  </FilterCard>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';

	interface FilterCardProps {
		/** Title displayed in the card header */
		title: string;
		/** Optional count to show next to the title (e.g., journal count) */
		count?: number;
		/** Whether to show the clear button */
		showClear?: boolean;
		/** Callback when clear button is clicked */
		onClear?: () => void;
		/** Main content - typically filter chips */
		chips: Snippet;
		/** Optional header content (rendered next to title) */
		header?: Snippet;
		/** Optional footer content (e.g., legend, search) */
		footer?: Snippet;
		/** Optional content before chips (e.g., search bar) */
		beforeChips?: Snippet;
		/** Additional CSS class */
		class?: string;
	}

	let {
		title,
		count,
		showClear = false,
		onClear,
		chips,
		header,
		footer,
		beforeChips,
		class: className = ''
	}: FilterCardProps = $props();
</script>

<div class="filter-card {className}">
	<div class="filter-header">
		<h3 class="filter-title">{title}</h3>
		{#if count !== undefined}
			<span class="filter-count">({count})</span>
		{/if}
		{#if header}
			{@render header()}
		{/if}
	</div>

	{#if beforeChips}
		{@render beforeChips()}
	{/if}

	<div class="filter-chips">
		{@render chips()}
	</div>

	{#if showClear && onClear}
		<button class="clear-btn" onclick={onClear} type="button">
			{$t.filters.clearAll}
		</button>
	{/if}

	{#if footer}
		<div class="filter-footer">
			{@render footer()}
		</div>
	{/if}
</div>

<style>
	.filter-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		/* Rail cards are the dense variant by default — they live in a 320px
		   column, not the main content area. */
		padding: var(--pad-card-compact);
		box-shadow: var(--elevation-card);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.filter-card:hover {
		border-color: var(--border-hover);
	}

	.filter-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3-5);
	}

	.filter-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
		letter-spacing: var(--tracking-snug);
	}

	.filter-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.clear-btn {
		display: inline-flex;
		align-items: center;
		margin-top: var(--space-2);
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-panel);
		cursor: pointer;
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.clear-btn:hover {
		background: color-mix(in oklab, var(--color-error-500) 12%, transparent);
		border-color: color-mix(in oklab, var(--color-error-500) 30%, transparent);
		color: var(--color-error-400);
	}

	.filter-footer {
		margin-top: var(--space-3);
	}

	/* Compact treatment, keyed on the rail's own width rather than the
	   viewport's. Two viewport queries used to sit here (768px and 480px)
	   producing three sizes of this card — but the card only ever renders in
	   the ~320px filter rail, whose width barely changes between the desktop
	   column and the mobile drawer. The result was that the same card at the
	   same physical width looked different depending on the window behind it.
	   One threshold now, and it describes something the card can actually see:
	   below 300px of usable column (a phone under ~340px wide), tighten up. */
	@container filter-rail (max-width: 300px) {
		.filter-card {
			padding: var(--space-3);
		}

		.filter-header {
			margin-bottom: var(--space-3);
		}

		.clear-btn {
			font-size: var(--font-size-eyebrow);
			padding: var(--space-1) var(--space-2-5);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.filter-card,
		.clear-btn {
			transition: none;
		}
	}
</style>
