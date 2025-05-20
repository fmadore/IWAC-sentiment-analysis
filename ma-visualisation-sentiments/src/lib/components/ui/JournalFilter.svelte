<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { currentDatasetArticles, journalFilters } from '$lib/stores.ts';
  import type { Article } from '$lib/types/data';

  // Propriété pour référence externe, pas pour l'injection de propriété
  export const class_name = '';
  
  // Variables locales
  let journals: string[] = [];
  let selectedJournals: string[] = [];

  // Souscrire aux changements du dataset
  const unsubscribe = currentDatasetArticles.subscribe(value => {
    // Extraire les journaux uniques
    journals = [...new Set(value.map(article => article.journal_source).filter(Boolean))] as string[];
    journals.sort(); // Trier par ordre alphabétique
  });

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

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div class="card variant-glass p-4">
  <h3 class="h4 mb-4 text-white">Journal</h3>
  
  <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
    {#each journals as journal}
      <button 
        class="chip variant-soft-primary {selectedJournals.includes(journal) ? 'ring-2 ring-primary-500' : ''}" 
        on:click={() => toggleJournal(journal)}
      >
        {journal}
      </button>
    {/each}
  </div>

  {#if selectedJournals.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3" 
      on:click={() => {selectedJournals = []; applyFilter();}}
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
    white-space: nowrap;
  }
  
  .chip:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
</style> 