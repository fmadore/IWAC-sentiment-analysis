<script lang="ts">
  import { polarityFilter } from '$lib/stores.ts';

  export let class_name = '';

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

<div class="card card-enhanced glossy p-6 space-y-4 {class_name} bg-primary-500 text-primary-contrast-500">
  <fieldset class="space-y-3">
    <legend class="font-bold text-xl">Filtrer par Polarité :</legend>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {#each allPolarities as p (p)}
        <label class="flex items-center space-x-2 cursor-pointer bg-primary-400/20 p-2 rounded-lg backdrop-blur-sm border border-primary-300/30 transition-all hover:bg-primary-400/30">
          <input type="checkbox" value={p} on:change={handlePolarityChange} checked={$polarityFilter.includes(p)} class="checkbox" />
          <span>{p}</span>
        </label>
      {/each}
    </div>
    <button type="button" class="btn btn-sm btn-enhanced bg-surface-300-600 hover:bg-surface-400-500 mt-3" on:click={() => polarityFilter.set([])}>
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