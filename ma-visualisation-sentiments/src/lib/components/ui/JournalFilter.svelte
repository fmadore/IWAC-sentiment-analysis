<!-- Composant JournalFilter.svelte --> 
<script lang="ts">
  import { currentDatasetArticles, journalFilter } from '$lib/stores.ts'; // Ajustez chemin
  import { derived } from 'svelte/store';
  import type { Article } from '$lib/types/data.ts'; // Importer Article

  export let class_name = ''; // Added prop

  const uniqueJournals = derived(currentDatasetArticles, ($articles: Article[]) => {
    const journals = new Set<string>();
    $articles.forEach((article: Article) => {
      if (article.journal_source) journals.add(article.journal_source);
    });
    return Array.from(journals).sort();
  });

  // Gérer la sélection multiple (par exemple, avec des checkboxes)
  // Ici, un simple select multiple pour l'exemple
  function handleChange(event: Event) {
      const selectedOptions = Array.from((event.target as HTMLSelectElement).selectedOptions);
      journalFilter.set(selectedOptions.map(opt => opt.value));
  }
</script>

<div class="card card-enhanced glossy p-6 space-y-4 {class_name} bg-primary-500 text-primary-contrast-500">
  <h3 class="font-bold text-xl">Filtrer par Journal :</h3>
  {#if $uniqueJournals.length > 0}
    <select id="journal-filter" multiple on:change={handleChange} class="select bg-surface-200-700 text-surface-900-50 rounded-lg border border-primary-300 min-h-[120px]">
      {#each $uniqueJournals as journal (journal)}
        <option value={journal} selected={$journalFilter.includes(journal)}>{journal}</option>
      {/each}
    </select>
    <button type="button" class="btn btn-sm btn-enhanced bg-surface-300-600 hover:bg-surface-400-500" on:click={() => journalFilter.set([])} title="Réinitialiser le filtre journal">
      Effacer sélection
    </button>
  {:else}
    <p class="text-sm opacity-80">Aucun journal à filtrer pour ce dataset.</p>
  {/if}
</div>
<style>
  /* Removed previous .filter-group style as card provides structure */
  /* .filter-group {display: flex; flex-direction: column; gap: 5px;} */
</style> 