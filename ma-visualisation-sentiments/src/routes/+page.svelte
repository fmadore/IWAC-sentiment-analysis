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
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  export let data: PageData; // Données du `load` de +page.ts

  let tab = 'charts'; // Onglet par défaut

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

    <div class="card card-enhanced glossy p-2 mb-6 bg-surface-100-800">
      <Tabs value={tab} onValueChange={({ value }) => tab = value}>
        <Tabs.Control value="charts">Graphiques</Tabs.Control>
        <Tabs.Control value="table">Tableau</Tabs.Control>
      </Tabs>
    </div>

    {#if tab === 'charts'}
      <div class="card card-enhanced glossy p-6 mb-6 bg-surface-100-800">
        <SentimentChart />
      </div>
      <div class="card card-enhanced glossy p-6 mb-6 bg-surface-100-800">
        <SentimentTrendsChart />
      </div>
    {:else if tab === 'table'}
      <div class="flex flex-col lg:flex-row gap-6 mb-6">
        <div class="w-full card card-enhanced glossy p-6 bg-surface-100-800">
          <h2 class="text-xl font-semibold mb-4">Liste des Articles</h2>
          <ArticleTable />
        </div>
        <div class="hidden lg:block lg:w-1/3 card card-enhanced glossy p-6 bg-surface-100-800">
          <h2 class="text-xl font-semibold mb-4">Détails de l'Article</h2>
          <ArticleDetail />
        </div>
      </div>
    {/if}

  {:else if $selectedDatasetId && !$isLoadingDataset}
    <div class="alert card-enhanced glossy bg-error-500 text-error-contrast-500 p-4 mb-6">Aucun article trouvé pour ce dataset ou le dataset est vide.</div>
  {:else}
    <div class="alert card-enhanced glossy bg-info-500 text-info-contrast-500 p-4 mb-6">Veuillez sélectionner un dataset pour commencer.</div>
  {/if}
</main>

<style>
  /* Styles locaux */
</style>
