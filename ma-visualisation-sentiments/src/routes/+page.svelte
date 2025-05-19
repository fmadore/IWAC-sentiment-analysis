<script lang="ts">
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { 
    availableDatasets as availableDatasetsStore, 
    selectedDatasetId, 
    currentDatasetArticles, 
    isLoadingDataset, 
    fetchDataset, 
    DatasetSelector, 
    JournalFilter as JournalFilterComponent, 
    PolarityFilter,
    SubjectivityFilter,
    SentimentChart,
    SentimentTrendsChart,
    selectedArticle
  } from '$lib';
  import type { DatasetInfo } from '$lib'; // Importer DatasetInfo
  import ArticleTable from '$lib/components/ArticleTable.svelte'; // Import ArticleTable
  import ArticleDetail from '$lib/components/ArticleDetail.svelte'; // Import ArticleDetail
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  // Importons les icônes nécessaires
  import ChartIcon from '@lucide/svelte/icons/bar-chart-2';
  import TableIcon from '@lucide/svelte/icons/table';

  export let data: PageData; // Données du `load` de +page.ts

  let activeView = 'charts'; // Vue active par défaut

  onMount(() => {
    if (data.availableDatasets) {
      availableDatasetsStore.set(data.availableDatasets);
    }
  });

  selectedDatasetId.subscribe(async (id: string | null) => {
    if (id) {
      const selectedInfo = $availableDatasetsStore.find((d: DatasetInfo) => d.id === id);
      if (selectedInfo) {
        isLoadingDataset.set(true);
        selectedArticle.set(null);
        currentDatasetArticles.set(await fetchDataset(selectedInfo.filePath, selectedInfo.id, fetch));
        isLoadingDataset.set(false);
      }
    } else {
      currentDatasetArticles.set([]);
      selectedArticle.set(null);
    }
  });
</script>

<main class="container max-w-6xl mx-auto p-4 md:p-6 mt-6">
  <DatasetSelector />

  {#if $isLoadingDataset}
    <div class="alert card-enhanced glossy bg-warning-500 text-warning-contrast-500 p-4 mb-6">Chargement des données du dataset...</div>
  {:else if $currentDatasetArticles.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <JournalFilterComponent />
      <PolarityFilter />
      <SubjectivityFilter />
    </div>

    <div class="card card-enhanced glossy mb-6 bg-surface-100-800 overflow-hidden">
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
            <Navigation.Tile id="table" label="Tableau">
              <TableIcon />
            </Navigation.Tile>
          {/snippet}
        </Navigation.Rail>

        <!-- Contenu associé au menu -->
        <div class="p-6">
          {#if activeView === 'charts'}
            <div class="space-y-6">
              <div class="card-enhanced glossy p-6 bg-surface-200-700">
                <SentimentChart />
              </div>
              <div class="card-enhanced glossy p-6 bg-surface-200-700">
                <SentimentTrendsChart />
              </div>
            </div>
          {:else if activeView === 'table'}
            <div class="flex flex-col gap-6">
              <div class="w-full card-enhanced glossy p-6 bg-surface-200-700">
                <h2 class="text-xl font-semibold mb-4 text-white">Liste des Articles</h2>
                <ArticleTable />
              </div>
              <div class="w-full card-enhanced glossy p-6 bg-surface-200-700">
                <h2 class="text-xl font-semibold mb-4 text-white">Détails de l'Article</h2>
                <ArticleDetail />
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else if $selectedDatasetId && !$isLoadingDataset}
    <div class="alert card-enhanced glossy bg-error-500 text-error-contrast-500 p-4 mb-6">Aucun article trouvé pour ce dataset ou le dataset est vide.</div>
  {:else}
    <div class="alert card-enhanced glossy bg-info-500 text-info-contrast-500 p-4 mb-6">Veuillez sélectionner un dataset pour commencer.</div>
  {/if}
</main>

<style>
  /* Styles locaux */
</style>
