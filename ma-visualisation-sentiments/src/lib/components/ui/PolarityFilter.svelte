<script lang="ts">
  import { polarityFilters } from '$lib/stores.ts';
  import { t, currentLanguage } from '$lib/i18n';
  import { getSentimentLabels, getFrenchSentimentValue } from '$lib/i18n/utils';

  // French values for data storage
  const frenchPolarityOptions = [
    { value: 'Très positif', class: 'variant-filled-success' },
    { value: 'Positif', class: 'variant-soft-success' },
    { value: 'Neutre', class: 'variant-soft-primary' },
    { value: 'Négatif', class: 'variant-soft-error' },
    { value: 'Très négatif', class: 'variant-filled-error' },
    { value: 'Non applicable', class: 'variant-ghost' }
  ];

  // Get translated labels
  let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
  
  // Create options with translated labels
  let polarityOptions = $derived(frenchPolarityOptions.map((option, index) => ({
    ...option,
    label: polarityLabels[index]
  })));
  
  let selectedPolarities = $state<string[]>([]);
  
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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">{$t.filters.polarity}</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each polarityOptions as option}
      <button 
        class="chip hover-lift {option.class} {selectedPolarities.includes(option.label) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => togglePolarity(option.label)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedPolarities.length > 0}
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