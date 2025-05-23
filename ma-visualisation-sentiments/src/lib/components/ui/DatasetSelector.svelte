<!-- Composant DatasetSelector.svelte --> 
<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores.ts'; // Ajustez chemin
</script>

<div class="card variant-glass p-4 mb-6">
  <h3 class="h4 mb-3 text-white">Choisir un corpus :</h3>
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
  <p class="text-sm text-white opacity-80">
    Sélectionnez un corpus pour afficher les articles correspondants.
  </p>
</div>