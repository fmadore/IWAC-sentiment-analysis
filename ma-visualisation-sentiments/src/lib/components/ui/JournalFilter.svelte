<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { availableJournals, journalFilters } from '$lib/stores.ts';
  import { t } from '$lib/i18n';

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
    <h3 class="h4 text-white responsive-title">{$t.filters.journal}</h3>
    <span class="text-sm text-white/60">({journals.length})</span>
  </div>
  
  <!-- Barre de recherche -->
  {#if journals.length > 6}
    <div class="mb-3">
      <div class="relative">
        <input 
          type="text" 
          placeholder={$t.filters.searchJournals}
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
      {$t.filters.showingJournals} {filteredJournals.length} {$t.filters.of} {journals.length}
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
      {showAll ? `${$t.common.viewLess} (${INITIAL_DISPLAY_COUNT})` : `${$t.common.viewMore} (+${filteredJournals.length - INITIAL_DISPLAY_COUNT})`}
    </button>
  {/if}

  <!-- Bouton effacer sélection -->
  {#if selectedJournals.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-1 hover-lift" 
      onclick={() => {selectedJournals = []; applyFilter();}}
    >
      {$t.filters.clearAll} ({selectedJournals.length})
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
  
  .input {
    border-radius: var(--radius-md);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    transition: all var(--transition-normal);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
    }
  }
  
  .input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    background: var(--glass-hover-bg);
    box-shadow: 
      0 0 0 3px rgba(59, 130, 246, 0.1),
      var(--shadow-md);
  }
  
  .input:hover {
    border-color: var(--glass-hover-border);
    background: var(--glass-hover-bg);
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