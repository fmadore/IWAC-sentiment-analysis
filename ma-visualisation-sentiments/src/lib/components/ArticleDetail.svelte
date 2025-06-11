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
  <div class="space-y-6">
    <h3 class="h3 text-white text-balance">{article['o:title'] ?? 'Titre non disponible'}</h3>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">Journal</span>
        <p class="text-white mt-2 font-medium">{getJournalName(article)}</p>
      </div>
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">Date de publication</span>
        <p class="text-white mt-2 font-medium">{formatDate(article.publication_date)}</p>
      </div>
    </div>

    <div class="card variant-glass glass-light p-4 hover-lift-sm">
      <span class="text-xs uppercase font-bold opacity-75 text-white/60">Lien vers l'article complet</span>
      <p class="text-white mt-2">
        <a href={getArticleUrl(article['o:id'])} target="_blank" class="anchor hover-glow focus-ring">
          Consulter l'article original →
        </a>
      </p>
    </div>
    
    {#if article.sentiment_analysis}
      <!-- Centralité -->
      <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span class="badge badge-lg {getCentralityClass(article.sentiment_analysis.centralite_islam_musulmans)} hover-glow">
            {article.sentiment_analysis.centralite_islam_musulmans ?? 'Non abordé'}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">Centralité de l'islam/musulmans</span>
        </div>
        
        {#if article.sentiment_analysis.centralite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">Justification</span>
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-blue-400/50 italic text-white/90 leading-relaxed">
              {article.sentiment_analysis.centralite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Polarité -->
      <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span class="badge badge-lg {getPolarityClass(article.sentiment_analysis.polarite)} hover-glow">
            {article.sentiment_analysis.polarite}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">Polarité</span>
        </div>
        
        {#if article.sentiment_analysis.polarite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">Justification</span>
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-purple-400/50 italic text-white/90 leading-relaxed">
              {article.sentiment_analysis.polarite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
      
      <!-- Subjectivité -->
      <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span class="badge badge-lg {getSubjectivityClass(article.sentiment_analysis.subjectivite_score)} hover-glow">
            {article.sentiment_analysis.subjectivite_score}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">Score de Subjectivité</span>
        </div>
        
        {#if article.sentiment_analysis.subjectivite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">Justification</span>
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-green-400/50 italic text-white/90 leading-relaxed">
              {article.sentiment_analysis.subjectivite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
    {:else}
      <div class="card variant-glass glass-light p-6 text-center hover-lift-sm">
        <p class="text-white/80 text-balance">Les données d'analyse des sentiments ne sont pas disponibles pour cet article.</p>
      </div>
    {/if}
  </div>
{:else}
  <div class="card variant-glass glass-light p-8 flex flex-col items-center justify-center min-h-[300px] text-center hover-lift-sm">
    <div class="mb-4 opacity-50">
      <svg class="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h4 class="h4 text-white/80 mb-2">Aucun article sélectionné</h4>
    <p class="text-white/60 text-balance max-w-md">Sélectionnez un article dans le tableau pour voir ses détails d'analyse des sentiments.</p>
  </div>
{/if}

<style>
  .badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
    transition: all var(--transition-fast);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .badge-lg {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .anchor {
    color: #60A5FA;
    text-decoration: none;
    font-weight: 500;
    transition: all var(--transition-normal);
    border-bottom: 1px solid rgba(96, 165, 250, 0.3);
    padding-bottom: 1px;
  }
  
  .anchor:hover {
    color: #93C5FD;
    border-bottom-color: rgba(147, 197, 253, 0.6);
    transform: translateY(-1px);
  }
  
  /* Enhanced blockquote styling */
  blockquote {
    position: relative;
    font-style: italic;
    line-height: 1.6;
  }
  
  blockquote::before {
    content: '"';
    position: absolute;
    top: -0.5rem;
    left: -0.5rem;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.2);
    font-family: serif;
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .badge-lg {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
    
    blockquote {
      font-size: 0.875rem;
      padding: 0.75rem;
    }
  }
</style>