<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentExtremeAnalysis } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import type { ExtremeCategory, KeywordType, ExtremeCategoryAnalysis } from '$lib/types/extremeAnalysis';
  import { getExtremeCategoryConfig, getTopKeywords } from '$lib/utils/extremeAnalysis';
  import { init, use } from 'echarts/core';
  import type { ECharts } from 'echarts/core';
  import { BarChart } from 'echarts/charts';
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';

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
  let selectedCategory = $state<ExtremeCategory>('polarity_very_negative');
  let selectedKeywordType = $state<KeywordType>('subject');
  let showTopN = $state(10);
  let chartContainer: HTMLDivElement;
  let chartInstance: ECharts | null = null;
  let isContainerReady = $state(false);
  
  // Derived data
  let categoryData = $derived(() => {
    if (!$currentExtremeAnalysis) return null;
    return $currentExtremeAnalysis.analysis[selectedCategory];
  });

  // Calculate dynamic chart height based on number of keywords
  let chartHeight = $derived(() => {
    // Base height + (number of keywords * spacing per keyword)
    // Minimum 500px, with ~50px per keyword for better spacing
    // For larger numbers of keywords, we need more space
    const baseHeight = 180; // Space for title, margins, etc.
    const keywordHeight = showTopN <= 15 ? 45 : 55; // More space for many keywords
    return Math.max(500, showTopN * keywordHeight + baseHeight);
  });

  onMount(() => {
    // Use a timeout to ensure DOM is fully rendered and styled
    setTimeout(() => {
      if (chartContainer) {
        // Initialize ECharts instance directly
        try {
          chartInstance = init(chartContainer);
          isContainerReady = true;
        } catch (error) {
          console.error('Failed to create chart instance:', error);
        }
      }
    }, 100);
  });

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.dispose();
    }
  });

  // Update chart when data or selection changes
  $effect(() => {
    if (isContainerReady && chartInstance && categoryData()) {
      updateChart();
    }
  });

  function updateChart() {
    const data = categoryData();
    if (!data || !chartInstance) return;

    const keywords = selectedKeywordType === 'subject' 
      ? data.subject 
      : data.spatial;
    
    const topKeywords = getTopKeywords(keywords, showTopN);
    const categoryConfig = getExtremeCategoryConfig(selectedCategory);
    
    // Reverse for horizontal display (highest at top)
    const reversedData = [...topKeywords].reverse();
    
    const options = {
      backgroundColor: 'transparent',
      title: {
        text: $t.extremeAnalysis.topKeywords,
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold'
        },
        left: 'center',
        top: 15
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: {
          color: '#ffffff'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
            <div>${$t.extremeAnalysis.articleCount}: ${data.value}</div>
          </div>`;
        }
      },
      grid: {
        left: '40%', // Even more space for labels
        right: '10%',
        top: 60,
        bottom: 40,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: reversedData.map(item => item.keyword),
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: showTopN > 20 ? 10 : 11, // Smaller font for many keywords
          interval: 0,
          formatter: (value: string) => {
            // Adjust truncation based on number of keywords
            const maxLength = showTopN > 20 ? 16 : 20;
            if (value.length > maxLength) {
              return value.substring(0, maxLength - 2) + '...';
            }
            return value;
          },
          margin: 15, // More margin for better spacing
          overflow: 'truncate',
          width: 150 // Set a fixed width for labels
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false // Remove horizontal grid lines for cleaner look
        }
      },
      series: [{
        type: 'bar',
        barWidth: showTopN > 20 ? '50%' : '60%', // Thinner bars for many keywords
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
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1
          }
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        animationDelay: (idx: number) => idx * 30
      }]
    };
    
    // Set the options on the chart instance
    chartInstance.setOption(options);
  }

  function adjustBrightness(color: string, percent: number): string {
    // Simple brightness adjustment
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Handle category change
  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCategory = target.value as ExtremeCategory;
  }

  // Handle keyword type change  
  function handleKeywordTypeChange(type: KeywordType) {
    selectedKeywordType = type;
  }
</script>

<div class="keyword-frequency-container">
  <!-- Controls -->
  <div class="controls-row">
    <div class="control-group">
      <label for="category-select" class="control-label">
        {$t.extremeAnalysis.selectCategory}
      </label>
      <select
        id="category-select"
        bind:value={selectedCategory}
        onchange={handleCategoryChange}
        class="select variant-filled-surface"
      >
        <option value="subjectivity_extreme_high">
          {$t.extremeAnalysis.categories.subjectivityHigh}
        </option>
        <option value="subjectivity_extreme_low">
          {$t.extremeAnalysis.categories.subjectivityLow}
        </option>
        <option value="polarity_very_negative">
          {$t.extremeAnalysis.categories.polarityNegative}
        </option>
        <option value="polarity_very_positive">
          {$t.extremeAnalysis.categories.polarityPositive}
        </option>
        <option value="centrality_very_central">
          {$t.extremeAnalysis.categories.centralityHigh}
        </option>
        <option value="centrality_not_central">
          {$t.extremeAnalysis.categories.centralityLow}
        </option>
      </select>
    </div>

    <div class="control-group">
      <span class="control-label" id="keyword-type-label">
        {$t.extremeAnalysis.selectKeywordType}
      </span>
      <div class="btn-group variant-ghost-surface" role="group" aria-labelledby="keyword-type-label">
        <button
          class="btn {selectedKeywordType === 'subject' ? 'variant-filled-primary' : 'variant-ghost-surface'}"
          onclick={() => handleKeywordTypeChange('subject')}
          aria-pressed={selectedKeywordType === 'subject'}
        >
          {$t.extremeAnalysis.subjectKeywords}
        </button>
        <button
          class="btn {selectedKeywordType === 'spatial' ? 'variant-filled-primary' : 'variant-ghost-surface'}"
          onclick={() => handleKeywordTypeChange('spatial')}
          aria-pressed={selectedKeywordType === 'spatial'}
        >
          {$t.extremeAnalysis.spatialKeywords}
        </button>
      </div>
    </div>

    <div class="control-group">
      <label for="keywords-count" class="control-label">
        {$t.extremeAnalysis.numberOfKeywords || 'Number of Keywords'}
      </label>
      <input
        id="keywords-count"
        type="number"
        min="5"
        max="25"
        bind:value={showTopN}
        class="number-input variant-filled-surface"
      />
    </div>
  </div>

  <!-- Category description -->
  {#if selectedCategory}
    {@const descriptionKey = selectedCategory.replace('_extreme', '').replace('polarity_very_', 'polarity').replace('centrality_', 'centrality') as keyof typeof $t.extremeAnalysis.descriptions}
    <div class="category-description">
      <p class="text-sm text-surface-400">
        {$t.extremeAnalysis.descriptions[descriptionKey]}
      </p>
    </div>
  {/if}

  <!-- Chart -->
  <div 
    bind:this={chartContainer}
    class="chart-container" 
    style="min-height: {chartHeight}px;"
  >
    <!-- Loading message only shows when container is not ready -->
    {#if !isContainerReady}
      <div class="no-data-message">
        <p>{$t.messages.loading}</p>
      </div>
    {/if}
  </div>

  <!-- Statistics -->
  {#if categoryData()}
    {@const data = categoryData()}
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
  {/if}
</div>

<style>
  .keyword-frequency-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
    min-height: 800px;
  }

  .controls-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3rem;
    align-items: flex-end;
    padding-bottom: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    min-width: 280px;
  }

  .control-label {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 0.25rem;
  }

  .select, .number-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-height: 44px;
  }

  .select:hover, .number-input:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .select:focus, .number-input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .number-input {
    max-width: 120px;
  }

  .btn-group {
    display: flex;
    gap: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn {
    padding: 0.75rem 1.25rem;
    border-radius: 0;
    border: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .category-description {
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .category-description p {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
  }

  .chart-container {
    flex: 1;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    padding: 1.5rem;
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Ensure ECharts canvas fills the container properly */
  .chart-container > div {
    width: 100% !important;
    height: 100% !important;
  }

  .no-data-message {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.125rem;
  }

  /* Ensure Chart component takes full width */
  .chart-container :global(.svelte-echarts-container) {
    width: 100% !important;
    height: 100% !important;
  }

  .statistics-row {
    display: flex;
    gap: 3rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    margin-top: 0.5rem;
  }

  .stat-item {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .stat-value {
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .keyword-frequency-container {
      gap: 1.5rem;
      min-height: 600px;
    }

    .controls-row {
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 0.5rem;
    }

    .control-group {
      min-width: 100%;
    }

    .control-label {
      font-size: 0.95rem;
    }

    .select, .btn, .number-input {
      font-size: 0.85rem;
      padding: 0.625rem 1rem;
      min-height: 40px;
    }

    .number-input {
      max-width: 100px;
    }

    .chart-container {
      padding: 1rem;
    }

    .category-description {
      padding: 1rem;
    }

    .category-description p {
      font-size: 0.9rem;
    }

    .statistics-row {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .stat-label {
      font-size: 0.9rem;
    }

    .stat-value {
      font-size: 1rem;
    }
  }

  /* Large screens optimization */
  @media (min-width: 1200px) {
    .keyword-frequency-container {
      min-height: 900px;
    }

    .chart-container {
      padding: 2rem;
    }

    .controls-row {
      gap: 4rem;
    }

    .control-group {
      min-width: 320px;
    }
  }
</style> 