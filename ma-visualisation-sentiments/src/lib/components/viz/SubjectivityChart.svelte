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
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption, SeriesOption } from 'echarts'; // Main EChartsOption and SeriesOption
  import { onMount } from 'svelte';

  // Register the required components
  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    PieChart,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { getJournalName } from '$lib/utils';
  import { t, currentLanguage } from '$lib/i18n';
  import { getSentimentLabels, formatNumber } from '$lib/i18n/utils';

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
  
  // Color definitions with logical gradations for subjectivity
  const subjectivityColors: Record<string, string> = {
    'Factuel': '#059669',       // Score 1 - Dark green (very objective)
    'Plutôt factuel': '#10B981', // Score 2 - Medium green (rather objective)
    'Mixte': '#3B82F6',         // Score 3 - Blue (neutral/mixed)
    'Plutôt subjectif': '#EF4444', // Score 4 - Medium red (rather subjective)
    'Subjectif': '#DC2626',     // Score 5 - Dark red (very subjective)
    'Non applicable': '#9CA3AF'  // Neutral gray
  };

  // Color palette for newspapers
  const newspaperColorPalette = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#6c5ce7'
  ];

  function getNewspaperColor(journal: string, index: number): string {
    // Generate a color based on the journal name or use a color from the palette
    return newspaperColorPalette[index % newspaperColorPalette.length];
  }

  let isMobile = $state(false);
  let chartContainer = $state<HTMLDivElement>();
  let chartType = $state<'bar' | 'pie'>('bar');

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
          itemStyle: { color: subjectivityColors[frenchSubjectivityLabels[index]] }
        }));

      return {
        title: {
          text: `${currentT.charts.globalDistribution} ${currentT.charts.subjectivityDistribution.toLowerCase()} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
          left: 'center',
          top: '2%',
          textStyle: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: isMobile ? 12 : 16
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params: any) {
            if (Array.isArray(params)) {
              return params.map(param => 
                `${param.marker} ${param.seriesName}: ${param.value} (${param.percent}%)`
              ).join('<br/>');
            } else {
              return `${params.marker} ${params.seriesName}<br/>${params.name}: ${params.value} (${params.percent}%)`;
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
          show: false // Hide legend for pie chart to avoid confusion
        },
        series: [{
          name: currentT.filters.subjectivity,
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: pieData,
          label: {
            color: '#fff',
            fontSize: isMobile ? 10 : 12,
            fontWeight: 'normal'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      } as EChartsOption;
    
    } else {
      // Bar chart (original)
      const seriesData: SeriesOption[] = newspaperList.map((journal, index) => {
        return {
          name: journal,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: frenchSubjectivityLabels.map(frenchLabel => newspaperSubjectivityCounts[journal]?.[frenchLabel] || 0),
          itemStyle: {
            color: getNewspaperColor(journal, index)
          }
        };
      });

      return {
        title: {
          text: isMobile 
            ? `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal}\n(${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`
            : `${currentT.charts.subjectivityDistribution} ${currentT.charts.byJournal} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
          left: 'center',
          top: '1%',
          textStyle: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: isMobile ? 11 : 16,
            lineHeight: isMobile ? 16 : 20
          }
        },
        tooltip: {
          trigger: 'axis',
          triggerOn: 'mousemove',
          enterable: true,
          axisPointer: {
            type: 'shadow'
          },
          confine: true,
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
            const sortedParams = params.slice().sort((a: any, b: any) => b.value - a.value);
            
            let listItemsHtml = '';
            let total = 0;
            
            sortedParams.forEach((param: any) => {
              if (param.value > 0) { 
                listItemsHtml += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
              }
              total += param.value;
            });

            // Wrap the list in a scrollable div
            const scrollableListHtml = `
              <div style="max-height: ${isMobile ? '150px' : '200px'}; overflow-y: auto; margin-bottom: 5px;">
                ${listItemsHtml}
              </div>`;
            
            let tooltipHtml = `${params[0].axisValueLabel}<br/>`;
            tooltipHtml += scrollableListHtml;
            tooltipHtml += `<strong>${currentT.common.total}: ${total}</strong>`;
            
            return tooltipHtml;
          }
        },
        legend: {
          data: newspaperList,
          bottom: isMobile ? '8%' : undefined,
          top: isMobile ? undefined : '8%',
          textStyle: {
            color: '#fff',
            fontSize: isMobile ? 10 : 12
          },
          type: 'scroll',
          orient: 'horizontal',
          left: 'center',
          itemWidth: isMobile ? 12 : 25,
          itemHeight: isMobile ? 8 : 14
        },
        grid: {
          left: isMobile ? '5%' : '3%',
          right: isMobile ? '5%' : '4%',
          bottom: isMobile ? '25%' : '3%',
          top: isMobile ? '18%' : '18%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: subjectivityLabels,
          axisTick: {
            alignWithLabel: true
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.5)'
            }
          },
          axisLabel: {
            color: '#fff',
            rotate: isMobile ? 45 : 30,
            fontSize: isMobile ? 9 : 11,
            interval: 0 // Show all labels
          }
        },
        yAxis: {
          type: 'value',
          minInterval: 1, // Force integer intervals
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
              return Math.floor(value).toString(); // Ensure only whole numbers are displayed
            }
          }
        },
        series: seriesData
      } as EChartsOption;
    }
  });
</script>

{#if $filteredArticles.length > 0}
  <!-- Chart type selection buttons -->
  <div class="flex flex-wrap gap-2 mb-4 justify-center">
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