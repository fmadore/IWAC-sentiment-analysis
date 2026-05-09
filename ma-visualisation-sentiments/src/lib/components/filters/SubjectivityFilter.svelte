<!--
  SubjectivityFilter Component
  
  Filter for subjectivity scores (1-5) using reusable FilterCard and FilterChip components.
-->
<script lang="ts">
	import { subjectivityFilters } from '$lib/stores';
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

	let selectedScores = $derived($subjectivityFilters);

	function toggleScore(score: number) {
		const scoreStr = score.toString();
		const updated = selectedScores.includes(scoreStr)
			? selectedScores.filter((s) => s !== scoreStr)
			: [...selectedScores, scoreStr];
		subjectivityFilters.set(updated);
	}

	function clearSelection() {
		subjectivityFilters.set([]);
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
				<span class="legend-badge subjectivity-1">1-2</span>
				<span class="legend-text">{$t.filters.ratherObjective}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge subjectivity-3">3</span>
				<span class="legend-text">{$t.filters.mixedSubjectivity}</span>
			</div>
			<div class="legend-item">
				<span class="legend-badge subjectivity-5">4-5</span>
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
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-sm);
	}

	.legend-badge.subjectivity-1 {
		background: var(--sentiment-subjectivity-1-bg);
		border: 1px solid var(--sentiment-subjectivity-1-border);
		color: var(--sentiment-subjectivity-1);
	}

	.legend-badge.subjectivity-3 {
		background: var(--sentiment-subjectivity-3-bg);
		border: 1px solid var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.legend-badge.subjectivity-5 {
		background: var(--sentiment-subjectivity-5-bg);
		border: 1px solid var(--sentiment-subjectivity-5-border);
		color: var(--sentiment-subjectivity-5);
	}

	.legend-text {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.legend-badge {
			font-size: var(--font-size-2xs);
			padding: var(--space-0-5) var(--space-1-5);
		}
		.legend-text {
			font-size: var(--font-size-2xs);
		}
	}
</style>
