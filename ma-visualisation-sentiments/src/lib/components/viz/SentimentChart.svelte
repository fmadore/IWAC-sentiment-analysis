<!-- Composant SentimentChart.svelte (sera adapté pour ECharts) --> 
<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import type { EChartsOption } from 'echarts/types/dist/shared';
  import { filteredArticles } from '$lib/stores';
  import type { Article } from '$lib/types/data';
  import { onDestroy } from 'svelte';

  let options: EChartsOption = {};

  // Exemple de données pour ECharts (sera dynamique)
  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  // Couleurs pourraient être définies ici ou dans les options du graphique

  const unsubscribe = filteredArticles.subscribe(($articles: Article[]) => {
    const counts: Record<string, number> = Object.fromEntries(polarityLabels.map(l => [l, 0]));
    let articlesAnalyzed = 0;
    $articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.polarite) {
        const polarityKey = article.sentiment_analysis.polarite as string;
        if (counts.hasOwnProperty(polarityKey)) {
          counts[polarityKey] = (counts[polarityKey] || 0) + 1;
        }
        articlesAnalyzed++;
      }
    });

    options = {
      title: {
        text: `Distribution de la Polarité (${articlesAnalyzed} articles analysés)`
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        // data:['Nombre d\'articles'] // ECharts peut le déduire
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: polarityLabels,
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: 'Nombre d\'articles',
        type: 'bar',
        barWidth: '60%',
        data: polarityLabels.map(l => counts[l])
      }]
    };
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if $filteredArticles.length > 0}
  <div style="height:450px; position: relative;">
    <Chart {options} />
  </div>
{:else}
  <p>Aucun article ne correspond aux filtres actuels, ou aucun dataset n'est chargé.</p>
{/if} 