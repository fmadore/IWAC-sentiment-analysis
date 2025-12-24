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
    <button 
      class="clear-btn" 
      onclick={onClear}
      type="button"
    >
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
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 0.875rem;
    padding: 1rem;
    box-shadow: 
      0 4px 16px color-mix(in oklab, black 8%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    transition: all var(--timing-normal) var(--easing-default);
  }

  .filter-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  .filter-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.875rem;
  }

  .filter-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .filter-count {
    font-size: 0.8125rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    margin-left: auto;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .clear-btn:hover {
    background: color-mix(in oklab, var(--color-error-500) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-error-500) 30%, transparent);
    color: var(--color-error-400);
  }

  .filter-footer {
    margin-top: 0.75rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .filter-card { 
      padding: 0.875rem; 
    }
    .filter-title { 
      font-size: 0.875rem; 
    }
    .filter-header {
      margin-bottom: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .filter-card { 
      padding: 0.75rem; 
    }
    .filter-title { 
      font-size: 0.8125rem; 
    }
    .clear-btn {
      font-size: 0.6875rem;
      padding: 0.3125rem 0.625rem;
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
