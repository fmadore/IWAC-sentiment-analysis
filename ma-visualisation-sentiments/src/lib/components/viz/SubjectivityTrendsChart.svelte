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
  import { LabelLayout } from 'echarts/features';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';
  import { innerWidth } from 'svelte/reactivity/window';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    LabelLayout,
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
    subjectivityColors,
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

  // Get subjectivity labels in current language
  let subjectivityLabels = $derived(getSentimentLabels('subjectivity', $currentLanguage));
  
  // Subjectivity scores (1-5, excluding N/A for trends)
  const subjectivityScores = [1, 2, 3, 4, 5] as const;
  type SubjectivityScore = typeof subjectivityScores[number];

  // Reactive window width for responsive behavior
  let isMobile = $derived((innerWidth.current ?? 1024) < 768);
  let chartContainer = $state<HTMLDivElement>();

  // Use $derived for proper reactivity in Svelte 5
  let options = $derived.by(() => {
    const articles = $filteredArticles; // Direct reactive dependency
    const currentT = $t; // Capture current translations for reactive updates
    const currentLang = $currentLanguage; // Capture current language for reactive updates
    const yearlyData: Record<string, Record<SubjectivityScore, number>> = {};
    let articlesAnalyzed = 0;

    articles.forEach((article: Article) => {
      if (article.publication_date && article.sentiment_analysis?.subjectivite_score) {
        const year = article.publication_date.substring(0, 4);
        const score = article.sentiment_analysis.subjectivite_score as SubjectivityScore;

        if (subjectivityScores.includes(score)) {
          if (!yearlyData[year]) {
            yearlyData[year] = Object.fromEntries(subjectivityScores.map(s => [s, 0])) as Record<SubjectivityScore, number>;
          }
          yearlyData[year][score]++;
          articlesAnalyzed++;
        }
      }
    });

    const years = Object.keys(yearlyData).sort();

    const series = subjectivityScores.map((score, index) => {
      const color = subjectivityColors[score];
      const lineStyle = getLineSeriesStyle(isMobile, color);
      return {
        name: subjectivityLabels[index],
        type: 'line' as const,
        emphasis: getEmphasisConfig(),
        data: years.map(year => yearlyData[year][score] || 0),
        color,
        ...lineStyle,
        smooth: true
      };
    });

    const tooltipConfig = getTooltipConfig(isMobile);

    return {
      backgroundColor: 'transparent',
      title: {
        text: `${currentT.charts.subjectivityTrends} ${currentT.charts.byYear} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
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
        data: subjectivityLabels.slice(0, 5), // Exclude N/A label
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
