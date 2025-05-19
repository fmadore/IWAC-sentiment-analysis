<script lang="ts">
  import { subjectivityFilterRange } from '$lib/stores.ts';

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

<div class="filter-group">
  <fieldset>
    <legend>Filtrer par Score de Subjectivité (1-5) :</legend>
    <label>Min: <input type="number" min="1" max="5" bind:value={minSubjectivity} on:input={updateSubjectivityStore} on:change={updateSubjectivityStore} /></label>
    <label>Max: <input type="number" min="1" max="5" bind:value={maxSubjectivity} on:input={updateSubjectivityStore} on:change={updateSubjectivityStore} /></label>
    <button on:click={resetSubjectivity}>Réinitialiser</button>
  </fieldset>
</div>

<style>
  .filter-group { margin-bottom: 15px; }
  fieldset { border: 1px solid #ccc; padding: 10px; }
  label { margin-right: 10px; display: inline-block; }
</style> 