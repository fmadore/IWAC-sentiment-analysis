<script lang="ts">
  import { selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  // Définition des couleurs de polarité, en harmonie avec les graphiques et le tableau
  const polarityColors = {
    'Très positif': '#00b894',
    'Positif': '#55efc4',
    'Neutre': '#74b9ff',
    'Négatif': '#ff7675',
    'Très négatif': '#d63031',
    'Non applicable': '#a5a5a5'
  };

  // Fonction d'aide pour obtenir la couleur selon la polarité
  function getPolarityColor(polarity: string | null | undefined): string {
    if (!polarity) return '#a5a5a5';
    return polarityColors[polarity as keyof typeof polarityColors] || '#a5a5a5';
  }
</script>

{#if $selectedArticle}
  <div class="bg-surface-800 rounded-lg p-5 border border-surface-700 shadow-lg">
    <h3 class="text-xl font-bold text-white mb-4">{$selectedArticle['o:title'] ?? 'Titre non disponible'}</h3>
    
    <div class="mb-4 grid grid-cols-2 gap-3">
      <div class="bg-surface-700 p-3 rounded-lg">
        <span class="text-white/70 text-sm font-medium">Journal</span>
        <p class="text-white mt-1">{$selectedArticle.journal_source ?? 'Source non disponible'}</p>
      </div>
      <div class="bg-surface-700 p-3 rounded-lg">
        <span class="text-white/70 text-sm font-medium">Date de publication</span>
        <p class="text-white mt-1">{$selectedArticle.publication_date ?? 'Date non disponible'}</p>
      </div>
    </div>
    
    {#if $selectedArticle.sentiment_analysis}
      <div class="mt-5 space-y-4">
        <div class="border-t border-surface-600 pt-4">
          <div class="flex items-center mb-2">
            <div class="w-4 h-4 rounded-full mr-2" style="background-color: {getPolarityColor($selectedArticle.sentiment_analysis.polarite)}"></div>
            <span class="text-white/70 text-sm font-medium">Polarité</span>
          </div>
          <p class="text-white font-medium text-lg">{$selectedArticle.sentiment_analysis.polarite}</p>
          
          {#if $selectedArticle.sentiment_analysis.polarite_justification}
            <div class="mt-3">
              <span class="text-white/70 text-sm font-medium">Justification</span>
              <div class="mt-1 bg-surface-600 p-4 rounded border-l-4 text-white text-sm" style="border-color: {getPolarityColor($selectedArticle.sentiment_analysis.polarite)}">
                {$selectedArticle.sentiment_analysis.polarite_justification}
              </div>
            </div>
          {/if}
        </div>
        
        <div class="border-t border-surface-600 pt-4">
          <div class="flex items-center mb-2">
            <span class="text-white/70 text-sm font-medium">Score de Subjectivité</span>
          </div>
          <p class="text-white font-medium text-lg">{$selectedArticle.sentiment_analysis.subjectivite_score}</p>
          
          {#if $selectedArticle.sentiment_analysis.subjectivite_justification}
            <div class="mt-3">
              <span class="text-white/70 text-sm font-medium">Justification</span>
              <div class="mt-1 bg-surface-600 p-4 rounded border-l-4 text-white text-sm" style="border-color: #74b9ff">
                {$selectedArticle.sentiment_analysis.subjectivite_justification}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-white text-center py-4">Les données d'analyse des sentiments ne sont pas disponibles pour cet article.</p>
    {/if}
  </div>
{:else}
  <div class="bg-surface-800 rounded-lg p-5 border border-surface-700 shadow-lg flex items-center justify-center min-h-[200px]">
    <p class="text-white text-center">Sélectionnez un article dans le tableau pour voir les détails.</p>
  </div>
{/if}

<style>
  div {
    border: 1px solid #eee;
    padding: 1em;
    margin-top: 1em;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  h3 {
    margin-top: 0;
    color: #333;
  }
  p {
    margin-bottom: 0.5em;
    line-height: 1.6;
  }
  blockquote {
    border-left: 4px solid #ccc;
    padding-left: 1em;
    margin-left: 0;
    font-style: italic;
    color: #555;
  }
</style> 