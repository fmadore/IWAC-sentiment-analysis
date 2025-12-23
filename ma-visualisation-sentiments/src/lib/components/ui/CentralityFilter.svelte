<script lang="ts">
  import { centralityFilters } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, getFrenchSentimentValue } from '$lib/i18n/utils';

  // French values (stored in data) with their CSS class names
  const centralityOptions = [
    { value: 'Très central', cssClass: 'centrality-very-central' },
    { value: 'Central', cssClass: 'centrality-central' },
    { value: 'Secondaire', cssClass: 'centrality-secondary' },
    { value: 'Marginal', cssClass: 'centrality-marginal' },
    { value: 'Non abordé', cssClass: 'centrality-not-addressed' }
  ];

  let selectedCentralities: string[] = $state([]);

  // Sync local state with store values
  $effect(() => {
    selectedCentralities = $centralityFilters;
  });

  // Get translated labels for display
  const translatedOptions = $derived(
    centralityOptions.map(option => ({
      value: option.value, // Keep French value for data operations
      label: translateSentimentValue(option.value, $currentLanguage), // Translated label for display
      cssClass: option.cssClass
    }))
  );

  // Mettre à jour le store quand la sélection change
  function toggleCentrality(centrality: string) {
    if (selectedCentralities.includes(centrality)) {
      selectedCentralities = selectedCentralities.filter(c => c !== centrality);
    } else {
      selectedCentralities = [...selectedCentralities, centrality];
    }
    centralityFilters.set(selectedCentralities);
  }

  function clearSelection() {
    selectedCentralities = [];
    centralityFilters.set(selectedCentralities);
  }
</script>

<div class="filter-card">
  <h3 class="filter-title">{$t.analysis.centralitySection}</h3>
  
  <div class="filter-chips">
    {#each translatedOptions as option}
      <button 
        class="filter-chip {option.cssClass}" 
        data-selected={selectedCentralities.includes(option.value)}
        onclick={() => toggleCentrality(option.value)}
        aria-pressed={selectedCentralities.includes(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedCentralities.length > 0}
    <button 
      class="clear-btn" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
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

  .filter-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0 0 0.875rem 0;
    letter-spacing: -0.01em;
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

  @media (max-width: 768px) {
    .filter-card { padding: 0.875rem; }
    .filter-title { font-size: 0.875rem; margin-bottom: 0.625rem; }
  }

  @media (max-width: 480px) {
    .filter-card { padding: 0.75rem; }
    .filter-title { font-size: 0.8125rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-card, .clear-btn { transition: none; }
  }
</style>