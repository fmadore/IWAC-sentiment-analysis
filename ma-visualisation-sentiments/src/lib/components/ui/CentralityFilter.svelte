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

  let selectedCentralities: string[] = $state([]);

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
  <h3 class="h4 mb-3 text-white leading-tight">Centralité de l'islam / musulmans</h3>
  
  <div class="flex flex-wrap gap-2 mb-2">
    {#each centralityOptions as option}
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
  }
  
  .chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
</style>