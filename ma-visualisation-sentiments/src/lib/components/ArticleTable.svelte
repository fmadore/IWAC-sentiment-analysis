<script lang="ts">
  import { onDestroy } from 'svelte';
  import { filteredArticles, selectedArticle } from '$lib/stores';
  import type { Article } from '$lib/types/data';

  let articles: Article[] = [];
  const unsubscribeFiltered = filteredArticles.subscribe(value => {
    articles = value;
  });

  function selectArticle(article: Article) {
    selectedArticle.set(article);
  }

  // Définition des couleurs de polarité pour les badges, en harmonie avec les graphiques
  const polarityColors = {
    'Très positif': 'bg-[#00b894] text-white',
    'Positif': 'bg-[#55efc4] text-black',
    'Neutre': 'bg-[#74b9ff] text-black',
    'Négatif': 'bg-[#ff7675] text-black',
    'Très négatif': 'bg-[#d63031] text-white',
    'Non applicable': 'bg-[#a5a5a5] text-white'
  };

  // Fonction d'aide pour obtenir la classe de couleur de badge selon la polarité
  function getPolarityBadgeClass(polarity: string | null | undefined): string {
    if (!polarity) return 'bg-[#a5a5a5] text-white';
    return polarityColors[polarity as keyof typeof polarityColors] || 'bg-[#a5a5a5] text-white';
  }

  onDestroy(() => {
    unsubscribeFiltered();
  });
</script>

{#if articles.length > 0}
  <div class="table-container glossy bg-surface-900/60 rounded-lg border border-surface-500/20 shadow-lg">
    <table class="w-full">
      <thead>
        <tr class="border-b border-surface-500/30">
          <th class="p-3 text-white font-semibold text-left">Titre</th>
          <th class="p-3 text-white font-semibold text-left">Journal</th>
          <th class="p-3 text-white font-semibold text-left">Date</th>
          <th class="p-3 text-white font-semibold text-left">Polarité</th>
        </tr>
      </thead>
      <tbody>
        {#each articles as article (article['o:id'])}
          <tr 
            on:click={() => selectArticle(article)} 
            class="border-b border-surface-500/20 transition-colors duration-200 hover:bg-surface-700/40 cursor-pointer {$selectedArticle && $selectedArticle['o:id'] === article['o:id'] ? 'bg-primary-500/30' : ''}"
          >
            <td class="p-3 text-white/90">{article['o:title'] ?? 'N/A'}</td>
            <td class="p-3 text-white/90">{article.journal_source ?? 'N/A'}</td>
            <td class="p-3 text-white/90">{article.publication_date ?? 'N/A'}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium {getPolarityBadgeClass(article.sentiment_analysis?.polarite)}">
                {article.sentiment_analysis?.polarite ?? 'N/A'}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="text-center py-8 text-white/80">Aucun article à afficher avec les filtres actuels.</p>
{/if}

<style>
  .table-container {
    max-height: 400px;
    overflow-y: auto;
    background-image: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    backdrop-filter: blur(4px);
  }
  
  /* Style pour la scrollbar personnalisée */
  .table-container::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  .table-container::-webkit-scrollbar-track {
    background: rgba(30, 30, 30, 0.2);
    border-radius: 5px;
  }
  
  .table-container::-webkit-scrollbar-thumb {
    background: rgba(100, 100, 100, 0.4);
    border-radius: 5px;
  }
  
  .table-container::-webkit-scrollbar-thumb:hover {
    background: rgba(120, 120, 120, 0.6);
  }
  
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
    backdrop-filter: blur(4px);
  }
</style> 