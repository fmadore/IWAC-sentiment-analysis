<script lang="ts">
  import { subjectivityFilterRange } from '$lib/stores.ts';

  export let class_name = '';

  // Initialize local reactive variables from the store for binding.
  let minSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[0] : 1;
  let maxSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[1] : 5;

  // Subscribe to store changes to update local variables if store is changed externally.
  subjectivityFilterRange.subscribe(value => {
    if (value) {
      minSubjectivity = value[0];
      maxSubjectivity = value[1];
    } else {
      minSubjectivity = 1;
      maxSubjectivity = 5;
    }
  });

  function updateSubjectivityStore() {
    const newMin = Number(minSubjectivity);
    const newMax = Number(maxSubjectivity);
    if (newMin <= newMax) {
      subjectivityFilterRange.set([newMin, newMax]);
    } else {
      // If range is invalid (e.g. min > max), an option is to set max to min
      subjectivityFilterRange.set([newMin, newMin]);
    }
  }

  function resetSubjectivity() {
    subjectivityFilterRange.set([1, 5]);
  }
</script>

<div class="card card-enhanced glossy p-6 space-y-4 {class_name} bg-primary-500 text-primary-contrast-500">
  <fieldset class="space-y-3">
    <legend class="font-bold text-xl">Filtrer par Score de Subjectivité (1-5) :</legend>
    <div class="flex flex-col sm:flex-row sm:items-center gap-4 mt-3">
      <div class="bg-primary-400/20 p-3 rounded-lg backdrop-blur-sm border border-primary-300/30">
        <label class="label block">
          <span class="block mb-1">Min:</span>
          <input type="number" min="1" max="5" bind:value={minSubjectivity} on:input={updateSubjectivityStore} on:change={updateSubjectivityStore} class="input w-full rounded-lg bg-surface-200-700 text-surface-900-50 border border-primary-300" />
        </label>
      </div>
      <div class="bg-primary-400/20 p-3 rounded-lg backdrop-blur-sm border border-primary-300/30">
        <label class="label block">
          <span class="block mb-1">Max:</span>
          <input type="number" min="1" max="5" bind:value={maxSubjectivity} on:input={updateSubjectivityStore} on:change={updateSubjectivityStore} class="input w-full rounded-lg bg-surface-200-700 text-surface-900-50 border border-primary-300" />
        </label>
      </div>
    </div>
    <button type="button" class="btn btn-sm btn-enhanced bg-surface-300-600 hover:bg-surface-400-500 mt-3" on:click={resetSubjectivity}>
      Réinitialiser
    </button>
  </fieldset>
</div>

<style>
  /* Removed previous styles as card and utility classes handle them */
  /* .filter-group { margin-bottom: 15px; } */
  /* fieldset { border: 1px solid #ccc; padding: 10px; } */
  /* label { margin-right: 10px; display: inline-block; } */
</style> 