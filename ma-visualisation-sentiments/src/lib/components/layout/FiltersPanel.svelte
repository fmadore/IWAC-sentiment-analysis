<script lang="ts">
  import CountryFilter from '$lib/components/ui/CountryFilter.svelte';
  import JournalFilter from '$lib/components/ui/JournalFilter.svelte';
  import PolarityFilter from '$lib/components/ui/PolarityFilter.svelte';
  import SubjectivityFilter from '$lib/components/ui/SubjectivityFilter.svelte';
  import CentralityFilter from '$lib/components/ui/CentralityFilter.svelte';
  import ExtremeAnalysisControls from '$lib/components/ui/ExtremeAnalysisControls.svelte';
  import DatasetBadge from '$lib/components/ui/DatasetBadge.svelte';
  import ClearFiltersButton from '$lib/components/ui/ClearFiltersButton.svelte';
  import { t } from '$lib/i18n';
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
</script>

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
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .filters-grid-responsive.masonry .filter-shell :global(.filter-card) {
      transition: none;
    }
  }
</style>
