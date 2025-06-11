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

<main class="container max-w-6xl mx-auto p-2 sm:p-4 md:p-6 mt-2 sm:mt-6">
  <div class="mb-4 sm:mb-6">
    <AnalysisInfo />
  </div>

  {#if $isLoadingDataset}
    <div class="alert variant-filled-warning p-4 mb-4 sm:mb-6">Chargement des données du corpus IWAC...</div>
  {:else if $currentDatasetArticles.length > 0}
    <!-- Filters - Stack on mobile -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6 filters-grid">
      <CountryFilter />
      <JournalFilterComponent />
      <PolarityFilter />
      <SubjectivityFilter />
      <CentralityFilter />
    </div>

    <div class="card variant-glass mb-4 sm:mb-6 overflow-hidden">
      <!-- Navigation horizontale en haut -->
      <div class="navigation-top-bar">
        <!-- Navigation Desktop -->
        <div class="hidden md:flex items-center justify-center">
          <div class="flex space-x-2">
            <button
              class="nav-tab {activeView === 'charts' ? 'active' : ''}"
              onclick={() => handleViewChange('charts')}
            >
              <ChartIcon size={20} />
              <span>Graphiques</span>
            </button>
            
            <button
              class="nav-tab {activeView === 'trends' ? 'active' : ''}"
              onclick={() => handleViewChange('trends')}
            >
              <TrendingUpIcon size={20} />
              <span>Tendances</span>
            </button>
            
            <button
              class="nav-tab {activeView === 'correlation' ? 'active' : ''}"
              onclick={() => handleViewChange('correlation')}
            >
              <BarChart3Icon size={20} />
              <span>Distribution</span>
            </button>
            
            <button
              class="nav-tab {activeView === 'volume' ? 'active' : ''}"
              onclick={() => handleViewChange('volume')}
            >
              <AreaChartIcon size={20} />
              <span>Volume</span>
            </button>
            
            <button
              class="nav-tab {activeView === 'heatmap' ? 'active' : ''}"
              onclick={() => handleViewChange('heatmap')}
            >
              <ActivityIcon size={20} />
              <span>Heatmap</span>
            </button>
            
            <button
              class="nav-tab {activeView === 'table' ? 'active' : ''}"
              onclick={() => handleViewChange('table')}
            >
              <TableIcon size={20} />
              <span>Tableau</span>
            </button>
          </div>
        </div>

        <!-- Navigation Mobile -->
        <div class="md:hidden">
          <div class="flex items-center space-x-2 overflow-x-auto pb-2">
            <button
              class="nav-tab-mobile {activeView === 'charts' ? 'active' : ''}"
              onclick={() => handleViewChange('charts')}
            >
              <ChartIcon size={18} />
              <span class="text-xs">Graphiques</span>
            </button>
            
            <button
              class="nav-tab-mobile {activeView === 'trends' ? 'active' : ''}"
              onclick={() => handleViewChange('trends')}
            >
              <TrendingUpIcon size={18} />
              <span class="text-xs">Tendances</span>
            </button>
            
            <button
              class="nav-tab-mobile {activeView === 'correlation' ? 'active' : ''}"
              onclick={() => handleViewChange('correlation')}
            >
              <BarChart3Icon size={18} />
              <span class="text-xs">Distribution</span>
            </button>
            
            <button
              class="nav-tab-mobile {activeView === 'volume' ? 'active' : ''}"
              onclick={() => handleViewChange('volume')}
            >
              <AreaChartIcon size={18} />
              <span class="text-xs">Volume</span>
            </button>
            
            <button
              class="nav-tab-mobile {activeView === 'heatmap' ? 'active' : ''}"
              onclick={() => handleViewChange('heatmap')}
            >
              <ActivityIcon size={18} />
              <span class="text-xs">Heatmap</span>
            </button>
            
            <button
              class="nav-tab-mobile {activeView === 'table' ? 'active' : ''}"
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
              <div class="card variant-glass p-3 sm:p-6">
                <SentimentChart />
              </div>
              <div class="card variant-glass p-3 sm:p-6">
                <SubjectivityChart />
              </div>
            </div>
          {:else if activeView === 'trends'}
            <div class="card variant-glass p-3 sm:p-6">
              <SentimentTrendsChart />
            </div>
          {:else if activeView === 'correlation'}
            <div class="card variant-glass p-3 sm:p-6">
              <CorrelationChart />
            </div>
          {:else if activeView === 'volume'}
            <div class="card variant-glass p-3 sm:p-6">
              <VolumeChart />
            </div>
          {:else if activeView === 'heatmap'}
            <div class="card variant-glass p-3 sm:p-6">
              <CentralityHeatmap />
            </div>
          {:else if activeView === 'table'}
            <div class="w-full card variant-glass p-3 sm:p-6">
              <h2 class="h3 mb-4 text-white">Liste des articles</h2>
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
  <div class="details-modal card variant-glass" 
    style="max-height: {Math.min(window.innerHeight - 50, 800)}px;">
    <div class="details-header">
      <h2 class="h3 m-0 text-white">Détails de l'Article</h2>
      <button class="btn-icon variant-soft-surface" onclick={closeDetails} title="Fermer">
        <XIcon size={20} />
      </button>
    </div>
    <div class="details-content">
      <ArticleDetail article={detailedArticle} />
    </div>
  </div>
  <button 
    class="modal-backdrop" 
    onclick={closeDetails}
    onkeydown={(e) => e.key === 'Escape' && closeDetails()}
    aria-label="Fermer les détails"
    role="dialog"
  ></button>
{/if}

<style>
  /* Ajustements pour les cartes et alertes */
  :global(.card) {
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(80, 80, 80, 0.2);
  }
  
  :global(.variant-glass) {
    background-image: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(4px);
  }
  
  /* Styles pour le panneau de détails */
  .details-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 800px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.2s ease-out;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
  
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.1s ease-out;
  }
  
  .details-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .details-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -45%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  /* Amélioration des tuiles de navigation Skeleton */
  :global(.navigation-rail-custom .nav-tile) {
    padding: 1.25rem 1rem !important;
    border-radius: 0.75rem !important;
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    margin-bottom: 0.75rem !important;
    min-height: 90px !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    text-align: center !important;
  }
  
  :global(.navigation-rail-custom .nav-tile:hover) {
    background: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    color: white !important;
  }
  
  :global(.navigation-rail-custom .nav-tile[data-selected="true"]) {
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4) !important;
    transform: translateY(-1px) !important;
  }
  
  :global(.navigation-rail-custom .nav-tile[data-selected="true"]:hover) {
    transform: translateY(-3px) !important;
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5) !important;
  }
  
  /* Amélioration des icônes dans la navigation */
  :global(.navigation-rail-custom .nav-tile svg) {
    opacity: 0.9;
    transition: opacity 0.2s ease;
    margin-bottom: 0.5rem;
  }
  
  :global(.navigation-rail-custom .nav-tile:hover svg) {
    opacity: 1;
  }
  
  :global(.navigation-rail-custom .nav-tile[data-selected="true"] svg) {
    opacity: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
  
  /* Amélioration du texte des labels */
  :global(.navigation-rail-custom .nav-tile .nav-tile-label) {
    font-size: 0.8rem !important;
    font-weight: 500 !important;
    line-height: 1.2 !important;
  }
  
  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    cursor: pointer;
  }
  
  /* Styles pour la grille de filtres */
  .filters-grid :global(.card) {
    height: fit-content;
    align-self: start;
  }
  
  .filters-grid {
    align-items: start;
  }
  
  /* Media queries pour la responsivité */
  @media (max-width: 640px) {
    .details-modal {
      width: 95%;
      max-height: 90vh !important;
    }
    
    .details-content {
      padding: 0.5rem;
    }
  }

  /* Styles pour la navigation horizontale en haut */
  .navigation-top-bar {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    margin-bottom: 1.5rem;
    padding: 1rem;
  }
  
  /* Navigation tabs desktop */
  .nav-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    font-size: 0.875rem;
    white-space: nowrap;
  }
  
  .nav-tab:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    color: white;
  }
  
  .nav-tab.active {
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
  
  .nav-tab.active:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }
  
  /* Navigation tabs mobile */
  .nav-tab-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    white-space: nowrap;
    min-width: 80px;
    flex-shrink: 0;
  }
  
  .nav-tab-mobile:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .nav-tab-mobile.active {
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  }
  
  /* Amélioration des icônes dans les tabs */
  .nav-tab :global(svg),
  .nav-tab-mobile :global(svg) {
    opacity: 0.9;
    transition: opacity 0.2s ease;
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
</style>
