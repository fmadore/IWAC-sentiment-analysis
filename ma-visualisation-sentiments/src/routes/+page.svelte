<script lang="ts">
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { availableDatasets as availableDatasetsStore, selectedDatasetId, currentDatasetArticles, isLoadingDataset } from '$lib/stores'; // Ajustez chemin
  import { fetchDataset } from '$lib/utils'; // Ou depuis un fichier utils
  import type { DatasetInfo } from '$lib/types/data'; // Importer DatasetInfo

  import DatasetSelector from '$lib/components/ui/DatasetSelector.svelte';
  import JournalFilterComponent from '$lib/components/ui/JournalFilter.svelte';
  import SentimentCriteriaFilter from '$lib/components/ui/SentimentCriteriaFilter.svelte';
  import SentimentChart from '$lib/components/viz/SentimentChart.svelte';

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
        currentDatasetArticles.set(await fetchDataset(selectedInfo.filePath, selectedInfo.id, fetch));
        isLoadingDataset.set(false);
      }
    } else {
      currentDatasetArticles.set([]);
    }
  });
</script>

<main class="container">
  <h1>Analyse de Sentiments des Articles de Presse</h1>

  <DatasetSelector />

  {#if $isLoadingDataset}
    <p>Chargement des données du dataset...</p>
  {:else if $currentDatasetArticles.length > 0}
    <div class="filters-container">
      <JournalFilterComponent />
      <SentimentCriteriaFilter />
    </div>
    <div class="chart-container">
      <SentimentChart />
    </div>
  {:else if $selectedDatasetId && !$isLoadingDataset}
    <p>Aucun article trouvé pour ce dataset ou le dataset est vide.</p>
  {:else}
    <p>Veuillez sélectionner un dataset pour commencer.</p>
  {/if}
</main>

<style>
  .container { max-width: 1200px; margin: auto; padding: 20px; }
  .filters-container { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
  .chart-container { min-height: 400px; /* Pour éviter le "layout shift" */ }
</style>
