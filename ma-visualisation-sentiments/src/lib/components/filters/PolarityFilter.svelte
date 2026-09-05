<!--
  PolarityFilter Component

  Filter for sentiment polarity values using reusable FilterCard and FilterChip
  components. The last chip is the "not annotated" bucket: a rating the model
  never produced, kept apart from "Non applicable", which is a rating.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { NOT_ANNOTATED } from '$lib/domain/sentimentContract';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// French values (stored in data) with their FilterChip variants
	const polarityOptions = [
		{ value: 'Très positif', variant: 'polarity-very-positive' as const },
		{ value: 'Positif', variant: 'polarity-positive' as const },
		{ value: 'Neutre', variant: 'polarity-neutral' as const },
		{ value: 'Négatif', variant: 'polarity-negative' as const },
		{ value: 'Très négatif', variant: 'polarity-very-negative' as const },
		{ value: 'Non applicable', variant: 'polarity-na' as const },
		{ value: NOT_ANNOTATED, variant: 'polarity-not-annotated' as const }
	];

	let selectedPolarities = $derived(filterState.polarities);

	// Get translated labels for display
	const translatedOptions = $derived(
		polarityOptions.map((option) => ({
			value: option.value, // Keep French value for data operations
			label: translateSentimentValue(option.value, $currentLanguage),
			variant: option.variant
		}))
	);

	function togglePolarity(polarity: string) {
		const updated = selectedPolarities.includes(polarity)
			? selectedPolarities.filter((p) => p !== polarity)
			: [...selectedPolarities, polarity];
		filterState.polarities = updated;
	}

	function clearSelection() {
		filterState.polarities = [];
	}
</script>

<FilterCard
	title={$t.filters.polarity}
	showClear={selectedPolarities.length > 0}
	onClear={clearSelection}
>
	{#snippet chips()}
		{#each translatedOptions as option (option.value)}
			<FilterChip
				label={option.label}
				selected={selectedPolarities.includes(option.value)}
				variant={option.variant}
				onclick={() => togglePolarity(option.value)}
			/>
		{/each}
	{/snippet}

	{#snippet footer()}
		<p class="bucket-note">{$t.filters.notAnnotatedNote}</p>
	{/snippet}
</FilterCard>

<style>
	.bucket-note {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		margin: 0;
	}

	/* Keyed on the rail's width, not the viewport's. */
	@container filter-rail (max-width: 300px) {
		.bucket-note {
			font-size: var(--font-size-eyebrow);
		}
	}
</style>
