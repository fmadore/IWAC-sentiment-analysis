<script lang="ts">
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { 
    currentDatasetArticles, 
    isLoadingDataset, 
    loadDatasetArticles, 
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
    selectedArticle
  } from '$lib';
  import type { Article } from '$lib';
  import ArticleTable from '$lib/components/ArticleTable.svelte';
  import ArticleDetail from '$lib/components/ArticleDetail.svelte';
  import AnalysisInfo from '$lib/components/AnalysisInfo.svelte';
  import CentralityFilter from '$lib/components/ui/CentralityFilter.svelte';
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
import TableIcon from '@lucide/svelte/icons/table';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import XIcon from '@lucide/svelte/icons/x';
import MenuIcon from '@lucide/svelte/icons/menu';
import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
import AreaChartIcon from '@lucide/svelte/icons/area-chart';
import ActivityIcon from '@lucide/svelte/icons/activity';

  // État de l'application
  let activeView = $state('charts');
  let detailedArticle: Article | null = $state(null);
  let showDetailsSidebar = $state(false);
  let detailsPosition = $state({ x: 0, y: 0 });

  onMount(() => {
    // Charger automatiquement le fichier iwac_articles.json
    const loadData = async () => {
      isLoadingDataset.set(true);
      selectedArticle.set(null);
      
      try {
        const articles = await loadDatasetArticles('/data/iwac_articles.json', 'iwac_articles', fetch);
        currentDatasetArticles.set(articles);
      } catch (error) {
        console.error("Failed to load IWAC articles:", error);
        currentDatasetArticles.set([]);
      } finally {
        isLoadingDataset.set(false);
      }
    };

    loadData();
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

  function handleViewChange(value: string) {
    activeView = value;
  }
</script>

<main class="main-container container max-w-6xl mx-auto p-2 sm:p-4 md:p-6">
  <div class="mb-4 sm:mb-6">
    <AnalysisInfo />
  </div>

  {#if $isLoadingDataset}
    <div class="alert variant-filled-warning p-4 mb-4 sm:mb-6">Chargement des données du corpus IWAC...</div>
  {:else if $currentDatasetArticles.length > 0}
    <!-- Filters - Improved responsive grid -->
    <div class="filters-grid-responsive mb-4 sm:mb-6">
      <CountryFilter />
      <JournalFilterComponent />
      <PolarityFilter />
      <SubjectivityFilter />
      <CentralityFilter />
    </div>

    <div class="card variant-glass mb-4 sm:mb-6 overflow-hidden hover-lift">
      <!-- Navigation horizontale en haut -->
      <div class="navigation-container glass-medium">
        <!-- Navigation Desktop -->
        <div class="hidden md:flex items-center justify-center">
          <div class="flex space-x-3">
            <button
              class="nav-tab hover-lift {activeView === 'charts' ? 'active' : ''}"
              onclick={() => handleViewChange('charts')}
            >
              <ChartIcon size={20} />
              <span>Graphiques</span>
            </button>
            
            <button
              class="nav-tab hover-lift {activeView === 'trends' ? 'active' : ''}"
              onclick={() => handleViewChange('trends')}
            >
              <TrendingUpIcon size={20} />
              <span>Tendances</span>
            </button>
            
            <button
              class="nav-tab hover-lift {activeView === 'correlation' ? 'active' : ''}"
              onclick={() => handleViewChange('correlation')}
            >
              <BarChart3Icon size={20} />
              <span>Distribution</span>
            </button>
            
            <button
              class="nav-tab hover-lift {activeView === 'volume' ? 'active' : ''}"
              onclick={() => handleViewChange('volume')}
            >
              <AreaChartIcon size={20} />
              <span>Volume</span>
            </button>
            
            <button
              class="nav-tab hover-lift {activeView === 'heatmap' ? 'active' : ''}"
              onclick={() => handleViewChange('heatmap')}
            >
              <ActivityIcon size={20} />
              <span>Heatmap</span>
            </button>
            
            <button
              class="nav-tab hover-lift {activeView === 'table' ? 'active' : ''}"
              onclick={() => handleViewChange('table')}
            >
              <TableIcon size={20} />
              <span>Tableau</span>
            </button>
          </div>
        </div>

        <!-- Navigation Mobile -->
        <div class="md:hidden">
          <div class="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'charts' ? 'active' : ''}"
              onclick={() => handleViewChange('charts')}
            >
              <ChartIcon size={18} />
              <span class="text-xs">Graphiques</span>
            </button>
            
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'trends' ? 'active' : ''}"
              onclick={() => handleViewChange('trends')}
            >
              <TrendingUpIcon size={18} />
              <span class="text-xs">Tendances</span>
            </button>
            
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'correlation' ? 'active' : ''}"
              onclick={() => handleViewChange('correlation')}
            >
              <BarChart3Icon size={18} />
              <span class="text-xs">Distribution</span>
            </button>
            
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'volume' ? 'active' : ''}"
              onclick={() => handleViewChange('volume')}
            >
              <AreaChartIcon size={18} />
              <span class="text-xs">Volume</span>
            </button>
            
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'heatmap' ? 'active' : ''}"
              onclick={() => handleViewChange('heatmap')}
            >
              <ActivityIcon size={18} />
              <span class="text-xs">Heatmap</span>
            </button>
            
            <button
              class="nav-tab-mobile hover-lift-sm {activeView === 'table' ? 'active' : ''}"
              onclick={() => handleViewChange('table')}
            >
              <TableIcon size={18} />
              <span class="text-xs">Tableau</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="w-full">
        <div class="p-3 sm:p-6">
          {#if activeView === 'charts'}
            <div class="space-y-4 sm:space-y-6">
              <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
                <SentimentChart />
              </div>
              <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
                <SubjectivityChart />
              </div>
            </div>
          {:else if activeView === 'trends'}
            <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
              <SentimentTrendsChart />
            </div>
          {:else if activeView === 'correlation'}
            <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
              <CorrelationChart />
            </div>
          {:else if activeView === 'volume'}
            <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
              <VolumeChart />
            </div>
          {:else if activeView === 'heatmap'}
            <div class="card variant-glass p-3 sm:p-6 hover-lift chart-container">
              <CentralityHeatmap />
            </div>
          {:else if activeView === 'table'}
            <div class="w-full card variant-glass p-3 sm:p-6 hover-lift">
              <h2 class="h3 mb-4 text-white text-gradient">Liste des articles</h2>
              <ArticleTable onShowDetails={handleShowDetails} />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="alert variant-filled-error p-4 mb-4 sm:mb-6">Erreur lors du chargement du corpus IWAC ou le corpus est vide.</div>
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
          <h2 class="h3 m-0 text-white text-gradient-primary">Détails de l'Article</h2>
          <button 
            class="btn-icon variant-soft-surface hover-glow focus-ring" 
            onclick={closeDetails} 
            title="Fermer"
            aria-label="Fermer les détails"
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
  /* Scrollbar hiding for mobile navigation */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
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
  
  /* Enhanced Filter Grid Styles */
  .filters-grid-responsive {
    display: grid;
    gap: 0.5rem;
    align-items: start;
    
    /* Mobile: 1 column */
    grid-template-columns: 1fr;
    
    /* Small tablets: 2 columns */
    @media (min-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    /* Medium tablets: 3 columns */
    @media (min-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    /* Large tablets/small desktop: 4 columns */
    @media (min-width: 1024px) {
      grid-template-columns: repeat(4, 1fr);
    }
    
    /* Desktop: 5 columns */
    @media (min-width: 1280px) {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  .filters-grid-responsive :global(.card) {
    height: fit-content;
    align-self: start;
    transition: all var(--transition-normal);
    min-width: 0; /* Permet aux cartes de se rétrécir si nécessaire */
  }
  
  .filters-grid-responsive :global(.card:hover) {
    transform: translateY(-2px);
  }
  
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

  /* Navigation Styles - Using Design System */
  .navigation-container {
    background: rgba(30, 41, 59, 0.9);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: var(--shadow-xl);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    position: relative;
    overflow: hidden;
  }
  
  .navigation-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }
  
  /* Navigation tabs desktop */
  .nav-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: rgba(255, 255, 255, 0.9);
    transition: all var(--transition-normal);
    font-weight: 500;
    font-size: 0.875rem;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .nav-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  
  .nav-tab:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    color: white;
  }
  
  .nav-tab:hover::before {
    opacity: 1;
  }
  
  .nav-tab.active {
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 
      0 8px 32px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .nav-tab.active:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 12px 40px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  /* Navigation tabs mobile */
  .nav-tab-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: rgba(255, 255, 255, 0.9);
    transition: all var(--transition-normal);
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .nav-tab-mobile::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  
  .nav-tab-mobile:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    color: white;
  }
  
  .nav-tab-mobile:hover::before {
    opacity: 1;
  }
  
  .nav-tab-mobile.active {
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 
      0 8px 32px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .nav-tab-mobile.active:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 12px 40px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  /* Enhanced icon styles */
  .nav-tab :global(svg),
  .nav-tab-mobile :global(svg) {
    opacity: 0.9;
    transition: opacity var(--transition-fast);
  }
  
  .nav-tab:hover :global(svg),
  .nav-tab-mobile:hover :global(svg) {
    opacity: 1;
  }
  
  .nav-tab.active :global(svg),
  .nav-tab-mobile.active :global(svg) {
    opacity: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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
  }

  @media (min-width: 1024px) {
    .main-container {
      margin-top: 0;
      padding-top: 1rem;
    }
  }
</style>
