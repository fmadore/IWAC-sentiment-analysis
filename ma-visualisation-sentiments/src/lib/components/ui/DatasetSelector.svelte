<!-- Composant DatasetSelector.svelte --> 
<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores.ts'; // Ajustez chemin
</script>

<div class="card card-enhanced glossy p-6 mb-6 bg-primary-500 text-primary-contrast-500">
  <h3 class="font-bold mb-3 text-xl">Choisir un corpus :</h3>
  <select
    id="dataset-select"
    bind:value={$selectedDatasetId}
    class="select w-full mb-3 bg-surface-200-700 text-surface-900-50 rounded-lg border border-primary-300"
  >
    <option value={null}>-- Sélectionner --</option>
    {#each $availableDatasets as ds (ds.id)}
      <option value={ds.id}>{ds.name}</option>
    {/each}
  </select>
  <p class="text-sm opacity-80">
    Sélectionnez un corpus pour afficher les articles correspondants.
  </p>
</div> 