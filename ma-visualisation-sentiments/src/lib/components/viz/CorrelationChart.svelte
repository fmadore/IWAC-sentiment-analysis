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
  import { onMount } from 'svelte';

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
  import { getJournalName } from '$lib/utils';

  // Ordre des polarités pour l'affichage
  const polarityOrder = [
    'Très négatif',
    'Négatif', 
    'Neutre',
    'Positif',
    'Très positif',
    'Non applicable'
  ];

  // Ordre des scores de subjectivité
  const subjectivityOrder = [1, 2, 3, 4, 5];

  // Labels descriptifs pour les scores de subjectivité
  const subjectivityLabels = {
    1: 'Très objectif',
    2: 'Plutôt objectif', 
    3: 'Mixte',
    4: 'Plutôt subjectif',
    5: 'Très subjectif'
  };

  // Couleurs pour les scores de subjectivité
  const subjectivityColors = {
    1: '#3498db', // Bleu - Très objectif
    2: '#2ecc71', // Vert - Plutôt objectif
    3: '#f39c12', // Orange - Mixte
    4: '#e74c3c', // Rouge - Plutôt subjectif
    5: '#9b59b6'  // Violet - Très subjectif
  };

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
      type: 'bar' as 'bar',
      data: polarityOrder.map(polarity => data[polarity][subjScore]),
      itemStyle: {
        color: subjectivityColors[subjScore as keyof typeof subjectivityColors]
      },
      emphasis: {
        focus: 'series' as 'series'
      }
    }));

    return {
      title: {
        text: `Distribution Polarité × Subjectivité (${articlesAnalyzed} articles)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: isMobile ? 12 : 16
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          let result = `<strong>${params[0].name}</strong><br/>`;
          let total = 0;
          params.forEach((param: any) => {
            if (param.value > 0) {
              result += `${param.seriesName}: ${param.value} articles<br/>`;
              total += param.value;
            }
          });
          result += `<strong>Total: ${total} articles</strong>`;
          return result;
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
        data: subjectivityOrder.map(s => subjectivityLabels[s as keyof typeof subjectivityLabels]),
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
        bottom: isMobile ? '25%' : '20%',
        top: isMobile ? '30%' : '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: polarityOrder,
        axisLabel: {
          color: '#fff',
          fontSize: isMobile ? 8 : 10,
          interval: 0,
          rotate: isMobile ? 45 : 0
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: 'Nombre d\'articles',
        nameLocation: 'middle',
        nameGap: 50,
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
    style="height: {isMobile ? '450px' : '500px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">Aucun article ne correspond aux filtres actuels pour afficher la distribution.</p>
{/if} 