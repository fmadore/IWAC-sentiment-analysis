<script lang="ts">
  // import { selectedArticle } from '$lib/stores'; // Removed store import
  import type { Article } from '$lib/types/data';
  import { getJournalName } from '$lib/utils';

  // Props: Accept article as a prop
  let { article }: { article: Article | null } = $props();

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
    return polarityClasses[polarity as keyof typeof polarityClasses] || 'variant-ghost';
  }

  // Fonction d'aide pour obtenir la classe selon la centralité
  function getCentralityClass(centrality: string | null | undefined): string {
    if (!centrality) return 'variant-ghost';
    return centralityClasses[centrality as keyof typeof centralityClasses] || 'variant-ghost';
  }
  
  // Fonction d'aide pour obtenir la classe selon le score de subjectivité
  function getSubjectivityClass(score: string | number | null | undefined): string {
    if (!score) return 'variant-ghost';
    const scoreStr = String(score);
    return subjectivityClasses[scoreStr as keyof typeof subjectivityClasses] || 'variant-ghost';
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

{#if article}
  <div class="space-y-6 p-2">
    <h3 class="h3 text-white">{article['o:title'] ?? 'Titre non disponible'}</h3>
    
    <div class="grid grid-cols-2 gap-3">
      <div class="card variant-soft-surface p-3">
        <span class="text-sm uppercase font-bold opacity-75">Journal</span>
        <p class="text-white mt-1">{getJournalName(article)}</p>
      </div>
      <div class="card variant-soft-surface p-3">
        <span class="text-sm uppercase font-bold opacity-75">Date de publication</span>
        <p class="text-white mt-1">{formatDate(article.publication_date)}</p>
      </div>
    </div>

    <div class="card variant-soft-surface p-3">
      <span class="text-sm uppercase font-bold opacity-75">Lien vers l'article complet</span>
      <p class="text-white mt-1">
        <a href={getArticleUrl(article['o:id'])} target="_blank" class="anchor">
          Consulter l'article original
        </a>
      </p>
    </div>
    
    {#if article.sentiment_analysis}
      <!-- Centralité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge {getCentralityClass(article.sentiment_analysis.centralite_islam_musulmans)}">
            {article.sentiment_analysis.centralite_islam_musulmans ?? 'Non abordé'}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Centralité de l'islam/musulmans</span>
        </div>
        
        {#if article.sentiment_analysis.centralite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {article.sentiment_analysis.centralite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Polarité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge {getPolarityClass(article.sentiment_analysis.polarite)}">
            {article.sentiment_analysis.polarite}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Polarité</span>
        </div>
        
        {#if article.sentiment_analysis.polarite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {article.sentiment_analysis.polarite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Subjectivité -->
      <div class="card variant-soft-surface p-4">
        <div class="flex items-center mb-3">
          <span class="badge {getSubjectivityClass(article.sentiment_analysis.subjectivite_score)}">
            {article.sentiment_analysis.subjectivite_score}
          </span>
          <span class="ml-2 text-sm uppercase font-bold opacity-75">Score de Subjectivité</span>
        </div>
        
        {#if article.sentiment_analysis.subjectivite_justification}
          <div class="mt-3">
            <span class="text-sm uppercase font-bold opacity-75">Justification</span>
            <blockquote class="mt-1 card variant-ghost p-3">
              {article.sentiment_analysis.subjectivite_justification}
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