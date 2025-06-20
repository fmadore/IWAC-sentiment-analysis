<!-- SentimentChart.svelte component with ECharts integration --> 
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
  import { getSentimentLabels, formatNumber, getLocale } from '$lib/i18n/utils';

  // Get polarity labels in current language
  let polarityLabels = $derived(getSentimentLabels('polarity', $currentLanguage));
  
  // French labels for data lookup (data is stored in French)
  const frenchPolarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  
  // Color definitions with logical gradations
  const polarityColors = {
    'Très positif': '#059669',    // Dark green (more intense)
    'Positif': '#10B981',         // Medium green
    'Neutre': '#3B82F6',          // Blue
    'Négatif': '#EF4444',         // Medium red
    'Très négatif': '#DC2626',    // Dark red (more intense)
    'Non applicable': '#9CA3AF'   // Neutral gray
  };

  let isMobile = $state(false);
  let chartContainer = $state<HTMLDivElement>();
  let chartType = $state<'bar' | 'pie'>('bar');
  let isLoading = $state(true);

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simulate loading delay for smooth transition
    setTimeout(() => {
      isLoading = false;
    }, 300);
    
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
    const newspaperPolarityCounts: Record<string, Record<string, number>> = {};
    const uniqueNewspapers = new Set<string>();

    articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.polarite) {
        const polarityKey = article.sentiment_analysis.polarite as string;
        const journal = getJournalName(article); // Use the utility function
        uniqueNewspapers.add(journal);

        if (!newspaperPolarityCounts[journal]) {
          newspaperPolarityCounts[journal] = Object.fromEntries(frenchPolarityLabels.map(l => [l, 0]));
        }
        if (newspaperPolarityCounts[journal].hasOwnProperty(polarityKey)) {
          newspaperPolarityCounts[journal][polarityKey]++;
        }
        articlesAnalyzed++;
      }
    });

    const newspaperList = Array.from(uniqueNewspapers).sort();

    if (chartType === 'pie') {
      // Pie chart: agrégation globale par polarité
      const totalByPolarity: Record<string, number> = {};
      frenchPolarityLabels.forEach((frenchLabel, index) => {
        const translatedLabel = polarityLabels[index];
        totalByPolarity[translatedLabel] = 0;
        newspaperList.forEach(journal => {
          totalByPolarity[translatedLabel] += newspaperPolarityCounts[journal]?.[frenchLabel] || 0;
        });
      });

      const pieData = polarityLabels
        .filter(label => totalByPolarity[label] > 0)
        .map((label, index) => ({
          name: label,
          value: totalByPolarity[label],
          itemStyle: { color: polarityColors[frenchPolarityLabels[index] as keyof typeof polarityColors] }
        }));

      return {
        title: {
          text: `${currentT.charts.globalDistribution} ${currentT.charts.polarityDistribution.toLowerCase()} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.common.articles})`,
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
          data: newspaperList,
          top: isMobile ? '12%' : '8%',
          textStyle: {
            color: '#fff',
            fontSize: isMobile ? 10 : 12
          },
          type: 'scroll', // Added for better handling of many newspapers
          orient: isMobile ? 'vertical' : 'horizontal',
          left: isMobile ? 'right' : 'center',
          itemWidth: isMobile ? 12 : 25,
          itemHeight: isMobile ? 8 : 14
        },
        series: [{
          name: currentT.filters.polarity,
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
      const seriesData: SeriesOption[] = newspaperList.map(journal => {
        return {
          name: journal,
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: frenchPolarityLabels.map(frenchLabel => newspaperPolarityCounts[journal]?.[frenchLabel] || 0)
          // ECharts will assign colors automatically. If specific colors are needed per newspaper:
          // itemStyle: { color: getNewspaperColor(journal) }
        };
      });

      return {
        title: {
          text: isMobile 
            ? `${currentT.charts.polarityDistribution} ${currentT.charts.byJournal}\n(${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`
            : `${currentT.charts.polarityDistribution} ${currentT.charts.byJournal} (${formatNumber(articlesAnalyzed, currentLang)} ${currentT.charts.articlesAnalyzed})`,
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
              total += param.value; // Total should include all, even if not displayed due to future limits
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
          type: 'scroll', // Added for better handling of many newspapers
          orient: 'horizontal',
          left: 'center',
          itemWidth: isMobile ? 12 : 25,
          itemHeight: isMobile ? 8 : 14
        },
        grid: {
          left: isMobile ? '5%' : '3%',
          right: isMobile ? '5%' : '4%',
          bottom: isMobile ? '25%' : '3%',
          top: isMobile ? '18%' : '18%', // Adjust top if legend takes more space
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: polarityLabels,
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