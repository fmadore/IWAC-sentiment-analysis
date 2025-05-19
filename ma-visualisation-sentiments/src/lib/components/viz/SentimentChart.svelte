<!-- Composant SentimentChart.svelte (sera adapté pour ECharts) --> 
<script lang="ts">
  import { ECharts } from 'svelte-echarts';
  import type { EChartsOption } from 'echarts';
  import { filteredArticles } from '$lib/stores'; // Utilise les données déjà filtrées
  import { onDestroy, onMount } from 'svelte';

  let options: EChartsOption = {};

  // Exemple de données pour ECharts (sera dynamique)
  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  // Couleurs pourraient être définies ici ou dans les options du graphique

  const unsubscribe = filteredArticles.subscribe($articles => {
    const counts: Record<string, number> = Object.fromEntries(polarityLabels.map(l => [l, 0]));
    let articlesAnalyzed = 0;
    $articles.forEach(article => {
      if (article.sentiment_analysis?.polarite) {
        counts[article.sentiment_analysis.polarite] = (counts[article.sentiment_analysis.polarite] || 0) + 1;
        articlesAnalyzed++;
      }
    });

    options = {
      title: {
        text: `Distribution de la Polarité (${articlesAnalyzed} articles analysés)`
      },
      tooltip: {},
      legend: {
        data:['Nombre d\'articles']
      },
      xAxis: {
        data: polarityLabels
      },
      yAxis: {},
      series: [{
        name: 'Nombre d\'articles',
        type: 'bar',
        data: polarityLabels.map(l => counts[l])
        // Vous pouvez ajouter des couleurs ici par exemple
        // itemStyle: { color: ... }
      }]
    };
  });

  onDestroy(() => {
    unsubscribe(); // Important pour éviter les fuites mémoire
  });
</script>

{#if $filteredArticles.length > 0}
  <div style="height:450px; position: relative;">
    <ECharts {options} />
  </div>
{:else}
  <p>Aucun article ne correspond aux filtres actuels, ou aucun dataset n'est chargé.</p>
{/if} 