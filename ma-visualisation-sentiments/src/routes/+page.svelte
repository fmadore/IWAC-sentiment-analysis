<script lang="ts">
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { 
    availableDatasets as availableDatasetsStore, 
    selectedDatasetId, 
    currentDatasetArticles, 
    isLoadingDataset, 
    loadDatasetArticles, 
    DatasetSelector, 
    JournalFilter as JournalFilterComponent, 
    PolarityFilter,
    SubjectivityFilter,
    SentimentChart,
    SentimentTrendsChart,
    SubjectivityChart,
    selectedArticle
  } from '$lib';
  import type { DatasetInfo, Article } from '$lib'; // Assuming Article type is available in $lib, adjust if not.
  import ArticleTable from '$lib/components/ArticleTable.svelte';
  import ArticleDetail from '$lib/components/ArticleDetail.svelte';
  import AnalysisInfo from '$lib/components/AnalysisInfo.svelte';
  import CentralityFilter from '$lib/components/ui/CentralityFilter.svelte';
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
  import TableIcon from '@lucide/svelte/icons/table';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import InfoIcon from '@lucide/svelte/icons/info';
  import XIcon from '@lucide/svelte/icons/x';

  let { data }: { data: PageData } = $props(); // Changed to $props()

  let activeView = $state('charts');
  let showDetailsSidebar = $state(false);
  let detailedArticle = $state<Article | null>(null);
  let detailsPosition = $state({ x: 0, y: 0 });

  onMount(() => {
    if (data.availableDatasets) {
      availableDatasetsStore.set(data.availableDatasets);
    }
  });

  // Gérer l'affichage des détails
  function handleShowDetails(details: { article: Article, position: {x: number, y: number}}) { // Changed parameter type
    detailedArticle = details.article; // Use details.article
    showDetailsSidebar = true;
    detailsPosition = details.position; // Use details.position
  }

  function closeDetails() {
    showDetailsSidebar = false;
    detailedArticle = null;
  }

  // Removed selectedDatasetId.subscribe block

  $effect(() => {
    const performAsyncLoad = async () => {
      const id = $selectedDatasetId; // Reactive read of selectedDatasetId store
      const datasets = $availableDatasetsStore; // Reactive read of availableDatasetsStore

      if (id) {
        const selectedInfo = datasets.find((d: DatasetInfo) => d.id === id);
        if (selectedInfo) {
          isLoadingDataset.set(true);
          selectedArticle.set(null); // Clear legacy store if still used elsewhere
          detailedArticle = null;    // Clear local state for the detail view

          try {
            const articles = await loadDatasetArticles(selectedInfo.filePath, selectedInfo.id, fetch);
            currentDatasetArticles.set(articles);
          } catch (error) {
            console.error("Failed to load dataset articles:", error);
            currentDatasetArticles.set([]); // Set to empty on error
          } finally {
            isLoadingDataset.set(false);
          }
        } else {
          // Case: id is set, but no matching dataset info found (e.g., if datasets is empty or id is stale)
          currentDatasetArticles.set([]);
          selectedArticle.set(null);
          detailedArticle = null;
          // isLoadingDataset is not set to true in this path, so no need to set it to false here.
        }
      } else { // No dataset selected (id is null)
        currentDatasetArticles.set([]);
        selectedArticle.set(null);
        detailedArticle = null;
      }
    };

    performAsyncLoad();

    // No cleanup function needed here, so we don't return anything.
  });
</script>

<main class="container max-w-6xl mx-auto p-4 md:p-6 mt-6">
  <div class="mb-6">
    <AnalysisInfo />
  </div>

  <div class="flex justify-between items-center mb-6">
    <DatasetSelector />
  </div>

  {#if $isLoadingDataset}
    <div class="alert variant-filled-warning p-4 mb-6">Chargement des données du corpus...</div>
  {:else if $currentDatasetArticles.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <JournalFilterComponent />
      <PolarityFilter />
      <SubjectivityFilter />
      <CentralityFilter />
    </div>

    <div class="card variant-glass mb-6 overflow-hidden">
      <div class="grid grid-cols-[auto_1fr]">
        <!-- Menu de navigation latéral -->
        <Navigation.Rail 
          value={activeView} 
          onValueChange={(value) => activeView = value}
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

        <!-- Contenu associé au menu -->
        <div class="p-6">
          {#if activeView === 'charts'}
            <div class="space-y-6">
              <div class="card variant-glass p-6">
                <SentimentChart />
              </div>
              <div class="card variant-glass p-6">
                <SubjectivityChart />
              </div>
            </div>
          {:else if activeView === 'trends'}
            <div class="card variant-glass p-6">
              <SentimentTrendsChart />
            </div>
          {:else if activeView === 'table'}
            <div class="w-full card variant-glass p-6">
              <h2 class="h3 mb-4 text-white">Liste des articles</h2>
              <ArticleTable onShowDetails={handleShowDetails} />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else if $selectedDatasetId && !$isLoadingDataset}
    <div class="alert variant-filled-error p-4 mb-6">Aucun article trouvé pour ce corpus ou le corpus est vide.</div>
  {:else}
    <div class="alert variant-filled-primary p-4 mb-6">Veuillez sélectionner un corpus pour commencer.</div>
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
  
  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    cursor: pointer;
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
