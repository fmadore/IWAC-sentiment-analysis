<!--
  SubjectivityFilter Component
  
  Filter for subjectivity scores (1-5) using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { FilterCard, FilterChip } from '$lib/components/common';

	// Scores with corresponding FilterChip variants
	const scores = [
		{ value: 1, variant: 'subjectivity-1' as const },
		{ value: 2, variant: 'subjectivity-2' as const },
		{ value: 3, variant: 'subjectivity-3' as const },
		{ value: 4, variant: 'subjectivity-4' as const },
		{ value: 5, variant: 'subjectivity-5' as const }
	];

	let selectedScores = $derived(filterState.subjectivities);

	function toggleScore(score: number) {
		const scoreStr = score.toString();
		const updated = selectedScores.includes(scoreStr)
			? selectedScores.filter((s) => s !== scoreStr)
			: [...selectedScores, scoreStr];
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
		{#each scores as score (score.value)}
			<FilterChip
				label={score.value.toString()}
				selected={selectedScores.includes(score.value.toString())}
				variant={score.variant}
				onclick={() => toggleScore(score.value)}
			/>
		{/each}
	{/snippet}

	{#snippet footer()}
		<div class="legend">
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="1">1-2</span>
				<span class="legend-text">{$t.filters.ratherObjective}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="3">3</span>
				<span class="legend-text">{$t.filters.mixedSubjectivity}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge" data-subjectivity="5">4-5</span>
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
