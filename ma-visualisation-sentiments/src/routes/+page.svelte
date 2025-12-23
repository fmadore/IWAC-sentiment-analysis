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
    loadArbiterEvaluations,
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
  import { initializeURLState, updateURL, clearSelectedArticle, clearSelectedArticleOnly, handlePendingArticleSelection } from '$lib/urlState';
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
      
      // Also load arbiter evaluations (optional data)
      loadArbiterEvaluations(fetch)
        .then(() => {
          console.log('Arbiter evaluations loaded (if available)');
        })
        .catch(error => {
          console.log('Arbiter evaluations not available:', error);
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
      // Only clear selected article, not pending selections during initial load
      clearSelectedArticleOnly();
      
      try {
        // Load only the currently selected dataset
        await loadCurrentDataset(fetch);
        // Handle any pending article selection from URL after dataset is loaded
        // Add small delay to ensure store updates are propagated
        setTimeout(() => {
          handlePendingArticleSelection();
        }, 100);
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

    // React to selectedArticle changes and show details if article is selected
    $effect(() => {
      const article = $selectedArticle;
      if (article && !detailedArticle) {
        // Article was selected (likely from URL), show details
        detailedArticle = article;
        showDetailsSidebar = true;
        console.log(`[Article Details] Showing details for article from URL: ${article['o:title']}`);
      }
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
            // Handle any pending article selection from URL after dataset is loaded
            // Add small delay to ensure store updates are propagated
            setTimeout(() => {
              handlePendingArticleSelection();
            }, 100);
          } catch (error) {
            console.error("Failed to load dataset:", error);
          } finally {
            isLoadingDataset.set(false);
          }
        } else {
          // Dataset already loaded, just update currentDatasetArticles
          currentDatasetArticles.set(currentDatasets[datasetId]);
          // Handle any pending article selection since dataset is already available
          setTimeout(() => {
            handlePendingArticleSelection();
          }, 100);
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
    clearSelectedArticle();
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
    <div class="loading-container animate-fade-in">
      <!-- Loading skeleton to prevent CLS -->
      <div class="skeleton h-32 rounded-lg mb-4 sm:mb-6"></div>
      <div class="alert alert-warning p-4 mb-4 sm:mb-6">{$t.messages.loadingData}</div>
      
      <!-- Reserve space for filters -->
      <div class="filters-skeleton mb-4 sm:mb-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {#each Array(5) as _}
            <div class="skeleton h-10 rounded-lg"></div>
          {/each}
        </div>
      </div>
      
      <!-- Reserve space for content -->
      <div class="content-skeleton">
        <div class="skeleton h-96 rounded-lg"></div>
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
        <div class="chart-card"><SentimentChart /></div>
        <div class="chart-card"><SubjectivityChart /></div>
      </div>
    {:else if activeView === 'trends'}
      <div class="chart-card mb-6"><SentimentTrendsChart /></div>
    {:else if activeView === 'correlation'}
      <div class="chart-card mb-6"><CorrelationChart /></div>
    {:else if activeView === 'volume'}
      <div class="chart-card mb-6"><VolumeChart /></div>
    {:else if activeView === 'heatmap'}
      <div class="chart-card mb-6"><CentralityHeatmap /></div>
    {:else if activeView === 'table'}
      <div class="w-full chart-card mb-6">
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
        <div class="chart-card chart-card-extreme">
          <div class="extreme-analysis-header">
            <h2 class="h2 mb-3 text-white text-gradient">{$t.extremeAnalysis.title}</h2>
            <p class="text-base text-surface-300 mb-6 leading-relaxed">{$t.extremeAnalysis.subtitle}</p>
          </div>
          <KeywordFrequencyChart {selectedCategory} {selectedKeywordType} {showTopN} />
        </div>
      </div>
    {/if}
  {:else}
    <div class="alert alert-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
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
      <div class="details-modal preset-glass hover-lift" 
        style="max-height: {Math.min(window.innerHeight - 100, 800)}px;">
        
        <!-- Header with gradient accent -->
        <div class="details-header preset-glass-sm">
          <h2 class="h3 m-0 text-white text-gradient-primary">{$t.article.details}</h2>
          <button 
            class="btn-icon preset-tonal-surface hover-glow" 
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
  /* Chart Card Styles - extends global .chart-card from app.postcss */
  .chart-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 1rem;
    padding: 0.75rem;
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    transition: all var(--timing-normal) var(--easing-default);
  }

  .chart-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    transform: translateY(-2px);
    box-shadow: 
      0 8px 32px color-mix(in oklab, black 15%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 8%, transparent);
  }

  @media (min-width: 640px) {
    .chart-card {
      padding: 1.5rem;
    }
  }

  /* Extreme Analysis Card */
  .chart-card-extreme {
    min-height: 850px;
    padding: 1rem;
  }

  @media (min-width: 640px) {
    .chart-card-extreme {
      padding: 1.5rem;
      min-height: 900px;
    }
  }

  @media (min-width: 1024px) {
    .chart-card-extreme {
      padding: 2rem;
      min-height: 950px;
    }
  }
  
  /* Enhanced Modal System with modern color-mix */
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
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-900) 80%, transparent);
    backdrop-filter: blur(var(--glass-blur-sm));
    animation: fadeIn var(--timing-normal) var(--easing-default);
  }
  
  .modal-container {
    width: 100%;
    max-width: 900px;
    max-height: 95vh;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: slideUp var(--timing-normal) var(--easing-default);
  }
  
  .details-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 1rem;
    overflow: hidden;
    position: relative;
    background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
    backdrop-filter: blur(var(--glass-blur-lg));
    box-shadow: 
      0 16px 64px color-mix(in oklab, black 30%, transparent),
      0 0 40px color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
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
      var(--color-primary-500), 
      var(--color-secondary-500), 
      transparent
    );
    opacity: 0.6;
    z-index: 1;
  }
  
  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    background: color-mix(in oklab, var(--color-surface-50) 4%, transparent);
    position: relative;
    z-index: 2;
  }
  
  .details-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-950) 50%, transparent);
  }
  
  /* Note: @keyframes fadeIn, slideUp and .btn-icon are defined globally in app.postcss */
  
  /* Enhanced Mobile Responsiveness */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .modal-container {
      max-width: 100%;
      max-height: 100vh;
    }
    
    .details-modal {
      border-radius: 0.75rem;
      max-height: 95vh !important;
    }
    
    .details-header {
      padding: 1rem 1.25rem;
    }
    
    .details-content {
      padding: 0.75rem;
    }
  }
  
  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.25rem;
    }
    
    .details-modal {
      border-radius: 0.625rem;
      max-height: 98vh !important;
    }
    
    .details-header {
      padding: 0.75rem 1rem;
    }
    
    .details-header .h3 {
      font-size: 1.125rem;
    }
  }

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

  .extreme-analysis-header h2 {
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
    .extreme-analysis-header h2 {
      font-size: 2rem;
    }
  }

  /* Main Container */
  .main-container {
    margin-top: 0;
    padding-top: 0.5rem;
  }

  @media (min-width: 640px) {
    .main-container {
      padding-top: 0.75rem;
    }
  }

  @media (min-width: 1024px) {
    .main-container {
      padding-top: 1rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .chart-card,
    .modal-backdrop,
    .modal-container,
    .btn-icon {
      transition: none;
      animation: none;
    }
  }
</style>
