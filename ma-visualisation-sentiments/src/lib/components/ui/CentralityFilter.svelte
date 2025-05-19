<script lang="ts">
  import { centralityFilters } from '$lib/stores';

  // Liste des options de centralité
  const centralityOptions = [
    { value: 'Très central', label: 'Très central' },
    { value: 'Central', label: 'Central' },
    { value: 'Secondaire', label: 'Secondaire' },
    { value: 'Marginal', label: 'Marginal' },
    { value: 'Non abordé', label: 'Non abordé' }
  ];

  let selectedCentralities: string[] = [];

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

<div class="card variant-glass p-4">
  <h3 class="h4 mb-3 text-white">Centralité de l'islam/musulmans</h3>
  
  <div class="flex flex-wrap gap-2 mb-2">
    {#each centralityOptions as option}
      <button 
        class="chip {option.value === 'Très central' ? 'variant-filled-tertiary' : option.value === 'Central' ? 'variant-soft-tertiary' : option.value === 'Secondaire' ? 'variant-soft-surface' : 'variant-ghost'} {selectedCentralities.includes(option.value) ? 'ring-2 ring-primary-500' : ''}" 
        on:click={() => toggleCentrality(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if selectedCentralities.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3" 
      on:click={clearSelection}
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