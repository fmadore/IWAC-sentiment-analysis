<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { init, use } from 'echarts/core';
  import { HeatmapChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';
  import { innerWidth } from 'svelte/reactivity/window';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent,
    HeatmapChart,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';
  
  // Import centralized chart theme
  import {
    centralityColors,
    getTitleStyle,
    getTooltipConfig,
    getAxisLineStyle,
    getAxisLabelStyle
  } from '$lib/utils/chartTheme';

  // Mapping des centralités vers des valeurs numériques (toujours en français pour les données)
  const centralityToNumber = {
    'Non abordé': 0,
    'Marginal': 1,
    'Secondaire': 2,
    'Central': 3,
    'Très central': 4
  };
  
  // Heatmap color gradient from not addressed (dark) to very central (bright gold)
  const heatmapColors = [
    centralityColors['Non abordé'],
    centralityColors['Marginal'],
    centralityColors['Secondaire'],
    centralityColors['Central'],
    centralityColors['Très central']
  ];

  // Labels de centralité traduits
  const centralityLabels = $derived([
    translateSentimentValue('Non abordé', $currentLanguage),
    translateSentimentValue('Marginal', $currentLanguage),
    translateSentimentValue('Secondaire', $currentLanguage),
    translateSentimentValue('Central', $currentLanguage),
    translateSentimentValue('Très central', $currentLanguage)
  ]);

  // Reactive window width for responsive behavior
  let isMobile = $derived((innerWidth.current ?? 1024) < 768);
  let chartContainer = $state<HTMLDivElement>();

  let options = $derived.by(() => {
    const articles = $filteredArticles;
    const countryYearCentrality: Record<string, Record<string, { total: number, count: number }>> = {};
    let articlesAnalyzed = 0;
    
    // Get current translations to use in tooltip
    const currentTranslations = $t;

    articles.forEach((article: Article) => {
      if (article.publication_date && 
          article.Country && 
          article.sentiment_analysis?.centralite_islam_musulmans) {
        
        const year = article.publication_date.substring(0, 4);
        const country = article.Country;
        const centralityValue = centralityToNumber[article.sentiment_analysis.centralite_islam_musulmans as keyof typeof centralityToNumber];
        
        if (centralityValue !== undefined) {
          if (!countryYearCentrality[country]) {
            countryYearCentrality[country] = {};
          }
          if (!countryYearCentrality[country][year]) {
            countryYearCentrality[country][year] = { total: 0, count: 0 };
          }
          
          countryYearCentrality[country][year].total += centralityValue;
          countryYearCentrality[country][year].count++;
          articlesAnalyzed++;
        }
      }
    });

    const countries = Object.keys(countryYearCentrality).sort();
    const allYears = new Set<string>();
    
    // Collecter toutes les années
    countries.forEach(country => {
      Object.keys(countryYearCentrality[country]).forEach(year => {
        allYears.add(year);
      });
    });
    
    const years = Array.from(allYears).sort();

    // Préparer les données pour la heatmap
    const heatmapData: Array<[number, number, number]> = [];
    let maxValue = 0;
    let minValue = 4;

    countries.forEach((country, countryIndex) => {
      years.forEach((year, yearIndex) => {
        const data = countryYearCentrality[country]?.[year];
        if (data && data.count > 0) {
          const avgCentrality = data.total / data.count;
          heatmapData.push([yearIndex, countryIndex, avgCentrality]);
          maxValue = Math.max(maxValue, avgCentrality);
          minValue = Math.min(minValue, avgCentrality);
        }
        // Don't push any data point when there are no articles - this will leave the cell empty
      });
    });

    const tooltipConfig = getTooltipConfig(isMobile);

    return {
      backgroundColor: 'transparent',
      title: {
        text: `${$t.charts.centralityHeatmap} (${articlesAnalyzed} ${$t.charts.articlesAnalyzed})`,
        left: 'center',
        top: '2%',
        textStyle: getTitleStyle(isMobile)
      },
      tooltip: {
        ...tooltipConfig,
        position: 'top',
        formatter: function(params: any) {
          if (!params.data || params.data.length < 3) {
            return `<div style="font-weight:600;">${currentTranslations.messages.noData}</div>`;
          }
          
          const [yearIndex, countryIndex, value] = params.data;
          const year = years[yearIndex];
          const country = countries[countryIndex];
          
          if (value === 0 || value === undefined || value === null) {
            return `<div style="min-width:140px;">
              <div style="font-weight:600;margin-bottom:4px;">${country} - ${year}</div>
              <div style="opacity:0.7;">${currentTranslations.messages.noData}</div>
            </div>`;
          }
          
          const centralityLabel = centralityLabels[Math.round(value)] || 'N/A';
          
          return `<div style="min-width:160px;">
            <div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${country} - ${year}</div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span>${currentTranslations.filters.averageCentrality}:</span>
              <strong>${value.toFixed(2)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:2px 0;">
              <span>${currentTranslations.filters.level}:</span>
              <strong>${centralityLabel}</strong>
            </div>
          </div>`;
        }
      },
      grid: {
        height: '55%',
        top: isMobile ? '18%' : '14%',
        left: isMobile ? '12%' : '8%',
        right: isMobile ? '8%' : '6%'
      },
      xAxis: {
        type: 'category',
        data: years,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'transparent']
          }
        },
        axisLabel: {
          ...getAxisLabelStyle(isMobile),
          rotate: isMobile ? 45 : 0
        },
        axisLine: getAxisLineStyle()
      },
      yAxis: {
        type: 'category',
        data: countries,
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'transparent']
          }
        },
        axisLabel: getAxisLabelStyle(isMobile),
        axisLine: getAxisLineStyle()
      },
      visualMap: {
        min: 0,
        max: 4,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        textStyle: {
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: isMobile ? 10 : 12,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        },
        itemWidth: isMobile ? 15 : 20,
        itemHeight: isMobile ? 100 : 140,
        inRange: {
          color: heatmapColors
        },
        text: [centralityLabels[4], centralityLabels[0]],
        pieces: [
          { min: 0, max: 0.5, label: centralityLabels[0], color: heatmapColors[0] },
          { min: 0.5, max: 1.5, label: centralityLabels[1], color: heatmapColors[1] },
          { min: 1.5, max: 2.5, label: centralityLabels[2], color: heatmapColors[2] },
          { min: 2.5, max: 3.5, label: centralityLabels[3], color: heatmapColors[3] },
          { min: 3.5, max: 4, label: centralityLabels[4], color: heatmapColors[4] }
        ]
      },
      series: [{
        name: currentTranslations.filters.centrality,
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 2
          }
        },
        itemStyle: {
          borderColor: 'rgba(15, 23, 42, 0.8)',
          borderWidth: 1,
          borderRadius: 2
        }
      }]
    } as EChartsOption;
  });
</script>

{#if $filteredArticles.length > 0}
  <div class="mb-4">
    <DatasetBadge size="sm" />
  </div>
  
  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '500px' : '600px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if} 