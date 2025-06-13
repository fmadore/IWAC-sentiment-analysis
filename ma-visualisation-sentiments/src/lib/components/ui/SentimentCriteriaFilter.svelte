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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">Critères d'analyse des sentiments</h3>
  
  <div class="mb-4">
    <h4 class="h5 mb-2 text-white responsive-subtitle">Polarité</h4>
    <div class="flex flex-wrap gap-2">
      {#each polarityOptions as option}
        <button 
          class="chip {option.class} {selectedPolarities.includes(option.value) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
          onclick={() => togglePolarity(option.value)}
        >
          {option.value}
        </button>
      {/each}
    </div>
  </div>
  
  <div>
    <h4 class="h5 mb-2 text-white responsive-subtitle">Score de subjectivité</h4>
    <div class="flex flex-wrap gap-2">
      {#each [1, 2, 3, 4, 5] as score}
        <button 
          class="chip {score <= 2 ? 'variant-soft-success' : score <= 4 ? 'variant-soft-warning' : 'variant-soft-error'} {selectedScores.includes(score) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
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
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
    }
    
    @media (max-width: 480px) {
      padding: 0.15rem 0.5rem;
      font-size: 0.65rem;
    }
  }
  
  .chip:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  /* Responsive title adjustments */
  .responsive-title {
    @media (max-width: 768px) {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
  }
  
  /* Responsive subtitle adjustments */
  .responsive-subtitle {
    @media (max-width: 768px) {
      font-size: 0.9rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    @media (max-width: 480px) {
      font-size: 0.8rem !important;
      margin-bottom: 0.4rem !important;
    }
  }
</style>