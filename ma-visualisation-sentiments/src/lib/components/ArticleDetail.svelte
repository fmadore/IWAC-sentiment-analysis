<script lang="ts">
  import { selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  // Définition des classes de polarité selon les variantes Skeleton
  const polarityClasses = {
    'Très positif': 'variant-filled-success',
    'Positif': 'variant-soft-success',
    'Neutre': 'variant-soft-primary',
    'Négatif': 'variant-soft-error',
    'Très négatif': 'variant-filled-error',
    'Non applicable': 'variant-ghost'
  };

  // Définition des classes de centralité
  const centralityClasses = {
    'Très central': 'variant-filled-tertiary',
    'Central': 'variant-soft-tertiary',
    'Secondaire': 'variant-soft-surface',
    'Marginal': 'variant-ghost',
    'Non abordé': 'variant-ghost'
  };

  // Fonction d'aide pour obtenir la classe selon la polarité
  function getPolarityClass(polarity: string | null | undefined): string {
    if (!polarity) return 'variant-ghost';
    return polarityClasses[polarity as keyof typeof polarityClasses] || 'variant-ghost';
  }

  // Fonction d'aide pour obtenir la classe selon la centralité
  function getCentralityClass(centrality: string | null | undefined): string {
    if (!centrality) return 'variant-ghost';
    return centralityClasses[centrality as keyof typeof centralityClasses] || 'variant-ghost';
  }

  // Fonction pour formater les dates
  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Date non disponible';
    
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

  // Fonction pour construire l'URL de l'article complet
  function getArticleUrl(id: string | number | null | undefined): string {
    if (!id) return '#';
    return `https://islam.zmo.de/s/afrique_ouest/item/${id}`;
  }
</script>

{#if $selectedArticle}
  <div class="space-y-6 p-2">
    <h3 class="h3 text-white">{$selectedArticle['o:title'] ?? 'Titre non disponible'}</h3>
    
    <div class="grid grid-cols-2 gap-3">
      <div class="card variant-soft-surface p-3">
        <span class="text-sm uppercase font-bold opacity-75">Journal</span>
        <p class="text-white mt-1">{$selectedArticle.journal_source ?? 'Source non disponible'}</p>
      </div>
      <div class="card variant-soft-surface p-3">
        <span class="text-sm uppercase font-bold opacity-75">Date de publication</span>
        <p class="text-white mt-1">{formatDate($selectedArticle.publication_date)}</p>
      </div>
    </div>

    <div class="card variant-soft-surface p-3">
      <span class="text-sm uppercase font-bold opacity-75">Lien vers l'article complet</span>
      <p class="text-white mt-1">
        <a href={getArticleUrl($selectedArticle['o:id'])} target="_blank" class="anchor">
          Consulter l'article original
        </a>
      </p>
    </div>
    
    {#if $selectedArticle.sentiment_analysis}
      <!-- Centralité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge {getCentralityClass($selectedArticle.sentiment_analysis.centralite_islam_musulmans)}">
            {$selectedArticle.sentiment_analysis.centralite_islam_musulmans ?? 'Non abordé'}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Centralité de l'islam/musulmans</span>
        </div>
        
        {#if $selectedArticle.sentiment_analysis.centralite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {$selectedArticle.sentiment_analysis.centralite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Polarité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge {getPolarityClass($selectedArticle.sentiment_analysis.polarite)}">
            {$selectedArticle.sentiment_analysis.polarite}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Polarité</span>
        </div>
        
        {#if $selectedArticle.sentiment_analysis.polarite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {$selectedArticle.sentiment_analysis.polarite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Subjectivité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge variant-soft-primary">
            {$selectedArticle.sentiment_analysis.subjectivite_score}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Score de Subjectivité</span>
        </div>
        
        {#if $selectedArticle.sentiment_analysis.subjectivite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {$selectedArticle.sentiment_analysis.subjectivite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
    {:else}
      <div class="card variant-ghost p-4 text-center">
        <p class="text-white">Les données d'analyse des sentiments ne sont pas disponibles pour cet article.</p>
      </div>
    {/if}
  </div>
{:else}
  <div class="card variant-ghost p-6 flex items-center justify-center min-h-[200px]">
    <p class="text-white text-center">Sélectionnez un article dans le tableau pour voir les détails.</p>
  </div>
{/if}

<style>
  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
  }
  
  .anchor {
    color: #3B82F6;
    text-decoration: underline;
    transition: color 0.2s;
  }
  
  .anchor:hover {
    color: #60A5FA;
  }
</style> 