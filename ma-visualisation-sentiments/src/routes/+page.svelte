<script lang="ts">
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { 
    currentDatasetArticles, 
    isLoadingDataset, 
    isLoadingExtremeAnalysis,
    isLoadingComparison,
    loadDatasetArticles,
    loadCurrentDataset,
    loadComparisonDatasets,
    loadCurrentExtremeAnalysis,
    selectedDataset,
    datasetArticles,
    comparisonMode,
    CountryFilter,
    JournalFilter as JournalFilterComponent, 
    PolarityFilter,
    SubjectivityFilter,
    SentimentChart,
    SentimentTrendsChart,
    SubjectivityChart,
    CorrelationChart,
    VolumeChart,
    CentralityHeatmap,
    ComparisonView,
    KeywordFrequencyChart,
    selectedArticle,
    countryFilters,
    journalFilters,
    polarityFilters,
    subjectivityFilters,
    centralityFilters
  } from '$lib';
  import { t, currentLanguage } from '$lib/i18n';
  import type { Article } from '$lib';
  import ArticleTable from '$lib/components/ArticleTable.svelte';
  import ArticleDetail from '$lib/components/ArticleDetail.svelte';
  import AnalysisInfo from '$lib/components/AnalysisInfo.svelte';
  import SEOHead from '$lib/components/SEOHead.svelte';
  import FiltersPanel from '$lib/components/layout/FiltersPanel.svelte';
  import CSVExportButton from '$lib/components/ui/CSVExportButton.svelte';
  import { initializeURLState, updateURL } from '$lib/urlState';
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import NavigationTabs from '$lib/components/layout/NavigationTabs.svelte';

  // État de l'application
  let activeView = $state('charts');
  let detailedArticle: Article | null = $state(null);
  let showDetailsSidebar = $state(false);
  let detailsPosition = $state({ x: 0, y: 0 });

  // État pour les contrôles d'analyse extrême
  let selectedCategory = $state<import('$lib/types/extremeAnalysis').ExtremeCategory>('polarity_very_negative');
  let selectedKeywordType = $state<import('$lib/types/extremeAnalysis').KeywordType>('subject');
  let showTopN = $state(10);

  // Get articles for the current dataset
  let currentArticles = $derived($datasetArticles[$selectedDataset] || []);

  // Reactive statement to handle extreme analysis data loading when dataset changes
  $effect(() => {
    if (activeView === 'extremes' && $selectedDataset && browser) {
      console.log('Loading extreme analysis for dataset:', $selectedDataset);
      // Load extreme analysis data for the current dataset (uses specific loading state internally)
      loadCurrentExtremeAnalysis(fetch)
        .then(() => {
          console.log('Extreme analysis loaded successfully for:', $selectedDataset);
        })
        .catch(error => {
          console.error("Failed to load extreme analysis data:", error);
        });
    }
  });

  // Reactive statement to handle comparison data loading when comparison mode is enabled
  $effect(() => {
    if ($comparisonMode && browser) {
      console.log('Comparison mode enabled, loading comparison datasets...');
      // Load comparison datasets if not already loaded (uses specific loading state internally)
      loadComparisonDatasets(fetch)
        .then(() => {
          console.log('Comparison datasets loaded successfully');
        })
        .catch(error => {
          console.error("Failed to load comparison datasets:", error);
        });
    }
  });

  onMount(() => {
    // Initialize URL state management first
    const urlView = initializeURLState();
    if (urlView) {
      activeView = urlView;
    }

    // Update HTML lang attribute when language changes
    const updateHtmlLang = (lang: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    };

    // Set initial HTML lang attribute
    updateHtmlLang($currentLanguage);

    // Load only the current dataset at startup (lazy loading)
    const loadData = async () => {
      isLoadingDataset.set(true);
      selectedArticle.set(null);
      
      try {
        // Load only the currently selected dataset
        await loadCurrentDataset(fetch);
      } catch (error) {
        console.error("Failed to load dataset:", error);
      } finally {
        isLoadingDataset.set(false);
      }
    };

    loadData();

    // Modern Svelte 5 reactive patterns using $effect instead of store subscriptions
    // React to filter changes and update URL
    $effect(() => {
      // Watch all filter stores and update URL when they change
      $countryFilters;
      $journalFilters;
      $polarityFilters;
      $subjectivityFilters;
      $centralityFilters;
      $comparisonMode;
      
      if (browser) {
        updateURL(activeView);
      }
    });
    
    // React to language changes and update HTML lang attribute
    $effect(() => {
      updateHtmlLang($currentLanguage);
    });

    // React to dataset changes to load new dataset and update URL
    $effect(() => {
      const datasetId = $selectedDataset;
      
      // Handle async operations inside the effect without making the effect itself async
      (async () => {
        // Load the new dataset if not already loaded
        const currentDatasets = $datasetArticles;
        if (!currentDatasets[datasetId] || currentDatasets[datasetId].length === 0) {
          isLoadingDataset.set(true);
          try {
            await loadCurrentDataset(fetch);
          } catch (error) {
            console.error("Failed to load dataset:", error);
          } finally {
            isLoadingDataset.set(false);
          }
        } else {
          // Dataset already loaded, just update currentDatasetArticles
          currentDatasetArticles.set(currentDatasets[datasetId]);
        }
        
        // Only update URL if browser is available
        if (browser) {
          updateURL(activeView);
        }
      })();
    });
  });

  // Gérer l'affichage des détails
  function handleShowDetails(details: { article: Article, position: {x: number, y: number}}) {
    detailedArticle = details.article;
    showDetailsSidebar = true;
    detailsPosition = details.position;
  }

  function closeDetails() {
    showDetailsSidebar = false;
    detailedArticle = null;
  }

  async function handleViewChange(value: string) {
    activeView = value;
    
    // Automatically manage comparison mode based on view
    if (value === 'comparison') {
      // Enable comparison mode when switching to comparison view
      if (!$comparisonMode) {
        comparisonMode.set(true);
      }
      
      // Load comparison datasets if not already loaded (uses specific loading state internally)
      try {
        await loadComparisonDatasets(fetch);
      } catch (error) {
        console.error("Failed to load comparison datasets:", error);
      }
    } else if (value === 'extremes') {
      // Load extreme analysis data if not already loaded (uses specific loading state internally)
      try {
        await loadCurrentExtremeAnalysis(fetch);
      } catch (error) {
        console.error("Failed to load extreme analysis data:", error);
      }
    } else {
      // Disable comparison mode when switching away from comparison view
      if ($comparisonMode) {
        comparisonMode.set(false);
      }
    }
    
    updateURL(activeView);
  }

  // Gestionnaires pour les contrôles d'analyse extrême
  function handleCategoryChange(category: import('$lib/types/extremeAnalysis').ExtremeCategory) {
    selectedCategory = category;
  }

  function handleKeywordTypeChange(type: import('$lib/types/extremeAnalysis').KeywordType) {
    selectedKeywordType = type;
  }

  function handleTopNChange(value: number) {
    showTopN = value;
  }
</script>

<!-- Dynamic SEO Head -->
<SEOHead view={activeView} comparisonMode={$comparisonMode} />

<main class="main-container container {activeView === 'extremes' ? 'max-w-7xl' : 'max-w-6xl'} mx-auto p-2 sm:p-4 md:p-6">
  <div class="mb-4 sm:mb-6">
    <AnalysisInfo />
  </div>

  {#if $isLoadingDataset}
    <div class="loading-container">
      <!-- Loading skeleton to prevent CLS -->
      <div class="loading-skeleton h-32 rounded-lg mb-4 sm:mb-6"></div>
      <div class="alert variant-filled-warning p-4 mb-4 sm:mb-6">{$t.messages.loadingData}</div>
      
      <!-- Reserve space for filters -->
      <div class="filters-skeleton mb-4 sm:mb-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {#each Array(5) as _}
            <div class="loading-skeleton h-10 rounded-lg"></div>
          {/each}
        </div>
      </div>
      
      <!-- Reserve space for content -->
      <div class="content-skeleton">
        <div class="loading-skeleton h-96 rounded-lg"></div>
      </div>
    </div>
  {:else if currentArticles.length > 0}
  <NavigationTabs activeView={activeView} onChange={handleViewChange} />

    <!-- Conditional Filters based on active view -->
  <FiltersPanel
        {activeView}
        {selectedCategory}
        {selectedKeywordType}
        {showTopN}
        onCategoryChange={handleCategoryChange}
        onKeywordTypeChange={handleKeywordTypeChange}
        onTopNChange={handleTopNChange}
      />

    {#if activeView === 'charts'}
      <div class="space-y-4 sm:space-y-6 mb-6">
        <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container"><SentimentChart /></div>
        <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container"><SubjectivityChart /></div>
      </div>
    {:else if activeView === 'trends'}
      <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container mb-6"><SentimentTrendsChart /></div>
    {:else if activeView === 'correlation'}
      <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container mb-6"><CorrelationChart /></div>
    {:else if activeView === 'volume'}
      <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container mb-6"><VolumeChart /></div>
    {:else if activeView === 'heatmap'}
      <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container mb-6"><CentralityHeatmap /></div>
    {:else if activeView === 'table'}
      <div class="w-full card variant-glass p-3 sm:p-6 hover-lift mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 class="h3 m-0 text-white text-gradient">{$t.table.title}</h2>
          <CSVExportButton />
        </div>
        <ArticleTable onShowDetails={handleShowDetails} />
      </div>
    {:else if activeView === 'comparison'}
      <ComparisonView />
    {:else if activeView === 'extremes'}
      <div class="extreme-analysis-view mb-6">
        <div class="card variant-glass p-4 sm:p-6 lg:p-8 hover-lift extreme-analysis-card">
          <div class="extreme-analysis-header">
            <h2 class="h2 mb-3 text-white text-gradient">{$t.extremeAnalysis.title}</h2>
            <p class="text-base text-surface-300 mb-6 leading-relaxed">{$t.extremeAnalysis.subtitle}</p>
          </div>
          <KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
        </div>
      </div>
    {/if}
  {:else}
    <div class="alert variant-filled-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
  {/if}
</main>

<!-- Panneau de détails pour l'article -->
{#if showDetailsSidebar}
  <!-- Modal backdrop with proper glass effect -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop glass-heavy" 
    onclick={closeDetails}
    onkeydown={(e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeDetails();
      }
    }}
    aria-label="Fermer les détails"
    role="button"
    tabindex="0"
  >
    <!-- Modal container with enhanced positioning -->
    <div 
      class="modal-container"
      onclick={(e) => e.stopPropagation()}
      role="document"
      tabindex="-1"
    >
      <!-- Enhanced modal with proper Skeleton classes -->
      <div class="details-modal card variant-glass hover-lift" 
        style="max-height: {Math.min(window.innerHeight - 100, 800)}px;">
        
        <!-- Header with gradient accent -->
        <div class="details-header glass-medium">
          <h2 class="h3 m-0 text-white text-gradient-primary">{$t.article.details}</h2>
          <button 
            class="btn-icon variant-soft-surface hover-glow focus-ring" 
            onclick={closeDetails} 
            title={$t.common.close}
            aria-label={$t.common.close}
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <!-- Content with custom scrollbar -->
        <div class="details-content custom-scrollbar">
          <ArticleDetail article={detailedArticle} />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Scrollbar styles moved to NavigationTabs component */
  
  /* Enhanced Modal System with Skeleton UI Integration */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    animation: fadeIn var(--transition-normal) ease-out;
  }
  
  .modal-container {
    width: 100%;
    max-width: 900px;
    max-height: 95vh;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: slideUp var(--transition-normal) ease-out;
  }
  
  .details-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-xl);
    overflow: hidden;
    position: relative;
    box-shadow: 
      var(--shadow-2xl),
      0 0 40px rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .details-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(59, 130, 246, 0.6), 
      rgba(139, 92, 246, 0.6), 
      transparent
    );
    z-index: 1;
  }
  
  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg) var(--spacing-xl);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    position: relative;
    z-index: 2;
  }
  
  .details-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
    background: rgba(15, 23, 42, 0.3);
    backdrop-filter: blur(8px);
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
    }
    to { 
      opacity: 1; 
    }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(30px) scale(0.95); 
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1); 
    }
  }
  
  /* Enhanced Button Icon Styles */
  
  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
  }
  
  .btn-icon:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  /* Filters grid & extreme layouts moved to FiltersPanel component */
  
  /* Enhanced Mobile Responsiveness */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: var(--spacing-sm);
    }
    
    .modal-container {
      max-width: 100%;
      max-height: 100vh;
    }
    
    .details-modal {
      border-radius: var(--radius-lg);
      max-height: 95vh !important;
    }
    
    .details-header {
      padding: var(--spacing-md) var(--spacing-lg);
    }
    
    .details-content {
      padding: var(--spacing-sm);
    }
  }
  
  @media (max-width: 480px) {
    .modal-backdrop {
      padding: var(--spacing-xs);
    }
    
    .details-modal {
      border-radius: var(--radius-md);
      max-height: 98vh !important;
    }
    
    .details-header {
      padding: var(--spacing-sm) var(--spacing-md);
    }
    
    .details-header .h3 {
      font-size: 1.25rem;
    }
  }

  /* Navigation styles moved to NavigationTabs component */

  /* CLS prevention and performance optimizations */
  .loading-container {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 0.5rem;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* Accordion optimization moved to AnalysisInfo.svelte */

  /* Extreme Analysis View Styles */
  .extreme-analysis-view {
    width: 100%;
    min-height: calc(100vh - 200px);
  }

  .extreme-analysis-card {
    min-height: 850px;
    width: 100%;
  }

  .extreme-analysis-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .extreme-analysis-header h2 {
    font-size: 2rem;
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

  /* Main Container Spacing Optimization */
  .main-container {
    margin-top: 0;
    padding-top: 0.5rem;
  }

  @media (min-width: 640px) {
    .main-container {
      margin-top: 0;
      padding-top: 0.75rem;
    }

    .extreme-analysis-card {
      min-height: 900px;
    }
  }

  @media (min-width: 1024px) {
    .main-container {
      margin-top: 0;
      padding-top: 1rem;
    }

    .extreme-analysis-card {
      min-height: 950px;
    }

    .extreme-analysis-header h2 {
      font-size: 2.25rem;
    }
  }

  /* Extreme filters layout moved to FiltersPanel component */

  @media (min-width: 1200px) {
    .extreme-analysis-card {
      min-height: 1000px;
    }
  }


</style>
