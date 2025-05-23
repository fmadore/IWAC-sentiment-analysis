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

<div class="card variant-glass p-4">
  <h3 class="h4 mb-4 text-white">Polarité</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each polarityOptions as option}
      <button 
        class="chip {option.class} {selectedPolarities.includes(option.value) ? 'ring-2 ring-primary-500' : ''}" 
        onclick={() => togglePolarity(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedPolarities.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3" 
      onclick={clearSelection}
    >
      Effacer sélection
    </button>
  {/if}
</div>

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chip:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
</style>