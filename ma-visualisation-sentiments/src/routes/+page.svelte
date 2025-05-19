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

  export let data: PageData; // Données du `load` de +page.ts

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

<main class="container max-w-6xl mx-auto p-6">
  <div class="card preset-surface p-8 mb-8 shadow-lg">
    <DatasetSelector />
  </div>

  {#if $isLoadingDataset}
    <div class="alert preset-warning mb-4">Chargement des données du dataset...</div>
  {:else if $currentDatasetArticles.length > 0}
    <div class="flex flex-col md:flex-row gap-4 mb-6 items-stretch">
      <JournalFilterComponent class_name="flex-1" />
      <PolarityFilter class_name="flex-1" />
      <SubjectivityFilter class_name="flex-1" />
    </div>
    <div class="card preset-surface p-6 mb-6 shadow">
      <SentimentChart />
    </div>
    <div class="card preset-surface p-6 mb-6 shadow">
      <SentimentTrendsChart />
    </div>

    <div class="flex flex-col lg:flex-row gap-6 mb-6">
      <div class="lg:w-2/3 card preset-surface p-6 shadow">
        <h2 class="text-xl font-semibold mb-4">Liste des Articles</h2>
        <ArticleTable />
      </div>
      <div class="lg:w-1/3 card preset-surface p-6 shadow">
        <h2 class="text-xl font-semibold mb-4">Détails de l'Article</h2>
        <ArticleDetail />
      </div>
    </div>

  {:else if $selectedDatasetId && !$isLoadingDataset}
    <div class="alert preset-error mb-4">Aucun article trouvé pour ce dataset ou le dataset est vide.</div>
  {:else}
    <div class="alert preset-info mb-4">Veuillez sélectionner un dataset pour commencer.</div>
  {/if}
</main>

<style>
  /* Removed custom CSS for container, filters-container, and chart-container to let Skeleton handle layout and spacing */
</style>
