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

  // Define colors for each polarity for consistency
  const polarityColors: Record<PolarityType, string> = {
    'Très positif': '#2E7D32',
    'Positif': '#4CAF50',
    'Neutre': '#BDBDBD',
    'Négatif': '#F44336',
    'Très négatif': '#B71C1C'
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
      color: polarityColors[polarity]
    }));

    options = {
      title: {
        text: `Tendance des Sentiments par Année (${articlesAnalyzed} articles analysés)`
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: [...polarityLabels]
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%', // Increased bottom margin for DataZoom
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years
      },
      yAxis: {
        type: 'value'
      },
      series: series,
      dataZoom: [ // Added DataZoom for better navigation with many years
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: '2%'
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
  <div style="height:500px; position: relative;">
    <Chart {init} {options} />
  </div>
{:else}
  <p>Aucun article ne correspond aux filtres actuels, ou aucun dataset n'est chargé pour afficher les tendances.</p>
{/if} 