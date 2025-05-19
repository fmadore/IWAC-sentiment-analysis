<!-- Composant DatasetSelector.svelte --> 
<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores.ts'; // Ajustez chemin
</script>

<div class="card p-6 shadow mb-4 bg-primary-500 text-primary-contrast-500">
  <label for="dataset-select" class="label font-bold mb-2 block text-lg">
    <span>Choisir un Dataset :</span>
  </label>
  <select
    id="dataset-select"
    bind:value={$selectedDatasetId}
    class="select w-full mb-2 bg-surface-200-700 text-surface-900-50"
  >
    <option value={null}>-- Sélectionner --</option>
    {#each $availableDatasets as ds (ds.id)}
      <option value={ds.id}>{ds.name}</option>
    {/each}
  </select>
  <p class="text-sm opacity-70">
    Sélectionnez un dataset pour afficher les articles correspondants.
  </p>
</div> 