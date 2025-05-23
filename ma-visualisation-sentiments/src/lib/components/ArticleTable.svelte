<script lang="ts">
  import { onDestroy } from 'svelte'; // createEventDispatcher will be removed
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  // Props - for event dispatching
  let { onShowDetails }: { onShowDetails: (details: { article: Article, position: {x: number, y: number} }) => void } = $props();

  let articles = $state<Article[]>([]);
  // Update articles when filteredArticles changes
  $effect(() => {
    const unsubscribe = filteredArticles.subscribe(value => {
      articles = value;
    });
    return unsubscribe; // Cleanup subscription
  });

  // Variables pour le tri
  let sortColumn = $state<string>('titre');
  let sortDirection = $state<'asc' | 'desc'>('asc');

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
        valA = a.journal_source || '';
        valB = b.journal_source || '';
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

  // onDestroy is no longer needed for the store subscription as $effect handles cleanup
</script>

{#if articles.length > 0}
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
        {#each sortedArticles as article (article['o:id'])}
          <tr 
            title="Cliquez pour voir les détails"
            onclick={(event) => selectArticle(article, event)} 
          >
            <td>{article['o:title']}</td>
            <td>{article.journal_source}</td>
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
  
  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }
  
  .sortable-header:hover {
    background-color: rgba(255, 255, 255, 0.1);
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