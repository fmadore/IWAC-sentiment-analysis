<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { availableJournals, journalFilters } from '$lib/stores.ts';

  // Propriété pour référence externe, pas pour l'injection de propriété
  export const class_name = '';
  
  // Variables locales
  let selectedJournals = $state<string[]>([]);
  let searchTerm = $state('');
  let showAll = $state(false);
  const INITIAL_DISPLAY_COUNT = 8;
  
  let journals = $derived($availableJournals);
  
  // Filtrer les journaux selon le terme de recherche
  let filteredJournals = $derived(
    journals.filter(journal => 
      journal.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Journaux à afficher (limités ou tous selon showAll)
  let displayedJournals = $derived(
    showAll ? filteredJournals : filteredJournals.slice(0, INITIAL_DISPLAY_COUNT)
  );
  
  let hasMoreJournals = $derived(filteredJournals.length > INITIAL_DISPLAY_COUNT);

  // Fonction pour appliquer le filtre
  function applyFilter() {
    journalFilters.set(selectedJournals);
  }

  function toggleJournal(journal: string) {
    if (selectedJournals.includes(journal)) {
      selectedJournals = selectedJournals.filter(j => j !== journal);
    } else {
      selectedJournals = [...selectedJournals, journal];
    }
    applyFilter();
  }
  
  function clearSearch() {
    searchTerm = '';
  }
  
  function toggleShowAll() {
    showAll = !showAll;
  }

</script>

<div class="card variant-glass p-4 hover-lift">
  <div class="flex items-center justify-between mb-4">
    <h3 class="h4 text-white">Journal</h3>
    <span class="text-sm text-white/60">({journals.length})</span>
  </div>
  
  <!-- Barre de recherche -->
  {#if journals.length > 6}
    <div class="mb-3">
      <div class="relative">
        <input 
          type="text" 
          placeholder="Rechercher un journal..." 
          bind:value={searchTerm}
          class="input input-sm w-full pr-8 glass-medium text-white placeholder-white/40"
        />
        {#if searchTerm}
          <button 
            onclick={clearSearch}
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Compteur de résultats -->
  {#if searchTerm}
    <div class="text-sm text-white/70 mb-2">
      {filteredJournals.length} journal{filteredJournals.length !== 1 ? 's' : ''} trouvé{filteredJournals.length !== 1 ? 's' : ''}
    </div>
  {/if}
  
  <!-- Liste des journaux -->
  <div class="flex flex-wrap gap-2 mb-2">
    {#each displayedJournals as journal}
      <button 
        class="chip hover-lift variant-soft-primary {selectedJournals.includes(journal) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => toggleJournal(journal)}
      >
        {journal}
      </button>
    {/each}
  </div>
  
  <!-- Bouton "Voir plus/moins" -->
  {#if hasMoreJournals && !searchTerm}
    <button 
      class="btn btn-sm variant-ghost-surface mb-2 hover-lift" 
      onclick={toggleShowAll}
    >
      {showAll ? `Voir moins (${INITIAL_DISPLAY_COUNT})` : `Voir plus (+${filteredJournals.length - INITIAL_DISPLAY_COUNT})`}
    </button>
  {/if}

  <!-- Bouton effacer sélection -->
  {#if selectedJournals.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-1 hover-lift" 
      onclick={() => {selectedJournals = []; applyFilter();}}
    >
      Effacer sélection ({selectedJournals.length})
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
    white-space: nowrap;
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
  
  .input {
    border-radius: var(--radius-md);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    transition: all var(--transition-normal);
  }
  
  .input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 
      0 0 0 3px rgba(59, 130, 246, 0.1),
      var(--shadow-md);
  }
</style>