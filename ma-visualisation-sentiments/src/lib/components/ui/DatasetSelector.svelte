<!-- Composant DatasetSelector.svelte --> 
<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores.ts'; // Ajustez chemin
</script>

<div class="card p-4 mb-4 max-w-md mx-auto">
  <label for="dataset-select" class="font-bold mb-2 block text-lg">
    Choisir un Dataset :
  </label>
  <select
    id="dataset-select"
    bind:value={$selectedDatasetId}
    class="select w-full mb-2"
  >
    <option value={null}>-- Sélectionner --</option>
    {#each $availableDatasets as ds (ds.id)}
      <option value={ds.id}>{ds.name}</option>
    {/each}
  </select>
  <p class="text-xs text-neutral-500">
    Sélectionnez un dataset pour afficher les articles correspondants.
  </p>
</div> 