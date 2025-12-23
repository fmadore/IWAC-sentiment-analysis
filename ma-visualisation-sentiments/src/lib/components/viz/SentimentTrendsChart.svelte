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
  
  // Import centralized chart theme
  import {
    polarityColors,
    getTitleStyle,
    getTooltipConfig,
    getLegendConfig,
    getAxisLineStyle,
    getAxisLabelStyle,
    getSplitLineStyle,
    getGridConfig,
    getDataZoomConfig,
    getLineSeriesStyle,
    getEmphasisConfig
  } from '$lib/utils/chartTheme';

  // Get polarity labels in current language
  let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
  
  // French labels for data lookup (data is stored in French)
  const frenchPolarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'] as const;
  type PolarityType = typeof frenchPolarityLabels[number];

  let isMobile = $state(false);
  let chartContainer = $state<HTMLDivElement>();

  // Modern Svelte 5 approach using $effect instead of onMount
  $effect(() => {
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

    const series = frenchPolarityLabels.map((frenchPolarity, index) => {
      const color = polarityColors[frenchPolarity as keyof typeof polarityColors];
      const lineStyle = getLineSeriesStyle(isMobile, color);
      return {
        name: polarityLabels[index],
        type: 'line' as const,
        emphasis: getEmphasisConfig(),
        data: years.map(year => yearlyData[year][frenchPolarity] || 0),
        color,
        ...lineStyle,
        smooth: true
      };
    });

    const tooltipConfig = getTooltipConfig(isMobile);

    return {
      backgroundColor: 'transparent',
      title: {
        text: `${currentT.charts.sentimentTrends} ${currentT.charts.byYear} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
        left: 'center',
        top: '2%',
        textStyle: getTitleStyle(isMobile)
      },
      tooltip: {
        ...tooltipConfig,
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          crossStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          }
        },
        formatter: function (params: any) {
          if (!Array.isArray(params) || params.length === 0) {
            return '';
          }
          
          let listHtml = '';
          let total = 0;
          
          params.forEach((param: any) => {
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
        data: polarityLabels,
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