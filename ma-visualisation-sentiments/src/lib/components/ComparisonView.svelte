<script lang="ts">
  import { filteredComparisons, comparisonMode } from '$lib/stores';
  import DiscrepancyFilter from './ui/DiscrepancyFilter.svelte';
  import ComparisonTable from './ComparisonTable.svelte';
  import ComparisonStats from './ComparisonStats.svelte';
  import { t } from '$lib/i18n';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  
  const hasData = $derived($filteredComparisons.length > 0);
</script>

<div class="comparison-view">
  {#if !$comparisonMode}
    <!-- Not in comparison mode -->
    <div class="empty-state card variant-glass p-8 text-center">
      <AlertCircleIcon size={48} class="mx-auto mb-4 text-white/60" />
      <h3 class="h3 mb-2 text-white">{$t.comparison?.enableComparisonMode || 'Enable Comparison Mode'}</h3>
      <p class="text-white/60 max-w-md mx-auto">
        {$t.comparison?.enableComparisonDescription || 'Click the comparison button in the dataset picker to compare ChatGPT and Gemini analyses.'}
      </p>
    </div>
  {:else}
    <!-- Stats Overview -->
    <div class="stats-section mb-6">
      <ComparisonStats />
    </div>
    
    <!-- Filters -->
    <div class="filters-section mb-6">
      <DiscrepancyFilter />
    </div>
    
    <!-- Results -->
    {#if hasData}
      <div class="comparison-content">
        <ComparisonTable />
      </div>
    {:else}
      <div class="empty-results card variant-glass p-8 text-center">
        <AlertCircleIcon size={48} class="mx-auto mb-4 text-white/60" />
        <h3 class="h4 mb-2 text-white">{$t.comparison?.noDiscrepancies || 'No Discrepancies Found'}</h3>
        <p class="text-white/60 max-w-md mx-auto">
          {$t.comparison?.adjustFilters || 'Try adjusting your filters to see articles with differences between models.'}
        </p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .comparison-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .empty-state,
  .empty-results {
    margin: 2rem auto;
    max-width: 600px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .comparison-view {
      gap: 1rem;
    }
  }
</style>
