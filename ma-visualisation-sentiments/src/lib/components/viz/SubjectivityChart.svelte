<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { get } from 'svelte/store';

  // ECharts core and modules for tree-shaking
  import { init, use } from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption, SeriesOption } from 'echarts'; // Main EChartsOption and SeriesOption

  // Register the required components
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

  let options = $state<EChartsOption>({});

  // Libellés de subjectivité avec correspondance des scores
  const subjectivityLabels = ['Factuel', 'Plutôt factuel', 'Mixte', 'Plutôt subjectif', 'Subjectif', 'Non applicable'];
  
  // Fonction qui convertit le score numérique en libellé
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
  
  // Définition des couleurs harmonisées pour les niveaux de subjectivité
  const subjectivityColors: Record<string, string> = {
    'Factuel': '#0984e3',       // Bleu foncé
    'Plutôt factuel': '#74b9ff', // Bleu clair
    'Mixte': '#a29bfe',         // Violet clair
    'Plutôt subjectif': '#ffeaa7', // Jaune clair
    'Subjectif': '#fdcb6e',     // Jaune/Orange
    'Non applicable': '#a5a5a5'  // Gris
  };

  // Palette de couleurs pour les journaux
  const newspaperColorPalette = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
    '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#6c5ce7'
  ];

  function getNewspaperColor(journal: string, index: number): string {
    // Générer une couleur basée sur le nom du journal ou utiliser une couleur de la palette
    return newspaperColorPalette[index % newspaperColorPalette.length];
  }

  $effect(() => {
    const articles = get(filteredArticles);
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
          newspaperSubjectivityCounts[journal] = Object.fromEntries(subjectivityLabels.map(l => [l, 0]));
        }
        if (Object.prototype.hasOwnProperty.call(newspaperSubjectivityCounts[journal], subjectivityKey)) {
          newspaperSubjectivityCounts[journal][subjectivityKey]++;
        }
        articlesAnalyzed++;
      }
    });

    const newspaperList = Array.from(uniqueNewspapers);

    const seriesData: SeriesOption[] = newspaperList.map((journal, index) => {
      return {
        name: journal,
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: subjectivityLabels.map(label => newspaperSubjectivityCounts[journal]?.[label] || 0),
        itemStyle: {
          color: getNewspaperColor(journal, index)
        }
      };
    });

    options = {
      title: {
        text: `Distribution de la subjectivité par journal (${articlesAnalyzed} articles analysés)`,
        left: 'center',
        textStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16
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
          color: '#333'
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
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 5px;">
              ${listItemsHtml}
            </div>`;
          
          let tooltipHtml = `${params[0].axisValueLabel}<br/>`;
          tooltipHtml += scrollableListHtml;
          tooltipHtml += `<strong>Total: ${total}</strong>`;
          
          return tooltipHtml;
        }
      },
      legend: {
        data: newspaperList,
        top: '8%',
        textStyle: {
          color: '#fff'
        },
        type: 'scroll',
        orient: 'horizontal'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
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
          rotate: 30,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
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
          color: '#fff'
        }
      },
      series: seriesData
    };
  });

</script>

{#if $filteredArticles.length > 0}
  <div style="height:450px; position: relative;" class="bg-surface-900/50 rounded-lg p-2">
    <Chart {init} {options} />
  </div>
{:else}
  <p class="text-center py-8 text-white/80">Aucun article ne correspond aux filtres actuels, ou aucun corpus n'est chargé.</p>
{/if}