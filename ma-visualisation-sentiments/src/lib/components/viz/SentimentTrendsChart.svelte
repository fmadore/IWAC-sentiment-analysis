<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { onDestroy } from 'svelte';
  import { init, use } from 'echarts/core';
  import { LineChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer,
    DataZoomComponent
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';

  let options: EChartsOption = {};

  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'] as const;
  type PolarityType = typeof polarityLabels[number];

  // Définition des couleurs harmonisées avec le SentimentChart
  const polarityColors: Record<PolarityType, string> = {
    'Très positif': '#00b894',  // Vert foncé
    'Positif': '#55efc4',       // Vert clair
    'Neutre': '#74b9ff',        // Bleu clair
    'Négatif': '#ff7675',       // Rouge clair
    'Très négatif': '#d63031'   // Rouge foncé
  };

  const unsubscribe = filteredArticles.subscribe(($articles: Article[]) => {
    const yearlyData: Record<string, Record<PolarityType, number>> = {};
    let articlesAnalyzed = 0;

    $articles.forEach((article: Article) => {
      if (article.publication_date && article.sentiment_analysis?.polarite) {
        const year = article.publication_date.substring(0, 4);
        const polarity = article.sentiment_analysis.polarite as PolarityType;

        if (polarityLabels.includes(polarity)) {
          if (!yearlyData[year]) {
            yearlyData[year] = Object.fromEntries(polarityLabels.map(l => [l, 0])) as Record<PolarityType, number>;
          }
          yearlyData[year][polarity]++;
          articlesAnalyzed++;
        }
      }
    });

    const years = Object.keys(yearlyData).sort();

    const series = polarityLabels.map(polarity => ({
      name: polarity,
      type: 'line' as 'line',
      emphasis: {
        focus: 'series' as 'series'
      },
      data: years.map(year => yearlyData[year][polarity] || 0),
      color: polarityColors[polarity],
      lineStyle: {
        width: 3,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 10,
        shadowOffsetY: 5
      },
      symbolSize: 8,
      smooth: true
    }));

    options = {
      title: {
        text: `Tendance des entiments par année (${articlesAnalyzed} articles analysés)`,
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
          type: 'cross',
          label: {
            backgroundColor: 'rgba(70, 70, 70, 0.9)'
          }
        },
        textStyle: {
          color: '#333'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1
      },
      legend: {
        data: [...polarityLabels],
        top: '8%',
        textStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        axisLabel: {
          color: '#fff'
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
      series: series,
      dataZoom: [ // Added DataZoom for better navigation with many years
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: '2%',
          textStyle: {
            color: '#fff'
          },
          borderColor: 'rgba(255, 255, 255, 0.3)',
          fillerColor: 'rgba(120, 160, 255, 0.2)',
          handleStyle: {
            color: '#74b9ff',
            borderColor: '#fff'
          }
        },
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ]
    };
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if $filteredArticles.length > 0}
  <div style="height:500px; position: relative;" class="bg-surface-900/50 rounded-lg p-2">
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80">Aucun article ne correspond aux filtres actuels, ou aucun corpus n'est chargé pour afficher les tendances.</p>
{/if} 