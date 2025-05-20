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
  import type { EChartsOption, SeriesOption } from 'echarts'; // Main EChartsOption and SeriesOption

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
    let articlesAnalyzed = 0;
    const newspaperPolarityCounts: Record<string, Record<string, number>> = {};
    const uniqueNewspapers = new Set<string>();

    $articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.polarite) {
        const polarityKey = article.sentiment_analysis.polarite as string;
        const journal = article.journal_source || 'Inconnu'; // Handle undefined journal
        uniqueNewspapers.add(journal);

        if (!newspaperPolarityCounts[journal]) {
          newspaperPolarityCounts[journal] = Object.fromEntries(polarityLabels.map(l => [l, 0]));
        }
        if (newspaperPolarityCounts[journal].hasOwnProperty(polarityKey)) {
          newspaperPolarityCounts[journal][polarityKey]++;
        }
        articlesAnalyzed++;
      }
    });

    const newspaperList = Array.from(uniqueNewspapers);

    const seriesData: SeriesOption[] = newspaperList.map(journal => {
      return {
        name: journal,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: polarityLabels.map(label => newspaperPolarityCounts[journal]?.[label] || 0)
        // ECharts will assign colors automatically. If specific colors are needed per newspaper:
        // itemStyle: { color: getNewspaperColor(journal) }
      };
    });

    options = {
      title: {
        text: `Distribution de la polarité par journal (${articlesAnalyzed} articles analysés)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        triggerOn: 'mousemove',
        enterable: true,
        axisPointer: {
          type: 'shadow'
        },
        confine: true,
        textStyle: {
          color: '#333'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        formatter: function (params: any) {
          if (!Array.isArray(params) || params.length === 0) {
            return '';
          }
          const sortedParams = params.slice().sort((a: any, b: any) => b.value - a.value);
          
          let listItemsHtml = '';
          let total = 0;
          
          sortedParams.forEach((param: any) => {
            if (param.value > 0) { 
              listItemsHtml += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
            }
            total += param.value; // Total should include all, even if not displayed due to future limits
          });

          // Wrap the list in a scrollable div
          const scrollableListHtml = `
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 5px;">
              ${listItemsHtml}
            </div>`;
          
          let tooltipHtml = `${params[0].axisValueLabel}<br/>`;
          tooltipHtml += scrollableListHtml;
          tooltipHtml += `<strong>Total: ${total}</strong>`;
          
          return tooltipHtml;
        }
      },
      legend: {
        data: newspaperList,
        top: '8%',
        textStyle: {
          color: '#fff'
        },
        type: 'scroll', // Added for better handling of many newspapers
        orient: 'horizontal'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%', // Adjust top if legend takes more space
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
          rotate: 30,
          fontSize: 11
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
      series: seriesData
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
  <p class="text-center py-8 text-white/80">Aucun article ne correspond aux filtres actuels, ou aucun corpus n'est chargé.</p>
{/if} 