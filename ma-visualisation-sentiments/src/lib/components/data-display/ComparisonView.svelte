<script lang="ts">
  import { filteredComparisons, comparisonMode, selectedComparison, isLoadingComparison } from '$lib/stores';
  import { DiscrepancyFilter } from '$lib/components/filters';
  import ComparisonTable from './ComparisonTable.svelte';
  import ComparisonStats from './ComparisonStats.svelte';
  import { ComparisonDetailModal } from '$lib/components/common';
  import { t } from '$lib/i18n';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  
  const hasData = $derived($filteredComparisons.length > 0);
  const showDetailModal = $derived($selectedComparison !== null);

  function closeDetailModal() {
    selectedComparison.set(null);
  }
</script>

<!-- Comparison Detail Modal (full-screen) -->
<ComparisonDetailModal 
  comparison={$selectedComparison} 
  open={showDetailModal}
  onClose={closeDetailModal}
/>

<div class="comparison-view">
  {#if !$comparisonMode}
    <!-- Not in comparison mode -->
    <div class="empty-state preset-glass p-8 text-center rounded-xl">
      <AlertCircleIcon size={48} class="mx-auto mb-4 text-white/60" />
      <h3 class="h3 mb-2 text-white">{$t.comparison?.enableComparisonMode || 'Enable Comparison Mode'}</h3>
      <p class="text-white/60 max-w-md mx-auto">
        {$t.comparison?.enableComparisonDescription || 'Click the comparison button in the dataset picker to compare ChatGPT and Gemini analyses.'}
      </p>
    </div>
  {:else if $isLoadingComparison}
    <!-- Loading state for comparison data -->
    <div class="loading-section mb-6">
      <div class="preset-glass p-8 text-center rounded-xl">
        <div class="loading-spinner mb-4"></div>
        <p class="text-white/80">{$t.messages?.loading || 'Loading comparison data...'}</p>
      </div>
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
      <div class="empty-results preset-glass p-8 text-center rounded-xl">
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
  
  /* Loading spinner - using CSS custom properties */
  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-top-color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .comparison-view {
      gap: 1rem;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }
  }
</style>
