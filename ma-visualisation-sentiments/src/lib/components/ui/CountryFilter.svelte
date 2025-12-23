<!--
  CountryFilter Component
  
  This component provides hierarchical filtering where:
  1. Users first select countries of interest
  2. The JournalFilter automatically updates to show only journals from selected countries
  3. Other filters (polarity, subjectivity, centrality) work on the filtered dataset
  
  This creates a natural filtering flow: Country → Journal → Sentiment criteria
-->
<script lang="ts">
  import { currentDatasetArticles, countryFilters } from '$lib/stores.ts';
  import { t, currentLanguage } from '$lib/i18n';
  import type { Article } from '$lib/types/data';

  // Country name translations
  const countryTranslations: Record<string, Record<string, string>> = {
    'Bénin': {
      'fr': 'Bénin',
      'en': 'Benin'
    },
    'Benin': {
      'fr': 'Bénin', 
      'en': 'Benin'
    }
  };

  // Function to translate country name
  function translateCountryName(country: string): string {
    const translation = countryTranslations[country];
    if (translation) {
      return translation[$currentLanguage] || country;
    }
    return country;
  }

  // Variables locales
  let selectedCountries = $state<string[]>([]);
  let countries = $derived([...new Set(
    ($currentDatasetArticles as Article[]).map(article => article.Country)
                                       .filter((country): country is string => !!country)
  )].sort((a, b) => a.localeCompare(b)));

  // Sync local state with store values
  $effect(() => {
    selectedCountries = $countryFilters;
  });

  // Get countries with translated labels for display
  const translatedCountries = $derived(
    countries.map(country => ({
      value: country, // Keep original value for data operations
      label: translateCountryName(country) // Translated label for display
    }))
  );

  // Fonction pour appliquer le filtre
  function applyFilter() {
    countryFilters.set(selectedCountries);
  }

  function toggleCountry(country: string) {
    if (selectedCountries.includes(country)) {
      selectedCountries = selectedCountries.filter(c => c !== country);
    } else {
      selectedCountries = [...selectedCountries, country];
    }
    applyFilter();
  }

  function clearSelection() {
    selectedCountries = [];
    applyFilter();
  }
</script>

<div class="filter-card">
  <h3 class="filter-title">{$t.filters.country}</h3>
  
  <div class="filter-chips">
    {#each translatedCountries as country}
      <button 
        class="filter-chip" 
        data-selected={selectedCountries.includes(country.value)}
        onclick={() => toggleCountry(country.value)}
        aria-pressed={selectedCountries.includes(country.value)}
      >
        {country.label}
      </button>
    {/each}
  </div>

  {#if selectedCountries.length > 0}
    <button 
      class="clear-btn" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
  {/if}
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
    margin: 0 0 0.875rem 0;
    letter-spacing: -0.01em;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
  }

  .clear-btn:hover {
    background: color-mix(in oklab, var(--color-error-500) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-error-500) 30%, transparent);
    color: var(--color-error-400);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .filter-card {
      padding: 0.875rem;
    }

    .filter-title {
      font-size: 0.875rem;
      margin-bottom: 0.625rem;
    }
  }

  @media (max-width: 480px) {
    .filter-card {
      padding: 0.75rem;
    }

    .filter-title {
      font-size: 0.8125rem;
    }

    .clear-btn {
      font-size: 0.6875rem;
      padding: 0.3125rem 0.625rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .filter-card,
    .clear-btn {
      transition: none;
    }
  }
</style> 