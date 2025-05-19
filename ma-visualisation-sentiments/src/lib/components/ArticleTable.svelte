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

  // Définition des couleurs de centralité
  const centralityColors = {
    'Très central': 'variant-filled-tertiary',
    'Central': 'variant-soft-tertiary',
    'Secondaire': 'variant-soft-surface',
    'Marginal': 'variant-ghost',
    'Non abordé': 'variant-ghost'
  };

  // Fonction d'aide pour obtenir la classe selon la polarité
  function getPolarityClass(polarity: string | null | undefined): string {
    if (!polarity) return 'variant-ghost';
    return polarityColors[polarity as keyof typeof polarityColors] || 'variant-ghost';
  }

  // Fonction d'aide pour obtenir la classe selon la centralité
  function getCentralityClass(centrality: string | null | undefined): string {
    if (!centrality) return 'variant-ghost';
    return centralityColors[centrality as keyof typeof centralityColors] || 'variant-ghost';
  }

  // Fonction pour formater les dates
  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    
    try {
      // Gérer différents formats de date possibles
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Si la date n'est pas valide, renvoyer la chaîne originale
        return dateStr;
      }
      
      // Formater la date au format localisé (jour/mois/année)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return dateStr;
    }
  }

  onDestroy(() => {
    unsubscribeFiltered();
  });
</script>

{#if articles.length > 0}
  <div class="table-container card variant-glass">
    <table class="table">
      <thead>
        <tr class="bg-surface-800">
          <th class="text-white">Titre</th>
          <th class="text-white">Journal</th>
          <th class="text-white">Date</th>
          <th class="text-white">Centralité</th>
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
            <td class="text-white">{formatDate(article.publication_date)}</td>
            <td>
              <span class="badge {getCentralityClass(article.sentiment_analysis?.centralite_islam_musulmans)}">
                {article.sentiment_analysis?.centralite_islam_musulmans ?? 'Non abordé'}
              </span>
            </td>
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
    background-color: rgb(38, 41, 65); /* Couleur solide pour l'en-tête */
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
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

  /* Classes pour les centralités */
  :global(.variant-filled-tertiary) {
    background-color: #8B5CF6 !important;
    color: white !important;
  }
  
  :global(.variant-soft-tertiary) {
    background-color: rgba(139, 92, 246, 0.2) !important;
    color: #8B5CF6 !important;
  }
  
  :global(.variant-soft-surface) {
    background-color: rgba(100, 116, 139, 0.2) !important;
    color: #94A3B8 !important;
  }
</style> 