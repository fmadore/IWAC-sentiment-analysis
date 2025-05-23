<!-- Composant SentimentCriteriaFilter.svelte --> 
<script lang="ts">
  import { polarityFilters, subjectivityFilters } from '$lib/stores.ts';

  // Polarité options
  const polarityOptions = [
    { value: 'Très positif', class: 'variant-filled-success' },
    { value: 'Positif', class: 'variant-soft-success' },
    { value: 'Neutre', class: 'variant-soft-primary' },
    { value: 'Négatif', class: 'variant-soft-error' },
    { value: 'Très négatif', class: 'variant-filled-error' },
    { value: 'Non applicable', class: 'variant-ghost' }
  ];

  let selectedPolarities = $state<string[]>([]);
  let selectedScores = $state<number[]>([]);
  
  // Mettre à jour les stores quand la sélection change
  function updatePolaritySelection() {
    polarityFilters.set(selectedPolarities);
  }
  
  function updateSubjectivitySelection() {
    subjectivityFilters.set(selectedScores);
  }
  
  function togglePolarity(polarity: string) {
    if (selectedPolarities.includes(polarity)) {
      selectedPolarities = selectedPolarities.filter(p => p !== polarity);
    } else {
      selectedPolarities = [...selectedPolarities, polarity];
    }
    updatePolaritySelection();
  }

  function toggleScore(score: number) {
    if (selectedScores.includes(score)) {
      selectedScores = selectedScores.filter(s => s !== score);
    } else {
      selectedScores = [...selectedScores, score];
    }
    updateSubjectivitySelection();
  }
</script>

<div class="card p-4">
  <h3 class="h4 mb-4">Critères d'analyse des sentiments</h3>
  
  <div class="mb-4">
    <h4 class="h5 mb-2">Polarité</h4>
    <div class="flex flex-wrap gap-2">
      {#each polarityOptions as option}
        <button 
          class="chip {option.class} {selectedPolarities.includes(option.value) ? 'ring-2 ring-primary-500' : ''}" 
          onclick={() => togglePolarity(option.value)}
        >
          {option.value}
        </button>
      {/each}
    </div>
  </div>
  
  <div>
    <h4 class="h5 mb-2">Score de subjectivité</h4>
    <div class="flex flex-wrap gap-2">
      {#each [1, 2, 3, 4, 5] as score}
        <button 
          class="chip {score <= 2 ? 'variant-soft-success' : score <= 4 ? 'variant-soft-warning' : 'variant-soft-error'} {selectedScores.includes(score) ? 'ring-2 ring-primary-500' : ''}" 
          onclick={() => toggleScore(score)}
        >
          {score}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chip:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
</style>