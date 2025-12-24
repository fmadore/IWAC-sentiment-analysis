<!--
  ViewContent Component
  
  Encapsulates the main content area that switches between different views
  (charts, trends, correlation, volume, heatmap, table, comparison, extremes).
  
  This component receives the active view and renders the appropriate content,
  keeping the main page cleaner and more focused on orchestration.
  
  Usage:
  <ViewContent 
    {activeView} 
    {selectedCategory} 
    {selectedKeywordType}
    {showTopN}
    onShowDetails={handleShowDetails} 
  />
-->
<script lang="ts">
  import type { Article } from '$lib/types/data';
  import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
  import { t } from '$lib/i18n';
  
  // Charts
  import { 
    SentimentChart, 
    SentimentTrendsChart, 
    SubjectivityChart, 
    CorrelationChart, 
    VolumeChart, 
    CentralityHeatmap,
    KeywordFrequencyChart 
  } from '$lib/components/viz';
  
  // Data Display
  import { 
    ArticleTable, 
    ComparisonView 
  } from '$lib/components/data-display';
  
  // UI
  import { CSVExportButton, ChartCard } from '$lib/components/ui';

  interface ViewContentProps {
    /** Currently active view */
    activeView: string;
    /** Selected extreme analysis category */
    selectedCategory: ExtremeCategory;
    /** Selected keyword type for extreme analysis */
    selectedKeywordType: KeywordType;
    /** Number of top items to show in extreme analysis */
    showTopN: number;
    /** Callback when article details should be shown */
    onShowDetails: (details: { article: Article; position: { x: number; y: number } }) => void;
  }

  let { 
    activeView, 
    selectedCategory, 
    selectedKeywordType, 
    showTopN,
    onShowDetails 
  }: ViewContentProps = $props();
</script>

{#if activeView === 'charts'}
  <div class="space-y-4 sm:space-y-6 mb-6">
    <ChartCard>
      <SentimentChart />
    </ChartCard>
    <ChartCard>
      <SubjectivityChart />
    </ChartCard>
  </div>
{:else if activeView === 'trends'}
  <ChartCard class="mb-6">
    <SentimentTrendsChart />
  </ChartCard>
{:else if activeView === 'correlation'}
  <ChartCard class="mb-6">
    <CorrelationChart />
  </ChartCard>
{:else if activeView === 'volume'}
  <ChartCard class="mb-6">
    <VolumeChart />
  </ChartCard>
{:else if activeView === 'heatmap'}
  <ChartCard class="mb-6">
    <CentralityHeatmap />
  </ChartCard>
{:else if activeView === 'table'}
  <ChartCard class="mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <h2 class="h3 m-0 text-white text-gradient">{$t.table.title}</h2>
      <CSVExportButton />
    </div>
    <ArticleTable {onShowDetails} />
  </ChartCard>
{:else if activeView === 'comparison'}
  <ComparisonView />
{:else if activeView === 'extremes'}
  <div class="extreme-analysis-view mb-6">
    <ChartCard variant="extreme">
      <div class="extreme-analysis-header">
        <h2 class="h2 mb-3 text-white extreme-title">{$t.extremeAnalysis.title}</h2>
        <p class="text-base text-surface-300 mb-6 leading-relaxed">{$t.extremeAnalysis.subtitle}</p>
      </div>
      <KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
    </ChartCard>
  </div>
{/if}

<style>
  /* Extreme Analysis View */
  .extreme-analysis-view {
    width: 100%;
    min-height: calc(100vh - 200px);
  }

  .extreme-analysis-header {
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .extreme-title {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.75rem;
  }

  .extreme-analysis-header p {
    max-width: 800px;
    line-height: 1.6;
  }

  @media (min-width: 1024px) {
    .extreme-title {
      font-size: 2rem;
    }
  }
</style>
