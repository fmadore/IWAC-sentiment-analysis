<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { init, use } from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';
  import DatasetBadge from '../ui/DatasetBadge.svelte';
  
  // Import centralized chart theme
  import {
    subjectivityColors,
    getTitleStyle,
    getTooltipConfig,
    getLegendConfig,
    getAxisLineStyle,
    getAxisLabelStyle,
    getSplitLineStyle,
    getGridConfig,
    getEmphasisConfig
  } from '$lib/utils/chartTheme';

  // Ordre des polarités pour l'affichage (French values for data operations)
  const polarityOrder = [
    'Très négatif',
    'Négatif', 
    'Neutre',
    'Positif',
    'Très positif',
    'Non applicable'
  ];

  // Reactive translated polarity labels for display
  let translatedPolarityLabels = $derived(
    polarityOrder.map(polarity => translateSentimentValue(polarity, $currentLanguage))
  );

  // Ordre des scores de subjectivité
  const subjectivityOrder = [1, 2, 3, 4, 5];

  // Reactive subjectivity labels that update with language changes
  let subjectivityLabels = $derived({
    1: $t.filters.veryObjectiveScore,
    2: $t.filters.ratherObjectiveScore,
    3: $t.filters.mixedScore,
    4: $t.filters.ratherSubjectiveScore,
    5: $t.filters.verySubjectiveScore
  });

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

  let options = $derived.by(() => {
    const articles = $filteredArticles;
    
    // Structure: polarité -> subjectivité -> count
    const data: Record<string, Record<number, number>> = {};
    let articlesAnalyzed = 0;

    // Initialiser la structure de données
    polarityOrder.forEach(polarity => {
      data[polarity] = {};
      subjectivityOrder.forEach(subj => {
        data[polarity][subj] = 0;
      });
    });

    // Compter les articles
    articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.polarite && 
          article.sentiment_analysis?.subjectivite_score !== undefined) {
        
        const polarity = article.sentiment_analysis.polarite;
        const subjectivity = article.sentiment_analysis.subjectivite_score;
        
        if (data[polarity] && subjectivity !== null && subjectivity >= 1 && subjectivity <= 5) {
          data[polarity][subjectivity]++;
          articlesAnalyzed++;
        }
      }
    });

    // Créer les séries pour chaque score de subjectivité
    const series = subjectivityOrder.map(subjScore => ({
      name: subjectivityLabels[subjScore as keyof typeof subjectivityLabels],
      type: 'bar' as const,
      data: polarityOrder.map(polarity => data[polarity][subjScore]),
      itemStyle: {
        color: subjectivityColors[subjScore as keyof typeof subjectivityColors],
        borderRadius: [3, 3, 0, 0]
      },
      emphasis: getEmphasisConfig()
    }));

    const tooltipConfig = getTooltipConfig(isMobile);

    return {
      backgroundColor: 'transparent',
      title: {
        text: `${$t.charts.polaritySubjectivityDistribution} (${articlesAnalyzed} ${$t.common.articles})`,
        left: 'center',
        top: '2%',
        textStyle: getTitleStyle(isMobile)
      },
      tooltip: {
        ...tooltipConfig,
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(59, 130, 246, 0.08)'
          }
        },
        formatter: function(params: any) {
          let listHtml = '';
          let total = 0;
          params.forEach((param: any) => {
            if (param.value > 0) {
              listHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${param.color};"></span>
                <span style="flex:1;">${param.seriesName}</span>
                <strong>${param.value}</strong>
              </div>`;
              total += param.value;
            }
          });
          return `<div style="min-width:180px;">
            <div style="font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);">${params[0].name}</div>
            ${listHtml}
            <div style="padding-top:6px;margin-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-weight:600;">Total: ${total} ${$t.common.articles}</div>
          </div>`;
        }
      },
      legend: {
        ...getLegendConfig(isMobile),
        data: subjectivityOrder.map(s => subjectivityLabels[s as keyof typeof subjectivityLabels]),
        top: isMobile ? '12%' : '8%'
      },
      grid: getGridConfig(isMobile, { hasLegendTop: true }),
      xAxis: {
        type: 'category',
        data: translatedPolarityLabels,
        axisLabel: {
          ...getAxisLabelStyle(isMobile),
          interval: 0,
          rotate: isMobile ? 45 : 0
        },
        axisLine: getAxisLineStyle(),
        axisTick: {
          alignWithLabel: true,
          lineStyle: { color: 'rgba(255, 255, 255, 0.2)' }
        }
      },
      yAxis: {
        type: 'value',
        name: $t.filters.numberOfArticles,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: getAxisLabelStyle(isMobile),
        axisLine: getAxisLineStyle(),
        splitLine: getSplitLineStyle(),
        nameTextStyle: {
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: isMobile ? 10 : 12,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }
      },
      series: series
    } as EChartsOption;
  });
</script>

{#if $filteredArticles.length > 0}
  <div class="mb-4">
    <DatasetBadge size="sm" />
  </div>
  
  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '450px' : '500px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.table.noFilteredArticles}</p>
{/if} 