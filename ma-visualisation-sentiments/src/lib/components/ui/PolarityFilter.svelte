<script lang="ts">
  import { polarityFilter } from '$lib/stores.ts';

  const allPolarities = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];

  function handlePolarityChange(event: Event) {
      const target = event.target as HTMLInputElement;
      const polarity = target.value;
      const checked = target.checked;
      if (checked) {
          polarityFilter.update((current: string[]) => [...current, polarity]);
      } else {
          polarityFilter.update((current: string[]) => current.filter((p: string) => p !== polarity));
      }
  }
</script>

<div class="filter-group">
  <fieldset>
    <legend>Filtrer par Polarité :</legend>
    {#each allPolarities as p (p)}
      <label>
        <input type="checkbox" value={p} on:change={handlePolarityChange} checked={$polarityFilter.includes(p)} />
        {p}
      </label>
    {/each}
    <button on:click={() => polarityFilter.set([])}>Effacer sélection</button>
  </fieldset>
</div>

<style>
  .filter-group { margin-bottom: 15px; }
  fieldset { border: 1px solid #ccc; padding: 10px; }
  label { margin-right: 10px; display: inline-block; }
</style> 