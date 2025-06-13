<script lang="ts">
  import { polarityFilters } from '$lib/stores.ts';

  const polarityOptions = [
    { value: 'Très positif', label: 'Très positif', class: 'variant-filled-success' },
    { value: 'Positif', label: 'Positif', class: 'variant-soft-success' },
    { value: 'Neutre', label: 'Neutre', class: 'variant-soft-primary' },
    { value: 'Négatif', label: 'Négatif', class: 'variant-soft-error' },
    { value: 'Très négatif', label: 'Très négatif', class: 'variant-filled-error' },
    { value: 'Non applicable', label: 'Non applicable', class: 'variant-ghost' }
  ];
  
  let selectedPolarities = $state<string[]>([]);
  
  function updateSelection() {
    polarityFilters.set(selectedPolarities);
  }
  
  function togglePolarity(polarity: string) {
    if (selectedPolarities.includes(polarity)) {
      selectedPolarities = selectedPolarities.filter(p => p !== polarity);
    } else {
      selectedPolarities = [...selectedPolarities, polarity];
    }
    updateSelection();
  }

  function clearSelection() {
    selectedPolarities = [];
    updateSelection();
  }
</script>

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">Polarité</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each polarityOptions as option}
      <button 
        class="chip hover-lift {option.class} {selectedPolarities.includes(option.value) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => togglePolarity(option.value)}
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
      Effacer sélection
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
  
  .chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
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