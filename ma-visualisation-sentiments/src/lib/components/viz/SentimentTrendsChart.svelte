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
  import { t, currentLanguage } from '$lib/i18n';
  import { getSentimentLabels, formatNumber } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';

  // Get polarity labels in current language
  let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
  
  // French labels for data lookup (data is stored in French)
  const frenchPolarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'] as const;
  type PolarityType = typeof frenchPolarityLabels[number];

  // Color definitions with logical gradations
  const polarityColors: Record<PolarityType, string> = {
    'Très positif': '#059669',    // Dark green (more intense)
    'Positif': '#10B981',         // Medium green
    'Neutre': '#3B82F6',          // Blue
    'Négatif': '#EF4444',         // Medium red
    'Très négatif': '#DC2626'     // Dark red (more intense)
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
    const currentT = $t; // Capture current translations for reactive updates
    const currentLang = $currentLanguage; // Capture current language for reactive updates
    const yearlyData: Record<string, Record<PolarityType, number>> = {};
    let articlesAnalyzed = 0;

    articles.forEach((article: Article) => {
      if (article.publication_date && article.sentiment_analysis?.polarite) {
        const year = article.publication_date.substring(0, 4);
        const polarity = article.sentiment_analysis.polarite as PolarityType;

        if (frenchPolarityLabels.includes(polarity)) {
          if (!yearlyData[year]) {
            yearlyData[year] = Object.fromEntries(frenchPolarityLabels.map(l => [l, 0])) as Record<PolarityType, number>;
          }
          yearlyData[year][polarity]++;
          articlesAnalyzed++;
        }
      }
    });

    const years = Object.keys(yearlyData).sort();

    const series = frenchPolarityLabels.map((frenchPolarity, index) => ({
      name: polarityLabels[index], // Use translated label for display
      type: 'line' as 'line',
      emphasis: {
        focus: 'series' as 'series'
      },
      data: years.map(year => yearlyData[year][frenchPolarity] || 0),
      color: polarityColors[frenchPolarity],
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
        text: `${currentT.charts.sentimentTrends} ${currentT.charts.byYear} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
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
        borderWidth: 1,
        formatter: function (params: any) {
          if (!Array.isArray(params) || params.length === 0) {
            return '';
          }
          
          let tooltipHtml = `<strong>${params[0].axisValue}</strong><br/>`;
          let total = 0;
          
          params.forEach((param: any) => {
            if (param.value > 0) {
              tooltipHtml += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
            }
            total += param.value;
          });
          
          if (total > 0) {
            tooltipHtml += `<strong>${currentT.common.total}: ${total}</strong>`;
          }
          
          return tooltipHtml;
        }
      },
      legend: {
        data: polarityLabels,
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
  <div class="mb-4">
    <DatasetBadge size="sm" />
  </div>
  
  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '400px' : '500px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if}