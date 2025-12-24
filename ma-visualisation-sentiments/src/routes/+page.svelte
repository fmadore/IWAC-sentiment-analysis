<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    currentDatasetArticles, 
    isLoadingDataset, 
    loadCurrentDataset,
    loadComparisonDatasets,
    loadCurrentExtremeAnalysis,
    loadArbiterEvaluations,
    selectedDataset,
    datasetArticles,
    comparisonMode,
    selectedArticle,
    countryFilters,
    journalFilters,
    polarityFilters,
    subjectivityFilters,
    centralityFilters
  } from '$lib';
  import { t, currentLanguage } from '$lib/i18n';
  import type { Article } from '$lib';
  import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
  
  // Layout
  import { FiltersPanel, NavigationTabs, ViewContent } from '$lib/components/layout';
  
  // Data Display
  import { AnalysisInfo } from '$lib/components/data-display';
  
  // Common
  import { ArticleDetailModal, LoadingState } from '$lib/components/common';
  
  // Utilities
  import { SEOHead } from '$lib/components';
  import { initializeURLState, updateURL, clearSelectedArticle, clearSelectedArticleOnly, handlePendingArticleSelection } from '$lib/urlState';

  // Application state
  let activeView = $state('charts');
  let detailedArticle: Article | null = $state(null);
  let showDetailsSidebar = $state(false);

  // Extreme analysis controls state
  let selectedCategory = $state<ExtremeCategory>('polarity_very_negative');
  let selectedKeywordType = $state<KeywordType>('subject');
  let showTopN = $state(10);

  // Get articles for the current dataset
  let currentArticles = $derived($datasetArticles[$selectedDataset] || []);

  // Reactive statement to handle extreme analysis data loading when dataset changes
  $effect(() => {
    if (activeView === 'extremes' && $selectedDataset && browser) {
      console.log('Loading extreme analysis for dataset:', $selectedDataset);
      loadCurrentExtremeAnalysis(fetch)
        .then(() => console.log('Extreme analysis loaded successfully for:', $selectedDataset))
        .catch(error => console.error("Failed to load extreme analysis data:", error));
    }
  });

  // Reactive statement to handle comparison data loading when comparison mode is enabled
  $effect(() => {
    if ($comparisonMode && browser) {
      console.log('Comparison mode enabled, loading comparison datasets...');
      loadComparisonDatasets(fetch)
        .then(() => console.log('Comparison datasets loaded successfully'))
        .catch(error => console.error("Failed to load comparison datasets:", error));
      
      loadArbiterEvaluations(fetch)
        .then(() => console.log('Arbiter evaluations loaded (if available)'))
        .catch(error => console.log('Arbiter evaluations not available:', error));
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
      clearSelectedArticleOnly();
      
      try {
        await loadCurrentDataset(fetch);
        setTimeout(() => handlePendingArticleSelection(), 100);
      } catch (error) {
        console.error("Failed to load dataset:", error);
      } finally {
        isLoadingDataset.set(false);
      }
    };

    loadData();

    // React to filter changes and update URL
    $effect(() => {
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
        detailedArticle = article;
        showDetailsSidebar = true;
        console.log(`[Article Details] Showing details for article from URL: ${article['o:title']}`);
      }
    });

    // React to dataset changes to load new dataset and update URL
    $effect(() => {
      const datasetId = $selectedDataset;
      
      (async () => {
        const currentDatasets = $datasetArticles;
        if (!currentDatasets[datasetId] || currentDatasets[datasetId].length === 0) {
          isLoadingDataset.set(true);
          try {
            await loadCurrentDataset(fetch);
            setTimeout(() => handlePendingArticleSelection(), 100);
          } catch (error) {
            console.error("Failed to load dataset:", error);
          } finally {
            isLoadingDataset.set(false);
          }
        } else {
          currentDatasetArticles.set(currentDatasets[datasetId]);
          setTimeout(() => handlePendingArticleSelection(), 100);
        }
        
        if (browser) {
          updateURL(activeView);
        }
      })();
    });
  });

  // Handle showing article details
  function handleShowDetails(details: { article: Article, position: {x: number, y: number}}) {
    detailedArticle = details.article;
    showDetailsSidebar = true;
  }

  function closeDetails() {
    showDetailsSidebar = false;
    detailedArticle = null;
    clearSelectedArticle();
  }

  async function handleViewChange(value: string) {
    activeView = value;
    
    if (value === 'comparison') {
      if (!$comparisonMode) {
        comparisonMode.set(true);
      }
      
      try {
        await loadComparisonDatasets(fetch);
      } catch (error) {
        console.error("Failed to load comparison datasets:", error);
      }
    } else if (value === 'extremes') {
      try {
        await loadCurrentExtremeAnalysis(fetch);
      } catch (error) {
        console.error("Failed to load extreme analysis data:", error);
      }
    } else {
      if ($comparisonMode) {
        comparisonMode.set(false);
      }
    }
    
    updateURL(activeView);
  }

  // Handlers for extreme analysis controls
  function handleCategoryChange(category: ExtremeCategory) {
    selectedCategory = category;
  }

  function handleKeywordTypeChange(type: KeywordType) {
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
    <LoadingState />
  {:else if currentArticles.length > 0}
    <NavigationTabs {activeView} onChange={handleViewChange} />

    <FiltersPanel
      {activeView}
      {selectedCategory}
      {selectedKeywordType}
      {showTopN}
      onCategoryChange={handleCategoryChange}
      onKeywordTypeChange={handleKeywordTypeChange}
      onTopNChange={handleTopNChange}
    />

    <ViewContent
      {activeView}
      {selectedCategory}
      {selectedKeywordType}
      {showTopN}
      onShowDetails={handleShowDetails}
    />
  {:else}
    <div class="alert alert-error p-4 mb-4 sm:mb-6">{$t.messages.noData}</div>
  {/if}
</main>

<!-- Article Details Modal -->
<ArticleDetailModal 
  article={detailedArticle} 
  open={showDetailsSidebar} 
  onClose={closeDetails} 
/>

<style>
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
</style>
