<!--
  ComparisonPanel Component
  
  A side-by-side comparison panel showing ChatGPT vs Gemini analysis for a sentiment dimension.
  Used in ComparisonDetail to display centrality, polarity, and subjectivity comparisons.
  
  Features:
  - Two-column layout (responsive to single column on mobile)
  - Model label with sentiment badge
  - Blockquote for justification text
  - Customizable border accent color
  
  Usage:
  <ComparisonPanel 
    dimension="polarity"
    chatgptValue={comparison.chatgpt?.polarite}
    chatgptJustification={comparison.chatgpt?.polarite_justification}
    geminiValue={comparison.gemini?.polarite}
    geminiJustification={comparison.gemini?.polarite_justification}
    borderColorChatGPT="border-l-blue-400/50"
    borderColorGemini="border-l-green-400/50"
  />
-->
<script lang="ts">
  import { SentimentBadge } from '$lib/components/common';
  import { t } from '$lib/i18n';

  interface ComparisonPanelProps {
    /** The sentiment dimension type for SentimentBadge */
    dimension: 'polarity' | 'subjectivity' | 'centrality';
    /** ChatGPT's sentiment value */
    chatgptValue: string | number | null | undefined;
    /** ChatGPT's justification text */
    chatgptJustification?: string | null;
    /** Gemini's sentiment value */
    geminiValue: string | number | null | undefined;
    /** Gemini's justification text */
    geminiJustification?: string | null;
    /** Border color class for ChatGPT blockquote */
    borderColorChatGPT?: string;
    /** Border color class for Gemini blockquote */
    borderColorGemini?: string;
  }

  let { 
    dimension,
    chatgptValue,
    chatgptJustification,
    geminiValue,
    geminiJustification,
    borderColorChatGPT = 'border-l-blue-400/50',
    borderColorGemini = 'border-l-green-400/50'
  }: ComparisonPanelProps = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- ChatGPT Analysis -->
  <div class="comparison-panel">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-sm font-bold text-white/80">ChatGPT</span>
      <SentimentBadge type={dimension} value={chatgptValue} size="sm" />
    </div>
    {#if chatgptJustification}
      <blockquote class="card variant-glass glass-dark p-4 border-l-4 {borderColorChatGPT} italic text-white/90 leading-relaxed">
        {chatgptJustification}
      </blockquote>
    {:else}
      <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
    {/if}
  </div>

  <!-- Gemini Analysis -->
  <div class="comparison-panel">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-sm font-bold text-white/80">Gemini</span>
      <SentimentBadge type={dimension} value={geminiValue} size="sm" />
    </div>
    {#if geminiJustification}
      <blockquote class="card variant-glass glass-dark p-4 border-l-4 {borderColorGemini} italic text-white/90 leading-relaxed">
        {geminiJustification}
      </blockquote>
    {:else}
      <p class="text-white/60 italic">{$t.article.noAnalysisData}</p>
    {/if}
  </div>
</div>

<style>
  .comparison-panel {
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border-radius: 0.5rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-900) 60%, transparent);
  }

  /* Glass variants */
  :global(.glass-dark) {
    background: color-mix(in oklab, var(--color-surface-900) 75%, transparent) !important;
    backdrop-filter: blur(var(--glass-blur-md));
  }

  /* Enhanced blockquote styling */
  blockquote {
    position: relative;
    font-style: italic;
    line-height: 1.6;
    padding-left: 1.5rem;
  }
  
  blockquote::before {
    content: '"';
    position: absolute;
    top: -0.25rem;
    left: 0;
    font-size: 2rem;
    color: color-mix(in oklab, var(--color-surface-50) 30%, transparent);
    font-family: serif;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 640px) {
    .comparison-panel {
      padding: 0.75rem;
    }

    blockquote {
      font-size: 0.875rem;
      padding: 0.75rem;
    }
  }
</style>
