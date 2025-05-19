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

<div class="card p-6 shadow space-y-4 {class_name} bg-primary-500 text-primary-contrast-500">
  <label for="journal-filter" class="label">
    <span>Filtrer par Journal :</span>
  </label>
  {#if $uniqueJournals.length > 0}
    <select id="journal-filter" multiple on:change={handleChange} class="select bg-surface-200-700 text-surface-900-50">
      {#each $uniqueJournals as journal (journal)}
        <option value={journal} selected={$journalFilter.includes(journal)}>{journal}</option>
      {/each}
    </select>
    <button type="button" class="btn btn-sm preset-tonal-surface" on:click={() => journalFilter.set([])} title="Réinitialiser le filtre journal">
      Effacer sélection
    </button>
  {:else}
    <p class="text-sm opacity-70">Aucun journal à filtrer pour ce dataset.</p>
  {/if}
</div>
<style>
  /* Removed previous .filter-group style as card provides structure */
  /* .filter-group {display: flex; flex-direction: column; gap: 5px;} */
</style> 