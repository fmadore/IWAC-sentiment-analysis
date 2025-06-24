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
  import { formatNumber } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';

  // Color palette for countries
  const countryColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#6c5ce7'
  ];

  let isMobile = $state(false);
  let chartContainer = $state<HTMLDivElement>();
  let chartType = $state<'area' | 'line'>('area');

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

  let options = $derived.by(() => {
    const articles = $filteredArticles;
    const currentT = $t; // Capture current translations for reactive updates
    const currentLang = $currentLanguage; // Capture current language for reactive updates
    const countryYearData: Record<string, Record<string, number>> = {};
    let articlesAnalyzed = 0;

    articles.forEach((article: Article) => {
      if (article.publication_date && article.Country) {
        const year = article.publication_date.substring(0, 4);
        const country = article.Country;

        if (!countryYearData[country]) {
          countryYearData[country] = {};
        }
        if (!countryYearData[country][year]) {
          countryYearData[country][year] = 0;
        }
        countryYearData[country][year]++;
        articlesAnalyzed++;
      }
    });

    const countries = Object.keys(countryYearData);
    const allYears = new Set<string>();
    
    // Collecter toutes les années
    countries.forEach(country => {
      Object.keys(countryYearData[country]).forEach(year => {
        allYears.add(year);
      });
    });
    
    const years = Array.from(allYears).sort();

    const series = countries.map((country, index) => ({
      name: country,
      type: 'line' as 'line',
      stack: chartType === 'area' ? 'total' : undefined,
      areaStyle: chartType === 'area' ? {} : undefined,
      emphasis: {
        focus: 'series' as 'series'
      },
      data: years.map(year => countryYearData[country][year] || 0),
      color: countryColors[index % countryColors.length],
      lineStyle: {
        width: isMobile ? 2 : 3
      },
      symbolSize: isMobile ? 4 : 6,
      smooth: true
    }));

    return {
      title: {
        text: `${currentT.charts.volumeByCountry} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
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
          
          // Sort by value in descending order
          const sortedParams = params.slice().sort((a: any, b: any) => b.value - a.value);
          
          sortedParams.forEach((param: any) => {
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
        data: countries,
        top: isMobile ? '12%' : '8%',
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        },
        type: 'scroll',
        orient: isMobile ? 'vertical' : 'horizontal',
        left: isMobile ? 'right' : 'center'
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
      dataZoom: [
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
  <!-- Dataset badge and chart type selection buttons -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
    <DatasetBadge size="sm" />
    
    <div class="flex flex-wrap gap-2 justify-center">
      <button 
        class="btn btn-sm hover-lift {chartType === 'area' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => chartType = 'area'}
      >
        📈 {$t.charts.stackedAreas}
      </button>
      <button 
        class="btn btn-sm hover-lift {chartType === 'line' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => chartType = 'line'}
      >
        📊 {$t.charts.lines}
      </button>
    </div>
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