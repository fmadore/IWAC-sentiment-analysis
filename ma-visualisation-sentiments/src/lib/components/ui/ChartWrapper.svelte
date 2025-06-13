<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart } from 'svelte-echarts';
  import { init, use } from 'echarts/core';
  import type { ECharts, EChartsOption } from 'echarts';
  import ChartExporter from './ChartExporter.svelte';

  // Props
  interface ChartWrapperProps {
    options: EChartsOption;
    chartType: 'sentiment' | 'trends' | 'correlation' | 'volume' | 'centrality' | 'subjectivity';
    chartTitle: string;
    height?: string;
    showExporter?: boolean;
    emptyMessage?: string;
    hasData?: boolean;
  }

  let {
    options,
    chartType,
    chartTitle,
    height = '500px',
    showExporter = true,
    emptyMessage = 'Aucune donnée disponible pour ce graphique',
    hasData = true
  }: ChartWrapperProps = $props();

  // État local
  let chartInstance: ECharts | null = $state(null);
  let chartContainer: HTMLDivElement | null = $state(null);
  let isChartReady = $state(false);

  onMount(() => {
    // Petit délai pour s'assurer que le graphique est entièrement initialisé
    const timer = setTimeout(() => {
      isChartReady = true;
    }, 100);

    return () => clearTimeout(timer);
  });

  // Fonction pour gérer l'instance du graphique
  function handleChartReady(chart: ECharts) {
    chartInstance = chart;
  }

  // Fonction pour obtenir l'instance du graphique depuis l'élément Chart
  function getChartInstance(): ECharts | null {
    if (chartContainer) {
      const chartElement = chartContainer.querySelector('canvas');
      if (chartElement) {
        // Récupérer l'instance ECharts depuis le canvas
        const chart = chartElement.parentElement?.parentElement;
        if (chart && (chart as any).__echarts__) {
          return (chart as any).__echarts__;
        }
      }
    }
    return chartInstance;
  }

  // Réactiver l'obtention de l'instance du graphique
  let currentChartInstance = $derived.by(() => {
    if (isChartReady) {
      return getChartInstance();
    }
    return null;
  });
</script>

{#if hasData}
  <div class="chart-container-wrapper">
    <!-- Bouton d'export seulement -->
    {#if showExporter}
      <div class="flex justify-end mb-2">
        <ChartExporter 
          {chartType}
          {chartTitle}
          chartInstance={currentChartInstance || undefined}
        />
      </div>
    {/if}

    <!-- Conteneur du graphique sans style -->
    <div 
      bind:this={chartContainer}
      style="height: {height}; position: relative;" 
      class="chart-container"
    >
      <Chart 
        {init} 
        {options}
      />
    </div>
  </div>
{:else}
  <div class="empty-chart-container p-8 text-center">
    <div class="text-white/60 mb-4">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </div>
    <p class="text-white/80 text-sm sm:text-base">
      {emptyMessage}
    </p>
  </div>
{/if}

<style>
  .chart-container-wrapper {
    width: 100%;
  }

  .empty-chart-container {
    background: rgba(30, 30, 46, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
  }
</style> 