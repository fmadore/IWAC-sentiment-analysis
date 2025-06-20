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

<div class="card variant-glass p-4 hover-lift">
  <h3 class="h4 mb-4 text-white responsive-title">{$t.filters.country}</h3>
  
  <div class="flex flex-wrap gap-2">
    {#each translatedCountries as country}
      <button 
        class="chip hover-lift variant-soft-secondary {selectedCountries.includes(country.value) ? 'ring-2 ring-primary-500 hover-glow' : ''}" 
        onclick={() => toggleCountry(country.value)}
      >
        {country.label}
      </button>
    {/each}
  </div>

  {#if selectedCountries.length > 0}
    <button 
      class="btn btn-sm variant-soft-surface mt-3 hover-lift" 
      onclick={clearSelection}
    >
      {$t.filters.clearAll}
    </button>
  {/if}
</div>

<style>
  .chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all var(--transition-normal);
    white-space: nowrap;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    
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
  
  .chip::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    opacity: 0;
    transition: opacity var(--transition-normal);
  }
  
  .chip:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .chip:hover::before {
    opacity: 1;
  }
  
  .chip.hover-glow {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 
      var(--shadow-lg),
      0 0 20px rgba(59, 130, 246, 0.3);
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
</style> 