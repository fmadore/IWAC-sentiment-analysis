<!--
  SubjectivityFilter Component
  
  Filter for subjectivity scores (1-5) using reusable FilterCard and FilterChip
  components, plus the "not annotated" bucket for a score the model never gave.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue } from '$lib/i18n/utils';
	import { NOT_ANNOTATED } from '$lib/domain/sentimentContract';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// Filter values (the score as a string, as the store and URL carry it)
	// with corresponding FilterChip variants
	const scores = [
		{ value: '1', variant: 'subjectivity-1' as const },
		{ value: '2', variant: 'subjectivity-2' as const },
		{ value: '3', variant: 'subjectivity-3' as const },
		{ value: '4', variant: 'subjectivity-4' as const },
		{ value: '5', variant: 'subjectivity-5' as const }
	];

	let selectedScores = $derived(filterState.subjectivities);

	const options = $derived([
		...scores.map((score) => ({ ...score, label: score.value })),
		{
			value: NOT_ANNOTATED,
			variant: 'subjectivity-not-annotated' as const,
			label: translateSentimentValue(NOT_ANNOTATED, $currentLanguage)
		}
	]);

	function toggleScore(value: string) {
		const updated = selectedScores.includes(value)
			? selectedScores.filter((s) => s !== value)
			: [...selectedScores, value];
		filterState.subjectivities = updated;
	}

	function clearSelection() {
		filterState.subjectivities = [];
	}
</script>

<FilterCard
	title={$t.filters.subjectivityScore}
	showClear={selectedScores.length > 0}
	onClear={clearSelection}
>
	{#snippet chips()}
		{#each options as option (option.value)}
			<FilterChip
				label={option.label}
				selected={selectedScores.includes(option.value)}
				variant={option.variant}
				onclick={() => toggleScore(option.value)}
			/>
		{/each}
	{/snippet}

	{#snippet footer()}
		<div class="legend">
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="1">1–2</span>
				<span class="legend-text">{$t.filters.ratherObjective}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="3">3</span>
				<span class="legend-text">{$t.filters.mixedSubjectivity}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="5">4–5</span>
				<span class="legend-text">{$t.filters.ratherVerySubjective}</span>
			</div>
		</div>
	{/snippet}
</FilterCard>

<style>
	.legend {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.legend-badge {
		padding: var(--space-0-5) var(--space-2);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-hairline);

		/* Colours resolved by app.css from each badge's data-subjectivity. */
		background: var(--sentiment-bg);
		border: 1px solid var(--sentiment-border);
		color: var(--sentiment-fg);
	}

	.legend-text {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Keyed on the rail's width, not the viewport's — this control only ever
	   renders inside the filter rail. */
	@container filter-rail (max-width: 300px) {
		.legend-badge {
			font-size: var(--font-size-eyebrow);
			padding: var(--space-0-5) var(--space-1-5);
		}

		.legend-text {
			font-size: var(--font-size-eyebrow);
		}
	}
</style>
