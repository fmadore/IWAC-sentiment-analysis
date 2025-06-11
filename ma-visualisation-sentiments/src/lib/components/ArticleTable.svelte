<script lang="ts">
  import { onDestroy } from 'svelte'; // createEventDispatcher will be removed
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';
  import { getJournalName } from '$lib/utils';

  // Props - for event dispatching
  let { onShowDetails }: { onShowDetails: (details: { article: Article, position: {x: number, y: number} }) => void } = $props();

  let articles = $state<Article[]>([]);
  // Update articles when filteredArticles changes
  $effect(() => {
    const unsubscribe = filteredArticles.subscribe(value => {
      articles = value;
      // Réinitialiser à la première page quand les articles changent (filtres appliqués)
      currentPage = 1;
    });
    return unsubscribe; // Cleanup subscription
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
    
    // Notifier le parent de montrer les détails via callback prop
    if (onShowDetails) {
      onShowDetails({
        article, // Ensure article is passed as per the prop type
        position: { x: event.clientX, y: event.clientY }
      });
    }
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

  // Ordre de tri pour les valeurs de polarité
  const polarityOrder = {
    'Très positif': 5,
    'Positif': 4,
    'Neutre': 3,
    'Négatif': 2,
    'Très négatif': 1,
    'Non applicable': 0
  };

  // Définition des couleurs de centralité
  const centralityColors = {
    'Très central': 'variant-filled-tertiary',
    'Central': 'variant-soft-tertiary',
    'Secondaire': 'variant-soft-surface',
    'Marginal': 'variant-ghost',
    'Non abordé': 'variant-ghost'
  };

  // Ordre de tri pour les valeurs de centralité
  const centralityOrder = {
    'Très central': 5,
    'Central': 4,
    'Secondaire': 3,
    'Marginal': 2,
    'Non abordé': 1
  };
  
  // Définition des classes de subjectivité
  const subjectivityClasses = {
    '1': 'variant-filled-success',
    '2': 'variant-soft-success',
    '3': 'variant-soft-primary',
    '4': 'variant-soft-error',
    '5': 'variant-filled-error'
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

  // onDestroy is no longer needed for the store subscription as $effect handles cleanup
</script>

{#if articles.length > 0}
  <!-- Informations et contrôles de pagination (en haut) -->
  <div bind:this={tableContainerRef} class="pagination-info mb-4">
    <!-- Première ligne : Informations et sélecteur -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
      <span class="text-sm text-white">
        Affichage de {startIndex + 1} à {endIndex} sur {totalItems} articles
      </span>
      <div class="flex items-center gap-2">
        <label for="items-per-page" class="text-sm text-white">Articles par page:</label>
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
      <div class="pagination-controls flex items-center gap-2">
        <button 
          class="btn btn-sm variant-soft-surface" 
          onclick={previousPage}
          disabled={currentPage === 1}
          title="Page précédente"
        >
          ←
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
          title="Page suivante"
        >
          →
        </button>
      </div>
    </div>
  </div>

  <div class="table-container card variant-glass">
    <table class="table">
      <thead>
        <tr class="bg-surface-800">
          <th class="text-white sortable-header" onclick={() => sortBy('titre')}>
            Titre {sortColumn === 'titre' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
          <th class="text-white sortable-header" onclick={() => sortBy('journal')}>
            Journal {sortColumn === 'journal' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
          <th class="text-white sortable-header" onclick={() => sortBy('date')}>
            Date {sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
          <th class="text-white sortable-header" onclick={() => sortBy('centralite')}>
            Centralité {sortColumn === 'centralite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
          <th class="text-white sortable-header" onclick={() => sortBy('polarite')}>
            Polarité {sortColumn === 'polarite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
          <th class="text-white sortable-header" onclick={() => sortBy('subjectivite')}>
            Subjectivité {sortColumn === 'subjectivite' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each paginatedArticles as article (article['o:id'])}
          <tr 
            class="article-row"
            title="Cliquez pour voir les détails"
            onclick={(event) => selectArticle(article, event)} 
          >
            <td class="article-title">{article['o:title']}</td>
            <td>{getJournalName(article)}</td>
            <td>{formatDate(article.publication_date)}</td>
            <td>
              <span class="badge {getCentralityClass(article.sentiment_analysis?.centralite_islam_musulmans)}">
                {article.sentiment_analysis?.centralite_islam_musulmans || 'N/A'}
              </span>
            </td>
            <td>
              <span class="badge {getPolarityClass(article.sentiment_analysis?.polarite)}">
                {article.sentiment_analysis?.polarite || 'N/A'}
              </span>
            </td>
            <td>
              <span class="badge {getSubjectivityClass(article.sentiment_analysis?.subjectivite_score)}">
                {article.sentiment_analysis?.subjectivite_score || 'N/A'}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Navigation de pagination (en bas) -->
  <div class="pagination-bottom mt-4 flex items-center justify-center">
    <div class="pagination-controls flex items-center gap-2">
      <button 
        class="btn btn-sm variant-soft-surface" 
        onclick={previousPage}
        disabled={currentPage === 1}
        title="Page précédente"
      >
        ← Précédent
      </button>
      
      <span class="text-sm text-white px-4">
        Page {currentPage} sur {totalPages}
      </span>
      
      <button 
        class="btn btn-sm variant-soft-surface" 
        onclick={nextPage}
        disabled={currentPage === totalPages}
        title="Page suivante"
      >
        Suivant →
      </button>
    </div>
  </div>
{:else}
  <p class="text-center py-8 text-white">Aucun article à afficher avec les filtres actuels.</p>
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Styles pour les lignes d'articles cliquables */
  .article-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .article-row:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .article-title {
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .article-title:hover {
    color: #60A5FA;
    text-decoration: underline;
    font-weight: 500;
  }
  
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: rgb(38, 41, 65); /* Couleur solide pour l'en-tête */
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  
  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }
  
  .sortable-header:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* Styles pour la pagination */
  .pagination-info {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
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

  /* Responsive design pour la pagination */
  @media (max-width: 768px) {
    .pagination-info {
      padding: 0.75rem;
    }
    
    .pagination-info > div:first-child {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .pagination-controls {
      gap: 0.25rem;
    }
    
    .pagination-controls button {
      min-width: 2.25rem;
      height: 2.25rem;
      font-size: 0.875rem;
    }
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