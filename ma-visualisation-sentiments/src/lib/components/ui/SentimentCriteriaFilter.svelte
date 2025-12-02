<!-- Composant SentimentCriteriaFilter.svelte --> 
<script lang="ts">
  import { polarityFilters, subjectivityFilters } from '$lib/stores.ts';
  import { t, currentLanguage } from '$lib/i18n';
  import { translateSentimentValue } from '$lib/i18n/utils';

  // Polarity options with semantic CSS class names from app.postcss
  const polarityOptions = [
    { value: 'Très positif', cssClass: 'polarity-very-positive' },
    { value: 'Positif', cssClass: 'polarity-positive' },
    { value: 'Neutre', cssClass: 'polarity-neutral' },
    { value: 'Négatif', cssClass: 'polarity-negative' },
    { value: 'Très négatif', cssClass: 'polarity-very-negative' },
    { value: 'Non applicable', cssClass: 'polarity-na' }
  ];

  // Get translated polarity options for display
  const translatedPolarityOptions = $derived(
    polarityOptions.map(option => ({
      value: option.value,
      label: translateSentimentValue(option.value, $currentLanguage),
      cssClass: option.cssClass
    }))
  );

  // Subjectivity scores with semantic CSS class names
  const subjectivityScores = [
    { value: 1, cssClass: 'subjectivity-1' },
    { value: 2, cssClass: 'subjectivity-2' },
    { value: 3, cssClass: 'subjectivity-3' },
    { value: 4, cssClass: 'subjectivity-4' },
    { value: 5, cssClass: 'subjectivity-5' }
  ];

  let selectedPolarities = $state<string[]>([]);
  let selectedScores = $state<string[]>([]);
  
  // Sync local state with store values
  $effect(() => {
    selectedPolarities = $polarityFilters;
  });
  
  $effect(() => {
    selectedScores = $subjectivityFilters;
  });
  
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
    const scoreStr = score.toString();
    if (selectedScores.includes(scoreStr)) {
      selectedScores = selectedScores.filter(s => s !== scoreStr);
    } else {
      selectedScores = [...selectedScores, scoreStr];
    }
    updateSubjectivitySelection();
  }
</script>

<div class="filter-card">
  <h3 class="filter-title">{$t.filters.sentimentCriteria}</h3>
  
  <div class="filter-section">
    <h4 class="filter-subtitle">{$t.analysis.polaritySection}</h4>
    <div class="filter-chips">
      {#each translatedPolarityOptions as option}
        <button 
          class="filter-chip {option.cssClass}" 
          data-selected={selectedPolarities.includes(option.value)}
          onclick={() => togglePolarity(option.value)}
          aria-pressed={selectedPolarities.includes(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
  
  <div class="filter-section">
    <h4 class="filter-subtitle">{$t.filters.subjectivityScore}</h4>
    <div class="filter-chips">
      {#each subjectivityScores as score}
        <button 
          class="filter-chip {score.cssClass}" 
          data-selected={selectedScores.includes(score.value.toString())}
          onclick={() => toggleScore(score.value)}
          aria-pressed={selectedScores.includes(score.value.toString())}
        >
          {score.value}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .filter-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 0.875rem;
    padding: 1rem;
    box-shadow: 
      0 4px 16px color-mix(in oklab, black 8%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
    transition: all var(--timing-normal) var(--easing-default);
  }

  .filter-card:hover {
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
  }

  .filter-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0 0 1rem 0;
    letter-spacing: -0.01em;
  }

  .filter-section {
    margin-bottom: 1rem;
  }

  .filter-section:last-child {
    margin-bottom: 0;
  }

  .filter-subtitle {
    font-size: 0.8125rem;
    font-weight: 500;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    margin: 0 0 0.5rem 0;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    .filter-card {
      padding: 0.875rem;
    }

    .filter-title {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .filter-subtitle {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .filter-card {
      padding: 0.75rem;
    }

    .filter-title {
      font-size: 0.8125rem;
    }

    .filter-subtitle {
      font-size: 0.6875rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .filter-card {
      transition: none;
    }
  }
</style>