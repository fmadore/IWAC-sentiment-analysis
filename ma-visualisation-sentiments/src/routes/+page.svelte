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

  let activeView = $state('charts');
  let showDetailsSidebar = $state(false);
  let detailedArticle = $state<Article | null>(null);
  let detailsPosition = $state({ x: 0, y: 0 });
  let isMobileSidebarOpen = $state(false);
  let isMobile = $state(false);

  onMount(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      isMobile = window.innerWidth < 768; // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
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

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function handleViewChange(value: string) {
    activeView = value;
    // Close mobile sidebar when a view is selected
    if (isMobile) {
      isMobileSidebarOpen = false;
    }
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
      <!-- Mobile Header with Menu Toggle -->
      {#if isMobile}
        <div class="flex items-center justify-between p-4 border-b border-white/10 md:hidden">
          <h2 class="text-lg font-semibold text-white">
            {#if activeView === 'charts'}Graphiques
            {:else if activeView === 'trends'}Tendances  
            {:else if activeView === 'table'}Tableau
            {/if}
          </h2>
          <button 
            class="btn-icon variant-soft-surface"
            onclick={toggleMobileSidebar}
            title="Menu"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      {/if}

      <!-- Layout: Mobile uses conditional rendering, Desktop uses grid -->
      <div class="md:grid md:grid-cols-[auto_1fr]">
        <!-- Mobile Sidebar Overlay -->
        {#if isMobile && isMobileSidebarOpen}
          <div class="fixed inset-0 z-50 md:hidden">
            <!-- Backdrop -->
            <button 
              class="absolute inset-0 bg-black/50 border-0 p-0 cursor-pointer" 
              onclick={toggleMobileSidebar}
              onkeydown={(e) => e.key === 'Escape' && toggleMobileSidebar()}
              aria-label="Fermer le menu"
            ></button>
            <!-- Mobile Bottom Sheet Navigation -->
            <div class="absolute bottom-0 left-0 right-0 bg-surface-900 rounded-t-xl shadow-2xl border-t border-white/10 animate-slide-up">
              <div class="p-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-white font-semibold text-lg">Navigation</h3>
                  <button 
                    class="btn-icon variant-soft-surface"
                    onclick={toggleMobileSidebar}
                    aria-label="Fermer le menu"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                
                <!-- Navigation Options -->
                <div class="grid grid-cols-3 gap-3">
                  <button
                    class="nav-option {activeView === 'charts' ? 'active' : ''}"
                    onclick={() => handleViewChange('charts')}
                  >
                    <ChartIcon size={24} />
                    <span class="text-sm font-medium">Graphiques</span>
                  </button>
                  
                  <button
                    class="nav-option {activeView === 'trends' ? 'active' : ''}"
                    onclick={() => handleViewChange('trends')}
                  >
                    <TrendingUpIcon size={24} />
                    <span class="text-sm font-medium">Tendances</span>
                  </button>
                  
                  <button
                    class="nav-option {activeView === 'table' ? 'active' : ''}"
                    onclick={() => handleViewChange('table')}
                  >
                    <TableIcon size={24} />
                    <span class="text-sm font-medium">Tableau</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Desktop Sidebar -->
        <div class="hidden md:block">
          <Navigation.Rail 
            value={activeView} 
            onValueChange={handleViewChange}
            background="bg-primary-500/10"
            padding="p-2"
          >
            {#snippet tiles()}
              <Navigation.Tile id="charts" label="Graphiques">
                <ChartIcon />
              </Navigation.Tile>
              <Navigation.Tile id="trends" label="Tendances">
                <TrendingUpIcon />
              </Navigation.Tile>
              <Navigation.Tile id="table" label="Tableau">
                <TableIcon />
              </Navigation.Tile>
            {/snippet}
          </Navigation.Rail>
        </div>

        <!-- Content Area -->
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

  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }

  .nav-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    transition: all 0.2s ease;
    min-height: 80px;
  }

  .nav-option:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .nav-option.active {
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .nav-option.active:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
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
</style>
