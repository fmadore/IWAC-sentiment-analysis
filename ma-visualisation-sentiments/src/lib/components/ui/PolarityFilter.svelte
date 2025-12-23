<script lang="ts">
  import { polarityFilters } from '$lib/stores.ts';
  import { t, currentLanguage } from '$lib/i18n';
  import { getSentimentLabels, getFrenchSentimentValue } from '$lib/i18n/utils';

  // French values for data storage with corresponding CSS class names
  const frenchPolarityOptions = [
    { value: 'Très positif', cssClass: 'polarity-very-positive' },
    { value: 'Positif', cssClass: 'polarity-positive' },
    { value: 'Neutre', cssClass: 'polarity-neutral' },
    { value: 'Négatif', cssClass: 'polarity-negative' },
    { value: 'Très négatif', cssClass: 'polarity-very-negative' },
    { value: 'Non applicable', cssClass: 'polarity-na' }
  ];

  // Get translated labels
  let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
  
  // Create options with translated labels
  let polarityOptions = $derived(frenchPolarityOptions.map((option, index) => ({
    ...option,
    label: polarityLabels[index]
  })));
  
  let selectedPolarities = $state<string[]>([]);
  
  // Sync local state with store values when language or store changes
  $effect(() => {
    // Convert French store values to translated labels for UI
    const storeValues = $polarityFilters;
    selectedPolarities = storeValues.map(frenchValue => {
      // Find the index of the French value
      const index = frenchPolarityOptions.findIndex(option => option.value === frenchValue);
      // Return the corresponding translated label
      return index >= 0 ? polarityLabels[index] : frenchValue;
    });
  });
  
  function updateSelection() {
    // Convert translated values back to French for data filtering
    const frenchValues = selectedPolarities.map(label => getFrenchSentimentValue(label));
    polarityFilters.set(frenchValues);
  }
  
  function togglePolarity(translatedLabel: string) {
    if (selectedPolarities.includes(translatedLabel)) {
      selectedPolarities = selectedPolarities.filter(p => p !== translatedLabel);
    } else {
      selectedPolarities = [...selectedPolarities, translatedLabel];
    }
    updateSelection();
  }

  function clearSelection() {
    selectedPolarities = [];
    updateSelection();
  }
</script>

<div class="filter-card">
  <h3 class="filter-title">{$t.filters.polarity}</h3>
  
  <div class="filter-chips">
    {#each polarityOptions as option}
      <button 
        class="filter-chip {option.cssClass}" 
        data-selected={selectedPolarities.includes(option.label)}
        onclick={() => togglePolarity(option.label)}
        aria-pressed={selectedPolarities.includes(option.label)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedPolarities.length > 0}
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
    .filter-title { font-size: 0.875rem; margin-bottom: 0.75rem; }
  }

  @media (max-width: 480px) {
    .filter-card { padding: 0.75rem; }
    .filter-title { font-size: 0.8125rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-card, .clear-btn { transition: none; }
  }
</style>