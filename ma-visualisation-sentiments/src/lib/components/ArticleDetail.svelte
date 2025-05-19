<script lang="ts">
  import { selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';
</script>

{#if $selectedArticle}
  <div>
    <h3>{$selectedArticle['o:title'] ?? 'Titre non disponible'}</h3>
    <p><strong>Journal:</strong> {$selectedArticle.journal_source ?? 'Source non disponible'}</p>
    <p><strong>Date de publication:</strong> {$selectedArticle.publication_date ?? 'Date non disponible'}</p>
    {#if $selectedArticle.sentiment_analysis}
      <p><strong>Polarité:</strong> {$selectedArticle.sentiment_analysis.polarite}</p>
      {#if $selectedArticle.sentiment_analysis.polarite_justification}
        <p><strong>Justification de la polarité:</strong></p>
        <blockquote>{$selectedArticle.sentiment_analysis.polarite_justification}</blockquote>
      {/if}
      <p><strong>Score de Subjectivité:</strong> {$selectedArticle.sentiment_analysis.subjectivite_score}</p>
      {#if $selectedArticle.sentiment_analysis.subjectivite_justification}
        <p><strong>Justification de la subjectivité:</strong></p>
        <blockquote>{$selectedArticle.sentiment_analysis.subjectivite_justification}</blockquote>
      {/if}
    {:else}
      <p>Les données d'analyse des sentiments ne sont pas disponibles pour cet article.</p>
    {/if}
  </div>
{:else}
  <p>Sélectionnez un article dans le tableau pour voir les détails.</p>
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