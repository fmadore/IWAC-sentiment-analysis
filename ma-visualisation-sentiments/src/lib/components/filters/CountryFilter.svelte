<!--
  CountryFilter Component
  
  This component provides hierarchical filtering where:
  1. Users first select countries of interest
  2. The JournalFilter automatically updates to show only journals from selected countries
  3. Other filters (polarity, subjectivity, centrality) work on the filtered dataset
  
  This creates a natural filtering flow: Country → Journal → Sentiment criteria
-->
<script lang="ts">
  import { currentDatasetArticles, countryFilters } from '$lib/stores';
  import { t, currentLanguage } from '$lib/i18n';
  import { FilterCard, FilterChip } from '$lib/components/common';
  import type { Article } from '$lib/types/data';

  // Country name translations
  const countryTranslations: Record<string, Record<string, string>> = {
    'Bénin': { 'fr': 'Bénin', 'en': 'Benin' },
    'Benin': { 'fr': 'Bénin', 'en': 'Benin' }
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

<FilterCard 
  title={$t.filters.country}
  showClear={selectedCountries.length > 0}
  onClear={clearSelection}
>
  {#snippet chips()}
    {#each translatedCountries as country (country.value)}
      <FilterChip 
        label={country.label}
        selected={selectedCountries.includes(country.value)}
        onclick={() => toggleCountry(country.value)}
      />
    {/each}
  {/snippet}
</FilterCard> 