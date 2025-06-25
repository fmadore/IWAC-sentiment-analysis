<script lang="ts">
  import { onMount } from 'svelte';
  import { currentExtremeAnalysis } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import type { ExtremeCategory, KeywordType, ExtremeCategoryAnalysis } from '$lib/types/extremeAnalysis';
  import { getExtremeCategoryConfig, getTopKeywords } from '$lib/utils/extremeAnalysis';
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
  let showTopN = $state(15);
  
  // Derived data
  let chartOptions = $state<EChartsOption | null>(null);
  let categoryData = $derived(() => {
    if (!$currentExtremeAnalysis) return null;
    return $currentExtremeAnalysis.analysis[selectedCategory];
  });

  // Update chart when data or selection changes
  $effect(() => {
    const data = categoryData();
    if (data) {
      updateChart();
    }
  });

  function updateChart() {
    const data = categoryData();
    if (!data) return;

    const keywords = selectedKeywordType === 'subject' 
      ? data.subject 
      : data.spatial;
    
    const topKeywords = getTopKeywords(keywords, showTopN);
    const categoryConfig = getExtremeCategoryConfig(selectedCategory);
    
    // Reverse for horizontal display (highest at top)
    const reversedData = [...topKeywords].reverse();
    
    chartOptions = {
      backgroundColor: 'transparent',
      title: {
        text: $t.extremeAnalysis.topKeywords,
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold'
        },
        left: 'center',
        top: 10
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
        left: '15%',
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
          fontSize: 13,
          interval: 0,
          formatter: (value: string) => {
            // Truncate long keywords
            return value.length > 25 ? value.substring(0, 25) + '...' : value;
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        }
      },
      series: [{
        type: 'bar',
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
  <div class="chart-container">
    {#if chartOptions}
      <Chart 
        {init}
        options={chartOptions} 
      />
    {:else if !$currentExtremeAnalysis}
      <div class="no-data-message">
        <p>{$t.messages.loading}</p>
      </div>
    {:else}
      <div class="no-data-message">
        <p>{$t.extremeAnalysis.noData}</p>
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
    gap: 1.5rem;
    height: 100%;
  }

  .controls-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: flex-end;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 250px;
  }

  .control-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  .select {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .select:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .select:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .btn-group {
    display: flex;
    gap: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .btn:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .category-description {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .chart-container {
    flex: 1;
    min-height: 600px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    padding: 1rem;
    position: relative;
  }

  .no-data-message {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.125rem;
  }

  .statistics-row {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }

  .stat-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
  }

  .stat-value {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .controls-row {
      flex-direction: column;
      gap: 1rem;
    }

    .control-group {
      min-width: 100%;
    }

    .chart-container {
      min-height: 400px;
    }

    .statistics-row {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style> 