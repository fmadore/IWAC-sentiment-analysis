<!-- Composant SentimentCriteriaFilter.svelte --> 
<script lang="ts">
  import { polarityFilter, subjectivityFilterRange } from '$lib/stores'; // Ajustez chemin

  const allPolarities = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  // Pour le score de subjectivité, un simple input range ou deux inputs number
  let minSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[0] : 1;
  let maxSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[1] : 5;

  function updateSubjectivity() {
      subjectivityFilterRange.set([minSubjectivity, maxSubjectivity]);
  }

  // Gérer la sélection des polarités avec des checkboxes
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

<div class="filter-group">
  <fieldset>
    <legend>Filtrer par Score de Subjectivité (1-5) :</legend>
    <label>Min: <input type="number" min="1" max="5" bind:value={minSubjectivity} on:input={updateSubjectivity} /></label>
    <label>Max: <input type="number" min="1" max="5" bind:value={maxSubjectivity} on:input={updateSubjectivity} /></label>
    <button on:click={() => subjectivityFilterRange.set([1,5])}>Réinitialiser</button>
  </fieldset>
</div>
<style>
  .filter-group { margin-bottom: 15px; }
  fieldset { border: 1px solid #ccc; padding: 10px; }
  label { margin-right: 10px; display: inline-block; }
</style> 