<script lang="ts">
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  let articles: Article[] = [];
  const unsubscribeFiltered = filteredArticles.subscribe(value => {
    articles = value;
  });

  // État pour le tooltip/popup
  let showDetails = false;
  let detailsX = 0;
  let detailsY = 0;
  
  // Dispatcher pour communiquer avec le parent
  const dispatch = createEventDispatcher();

  function selectArticle(article: Article, event: MouseEvent) {
    selectedArticle.set(article);
    
    // Notifier le parent de montrer les détails
    dispatch('showDetails', {
      article,
      position: { x: event.clientX, y: event.clientY }
    });
  }

  // Définition des couleurs de polarité pour les badges
  const polarityColors = {
    'Très positif': 'variant-filled-success',
    'Positif': 'variant-soft-success',
    'Neutre': 'variant-soft-primary',
    'Négatif': 'variant-soft-error',
    'Très négatif': 'variant-filled-error',
    'Non applicable': 'variant-ghost'
  };

  // Fonction d'aide pour obtenir la classe selon la polarité
  function getPolarityClass(polarity: string | null | undefined): string {
    if (!polarity) return 'variant-ghost';
    return polarityColors[polarity as keyof typeof polarityColors] || 'variant-ghost';
  }

  onDestroy(() => {
    unsubscribeFiltered();
  });
</script>

{#if articles.length > 0}
  <div class="table-container card variant-glass">
    <table class="table">
      <thead>
        <tr class="bg-surface-700/50">
          <th class="text-white">Titre</th>
          <th class="text-white">Journal</th>
          <th class="text-white">Date</th>
          <th class="text-white">Polarité</th>
        </tr>
      </thead>
      <tbody>
        {#each articles as article (article['o:id'])}
          <tr 
            on:click={(e) => selectArticle(article, e)} 
            class="hover:bg-primary-500/20 cursor-pointer {$selectedArticle && $selectedArticle['o:id'] === article['o:id'] ? 'bg-primary-500/30' : ''}"
            title="Cliquez pour voir les détails"
          >
            <td class="text-white">{article['o:title'] ?? 'N/A'}</td>
            <td class="text-white">{article.journal_source ?? 'N/A'}</td>
            <td class="text-white">{article.publication_date ?? 'N/A'}</td>
            <td>
              <span class="badge {getPolarityClass(article.sentiment_analysis?.polarite)}">
                {article.sentiment_analysis?.polarite ?? 'N/A'}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="text-center py-8 text-white">Aucun article à afficher avec les filtres actuels.</p>
{/if}

<style>
  .table-container {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  /* Classes spécifiques pour les polarités */
  :global(.variant-filled-success) {
    background-color: #10B981 !important;
    color: white !important;
  }
  
  :global(.variant-soft-success) {
    background-color: rgba(16, 185, 129, 0.2) !important;
    color: #10B981 !important;
  }
  
  :global(.variant-soft-primary) {
    background-color: rgba(59, 130, 246, 0.2) !important;
    color: #3B82F6 !important;
  }
  
  :global(.variant-soft-error) {
    background-color: rgba(239, 68, 68, 0.2) !important;
    color: #EF4444 !important;
  }
  
  :global(.variant-filled-error) {
    background-color: #EF4444 !important;
    color: white !important;
  }
  
  :global(.variant-ghost) {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: #E5E7EB !important;
  }
</style> 