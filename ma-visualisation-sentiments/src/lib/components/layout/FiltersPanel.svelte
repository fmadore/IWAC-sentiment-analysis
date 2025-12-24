<script lang="ts">
  import { 
    CountryFilter, 
    JournalFilter, 
    PolarityFilter, 
    SubjectivityFilter, 
    CentralityFilter, 
    ExtremeAnalysisControls,
    ClearFiltersButton 
  } from '$lib/components/filters';
  import { DatasetBadge } from '$lib/components/ui';
  import { t } from '$lib/i18n';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';

  let { activeView, selectedCategory, selectedKeywordType, showTopN, onCategoryChange, onKeywordTypeChange, onTopNChange } = $props<{
    activeView: string;
    selectedCategory: ExtremeCategory;
    selectedKeywordType: KeywordType;
    showTopN: number;
    onCategoryChange: (c: ExtremeCategory) => void;
    onKeywordTypeChange: (k: KeywordType) => void;
    onTopNChange: (n: number) => void;
  }>();

  // State for collapsible filters panel
  let isFiltersOpen = $state(true);
</script>

<div class="filters-panel">
  <!-- Collapsible Header -->
  <button 
    class="filters-header-btn" 
    onclick={() => isFiltersOpen = !isFiltersOpen}
    aria-expanded={isFiltersOpen}
  >
    <h2 class="filters-title">{$t.filters.title}</h2>
    <span class="header-icon" data-state={isFiltersOpen ? 'open' : 'closed'}>
      <ChevronDownIcon size={20} />
    </span>
  </button>

  {#if isFiltersOpen}
  <div class="filters-content" data-state="open">
    {#if activeView === 'extremes'}
      <div class="mb-4"><DatasetBadge size="sm" /></div>
      <div class="extreme-filters-layout mb-4 sm:mb-6">
        <div class="filter-shell country"><CountryFilter /></div>
        <div class="filter-shell extreme-controls">
          <ExtremeAnalysisControls
            {selectedCategory}
            {selectedKeywordType}
            {showTopN}
            onCategoryChange={onCategoryChange}
            onKeywordTypeChange={onKeywordTypeChange}
            onTopNChange={onTopNChange}
          />
        </div>
      </div>
    {:else}
      <div class="filters-grid-responsive masonry mb-4 sm:mb-6">
        <div class="filter-shell country"><CountryFilter /></div>
        <div class="filter-shell journal"><JournalFilter /></div>
        <div class="filter-shell polarity"><PolarityFilter /></div>
        <div class="filter-shell subjectivity"><SubjectivityFilter /></div>
        <div class="filter-shell centrality"><CentralityFilter /></div>
      </div>
    {/if}
    <ClearFiltersButton />
  </div>
  {/if}
</div>

<style>
  /* Auto-fit responsive grid for standard facets */
  .filters-grid-responsive { 
    display: grid; 
    gap: 0.875rem; 
    align-items: start; 
    grid-auto-flow: row dense;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  }

  /* Masonry mode with CSS columns */
  .filters-grid-responsive.masonry { 
    display: block !important; 
  }

  @media (min-width: 1024px) {
    .filters-grid-responsive.masonry { 
      column-count: 2; 
      column-gap: 1.1rem; 
      column-width: 300px;
    }
  }

  @media (min-width: 1280px) {
    .filters-grid-responsive.masonry { 
      column-count: 3; 
      column-gap: 1.25rem; 
      column-width: 320px; 
    }
  }

  @media (min-width: 1600px) {
    .filters-grid-responsive.masonry { 
      column-count: 4; 
      column-gap: 1.5rem; 
      column-width: 340px; 
    }
  }

  .filters-grid-responsive.masonry .filter-shell { 
    break-inside: avoid; 
    -webkit-column-break-inside: avoid; 
    page-break-inside: avoid; 
    margin: 0 0 1.25rem; 
    width: 100%;
  }

  .filters-grid-responsive.masonry .filter-shell :global(.filter-card) {
    height: auto !important; 
    display: block; 
    width: 100%;
    transition: all var(--timing-normal) var(--easing-default);
  }

  /* Journal width hint for non-masonry grid */
  @media (min-width: 1200px) {
    .filters-grid-responsive:not(.masonry) .journal {
      grid-column: span 2;
    }
  }

  @media (min-width: 1600px) {
    .filters-grid-responsive:not(.masonry) {
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }
    .filters-grid-responsive:not(.masonry) .journal {
      grid-column: span 2;
    }
  }

  /* Extreme layout with fluid columns */
  .extreme-filters-layout { 
    display: grid; 
    gap: 1.5rem; 
    grid-template-columns: clamp(230px, 26%, 320px) 1fr; 
    align-items: start;
  }

  @media (max-width: 1100px) {
    .extreme-filters-layout {
      grid-template-columns: clamp(220px, 32%, 300px) 1fr;
      gap: 1.25rem;
    }
  }

  @media (max-width: 900px) {
    .extreme-filters-layout {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  @media (max-width: 600px) {
    .filters-grid-responsive {
      gap: 0.65rem;
    }
    .extreme-filters-layout {
      gap: 0.75rem;
    }
  }

  /* ==========================================================================
     COLLAPSIBLE PANEL STYLES
     ========================================================================== */
  .filters-panel {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
  }

  .filters-header-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .filters-header-btn:hover .filters-title {
    opacity: 0.9;
  }

  .filters-header-btn:hover .header-icon {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
  }

  .filters-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
    flex-shrink: 0;
  }

  .header-icon[data-state="open"] {
    transform: rotate(180deg);
    color: var(--color-primary-400);
  }

  .filters-content {
    margin-top: 1rem;
    animation: slideDown 0.25s var(--easing-default);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .filters-panel {
      padding: 1rem;
      border-radius: 0.875rem;
    }

    .filters-title {
      font-size: 1.125rem;
    }

    .header-icon {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .filters-grid-responsive.masonry .filter-shell :global(.filter-card),
    .filters-content,
    .header-icon,
    .filters-header-btn {
      transition: none;
      animation: none;
    }
  }
</style>
