<script lang="ts">
  import { Chart } from 'svelte-echarts';
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
  import { onMount } from 'svelte';

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

  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'] as const;
  type PolarityType = typeof polarityLabels[number];

  // Définition des couleurs avec gradations logiques
  const polarityColors: Record<PolarityType, string> = {
    'Très positif': '#059669',    // Vert foncé (plus intense)
    'Positif': '#10B981',         // Vert moyen
    'Neutre': '#3B82F6',          // Bleu
    'Négatif': '#EF4444',         // Rouge moyen
    'Très négatif': '#DC2626'     // Rouge foncé (plus intense)
  };

  let isMobile = $state(false);
  let chartContainer = $state<HTMLDivElement>();

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  // Use $derived for proper reactivity in Svelte 5
  let options = $derived.by(() => {
    const articles = $filteredArticles; // Direct reactive dependency
    const yearlyData: Record<string, Record<PolarityType, number>> = {};
    let articlesAnalyzed = 0;

    articles.forEach((article: Article) => {
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
        width: isMobile ? 2 : 3,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: isMobile ? 5 : 10,
        shadowOffsetY: isMobile ? 2 : 5
      },
      symbolSize: isMobile ? 6 : 8,
      smooth: true
    }));

    return {
      title: {
        text: `Tendance des sentiments par année (${articlesAnalyzed} articles analysés)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: isMobile ? 12 : 16
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
          color: '#333',
          fontSize: isMobile ? 10 : 12
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1
      },
      legend: {
        data: [...polarityLabels],
        top: isMobile ? '12%' : '8%',
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        },
        orient: isMobile ? 'vertical' : 'horizontal',
        left: isMobile ? 'right' : 'center',
        itemWidth: isMobile ? 12 : 25,
        itemHeight: isMobile ? 8 : 14
      },
      grid: {
        left: isMobile ? '5%' : '3%',
        right: isMobile ? '25%' : '4%',
        bottom: isMobile ? '15%' : '12%',
        top: isMobile ? '25%' : '18%',
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
          color: '#fff',
          fontSize: isMobile ? 9 : 11,
          rotate: isMobile ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
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
          color: '#fff',
          fontSize: isMobile ? 9 : 11,
          formatter: function (value: number) {
            return Math.floor(value).toString();
          }
        }
      },
      series: series,
      dataZoom: [ // Added DataZoom for better navigation with many years
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: isMobile ? '5%' : '2%',
          height: isMobile ? 15 : 20,
          textStyle: {
            color: '#fff',
            fontSize: isMobile ? 8 : 10
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
    } as EChartsOption;
  });
</script>

{#if $filteredArticles.length > 0}
  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '400px' : '500px'}; position: relative;" 
    class="bg-surface-900/50 rounded-lg p-1 sm:p-2"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">Aucun article ne correspond aux filtres actuels, ou aucun corpus n'est chargé pour afficher les tendances.</p>
{/if}