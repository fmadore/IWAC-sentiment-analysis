<!-- Composant DatasetSelector.svelte --> 
<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores'; // Ajustez chemin
</script>

<div class="filter-group">
  <label for="dataset-select">Choisir un Dataset :</label>
  <select id="dataset-select" bind:value={$selectedDatasetId}>
    <option value={null}>-- Sélectionner --</option>
    {#each $availableDatasets as ds (ds.id)}
      <option value={ds.id}>{ds.name}</option>
    {/each}
  </select>
</div> 