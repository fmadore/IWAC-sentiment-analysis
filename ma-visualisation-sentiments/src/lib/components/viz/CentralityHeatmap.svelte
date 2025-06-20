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
  import { onMount } from 'svelte';

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

  // Mapping des centralités vers des valeurs numériques (toujours en français pour les données)
  const centralityToNumber = {
    'Non abordé': 0,
    'Marginal': 1,
    'Secondaire': 2,
    'Central': 3,
    'Très central': 4
  };

  // Labels de centralité traduits
  const centralityLabels = $derived([
    translateSentimentValue('Non abordé', $currentLanguage),
    translateSentimentValue('Marginal', $currentLanguage),
    translateSentimentValue('Secondaire', $currentLanguage),
    translateSentimentValue('Central', $currentLanguage),
    translateSentimentValue('Très central', $currentLanguage)
  ]);

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

  let options = $derived.by(() => {
    const articles = $filteredArticles;
    const countryYearCentrality: Record<string, Record<string, { total: number, count: number }>> = {};
    let articlesAnalyzed = 0;

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
        } else {
          heatmapData.push([yearIndex, countryIndex, 0]);
        }
      });
    });

    return {
      title: {
        text: `${$t.charts.centralityHeatmap} (${articlesAnalyzed} ${$t.charts.articlesAnalyzed})`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: isMobile ? 12 : 16
        }
      },
      tooltip: {
        position: 'top',
        formatter: function(params: any) {
          const [yearIndex, countryIndex, value] = params.data;
          const year = years[yearIndex];
          const country = countries[countryIndex];
          const centralityLabel = centralityLabels[Math.round(value)] || 'N/A';
          
          return `<strong>${country} - ${year}</strong><br/>
                  ${$t.filters.averageCentrality}: ${value.toFixed(2)}<br/>
                  ${$t.filters.level}: ${centralityLabel}`;
        },
        textStyle: {
          color: '#333',
          fontSize: isMobile ? 10 : 12
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1
      },
      grid: {
        height: '60%',
        top: isMobile ? '20%' : '15%',
        left: isMobile ? '15%' : '10%',
        right: isMobile ? '15%' : '10%'
      },
      xAxis: {
        type: 'category',
        data: years,
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#fff',
          fontSize: isMobile ? 9 : 11,
          rotate: isMobile ? 45 : 0
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: countries,
        splitArea: {
          show: true
        },
        axisLabel: {
          color: '#fff',
          fontSize: isMobile ? 9 : 11
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }
      },
      visualMap: {
        min: 0,
        max: 4,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        },
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        text: [centralityLabels[4], centralityLabels[0]], // Très central, Non abordé
        pieces: [
          { min: 0, max: 0.5, label: centralityLabels[0], color: '#313695' },
          { min: 0.5, max: 1.5, label: centralityLabels[1], color: '#4575b4' },
          { min: 1.5, max: 2.5, label: centralityLabels[2], color: '#74add1' },
          { min: 2.5, max: 3.5, label: centralityLabels[3], color: '#fdae61' },
          { min: 3.5, max: 4, label: centralityLabels[4], color: '#d73027' }
        ]
      },
      series: [{
        name: $t.filters.centrality,
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    } as EChartsOption;
  });
</script>

{#if $filteredArticles.length > 0}
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