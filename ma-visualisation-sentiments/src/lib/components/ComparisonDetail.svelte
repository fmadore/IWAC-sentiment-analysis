<script lang="ts">
  import type { ComparisonData, ArbiterAnalysis } from '$lib/types/data';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
  import { getArbiterForArticle, isLoadingArbiter, arbiterModelAIsChatGPT, decodePreferredModel } from '$lib/stores';
  import GavelIcon from '@lucide/svelte/icons/gavel';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import XCircleIcon from '@lucide/svelte/icons/x-circle';
  import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';

  // Props: Accept comparison data as a prop
  let { comparison }: { comparison: ComparisonData | null } = $props();

  // State for arbiter section visibility
  let showArbiter = $state(true);
  
  // Get arbiter data for this article
  const arbiterData = $derived(
    comparison ? $getArbiterForArticle(comparison.article['o:id']) : null
  );
  
  // Get the global blind assignment key
  const modelAIsChatGPT = $derived($arbiterModelAIsChatGPT);
  
  // Helper to decode preferred model from blind assignment
  function getDecodedPreferredModel(preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'): 'chatgpt' | 'gemini' | 'both' | 'neither' {
    return decodePreferredModel(preferredModel, modelAIsChatGPT);
  }

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
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      const locale = $currentLanguage === 'en' ? 'en-US' : 'fr-FR';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return dateStr || '';
    }
  }

  // Fonction pour construire l'URL de l'article complet
  function getArticleUrl(id: string | number | null | undefined): string {
    if (!id) return '#';
    return `https://islam.zmo.de/s/afrique_ouest/item/${id}`;
  }

  // Fonction pour obtenir la classe de différence
  function getDiffClass(diff: number): string {
    if (diff === 0) return 'text-white/40';
    if (diff === 1) return 'text-yellow-400';
    if (diff === 2) return 'text-orange-400';
    return 'text-red-400';
  }

  function getDiffBadgeClass(diff: number): string {
    if (diff === 0) return 'variant-ghost';
    if (diff === 1) return 'variant-soft-warning';
    if (diff === 2) return 'variant-soft-error';
    return 'variant-filled-error';
  }

  // Get preferred model label (decodes blind assignment first)
  function getPreferredModelLabel(preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'): string {
    const decoded = getDecodedPreferredModel(preferredModel);
    switch (decoded) {
      case 'chatgpt': return $t.arbiter.prefersChatGPT;
      case 'gemini': return $t.arbiter.prefersGemini;
      case 'both': return $t.arbiter.prefersBoth;
      case 'neither': return $t.arbiter.prefersNeither;
      default: return preferredModel;
    }
  }

  // Get preferred model class (decodes blind assignment first)
  function getPreferredModelClass(preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'): string {
    const decoded = getDecodedPreferredModel(preferredModel);
    switch (decoded) {
      case 'chatgpt': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'gemini': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'both': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'neither': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'variant-ghost';
    }
  }
  
  // Get icon type for preferred model (decodes blind assignment first)
  function getPreferredModelIconType(preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'): 'check' | 'both' | 'neither' {
    const decoded = getDecodedPreferredModel(preferredModel);
    if (decoded === 'chatgpt' || decoded === 'gemini') return 'check';
    if (decoded === 'both') return 'both';
    return 'neither';
  }

  // Get confidence level label
  function getConfidenceLevelLabel(level: string): string {
    switch (level) {
      case 'high': return $t.arbiter.confidenceHigh;
      case 'medium': return $t.arbiter.confidenceMedium;
      case 'low': return $t.arbiter.confidenceLow;
      default: return level;
    }
  }

  // Get confidence badge class
  function getConfidenceBadgeClass(level: string): string {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'variant-ghost';
    }
  }
</script>

{#if comparison}
  <div class="space-y-6">
    <h3 class="h3 text-white text-balance">{comparison.article['o:title'] ?? $t.article.titleNotAvailable}</h3>
    
    <!-- Article metadata -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.filters.journal}</span>
        <p class="text-white mt-2 font-medium">{getJournalName(comparison.article)}</p>
      </div>
      <div class="card variant-glass glass-light p-4 hover-lift-sm">
        <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.article.publicationDate}</span>
        <p class="text-white mt-2 font-medium">{formatDate(comparison.article.publication_date)}</p>
      </div>
    </div>

    <!-- Link to full article -->
    <div class="card variant-glass glass-light p-4 hover-lift-sm">
      <span class="text-xs uppercase font-bold opacity-75 text-white/60">{$t.article.linkToFullArticle}</span>
      <p class="text-white mt-2">
        <a href={getArticleUrl(comparison.article['o:id'])} target="_blank" class="anchor hover-glow focus-ring">
          {$t.article.consultOriginalArticle}
        </a>
      </p>
    </div>

    <!-- Overall discrepancy summary -->
    <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
      <div class="flex items-center justify-between mb-4">
        <h4 class="h4 text-white">{$t.comparison.totalDiscrepancy}</h4>
        <span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
          {comparison.discrepancies.totalDiff} {comparison.discrepancies.totalDiff === 1 ? $t.comparison.pointDifference : $t.comparison.pointsDifference}
        </span>
      </div>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-sm text-white/60 mb-1">{$t.comparison.polarity}</div>
          <div class="text-lg font-semibold {getDiffClass(comparison.discrepancies.polarityDiff)}">
            {comparison.discrepancies.polarityDiff > 0 ? `±${comparison.discrepancies.polarityDiff}` : '='}
          </div>
        </div>
        <div>
          <div class="text-sm text-white/60 mb-1">{$t.comparison.subjectivity}</div>
          <div class="text-lg font-semibold {getDiffClass(comparison.discrepancies.subjectivityDiff)}">
            {comparison.discrepancies.subjectivityDiff > 0 ? `±${comparison.discrepancies.subjectivityDiff}` : '='}
          </div>
        </div>
        <div>
          <div class="text-sm text-white/60 mb-1">{$t.comparison.centrality}</div>
          <div class="text-lg font-semibold {getDiffClass(comparison.discrepancies.centralityDiff)}">
            {comparison.discrepancies.centralityDiff > 0 ? `±${comparison.discrepancies.centralityDiff}` : '='}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Centralité Comparison -->
    <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
      <div class="flex items-center gap-3 mb-4">
        <h4 class="h4 text-white">{$t.analysis.centralitySection}</h4>
        <span class="badge {getDiffBadgeClass(comparison.discrepancies.centralityDiff)}">
          {comparison.discrepancies.centralityDiff > 0 ? `±${comparison.discrepancies.centralityDiff}` : '='}
        </span>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ChatGPT Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">ChatGPT</span>
            <span class="badge badge-sm {getCentralityClass(comparison.chatgpt?.centralite_islam_musulmans)}">
              {translateSentimentValue(comparison.chatgpt?.centralite_islam_musulmans, $currentLanguage) ?? translateSentimentValue('Non abordé', $currentLanguage)}
            </span>
          </div>
          {#if comparison.chatgpt?.centralite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-blue-400/50 italic text-white/90 leading-relaxed">
              {comparison.chatgpt.centralite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>

        <!-- Gemini Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">Gemini</span>
            <span class="badge badge-sm {getCentralityClass(comparison.gemini?.centralite_islam_musulmans)}">
              {translateSentimentValue(comparison.gemini?.centralite_islam_musulmans, $currentLanguage) ?? translateSentimentValue('Non abordé', $currentLanguage)}
            </span>
          </div>
          {#if comparison.gemini?.centralite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-green-400/50 italic text-white/90 leading-relaxed">
              {comparison.gemini.centralite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Polarité Comparison -->
    <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
      <div class="flex items-center gap-3 mb-4">
        <h4 class="h4 text-white">{$t.analysis.polaritySection}</h4>
        <span class="badge {getDiffBadgeClass(comparison.discrepancies.polarityDiff)}">
          {comparison.discrepancies.polarityDiff > 0 ? `±${comparison.discrepancies.polarityDiff}` : '='}
        </span>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ChatGPT Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">ChatGPT</span>
            <span class="badge badge-sm {getPolarityClass(comparison.chatgpt?.polarite)}">
              {translateSentimentValue(comparison.chatgpt?.polarite, $currentLanguage)}
            </span>
          </div>
          {#if comparison.chatgpt?.polarite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-purple-400/50 italic text-white/90 leading-relaxed">
              {comparison.chatgpt.polarite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>

        <!-- Gemini Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">Gemini</span>
            <span class="badge badge-sm {getPolarityClass(comparison.gemini?.polarite)}">
              {translateSentimentValue(comparison.gemini?.polarite, $currentLanguage)}
            </span>
          </div>
          {#if comparison.gemini?.polarite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-purple-400/50 italic text-white/90 leading-relaxed">
              {comparison.gemini.polarite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Subjectivité Comparison -->
    <div class="card variant-glass glass-medium p-5 hover-lift-sm border-gradient">
      <div class="flex items-center gap-3 mb-4">
        <h4 class="h4 text-white">{$t.filters.subjectivityScore}</h4>
        <span class="badge {getDiffBadgeClass(comparison.discrepancies.subjectivityDiff)}">
          {comparison.discrepancies.subjectivityDiff > 0 ? `±${comparison.discrepancies.subjectivityDiff}` : '='}
        </span>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- ChatGPT Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">ChatGPT</span>
            <span class="badge badge-sm {getSubjectivityClass(comparison.chatgpt?.subjectivite_score)}">
              {translateSubjectivityScore(comparison.chatgpt?.subjectivite_score, $currentLanguage)}
            </span>
          </div>
          {#if comparison.chatgpt?.subjectivite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-green-400/50 italic text-white/90 leading-relaxed">
              {comparison.chatgpt.subjectivite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>

        <!-- Gemini Analysis -->
        <div class="comparison-panel">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-bold text-white/80">Gemini</span>
            <span class="badge badge-sm {getSubjectivityClass(comparison.gemini?.subjectivite_score)}">
              {translateSubjectivityScore(comparison.gemini?.subjectivite_score, $currentLanguage)}
            </span>
          </div>
          {#if comparison.gemini?.subjectivite_justification}
            <blockquote class="card variant-glass glass-light p-4 border-l-4 border-l-green-400/50 italic text-white/90 leading-relaxed">
              {comparison.gemini.subjectivite_justification}
            </blockquote>
          {:else}
            <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Arbiter (Gemini 2.5 Pro) Verdict Section -->
    <!-- ============================================ -->
    <div class="arbiter-section card variant-glass glass-heavy p-5 hover-lift-sm border-gradient arbiter-gradient">
      <!-- Header with toggle -->
      <button 
        class="arbiter-header w-full flex items-center justify-between gap-3 mb-4"
        onclick={() => showArbiter = !showArbiter}
      >
        <div class="flex items-center gap-3">
          <div class="arbiter-icon">
            <GavelIcon size={24} class="text-amber-400" />
          </div>
          <div class="text-left">
            <h4 class="h4 text-white flex items-center gap-2">
              {$t.arbiter.title}
              <span class="badge badge-sm bg-amber-500/20 text-amber-300 border-amber-500/30">
                {$t.arbiter.modelName}
              </span>
            </h4>
            <p class="text-xs text-white/60">{$t.arbiter.subtitle}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          {#if arbiterData}
            <span class="badge badge-sm {getConfidenceBadgeClass(arbiterData.confidence_level)}">
              {getConfidenceLevelLabel(arbiterData.confidence_level)}
            </span>
          {/if}
          {#if showArbiter}
            <ChevronUpIcon size={20} class="text-white/60" />
          {:else}
            <ChevronDownIcon size={20} class="text-white/60" />
          {/if}
        </div>
      </button>

      {#if showArbiter}
        {#if $isLoadingArbiter}
          <div class="flex items-center justify-center p-8">
            <div class="loading-spinner"></div>
            <span class="ml-3 text-white/60">{$t.arbiter.loadingArbiter}</span>
          </div>
        {:else if arbiterData}
          <!-- Overall Verdict -->
          <div class="card variant-glass glass-light p-4 mb-4 border-l-4 border-l-amber-400/50">
            <div class="flex items-start gap-3">
              <SparklesIcon size={20} class="text-amber-400 mt-1 flex-shrink-0" />
              <div>
                <h5 class="font-semibold text-white mb-2">{$t.arbiter.overallVerdict}</h5>
                <p class="text-white/90 leading-relaxed">{arbiterData.overall_verdict}</p>
              </div>
            </div>
          </div>

          <!-- Dimension-by-dimension verdicts -->
          <div class="grid grid-cols-1 gap-4">
            <!-- Polarity Verdict -->
            <div class="arbiter-verdict-panel">
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-semibold text-white">{$t.arbiter.polarityVerdict}</h5>
                <div class="flex items-center gap-2">
                  <span class="badge badge-sm {getPolarityClass(arbiterData.polarity.score)}">
                    {translateSentimentValue(arbiterData.polarity.score, $currentLanguage)}
                  </span>
                  <span class="badge badge-sm {getPreferredModelClass(arbiterData.polarity.preferred_model)}">
                    {#if getPreferredModelIconType(arbiterData.polarity.preferred_model) === 'check'}
                      <CheckCircleIcon size={12} class="mr-1" />
                    {:else if getPreferredModelIconType(arbiterData.polarity.preferred_model) === 'both'}
                      <MinusCircleIcon size={12} class="mr-1" />
                    {:else}
                      <XCircleIcon size={12} class="mr-1" />
                    {/if}
                    {getPreferredModelLabel(arbiterData.polarity.preferred_model)}
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.arbiterJustification}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.polarity.justification}</p>
                </div>
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.verdictExplanation}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.polarity.verdict_explanation}</p>
                </div>
              </div>
            </div>

            <!-- Subjectivity Verdict -->
            <div class="arbiter-verdict-panel">
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-semibold text-white">{$t.arbiter.subjectivityVerdict}</h5>
                <div class="flex items-center gap-2">
                  <span class="badge badge-sm {getSubjectivityClass(arbiterData.subjectivity.score)}">
                    {translateSubjectivityScore(parseInt(arbiterData.subjectivity.score) || null, $currentLanguage)}
                  </span>
                  <span class="badge badge-sm {getPreferredModelClass(arbiterData.subjectivity.preferred_model)}">
                    {#if getPreferredModelIconType(arbiterData.subjectivity.preferred_model) === 'check'}
                      <CheckCircleIcon size={12} class="mr-1" />
                    {:else if getPreferredModelIconType(arbiterData.subjectivity.preferred_model) === 'both'}
                      <MinusCircleIcon size={12} class="mr-1" />
                    {:else}
                      <XCircleIcon size={12} class="mr-1" />
                    {/if}
                    {getPreferredModelLabel(arbiterData.subjectivity.preferred_model)}
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.arbiterJustification}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.subjectivity.justification}</p>
                </div>
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.verdictExplanation}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.subjectivity.verdict_explanation}</p>
                </div>
              </div>
            </div>

            <!-- Centrality Verdict -->
            <div class="arbiter-verdict-panel">
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-semibold text-white">{$t.arbiter.centralityVerdict}</h5>
                <div class="flex items-center gap-2">
                  <span class="badge badge-sm {getCentralityClass(arbiterData.centrality.score)}">
                    {translateSentimentValue(arbiterData.centrality.score, $currentLanguage)}
                  </span>
                  <span class="badge badge-sm {getPreferredModelClass(arbiterData.centrality.preferred_model)}">
                    {#if getPreferredModelIconType(arbiterData.centrality.preferred_model) === 'check'}
                      <CheckCircleIcon size={12} class="mr-1" />
                    {:else if getPreferredModelIconType(arbiterData.centrality.preferred_model) === 'both'}
                      <MinusCircleIcon size={12} class="mr-1" />
                    {:else}
                      <XCircleIcon size={12} class="mr-1" />
                    {/if}
                    {getPreferredModelLabel(arbiterData.centrality.preferred_model)}
                  </span>
                </div>
              </div>
              <div class="space-y-2">
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.arbiterJustification}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.centrality.justification}</p>
                </div>
                <div>
                  <span class="text-xs uppercase font-bold text-white/50">{$t.arbiter.verdictExplanation}</span>
                  <p class="text-white/80 text-sm mt-1">{arbiterData.centrality.verdict_explanation}</p>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- No arbiter data available -->
          <div class="flex flex-col items-center justify-center p-8 text-center">
            <GavelIcon size={48} class="text-white/30 mb-4" />
            <h5 class="font-semibold text-white/80 mb-2">{$t.arbiter.noArbiterData}</h5>
            <p class="text-white/60 text-sm max-w-md">{$t.arbiter.noArbiterDataDescription}</p>
            <p class="text-white/40 text-xs mt-2">{$t.arbiter.runArbiterScript}</p>
          </div>
        {/if}
      {/if}
    </div>
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

  .badge-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.625rem;
    font-weight: 500;
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

  .comparison-panel {
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 5%, transparent);
    border-radius: 0.5rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-50) 2%, transparent);
  }

  /* ============================================ */
  /* Arbiter Section Styles */
  /* ============================================ */
  
  .arbiter-section {
    position: relative;
    overflow: hidden;
  }

  .arbiter-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      #f59e0b, /* amber-500 */
      #fbbf24, /* amber-400 */
      #f59e0b  /* amber-500 */
    );
    opacity: 0.8;
  }

  .arbiter-gradient {
    background: linear-gradient(135deg, 
      color-mix(in oklab, var(--color-surface-900) 90%, transparent),
      color-mix(in oklab, #f59e0b 5%, var(--color-surface-900))
    );
  }

  .arbiter-header {
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
    border-radius: 0.5rem;
    padding: 0.5rem;
    margin: -0.5rem;
  }

  .arbiter-header:hover {
    background: color-mix(in oklab, var(--color-surface-50) 5%, transparent);
  }

  .arbiter-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, 
      color-mix(in oklab, #f59e0b 20%, transparent),
      color-mix(in oklab, #fbbf24 10%, transparent)
    );
    border: 1px solid color-mix(in oklab, #f59e0b 30%, transparent);
  }

  .arbiter-verdict-panel {
    border: 1px solid color-mix(in oklab, #f59e0b 15%, transparent);
    border-radius: 0.5rem;
    padding: 1rem;
    background: color-mix(in oklab, #f59e0b 3%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .arbiter-verdict-panel:hover {
    border-color: color-mix(in oklab, #f59e0b 25%, transparent);
    background: color-mix(in oklab, #f59e0b 5%, transparent);
  }

  /* Loading spinner for arbiter */
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    border-top-color: #f59e0b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

    .comparison-panel {
      padding: 0.75rem;
    }
  }
</style> 