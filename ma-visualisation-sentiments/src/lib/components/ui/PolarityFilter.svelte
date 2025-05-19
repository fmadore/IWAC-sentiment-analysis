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

<div class="card preset-surface p-6 shadow space-y-4">
  <fieldset class="space-y-2">
    <legend class="h6">Filtrer par Polarité :</legend>
    {#each allPolarities as p (p)}
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" value={p} on:change={handlePolarityChange} checked={$polarityFilter.includes(p)} class="checkbox" />
        <span>{p}</span>
      </label>
    {/each}
    <button type="button" class="btn btn-sm preset-tonal-surface mt-2" on:click={() => polarityFilter.set([])}>
      Effacer sélection
    </button>
  </fieldset>
</div>

<style>
  /* Removed previous styles as card and utility classes handle them */
  /* .filter-group { margin-bottom: 15px; } */
  /* fieldset { border: 1px solid #ccc; padding: 10px; } */
  /* label { margin-right: 10px; display: inline-block; } */
</style> 