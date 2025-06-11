<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { init, use } from 'echarts/core';
  import { ScatterChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';
  import { onMount } from 'svelte';

  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    ScatterChart,
    CanvasRenderer
  ]);

  import { filteredArticles } from '$lib';
  import type { Article } from '$lib';
  import { getJournalName } from '$lib/utils';

  // Mapping des polarités vers des valeurs numériques
  const polarityToNumber = {
    'Très négatif': -2,
    'Négatif': -1,
    'Neutre': 0,
    'Positif': 1,
    'Très positif': 2,
    'Non applicable': null
  };

  // Définition des couleurs pour les journaux
  const journalColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#6c5ce7'
  ];

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
    const journalData: Record<string, Array<[number, number, string]>> = {};
    let articlesAnalyzed = 0;

    articles.forEach((article: Article) => {
      if (article.sentiment_analysis?.polarite && 
          article.sentiment_analysis?.subjectivite_score !== undefined) {
        
        const polarityValue = polarityToNumber[article.sentiment_analysis.polarite as keyof typeof polarityToNumber];
        const subjectivityValue = article.sentiment_analysis.subjectivite_score;
        
        if (polarityValue !== null && subjectivityValue !== null) {
          const journal = getJournalName(article);
          
          if (!journalData[journal]) {
            journalData[journal] = [];
          }
          
          journalData[journal].push([
            polarityValue, 
            subjectivityValue, 
            article['o:title'] || 'Sans titre'
          ]);
          articlesAnalyzed++;
        }
      }
    });

    const journalList = Object.keys(journalData);
    const series = journalList.map((journal, index) => ({
      name: journal,
      type: 'scatter' as 'scatter',
      data: journalData[journal],
      itemStyle: {
        color: journalColors[index % journalColors.length]
      },
      symbolSize: isMobile ? 6 : 8,
      emphasis: {
        focus: 'series' as 'series'
      }
    }));

    return {
      title: {
        text: `Corrélation Polarité vs Subjectivité (${articlesAnalyzed} articles)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: isMobile ? 12 : 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const [polarity, subjectivity, title] = params.data;
          const polarityLabels = {
            '-2': 'Très négatif',
            '-1': 'Négatif',
            '0': 'Neutre',
            '1': 'Positif',
            '2': 'Très positif'
          };
                     return `<strong>${params.seriesName}</strong><br/>
                   Polarité: ${polarityLabels[String(polarity) as keyof typeof polarityLabels]}<br/>
                   Subjectivité: ${subjectivity}<br/>
                   <em>${title.length > 50 ? title.substring(0, 50) + '...' : title}</em>`;
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
        data: journalList,
        top: isMobile ? '12%' : '8%',
        textStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        },
        type: 'scroll',
        orient: isMobile ? 'vertical' : 'horizontal',
        left: isMobile ? 'right' : 'center'
      },
      grid: {
        left: isMobile ? '10%' : '8%',
        right: isMobile ? '25%' : '8%',
        bottom: isMobile ? '15%' : '12%',
        top: isMobile ? '25%' : '18%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Polarité',
        nameLocation: 'middle',
        nameGap: 30,
        min: -2.5,
        max: 2.5,
        interval: 1,
        axisLabel: {
          color: '#fff',
          fontSize: isMobile ? 9 : 11,
          formatter: function(value: number) {
            const labels = {
              '-2': 'Très négatif',
              '-1': 'Négatif',
              '0': 'Neutre',
              '1': 'Positif',
              '2': 'Très positif'
            };
                         return labels[String(value) as keyof typeof labels] || '';
          }
        },
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
        nameTextStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        }
      },
      yAxis: {
        type: 'value',
        name: 'Subjectivité',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0.5,
        max: 5.5,
        interval: 1,
        axisLabel: {
          color: '#fff',
          fontSize: isMobile ? 9 : 11
        },
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
        nameTextStyle: {
          color: '#fff',
          fontSize: isMobile ? 10 : 12
        }
      },
      series: series
    } as EChartsOption;
  });
</script>

{#if $filteredArticles.length > 0}
  <div 
    bind:this={chartContainer}
    style="height: {isMobile ? '400px' : '500px'}; position: relative;" 
    class="bg-surface-900/50 rounded-lg p-1 sm:p-2"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">Aucun article ne correspond aux filtres actuels pour afficher la corrélation.</p>
{/if} 