<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { onMount } from 'svelte';
  import { currentExtremeAnalysis, extremeAnalysisData, selectedDataset, isLoadingExtremeAnalysis, filteredExtremeAnalysis } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import type { ExtremeCategory, KeywordType, ExtremeCategoryAnalysis } from '$lib/types/extremeAnalysis';
  import { getExtremeCategoryConfig, getTopKeywords } from '$lib/utils/extremeAnalysis';
  import {
    getTitleStyle,
    getTooltipConfig,
    getAxisLineStyle,
    getAxisLabelStyle,
    getSplitLineStyle,
    adjustBrightness
  } from '$lib/utils/chartTheme';
  
  // ECharts imports
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
  import DatasetBadge from '../ui/DatasetBadge.svelte';

  // Register the required components
  use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    BarChart,
    CanvasRenderer
  ]);

  // Component props
  interface Props {
    selectedCategory: ExtremeCategory;
    selectedKeywordType: KeywordType;
    showTopN: number;
  }

  let { selectedCategory, selectedKeywordType, showTopN }: Props = $props();
  
  let isMobile = $state(false);
  
  // Loading state - use specific loading state for better UX
  let isLoading = $derived(() => {
    return $isLoadingExtremeAnalysis || !$filteredExtremeAnalysis;
  });
  
  // Derived data
  let categoryData = $derived(() => {
    if (!$filteredExtremeAnalysis) return null;
    return $filteredExtremeAnalysis.analysis[selectedCategory];
  });

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

  // Chart options
  let options = $derived.by(() => {
    const data = categoryData();
    if (!data) return null;

    const keywords = selectedKeywordType === 'subject' 
      ? data.subject 
      : data.spatial;
    
    const topKeywords = getTopKeywords(keywords, showTopN);
    const categoryConfig = getExtremeCategoryConfig(selectedCategory);
    
    // Reverse for horizontal display (highest at top)
    const reversedData = [...topKeywords].reverse();

    // --- Dynamic left spacing & label width ---
    // We previously used a percentage (25-30%) which created large unused blank space.
    // Compute an approximate width needed for the longest label and size the grid and label width accordingly.
    const longestLabelLength = reversedData.reduce((max, k) => Math.max(max, k.keyword.length), 0);
    // Average character width heuristic (px). Monitors mobile vs desktop.
    const avgCharWidth = isMobile ? 6 : 7; // conservative so we don't truncate early
    const computedLabelWidth = longestLabelLength * avgCharWidth;
    // Clamp to sensible bounds so extremely long labels don't consume the whole chart.
    const labelWidth = Math.min(
      Math.max(computedLabelWidth, isMobile ? 90 : 140),
      isMobile ? 180 : 260 // slightly reduced max to avoid excessive whitespace
    );
    // IMPORTANT: With containLabel=true ECharts already expands the grid area to fit labels.
    // Previously we added labelWidth to grid.left, effectively doubling the needed space.
    // Keep a small constant padding only.
    const baseLeftPadding = isMobile ? 8 : 12; // px

    const tooltipConfig = getTooltipConfig(isMobile);
    
    return {
      backgroundColor: 'transparent',
      title: {
        text: $t.extremeAnalysis.topKeywords,
        textStyle: getTitleStyle(isMobile),
        left: 'center',
        top: 15
      },
      tooltip: {
        ...tooltipConfig,
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="min-width:140px;">
            <div style="font-weight:600;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.15);">${data.name}</div>
            <div style="display:flex;justify-content:space-between;">
              <span>${$t.extremeAnalysis.articleCount}:</span>
              <strong>${data.value}</strong>
            </div>
          </div>`;
        }
      },
      grid: {
        // Use pixel value derived above instead of large percentage to reclaim space.
        left: baseLeftPadding,
        right: isMobile ? '8%' : '10%',
        top: 60,
        bottom: 40,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: getAxisLabelStyle(isMobile),
        axisLine: getAxisLineStyle(),
        splitLine: getSplitLineStyle()
      },
      yAxis: {
        type: 'category',
        data: reversedData.map(item => item.keyword),
        axisLabel: {
          ...getAxisLabelStyle(isMobile),
          color: 'rgba(255, 255, 255, 0.9)',
          interval: 0,
          // Allow larger labels; only ellipsize if still too long for computed width.
          formatter: (value: string) => {
            const maxChars = Math.floor(labelWidth / avgCharWidth);
            if (value.length > maxChars) {
              return value.slice(0, Math.max(0, maxChars - 2)) + '…';
            }
            return value;
          },
          margin: 12,
          overflow: 'truncate',
          width: labelWidth
        },
        axisLine: getAxisLineStyle(),
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [{
        type: 'bar',
        barWidth: isMobile ? '50%' : '60%',
        data: reversedData.map(item => ({
          value: item.count,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [{
                offset: 0,
                color: categoryConfig?.color || '#3B82F6'
              }, {
                offset: 1,
                color: adjustBrightness(categoryConfig?.color || '#3B82F6', -30)
              }]
            },
            borderRadius: [0, 4, 4, 0]
          }
        })),
        emphasis: {
          focus: 'series' as const,
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            borderWidth: 1
          }
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 30
      }]
    } as EChartsOption;
  });
</script>

{#if isLoading()}
  <!-- Loading State -->
  <div class="loading-container">
    <div class="chart-container glass-medium rounded-lg p-4" style="min-height: 500px;">
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="loading-spinner mb-4"></div>
          <p class="text-white/80">{$t.messages.loading || 'Loading extreme analysis data...'}</p>
        </div>
      </div>
    </div>
  </div>
{:else if $filteredExtremeAnalysis && options}
  <!-- Category Description -->
  {#if selectedCategory}
    {@const descriptionKey = selectedCategory.replace('_extreme', '').replace('polarity_very_', 'polarity').replace('centrality_', 'centrality') as keyof typeof $t.extremeAnalysis.descriptions}
    {@const description = $t.extremeAnalysis.descriptions[descriptionKey]}
    {#if description && description.trim()}
      <div class="card variant-glass p-4 mb-4">
        <p class="text-sm text-white/80 leading-relaxed">
          {description}
        </p>
      </div>
    {/if}
  {/if}

  <!-- Chart Container -->
  <div 
    style="height: {isMobile ? '400px' : '500px'}; position: relative;" 
    class="chart-container glass-medium rounded-lg p-2 sm:p-4"
  >
    <Chart {init} {options} />
  </div>

  <!-- Statistics Card -->
  {#if categoryData()}
    {@const data = categoryData()}
    <div class="card variant-glass p-4 mt-4">
      <div class="statistics-row">
        <div class="stat-item">
          <span class="stat-label">{$t.common.total} {$t.common.articles}:</span>
          <span class="stat-value">{data?.articles.length || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{$t.extremeAnalysis.topKeywords}:</span>
          <span class="stat-value">{showTopN}</span>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <p class="text-center py-8 text-white/80 text-sm sm:text-base">{$t.messages.noData}</p>
{/if}

<style>
  .loading-container {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Chart Container */
  .chart-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* Statistics Row */
  .statistics-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
  }

  .stat-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .stat-value {
    color: white;
    font-weight: 700;
    font-size: 1rem;
  }

  /* Glass Effects */
  :global(.glass-medium) {
    backdrop-filter: blur(12px);
  }

  /* Hover Lift Effect */
  :global(.hover-lift) {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.hover-lift:hover) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  /* Card Styles */
  :global(.card) {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  :global(.card:hover) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Mobile Responsiveness */
  @media (max-width: 768px) {
    .statistics-row {
      gap: 1.5rem;
    }

    .stat-label {
      font-size: 0.8125rem;
    }

    .stat-value {
      font-size: 0.9375rem;
    }
  }

  @media (max-width: 480px) {
    .statistics-row {
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .stat-item {
      text-align: center;
    }
  }
</style> 