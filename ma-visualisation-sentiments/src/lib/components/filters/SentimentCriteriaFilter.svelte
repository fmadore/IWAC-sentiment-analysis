<!--
  SentimentCriteriaFilter Component
  
  Combined filter for polarity and subjectivity using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// Polarity options with semantic FilterChip variants
	const polarityOptions = [
		{ value: 'Très positif', variant: 'polarity-very-positive' as const },
		{ value: 'Positif', variant: 'polarity-positive' as const },
		{ value: 'Neutre', variant: 'polarity-neutral' as const },
		{ value: 'Négatif', variant: 'polarity-negative' as const },
		{ value: 'Très négatif', variant: 'polarity-very-negative' as const },
		{ value: 'Non applicable', variant: 'polarity-na' as const }
	];

	// Get translated polarity options for display
	const translatedPolarityOptions = $derived(
		polarityOptions.map((option) => ({
			value: option.value,
			label: translateSentimentValue(option.value, $currentLanguage),
			variant: option.variant
		}))
	);

	// Subjectivity scores with semantic FilterChip variants
	const subjectivityScores = [
		{ value: 1, variant: 'subjectivity-1' as const },
		{ value: 2, variant: 'subjectivity-2' as const },
		{ value: 3, variant: 'subjectivity-3' as const },
		{ value: 4, variant: 'subjectivity-4' as const },
		{ value: 5, variant: 'subjectivity-5' as const }
	];

	let selectedPolarities = $derived(filterState.polarities);
	let selectedScores = $derived(filterState.subjectivities);

	function togglePolarity(polarity: string) {
		const updated = selectedPolarities.includes(polarity)
			? selectedPolarities.filter((p) => p !== polarity)
			: [...selectedPolarities, polarity];
		filterState.polarities = updated;
	}

	function toggleScore(score: number) {
		const scoreStr = score.toString();
		const updated = selectedScores.includes(scoreStr)
			? selectedScores.filter((s) => s !== scoreStr)
			: [...selectedScores, scoreStr];
		filterState.subjectivities = updated;
	}

	function clearPolarities() {
		filterState.polarities = [];
	}

	function clearScores() {
		filterState.subjectivities = [];
	}
</script>

<div class="sentiment-criteria-container">
	<!-- Polarity Filter -->
	<FilterCard
		title={$t.analysis.polaritySection}
		showClear={selectedPolarities.length > 0}
		onClear={clearPolarities}
	>
		{#snippet chips()}
			{#each translatedPolarityOptions as option (option.value)}
				<FilterChip
					label={option.label}
					selected={selectedPolarities.includes(option.value)}
					variant={option.variant}
					onclick={() => togglePolarity(option.value)}
				/>
			{/each}
		{/snippet}
	</FilterCard>

	<!-- Subjectivity Filter -->
	<FilterCard
		title={$t.filters.subjectivityScore}
		showClear={selectedScores.length > 0}
		onClear={clearScores}
	>
		{#snippet chips()}
			{#each subjectivityScores as score (score.value)}
				<FilterChip
					label={score.value.toString()}
					selected={selectedScores.includes(score.value.toString())}
					variant={score.variant}
					onclick={() => toggleScore(score.value)}
				/>
			{/each}
		{/snippet}
	</FilterCard>
</div>

<style>
	.sentiment-criteria-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	@media (max-width: 768px) {
		.sentiment-criteria-container {
			gap: var(--space-3);
		}
	}
</style>
