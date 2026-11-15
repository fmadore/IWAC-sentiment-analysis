<!--
  CountryFilter Component
  
  This component provides hierarchical filtering where:
  1. Users first select countries of interest
  2. The JournalFilter automatically updates to show only journals from selected countries
  3. Other filters (polarity, subjectivity, centrality) work on the filtered dataset
  
  This creates a natural filtering flow: Country → Journal → Sentiment criteria
-->
<script lang="ts">
	import { articleState, datasetState, filterState } from '#lib/stores/index.js';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import FilterCard from '#lib/components/common/FilterCard.svelte';
	import FilterChip from '#lib/components/common/FilterChip.svelte';

	// Country name translations
	const countryTranslations: Record<string, Record<string, string>> = {
		Bénin: { fr: 'Bénin', en: 'Benin' },
		Benin: { fr: 'Bénin', en: 'Benin' }
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
	let selectedCountries = $derived(filterState.countries);
	// Every dataset is joined to the same article base, so while the selected
	// one is still loading any loaded dataset lists the same countries.
	let sourceArticles = $derived(
		articleState.datasets[datasetState.selected] ??
			Object.values(articleState.datasets).find((articles) => articles.length > 0) ??
			[]
	);
	let countries = $derived(
		[
			...new Set(
				sourceArticles
					.map((article) => article.Country)
					.filter((country): country is string => !!country)
			)
		].sort((a, b) => a.localeCompare(b))
	);

	// Get countries with translated labels for display
	const translatedCountries = $derived(
		countries.map((country) => ({
			value: country, // Keep original value for data operations
			label: translateCountryName(country) // Translated label for display
		}))
	);

	function toggleCountry(country: string) {
		const updated = selectedCountries.includes(country)
			? selectedCountries.filter((c) => c !== country)
			: [...selectedCountries, country];
		filterState.countries = updated;
	}

	function clearSelection() {
		filterState.countries = [];
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
