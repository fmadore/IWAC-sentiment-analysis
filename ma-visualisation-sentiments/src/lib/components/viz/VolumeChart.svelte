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
  
  // Import centralized chart theme
  import {
    seriesColorPalette,
    getTitleStyle,
    getTooltipConfig,
    getLegendConfig,
    getAxisLineStyle,
    getAxisPointerConfig,
    getAxisLabelStyle,
    getSplitLineStyle,
    getGridConfig,
    getDataZoomConfig,
    getLineSeriesStyle,
    getEmphasisConfig
  } from '$lib/utils/chartTheme';

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

    const series = countries.map((country, index) => {
      const color = seriesColorPalette[index % seriesColorPalette.length];
      const lineStyle = getLineSeriesStyle(isMobile, color);
      return {
        name: country,
        type: 'line' as const,
        stack: chartType === 'area' ? 'total' : undefined,
        areaStyle: chartType === 'area' ? {
          opacity: 0.4
        } : undefined,
        emphasis: getEmphasisConfig(),
        data: years.map(year => countryYearData[country][year] || 0),
        color,
        ...lineStyle,
        smooth: true
      };
    });

    const tooltipConfig = getTooltipConfig(isMobile);

    return {
      backgroundColor: 'transparent',
      title: {
        text: `${currentT.charts.volumeByCountry} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
        left: 'center',
        top: '2%',
        textStyle: getTitleStyle(isMobile)
      },
      tooltip: {
        ...tooltipConfig,
        trigger: 'axis',
        axisPointer: getAxisPointerConfig(),
        formatter: function (params: any) {
          if (!Array.isArray(params) || params.length === 0) {
            return '';
          }
          
          const sortedParams = params.slice().sort((a: any, b: any) => b.value - a.value);
          let listHtml = '';
          let total = 0;
          
          sortedParams.forEach((param: any) => {
            if (param.value > 0) {
              listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};"></span>
                <span style="flex:1;">${param.seriesName}</span>
                <strong>${param.value}</strong>
              </div>`;
            }
            total += param.value;
          });
          
          return `<div style="min-width:160px;">
            <div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${params[0].axisValue}</div>
            ${listHtml}
            ${total > 0 ? `<div style="padding-top:6px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${currentT.common.total}: ${total}</div>` : ''}
          </div>`;
        }
      },
      legend: {
        ...getLegendConfig(isMobile),
        data: countries,
        top: isMobile ? '12%' : '8%'
      },
      grid: getGridConfig(isMobile, { hasLegendTop: true, hasDataZoom: true }),
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years,
        axisLine: getAxisLineStyle(),
        axisLabel: {
          ...getAxisLabelStyle(isMobile),
          rotate: isMobile ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: getAxisLineStyle(),
        splitLine: getSplitLineStyle(),
        axisLabel: {
          ...getAxisLabelStyle(isMobile),
          formatter: (value: number) => Math.floor(value).toString()
        }
      },
      series: series,
      dataZoom: getDataZoomConfig(isMobile)
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