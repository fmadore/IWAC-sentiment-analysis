<script lang="ts">
  // import { selectedArticle } from '$lib/stores'; // Removed store import
  import type { Article } from '$lib/types/data';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';

  // Props: Accept article as a prop
  let { article }: { article: Article | null } = $props();

  // Semantic CSS classes for polarity (from app.postcss)
  const polarityClasses = {
    'Très positif': 'sentiment-very-positive',
    'Positif': 'sentiment-positive',
    'Neutre': 'sentiment-neutral',
    'Négatif': 'sentiment-negative',
    'Très négatif': 'sentiment-very-negative',
    'Non applicable': 'sentiment-na'
  };

  // Semantic CSS classes for centrality (from app.postcss)
  const centralityClasses = {
    'Très central': 'centrality-very-central',
    'Central': 'centrality-central',
    'Secondaire': 'centrality-secondary',
    'Marginal': 'centrality-marginal',
    'Non abordé': 'centrality-not-addressed'
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
    if (!dateStr) return $t.messages.noData;
    
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

  // Fonction pour construire l'URL de l'article complet
  function getArticleUrl(id: string | number | null | undefined): string {
    if (!id) return '#';
    return `https://islam.zmo.de/s/afrique_ouest/item/${id}`;
  }
</script>

{#if article}
  <div class="space-y-6">
    <h3 class="h3 text-white text-balance">{article['o:title'] ?? $t.article.titleNotAvailable}</h3>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.filters.journal}</span>
        <p class="text-white mt-2 font-medium">{getJournalName(article)}</p>
      </div>
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.article.publicationDate}</span>
        <p class="text-white mt-2 font-medium">{formatDate(article.publication_date)}</p>
      </div>
    </div>

    <div class="card variant-glass glass-light p-4 hover-lift-sm">
      <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.article.linkToFullArticle}</span>
      <p class="text-white mt-2">
        <a href={getArticleUrl(article['o:id'])} target="_blank" class="anchor hover-glow focus-ring">
          {$t.article.consultOriginalArticle}
        </a>
      </p>
    </div>
    
    {#if article.sentiment_analysis}
      <!-- Centralité -->
      <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span class="badge badge-lg {getCentralityClass(article.sentiment_analysis.centralite_islam_musulmans)} hover-glow">
            {translateSentimentValue(article.sentiment_analysis.centralite_islam_musulmans, $currentLanguage) ?? translateSentimentValue('Non abordé', $currentLanguage)}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">{$t.analysis.centralitySection}</span>
        </div>
        
        {#if article.sentiment_analysis.centralite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">{$t.article.justification}</span>
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
            {translateSentimentValue(article.sentiment_analysis.polarite, $currentLanguage)}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">{$t.analysis.polaritySection}</span>
        </div>
        
        {#if article.sentiment_analysis.polarite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">{$t.article.justification}</span>
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
            {translateSubjectivityScore(article.sentiment_analysis.subjectivite_score, $currentLanguage)}
          </span>
          <span class="text-sm uppercase font-bold opacity-75 text-white/80">{$t.filters.subjectivityScore}</span>
        </div>
        
        {#if article.sentiment_analysis.subjectivite_justification}
          <div class="mt-4">
            <span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block">{$t.article.justification}</span>
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-green-400/50 italic text-white/90 leading-relaxed">
              {article.sentiment_analysis.subjectivite_justification}
            </blockquote>
          </div>
        {/if}
      </div>
    {:else}
      <div class="card variant-glass glass-light p-6 text-center hover-lift-sm">
        <p class="text-white/80 text-balance">{$t.article.noAnalysisData}</p>
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
    <h4 class="h4 text-white/80 mb-2">{$t.article.noArticleSelected}</h4>
    <p class="text-white/60 text-balance max-w-md">{$t.article.selectArticlePrompt}</p>
  </div>
{/if}

<style>
  .badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
    transition: all var(--timing-fast) var(--easing-default);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    cursor: default;
  }
  
  .badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px color-mix(in oklab, black 20%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
  }
  
  .badge-lg {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: default;
  }
  
  .anchor {
    color: var(--color-primary-400);
    text-decoration: none;
    font-weight: 500;
    transition: all var(--timing-fast) var(--easing-default);
    border-bottom: 1px solid color-mix(in oklab, var(--color-primary-400) 30%, transparent);
    padding-bottom: 1px;
  }
  
  .anchor:hover {
    color: var(--color-primary-300);
    border-bottom-color: color-mix(in oklab, var(--color-primary-300) 60%, transparent);
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
    color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    font-family: serif;
  }
  
  /* Hover effects for cards */
  :global(.hover-lift-sm:hover) {
    transform: translateY(-2px);
    box-shadow: 
      0 10px 25px -5px color-mix(in oklab, black 30%, transparent),
      0 10px 10px -5px color-mix(in oklab, black 10%, transparent),
      0 0 20px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
  }
  
  :global(.border-gradient) {
    position: relative;
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
  }
  
  :global(.border-gradient::before) {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, 
      color-mix(in oklab, var(--color-primary-500) 30%, transparent), 
      color-mix(in oklab, var(--color-secondary-500) 30%, transparent), 
      color-mix(in oklab, var(--color-tertiary-500) 30%, transparent)
    );
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity var(--timing-normal) var(--easing-default);
  }
  
  :global(.border-gradient:hover::before) {
    opacity: 1;
  }
  
  /* Ensure proper cursor behavior */
  :global(.card) {
    cursor: default;
  }
  
  :global(.card *) {
    cursor: inherit;
  }
  
  /* Override cursor for clickable elements */
  :global(.anchor) {
    cursor: pointer !important;
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
    
    /* Reduce hover effects on mobile */
    :global(.hover-lift-sm:hover) {
      transform: translateY(-1px);
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .badge,
    .anchor,
    :global(.hover-lift-sm),
    :global(.border-gradient::before) {
      transition: none;
    }
  }
</style>