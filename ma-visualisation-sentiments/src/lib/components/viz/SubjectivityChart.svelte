<script lang="ts">
  import { Chart } from 'svelte-echarts';

  // ECharts core and modules for tree-shaking
  import { init, use } from 'echarts/core';
  import { BarChart, PieChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { LabelLayout, UniversalTransition } from 'echarts/features';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption, SeriesOption } from 'echarts';
  import { innerWidth } from 'svelte/reactivity/window';

  // Register the required components
  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    PieChart,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { getSentimentLabels, formatNumber } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';
  
  // Import centralized chart theme
  import {
    subjectivityColorsByLabel,
    seriesColorPalette,
    getTitleStyle,
    getTooltipConfig,
    getLegendConfig,
    getAxisLineStyle,
    getAxisLabelStyle,
    getSplitLineStyle,
    getGridConfig,
    getPieSeriesStyle,
    getEmphasisConfig,
    getUniversalTransitionConfig,
    getStaggeredAnimationDelay
  } from '$lib/utils/chartTheme';

  // Get subjectivity labels in current language
  let subjectivityLabels = $derived(getSentimentLabels('subjectivity', $currentLanguage));
  
  // French labels for data lookup (data is stored in French)
  const frenchSubjectivityLabels = ['Factuel', 'Plutôt factuel', 'Mixte', 'Plutôt subjectif', 'Subjectif', 'Non applicable'];
  
  // Function that converts numeric score to French label (for data operations)
  function getSubjectivityLabel(score: number | null): string {
    if (score === null || score === undefined) return 'Non applicable';
    
    switch (score) {
      case 1: return 'Factuel';
      case 2: return 'Plutôt factuel';
      case 3: return 'Mixte';
      case 4: return 'Plutôt subjectif';
      case 5: return 'Subjectif';
      default: return 'Non applicable';
    }
  }

  // Reactive window width for responsive behavior
  let isMobile = $derived((innerWidth.current ?? 1024) < 768);
  let chartContainer = $state<HTMLDivElement>();
  let chartType = $state<'bar' | 'pie'>('bar');

  // Use $derived for proper reactivity in Svelte 5
  let options = $derived.by(() => {
    const articles = $filteredArticles; // Direct reactive dependency
    const currentT = $t; // Capture current translations for reactive updates
    const currentLang = $currentLanguage; // Capture current language for reactive updates
    let articlesAnalyzed = 0;
    const newspaperSubjectivityCounts: Record<string, Record<string, number>> = {};
    const uniqueNewspapers = new Set<string>();

    articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.subjectivite_score !== undefined) {
        const subjectivityScore = article.sentiment_analysis.subjectivite_score;
        const subjectivityKey = getSubjectivityLabel(subjectivityScore);
        const journal = getJournalName(article); // Use the utility function
        uniqueNewspapers.add(journal);

        if (!newspaperSubjectivityCounts[journal]) {
          newspaperSubjectivityCounts[journal] = Object.fromEntries(frenchSubjectivityLabels.map(l => [l, 0]));
        }
        if (Object.prototype.hasOwnProperty.call(newspaperSubjectivityCounts[journal], subjectivityKey)) {
          newspaperSubjectivityCounts[journal][subjectivityKey]++;
        }
        articlesAnalyzed++;
      }
    });

    const newspaperList = Array.from(uniqueNewspapers).sort();

    if (chartType === 'pie') {
      // Pie chart: global aggregation by subjectivity
      const totalBySubjectivity: Record<string, number> = {};
      frenchSubjectivityLabels.forEach((frenchLabel, index) => {
        const translatedLabel = subjectivityLabels[index];
        totalBySubjectivity[translatedLabel] = 0;
        newspaperList.forEach(journal => {
          totalBySubjectivity[translatedLabel] += newspaperSubjectivityCounts[journal]?.[frenchLabel] || 0;
        });
      });

      const pieData = subjectivityLabels
        .filter((label, index) => totalBySubjectivity[label] > 0)
        .map((label, index) => ({
          name: label,
          value: totalBySubjectivity[label],
          itemStyle: { color: subjectivityColorsByLabel[frenchSubjectivityLabels[index] as keyof typeof subjectivityColorsByLabel] }
        }));

      const pieStyle = getPieSeriesStyle(isMobile);
      const tooltipConfig = getTooltipConfig(isMobile);

      return {
        backgroundColor: 'transparent',
        title: {
          text: `${currentT.charts.globalDistribution} ${currentT.charts.subjectivityDistribution.toLowerCase()} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
          left: 'center',
          top: '2%',
          textStyle: getTitleStyle(isMobile)
        },
        tooltip: {
          ...tooltipConfig,
          trigger: 'item',
          formatter: function(params: any) {
            if (Array.isArray(params)) {
              return params.map(param => 
                `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span> ${param.seriesName}: ${param.value} (${param.percent}%)`
              ).join('<br/>');
            } else {
              return `<div style="font-weight:600;margin-bottom:8px;">${params.seriesName}</div>
                      <span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${params.color};"></span> 
                      ${params.name}: <strong>${formatNumber(params.value, currentLang)}</strong> (${params.percent}%)`;
            }
          }
        },
        legend: {
          show: false
        },
        series: [{
          name: currentT.filters.subjectivity,
          type: 'pie',
          ...pieStyle,
          ...getUniversalTransitionConfig(),
          id: 'subjectivity',
          data: pieData
        }]
      } as EChartsOption;
    
    } else {
      // Bar chart (original)
      const seriesData: SeriesOption[] = newspaperList.map((journal, index) => {
        return {
          name: journal,
          type: 'bar',
          stack: 'total',
          emphasis: getEmphasisConfig(),
          ...getUniversalTransitionConfig(),
          ...getStaggeredAnimationDelay(),
          id: `subjectivity-${index}`,
          data: frenchSubjectivityLabels.map(frenchLabel => newspaperSubjectivityCounts[journal]?.[frenchLabel] || 0),
          itemStyle: {
            color: seriesColorPalette[index % seriesColorPalette.length],
            borderRadius: [2, 2, 0, 0]
          }
        };
      });

      const tooltipConfig = getTooltipConfig(isMobile);

      return {
        backgroundColor: 'transparent',
        title: {
          text: isMobile 
            ? `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal}\n(${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`
            : `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
          left: 'center',
          top: '1%',
          textStyle: {
            ...getTitleStyle(isMobile),
            lineHeight: isMobile ? 16 : 20
          }
        },
        tooltip: {
          ...tooltipConfig,
          trigger: 'axis',
          triggerOn: 'mousemove',
          enterable: true,
          axisPointer: {
            type: 'shadow',
            shadowStyle: {
              color: 'rgba(59, 130, 246, 0.08)'
            }
          },
          confine: true,
          formatter: function (params: any) {
            if (!Array.isArray(params) || params.length === 0) {
              return '';
            }
            const sortedParams = params.slice().sort((a: any, b: any) => b.value - a.value);
            
            let listItemsHtml = '';
            let total = 0;
            
            sortedParams.forEach((param: any) => {
              if (param.value > 0) { 
                listItemsHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${param.color};"></span>
                  <span style="flex:1;">${param.seriesName}</span>
                  <strong>${param.value}</strong>
                </div>`;
              }
              total += param.value;
            });

            return `<div style="min-width:180px;">
              <div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${params[0].axisValueLabel}</div>
              <div style="max-height:${isMobile ? '150px' : '200px'};overflow-y:auto;margin-bottom:8px;">
                ${listItemsHtml}
              </div>
              <div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">${currentT.common.total}: ${total}</div>
            </div>`;
          }
        },
        legend: {
          ...getLegendConfig(isMobile),
          data: newspaperList,
          bottom: isMobile ? '8%' : undefined,
          top: isMobile ? undefined : '8%'
        },
        grid: getGridConfig(isMobile, { 
          hasLegendTop: !isMobile, 
          legendPosition: isMobile ? 'bottom' : 'top' 
        }),
        xAxis: {
          type: 'category',
          data: subjectivityLabels,
          axisTick: {
            alignWithLabel: true,
            lineStyle: { color: 'rgba(255, 255, 255, 0.2)' }
          },
          axisLine: getAxisLineStyle(),
          axisLabel: {
            ...getAxisLabelStyle(isMobile),
            rotate: isMobile ? 45 : 30,
            interval: 0
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
        series: seriesData
      } as EChartsOption;
    }
  });
</script>

{#if $filteredArticles.length > 0}
  <!-- Dataset badge and Chart type selection buttons -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
    <DatasetBadge size="sm" />
    
    <div class="flex flex-wrap gap-2 justify-center">
      <button 
        class="btn btn-sm hover-lift transition-all duration-200 {chartType === 'bar' ? 'variant-filled-primary shadow-lg scale-105' : 'variant-soft-surface hover:variant-soft-primary'}"
        onclick={() => chartType = 'bar'}
      >
        📊 {$t.charts.bars}
      </button>
      <button 
        class="btn btn-sm hover-lift transition-all duration-200 {chartType === 'pie' ? 'variant-filled-primary shadow-lg scale-105' : 'variant-soft-surface hover:variant-soft-primary'}"
        onclick={() => chartType = 'pie'}
      >
        🥧 {$t.charts.pie}
      </button>
    </div>
  </div>

  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '350px' : '450px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if}