<script lang="ts">
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
  import DatasetBadge from './ui/DatasetBadge.svelte';
  import { updateURL } from '$lib/urlState';

  // Props - for event dispatching
  let { onShowDetails }: { onShowDetails: (details: { article: Article, position: {x: number, y: number} }) => void } = $props();

  let articles = $state<Article[]>([]);
  let isMobile = $state(false);
  
  // Update articles when filteredArticles changes
  $effect(() => {
    const unsubscribe = filteredArticles.subscribe(value => {
      articles = value;
      // Réinitialiser à la première page quand les articles changent (filtres appliqués)
      currentPage = 1;
    });
    return unsubscribe; // Cleanup subscription
  });

  // Modern Svelte 5 approach using $effect instead of onMount
  $effect(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  // Variables pour le tri
  let sortColumn = $state<string>('titre');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  // Variables pour la pagination
  let currentPage = $state<number>(1);
  let itemsPerPage = $state<number>(50); // 50 articles par page par défaut
  let itemsPerPageOptions = [25, 50, 100, 200];
  
  // Référence pour le conteneur du tableau
  let tableContainerRef = $state<HTMLElement | undefined>();

  // État pour le tooltip/popup - These seem unused in the provided snippet, but will be converted if used elsewhere in the full component
  let showDetails = $state(false);
  let detailsX = $state(0);
  let detailsY = $state(0);
  
  // Dispatcher is removed

  function selectArticle(article: Article, event: MouseEvent) {
    selectedArticle.set(article);
    
    // Update URL to include the selected article ID
    updateURL(undefined, true);
    
    // Notifier le parent de montrer les détails via callback prop
    if (onShowDetails) {
      onShowDetails({
        article, // Ensure article is passed as per the prop type
        position: { x: event.clientX, y: event.clientY }
      });
    }
  }

  // Semantic CSS classes for polarity (from app.postcss)
  const polarityColors = {
    'Très positif': 'sentiment-very-positive',
    'Positif': 'sentiment-positive',
    'Neutre': 'sentiment-neutral',
    'Négatif': 'sentiment-negative',
    'Très négatif': 'sentiment-very-negative',
    'Non applicable': 'sentiment-na'
  };

  // Ordre de tri pour les valeurs de polarité
  const polarityOrder = {
    'Très positif': 5,
    'Positif': 4,
    'Neutre': 3,
    'Négatif': 2,
    'Très négatif': 1,
    'Non applicable': 0
  };

  // Semantic CSS classes for centrality (from app.postcss)
  const centralityColors = {
    'Très central': 'centrality-very-central',
    'Central': 'centrality-central',
    'Secondaire': 'centrality-secondary',
    'Marginal': 'centrality-marginal',
    'Non abordé': 'centrality-not-addressed'
  };

  // Ordre de tri pour les valeurs de centralité
  const centralityOrder = {
    'Très central': 5,
    'Central': 4,
    'Secondaire': 3,
    'Marginal': 2,
    'Non abordé': 1
  };
  
  // Semantic CSS classes for subjectivity (from app.postcss)
  const subjectivityClasses = {
    '1': 'subjectivity-1',
    '2': 'subjectivity-2',
    '3': 'subjectivity-3',
    '4': 'subjectivity-4',
    '5': 'subjectivity-5'
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
  
  // Fonction d'aide pour obtenir la classe selon le score de subjectivité
  function getSubjectivityClass(score: string | number | null | undefined): string {
    if (!score) return 'variant-ghost';
    const scoreStr = String(score);
    return subjectivityClasses[scoreStr as keyof typeof subjectivityClasses] || 'variant-ghost';
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
      
      // Formater la date au format localisé selon la langue courante
      const locale = $currentLanguage === 'en' ? 'en-US' : 'fr-FR';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return dateStr;
    }
  }

  // Fonction pour changer la colonne de tri
  function sortBy(column: string) {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouvelle colonne de tri, direction par défaut ascendante
      sortColumn = column;
      sortDirection = 'asc';
    }
    // Réinitialiser à la première page après un tri
    currentPage = 1;
  }

  // Fonction pour trier les articles
  const sortedArticles = $derived([...articles].sort((a, b) => {
    let valA, valB;
    
    // Extraction des valeurs selon la colonne
    switch(sortColumn) {
      case 'titre':
        valA = a['o:title'] || '';
        valB = b['o:title'] || '';
        break;
      case 'journal':
        valA = getJournalName(a);
        valB = getJournalName(b);
        break;
      case 'date':
        valA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
        valB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
        break;
      case 'centralite':
        const centralA = a.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé';
        const centralB = b.sentiment_analysis?.centralite_islam_musulmans || 'Non abordé';
        valA = centralityOrder[centralA as keyof typeof centralityOrder] || 0;
        valB = centralityOrder[centralB as keyof typeof centralityOrder] || 0;
        break;
      case 'polarite':
        const polA = a.sentiment_analysis?.polarite || 'Non applicable';
        const polB = b.sentiment_analysis?.polarite || 'Non applicable';
        valA = polarityOrder[polA as keyof typeof polarityOrder] || 0;
        valB = polarityOrder[polB as keyof typeof polarityOrder] || 0;
        break;
      case 'subjectivite':
        valA = Number(a.sentiment_analysis?.subjectivite_score || 0);
        valB = Number(b.sentiment_analysis?.subjectivite_score || 0);
        break;
      default:
        return 0;
    }
    
    // Comparaison en fonction de la direction
    if (sortDirection === 'asc') {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    }
  }));

  // Calculs pour la pagination
  const totalItems = $derived(sortedArticles.length);
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
  const startIndex = $derived((currentPage - 1) * itemsPerPage);
  const endIndex = $derived(Math.min(startIndex + itemsPerPage, totalItems));
  
  // Articles paginés
  const paginatedArticles = $derived(sortedArticles.slice(startIndex, endIndex));

  // Fonction pour faire défiler vers le haut du tableau
  function scrollToTop() {
    if (tableContainerRef) {
      tableContainerRef.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  // Fonctions de navigation
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      // Faire défiler vers le haut après changement de page
      setTimeout(scrollToTop, 100);
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      setTimeout(scrollToTop, 100);
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      setTimeout(scrollToTop, 100);
    }
  }

  function changeItemsPerPage(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1; // Réinitialiser à la première page
    setTimeout(scrollToTop, 100);
  }

  // Générer les numéros de pages à afficher
  const visiblePages = $derived.by(() => {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si le nombre total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // Ajuster si on est près du début ou de la fin
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      } else if (currentPage > totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  });

</script>

{#if articles.length > 0}
  <!-- Dataset badge -->
  <div class="mb-4">
    <DatasetBadge size="sm" />
  </div>
  
  <!-- Informations et contrôles de pagination (en haut) -->
  <div bind:this={tableContainerRef} class="pagination-info mb-4">
    <!-- Première ligne : Informations et sélecteur -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3">
      <span class="text-xs sm:text-sm text-white">
        {$t.table.showingItems} {startIndex + 1} à {endIndex} sur {totalItems} {$t.common.articles}
      </span>
      <div class="flex items-center gap-2">
        <label for="items-per-page" class="text-xs sm:text-sm text-white whitespace-nowrap">{$t.table.itemsPerPage}:</label>
        <select 
          id="items-per-page"
          bind:value={itemsPerPage}
          onchange={(e) => changeItemsPerPage(Number((e.target as HTMLSelectElement)?.value))}
          class="select select-sm bg-surface-700 text-white border-surface-500"
        >
          {#each itemsPerPageOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Deuxième ligne : Navigation de pagination centrée -->
    <div class="flex justify-center">
      <div class="pagination-controls flex items-center gap-1 sm:gap-2">
        <button 
          class="btn btn-sm variant-soft-surface" 
          onclick={previousPage}
          disabled={currentPage === 1}
          title={$t.common.previous || 'Previous page'}
        >
          {isMobile ? '←' : '←'}
        </button>
        
        {#each visiblePages as page}
          <button 
            class="btn btn-sm {page === currentPage ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => goToPage(page)}
          >
            {page}
          </button>
        {/each}
        
        <button 
          class="btn btn-sm variant-soft-surface" 
          onclick={nextPage}
          disabled={currentPage === totalPages}
          title={$t.common.next || 'Next page'}
        >
          {isMobile ? '→' : '→'}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Card View -->
  {#if isMobile}
    <!-- Mobile Sort Controls -->
    <div class="mobile-sort-controls mb-4 p-3 card variant-glass">
      <div class="flex items-center gap-2">
        <label for="mobile-sort-select" class="text-xs text-white whitespace-nowrap">{$t.common.sortBy}:</label>
        <select 
          id="mobile-sort-select"
          bind:value={sortColumn}
          onchange={() => currentPage = 1}
          class="select select-sm bg-surface-700 text-white border-surface-500 flex-1"
        >
          <option value="titre">{$t.table.articleTitle}</option>
          <option value="journal">{$t.filters.journal}</option>
          <option value="date">{$t.table.date}</option>
          <option value="centralite">{$t.table.centrality}</option>
          <option value="polarite">{$t.table.polarity}</option>
          <option value="subjectivite">{$t.table.subjectivity}</option>
        </select>
        <button 
          class="btn btn-sm variant-soft-surface"
          onclick={() => { sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'; currentPage = 1; }}
          title={$t.table.sortBy}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>

    <div class="mobile-cards space-y-3">
      {#each paginatedArticles as article (article['o:id'])}
        <button 
          class="mobile-card card variant-glass p-4 cursor-pointer hover:bg-surface-800/50 transition-colors w-full text-left border-0"
          onclick={(event) => selectArticle(article, event)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const mouseEvent = new MouseEvent('click', {
                clientX: 0,
                clientY: 0,
                bubbles: true
              });
              selectArticle(article, mouseEvent);
            }
          }}
          aria-label="{$t.table.viewDetails}: {article['o:title']}"
        >
          <div class="mb-2">
            <h3 class="text-sm font-semibold text-white line-clamp-2 mb-1">
              {article['o:title']}
            </h3>
            <div class="flex items-center gap-2 text-xs text-white/70">
              <span>{getJournalName(article)}</span>
              <span>•</span>
              <span>{formatDate(article.publication_date)}</span>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-sm {getCentralityClass(article.sentiment_analysis?.centralite_islam_musulmans)}">
              {translateSentimentValue(article.sentiment_analysis?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
            </span>
            <span class="badge badge-sm {getPolarityClass(article.sentiment_analysis?.polarite)}">
              {translateSentimentValue(article.sentiment_analysis?.polarite, $currentLanguage) || 'N/A'}
            </span>
            <span class="badge badge-sm {getSubjectivityClass(article.sentiment_analysis?.subjectivite_score)}">
              {$t.table.subjectivity}: {translateSubjectivityScore(article.sentiment_analysis?.subjectivite_score, $currentLanguage)}
            </span>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Desktop Table View -->
    <div class="table-container card variant-glass">
      <table class="table">
        <thead>
          <tr class="bg-surface-800">
            <th class="text-white sortable-header" onclick={() => sortBy('titre')}>
              {$t.table.articleTitle} {sortColumn === 'titre' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="text-white sortable-header" onclick={() => sortBy('journal')}>
              {$t.filters.journal} {sortColumn === 'journal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="text-white sortable-header" onclick={() => sortBy('date')}>
              {$t.table.date} {sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="text-white sortable-header" onclick={() => sortBy('centralite')}>
              {$t.table.centrality} {sortColumn === 'centralite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="text-white sortable-header" onclick={() => sortBy('polarite')}>
              {$t.table.polarity} {sortColumn === 'polarite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="text-white sortable-header" onclick={() => sortBy('subjectivite')}>
              {$t.table.subjectivity} {sortColumn === 'subjectivite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedArticles as article (article['o:id'])}
            <tr 
              class="article-row"
              title={$t.table.viewDetails}
              onclick={(event) => selectArticle(article, event)} 
            >
              <td class="article-title">{article['o:title']}</td>
              <td>{getJournalName(article)}</td>
              <td>{formatDate(article.publication_date)}</td>
              <td>
                <span class="badge {getCentralityClass(article.sentiment_analysis?.centralite_islam_musulmans)}">
                  {translateSentimentValue(article.sentiment_analysis?.centralite_islam_musulmans, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td>
                <span class="badge {getPolarityClass(article.sentiment_analysis?.polarite)}">
                  {translateSentimentValue(article.sentiment_analysis?.polarite, $currentLanguage) || 'N/A'}
                </span>
              </td>
              <td>
                <span class="badge {getSubjectivityClass(article.sentiment_analysis?.subjectivite_score)}">
                  {translateSubjectivityScore(article.sentiment_analysis?.subjectivite_score, $currentLanguage)}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Navigation de pagination (en bas) -->
  <div class="pagination-bottom mt-4 flex items-center justify-center">
    <div class="pagination-controls flex items-center gap-2">
      <button 
        class="btn btn-sm variant-soft-surface" 
        onclick={previousPage}
        disabled={currentPage === 1}
        title={$t.common.previous}
      >
        ← {$t.common.previous}
      </button>
      
      <span class="text-sm text-white px-4">
        Page {currentPage} sur {totalPages}
      </span>
      
      <button 
        class="btn btn-sm variant-soft-surface" 
        onclick={nextPage}
        disabled={currentPage === totalPages}
        title={$t.common.next}
      >
        {$t.common.next} →
      </button>
    </div>
  </div>
{:else}
  <p class="text-center py-8 text-white">{$t.table.noFilteredArticles}</p>
{/if}

<style>
  .table-container {
    max-height: 600px;
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
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  /* Styles pour les lignes d'articles cliquables */
  .article-row {
    cursor: pointer;
    transition: background-color var(--timing-fast) var(--easing-default);
  }

  .article-row:hover {
    background-color: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
  }

  .article-title {
    cursor: pointer;
    transition: color var(--timing-fast) var(--easing-default);
  }

  .article-title:hover {
    color: var(--color-primary-400);
    text-decoration: underline;
    font-weight: 500;
  }
  
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--color-surface-800);
    box-shadow: 0 1px 0 color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }
  
  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color var(--timing-fast) var(--easing-default);
  }
  
  .sortable-header:hover {
    background-color: color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  /* Styles pour la pagination */
  .pagination-info {
    background: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .pagination-controls button {
    min-width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
  }

  /* Mobile card styles */
  .mobile-cards {
    max-height: 600px;
    overflow-y: auto;
  }

  .mobile-card {
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .badge-sm {
    padding: 0.125rem 0.375rem;
    font-size: 0.625rem;
    font-weight: 500;
    border-radius: 9999px;
  }

  /* Responsive design pour la pagination */
  @media (max-width: 768px) {
    .pagination-info {
      padding: 0.5rem;
    }
    
    .pagination-controls {
      gap: 0.25rem;
    }
    
    .pagination-controls button {
      min-width: 2rem;
      height: 2rem;
      font-size: 0.75rem;
      padding: 0.25rem;
    }

    .table-container {
      max-height: 500px;
    }

    th, td {
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .badge {
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
    }
  }

  /* Extra small screens */
  @media (max-width: 480px) {
    .pagination-controls button {
      min-width: 1.75rem;
      height: 1.75rem;
      font-size: 0.625rem;
    }

    .mobile-card {
      padding: 0.75rem;
    }

    .mobile-card h3 {
      font-size: 0.875rem;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .article-row,
    .article-title,
    .sortable-header {
      transition: none;
    }
  }
</style>