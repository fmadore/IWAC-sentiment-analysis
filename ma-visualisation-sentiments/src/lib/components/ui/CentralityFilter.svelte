<script lang="ts">
  import { centralityFilters } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, getFrenchSentimentValue } from '$lib/i18n/utils';

  // French values (stored in data) with their translation keys
  const centralityOptions = [
    { value: 'Très central', translationKey: 'centrality.veryCentral' },
    { value: 'Central', translationKey: 'centrality.central' },
    { value: 'Secondaire', translationKey: 'centrality.secondary' },
    { value: 'Marginal', translationKey: 'centrality.marginal' },
    { value: 'Non abordé', translationKey: 'centrality.notAddressed' }
  ];

  let selectedCentralities: string[] = $state([]);

  // Get translated labels for display
  const translatedOptions = $derived(
    centralityOptions.map(option => ({
      value: option.value, // Keep French value for data operations
      label: translateSentimentValue(option.value, $currentLanguage), // Translated label for display
      translationKey: option.translationKey
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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-3 text-white leading-tight responsive-title">{$t.analysis.centralitySection}</h3>
  
  <div class="flex flex-wrap gap-2 mb-2">
    {#each translatedOptions as option}
      <button 
        class="chip hover-lift {option.value === 'Très central' ? 'variant-filled-tertiary' : option.value === 'Central' ? 'variant-soft-tertiary' : option.value === 'Secondaire' ? 'variant-soft-surface' : 'variant-ghost'} {selectedCentralities.includes(option.value) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => toggleCentrality(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedCentralities.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3 hover-lift" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
  {/if}
</div>

<style>
  .chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
    }
    
    @media (max-width: 480px) {
      padding: 0.15rem 0.5rem;
      font-size: 0.65rem;
    }
  }
  
  .chip::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  
  .chip:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip:hover::before {
    opacity: 1;
  }
  
  .chip.hover-glow {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 
      var(--shadow-lg),
      0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  /* Responsive title adjustments */
  .responsive-title {
    @media (max-width: 768px) {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
  }
</style>