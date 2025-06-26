<script lang="ts">
  import { Chart } from 'svelte-echarts';
  import { onMount } from 'svelte';
  import { currentExtremeAnalysis, extremeAnalysisData, selectedDataset } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import type { ExtremeCategory, KeywordType, ExtremeCategoryAnalysis } from '$lib/types/extremeAnalysis';
  import { getExtremeCategoryConfig, getTopKeywords } from '$lib/utils/extremeAnalysis';
  
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
  let selectedCategory = $state<ExtremeCategory>('polarity_very_negative');
  let selectedKeywordType = $state<KeywordType>('subject');
  let showTopN = $state(10);
  let isMobile = $state(false);
  
  // Loading state
  let isLoading = $derived(() => {
    const currentDatasetId = $selectedDataset;
    const extremeData = $extremeAnalysisData;
    return !extremeData[currentDatasetId];
  });
  
  // Derived data
  let categoryData = $derived(() => {
    if (!$currentExtremeAnalysis) return null;
    return $currentExtremeAnalysis.analysis[selectedCategory];
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
    
    return {
      backgroundColor: 'transparent',
      title: {
        text: $t.extremeAnalysis.topKeywords,
        textStyle: {
          color: '#ffffff',
          fontSize: isMobile ? 12 : 16,
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        textStyle: {
          color: '#333',
          fontSize: isMobile ? 10 : 12
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
        left: isMobile ? '25%' : '30%',
        right: isMobile ? '8%' : '10%',
        top: 60,
        bottom: 40,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.7)',
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
        }
      },
      yAxis: {
        type: 'category',
        data: reversedData.map(item => item.keyword),
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: isMobile ? 9 : 11,
          interval: 0,
          formatter: (value: string) => {
            const maxLength = isMobile ? 16 : 20;
            if (value.length > maxLength) {
              return value.substring(0, maxLength - 2) + '...';
            }
            return value;
          },
          margin: 15,
          overflow: 'truncate',
          width: isMobile ? 100 : 150
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
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
    } as EChartsOption;
  });

  function adjustBrightness(color: string, percent: number): string {
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

{#if isLoading()}
  <!-- Loading State -->
  <div class="loading-container">
    <div class="mb-4">
      <DatasetBadge size="sm" />
    </div>
    
    <div class="card variant-glass p-4 mb-4">
      <div class="loading-skeleton" style="height: 200px; border-radius: 0.5rem;"></div>
    </div>
    
    <div class="chart-container glass-medium rounded-lg p-4" style="min-height: 500px;">
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="loading-spinner mb-4"></div>
          <p class="text-white/80">{$t.messages.loading || 'Loading extreme analysis data...'}</p>
        </div>
      </div>
    </div>
  </div>
{:else if $currentExtremeAnalysis && options}
  <!-- Dataset Badge -->
  <div class="mb-4">
    <DatasetBadge size="sm" />
  </div>

  <!-- Controls Card -->
  <div class="card variant-glass p-4 hover-lift mb-4">
    <div class="controls-grid">
      <!-- Category Select -->
      <div class="control-group">
        <label for="category-select" class="control-label">
          {$t.extremeAnalysis.selectCategory}
        </label>
        <select
          id="category-select"
          bind:value={selectedCategory}
          onchange={handleCategoryChange}
          class="select-input glass-medium"
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

      <!-- Keyword Type Toggle -->
      <div class="control-group">
        <span class="control-label" id="keyword-type-label">
          {$t.extremeAnalysis.selectKeywordType}
        </span>
        <div class="btn-group-toggle">
          <button
            class="btn-toggle hover-lift {selectedKeywordType === 'subject' ? 'active' : ''}"
            onclick={() => handleKeywordTypeChange('subject')}
            aria-pressed={selectedKeywordType === 'subject'}
          >
            {$t.extremeAnalysis.subjectKeywords}
          </button>
          <button
            class="btn-toggle hover-lift {selectedKeywordType === 'spatial' ? 'active' : ''}"
            onclick={() => handleKeywordTypeChange('spatial')}
            aria-pressed={selectedKeywordType === 'spatial'}
          >
            {$t.extremeAnalysis.spatialKeywords}
          </button>
        </div>
      </div>

      <!-- Keywords Count -->
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
          class="number-input glass-medium"
        />
      </div>
    </div>
  </div>

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

  .loading-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
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

  /* Controls Grid */
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    align-items: flex-end;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  /* Select Input */
  .select-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    min-height: 42px;
    cursor: pointer;
    outline: none;
  }

  .select-input:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .select-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Fix dropdown options styling */
  .select-input option {
    background: #1e293b;
    color: white;
    padding: 0.5rem;
    border: none;
  }

  .select-input option:hover {
    background: #334155;
  }

  .select-input option:checked {
    background: #3b82f6;
    color: white;
  }

  /* Button Toggle Group */
  .btn-group-toggle {
    display: flex;
    gap: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-toggle {
    flex: 1;
    padding: 0.625rem 1rem;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .btn-toggle:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .btn-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-toggle:hover::before {
    opacity: 1;
  }

  .btn-toggle.active {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2));
    color: white;
    font-weight: 600;
  }

  /* Number Input */
  .number-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    min-height: 42px;
    max-width: 120px;
    outline: none;
  }

  .number-input:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .number-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Chrome, Safari, Edge, Opera */
  .number-input::-webkit-outer-spin-button,
  .number-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  .number-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
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
    .controls-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .control-group {
      width: 100%;
    }

    .control-label {
      font-size: 0.8125rem;
    }

    .select-input,
    .btn-toggle,
    .number-input {
      font-size: 0.8125rem;
      padding: 0.5rem 0.75rem;
      min-height: 38px;
    }

    .number-input {
      max-width: 100px;
    }

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
    .controls-grid {
      gap: 0.75rem;
    }

    .control-label {
      font-size: 0.75rem;
    }

    .select-input,
    .btn-toggle,
    .number-input {
      font-size: 0.75rem;
      padding: 0.375rem 0.625rem;
      min-height: 34px;
    }

    .statistics-row {
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .stat-item {
      text-align: center;
    }
  }

  /* Large Screens */
  @media (min-width: 1200px) {
    .controls-grid {
      gap: 2rem;
    }
  }
</style> 