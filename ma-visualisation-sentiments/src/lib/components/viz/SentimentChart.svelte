<!-- Composant SentimentChart.svelte (sera adapté pour ECharts) --> 
<script lang="ts">
  import { Chart } from 'svelte-echarts';
  // import * as echarts from 'echarts'; // No longer importing the echarts namespace
  import { onDestroy } from 'svelte';

  // ECharts core and modules for tree-shaking
  import { init, use } from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts'; // Main EChartsOption

  // Register the required components
  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';

  let options: EChartsOption = {};

  // Exemple de données pour ECharts (sera dynamique)
  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  
  // Définition des couleurs harmonisées avec le thème de l'application
  const polarityColors = {
    'Très positif': '#00b894',  // Vert foncé
    'Positif': '#55efc4',       // Vert clair
    'Neutre': '#74b9ff',        // Bleu clair
    'Négatif': '#ff7675',       // Rouge clair
    'Très négatif': '#d63031',  // Rouge foncé
    'Non applicable': '#a5a5a5'  // Gris
  };

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
        text: `Distribution de la Polarité (${articlesAnalyzed} articles analysés)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        textStyle: {
          color: '#333'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1
      },
      legend: {
        data: ['Nombre d\'articles'],
        top: '8%',
        textStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: polarityLabels,
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        axisLabel: {
          color: '#fff',
          rotate: 30,  // Pivoter les étiquettes pour meilleure lisibilité
          fontSize: 11  // Taille de police réduite pour s'adapter
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        axisLabel: {
          color: '#fff'
        }
      },
      series: [{
        name: 'Nombre d\'articles',
        type: 'bar',
        barWidth: '60%',
        data: polarityLabels.map(l => ({
          value: counts[l],
          itemStyle: {
            color: polarityColors[l as keyof typeof polarityColors]
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if $filteredArticles.length > 0}
  <div style="height:450px; position: relative;" class="bg-surface-900/50 rounded-lg p-2">
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80">Aucun article ne correspond aux filtres actuels, ou aucun dataset n'est chargé.</p>
{/if} 