<script lang="ts">
  import { onDestroy } from 'svelte';
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  let articles: Article[] = [];
  const unsubscribeFiltered = filteredArticles.subscribe(value => {
    articles = value;
  });

  function selectArticle(article: Article) {
    selectedArticle.set(article);
  }

  onDestroy(() => {
    unsubscribeFiltered();
  });
</script>

{#if articles.length > 0}
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Titre</th>
          <th>Journal</th>
          <th>Date de publication</th>
          <th>Polarité</th>
        </tr>
      </thead>
      <tbody>
        {#each articles as article (article['o:id'])}
          <tr on:click={() => selectArticle(article)} class:selected={$selectedArticle && $selectedArticle['o:id'] === article['o:id']}>
            <td>{article['o:title'] ?? 'N/A'}</td>
            <td>{article.journal_source ?? 'N/A'}</td>
            <td>{article.publication_date ?? 'N/A'}</td>
            <td>{article.sentiment_analysis?.polarite ?? 'N/A'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p>Aucun article à afficher avec les filtres actuels.</p>
{/if}

<style>
  .table-container {
    max-height: 400px; /* Adjust as needed */
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 1em;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border-bottom: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    position: sticky;
    top: 0; /* Makes header sticky */
    z-index: 1;
  }
  tbody tr:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }
  tbody tr.selected {
    background-color: #e0e0e0; /* Highlight for selected row */
  }
</style> 