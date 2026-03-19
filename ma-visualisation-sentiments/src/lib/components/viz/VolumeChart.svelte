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
  import { UniversalTransition } from 'echarts/features';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';
  import { innerWidth } from 'svelte/reactivity/window';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    UniversalTransition,
    CanvasRenderer,
    DataZoomComponent
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { t, currentLanguage } from '$lib/i18n';
  import { formatNumber } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';
  import { createTrendTooltipFormatter } from '$lib/utils/chartFormatters';

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
    getEmphasisConfig,
    getUniversalTransitionConfig
  } from '$lib/utils/chartTheme';

  // Reactive window width for responsive behavior
  let isMobile = $derived((innerWidth.current ?? 1024) < 768);
  let chartContainer = $state<HTMLDivElement>();
  let chartType = $state<'area' | 'line'>('area');

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
        ...getUniversalTransitionConfig(),
        id: `volume-${index}`,
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
        formatter: createTrendTooltipFormatter({
          getTotalLabel: () => currentT.common.total,
          sort: true
        })
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