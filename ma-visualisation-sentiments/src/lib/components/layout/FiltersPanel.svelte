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
    <div class="country-filter-section"><CountryFilter /></div>
    <div class="analysis-controls-section">
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
  <div class="filters-grid-responsive mb-4 sm:mb-6">
    <CountryFilter />
    <JournalFilter />
    <PolarityFilter />
    <SubjectivityFilter />
    <CentralityFilter />
  </div>
{/if}
<ClearFiltersButton />

<style>
  .filters-grid-responsive { display:grid;gap:.5rem;align-items:start;grid-template-columns:1fr; }
  @media (min-width:640px){ .filters-grid-responsive{grid-template-columns:repeat(2,1fr);gap:1rem;} }
  @media (min-width:768px){ .filters-grid-responsive{grid-template-columns:repeat(3,1fr);} }
  @media (min-width:1024px){ .filters-grid-responsive{grid-template-columns:repeat(4,1fr);} }
  @media (min-width:1280px){ .filters-grid-responsive{grid-template-columns:repeat(5,1fr);} }
  .filters-grid-responsive :global(.card){height:fit-content;align-self:start;transition:all var(--transition-normal);min-width:0;}
  .extreme-filters-layout{display:grid;grid-template-columns:300px 1fr;gap:2rem;align-items:start;}
  @media (max-width:1200px){.extreme-filters-layout{grid-template-columns:280px 1fr;gap:1.5rem;}}
  @media (max-width:1024px){.extreme-filters-layout{grid-template-columns:1fr;gap:1rem;}}
  @media (max-width:768px){.extreme-filters-layout{gap:.75rem;}}
</style>
