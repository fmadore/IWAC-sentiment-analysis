<!--
  DiscrepancyFilter Component

  Comparison-view filter for model discrepancies: difference range slider,
  quick filters, dimension selection, and non-applicable exclusion.
  Built on the shared FilterCard/FilterChip design-system components plus
  the RangeSlider, ToggleSwitch, and InfoTooltip widgets.
-->
<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { FilterCard, FilterChip } from '$lib/components/common';
	import RangeSlider from '$lib/components/common/RangeSlider.svelte';
	import ToggleSwitch from '$lib/components/common/ToggleSwitch.svelte';
	import InfoTooltip from '$lib/components/common/InfoTooltip.svelte';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import SlidersIcon from '@lucide/svelte/icons/sliders';

	type Dimension = 'polarity' | 'subjectivity' | 'centrality';

	let minDiff = $state(0);
	let maxDiff = $state(5);
	let selectedDimensions = $state<string[]>(['polarity', 'subjectivity', 'centrality']);
	let excludeNonApplicable = $state(true);

	// Sync with store
	$effect(() => {
		const filters = filterState.discrepancy;
		minDiff = filters.minDifference;
		maxDiff = filters.maxDifference;
		selectedDimensions = [...filters.dimensions];
		excludeNonApplicable = filters.excludeNonApplicable;
	});

	function updateFilters() {
		filterState.discrepancy = {
			minDifference: minDiff,
			maxDifference: maxDiff,
			dimensions: selectedDimensions as Dimension[],
			excludeNonApplicable: excludeNonApplicable
		};
	}

	function setRange(min: number, max: number) {
		minDiff = min;
		maxDiff = max;
		updateFilters();
	}

	function toggleDimension(dimension: string) {
		if (selectedDimensions.includes(dimension)) {
			selectedDimensions = selectedDimensions.filter((d) => d !== dimension);
		} else {
			selectedDimensions = [...selectedDimensions, dimension];
		}
		updateFilters();
	}

	function resetFilters() {
		minDiff = 0;
		maxDiff = 5;
		selectedDimensions = ['polarity', 'subjectivity', 'centrality'];
		excludeNonApplicable = true;
		updateFilters();
	}

	// Quick range presets and dimension chips ($derived so labels track language)
	let quickFilters = $derived([
		{ label: `1 ${$t.comparison?.pointDifference || 'point difference'}`, min: 1, max: 1 },
		{ label: `2 ${$t.comparison?.pointsDifference || 'points difference'}`, min: 2, max: 2 },
		{ label: `3+ ${$t.comparison?.pointsDifference || 'points difference'}`, min: 3, max: 5 },
		{ label: $t.common?.all || 'All', min: 0, max: 5, variant: 'warning' as const }
	]);
	let dimensionChips = $derived([
		{ value: 'polarity', label: $t.analysis?.polaritySection || 'Polarity' },
		{ value: 'subjectivity', label: $t.analysis?.subjectivitySection || 'Subjectivity' },
		{ value: 'centrality', label: $t.analysis?.centralitySection || 'Centrality' }
	]);
</script>

<FilterCard
	title={$t.comparison?.filterByDiscrepancy || 'Filter by Discrepancy'}
	class="comparison-filter-card"
>
	{#snippet header()}
		<span class="filter-icon-container">
			<FilterIcon size={20} />
		</span>
	{/snippet}

	{#snippet beforeChips()}
		<!-- Difference Range -->
		<div class="filter-section">
			<div class="section-header">
				<span class="section-label">
					<SlidersIcon size={16} />
					{$t.comparison?.differenceRange || 'Difference Range'}: {minDiff} - {maxDiff}
				</span>
				<button class="reset-btn" type="button" onclick={resetFilters}>
					{$t.filters?.reset || 'Reset'}
				</button>
			</div>

			<RangeSlider
				min={0}
				max={5}
				step={1}
				lowValue={minDiff}
				highValue={maxDiff}
				onInput={(low, high) => {
					minDiff = low;
					maxDiff = high;
				}}
				onChange={(low, high) => {
					minDiff = low;
					maxDiff = high;
					updateFilters();
				}}
				lowAriaLabel={$t.comparison?.differenceRange || 'Difference Range'}
				highAriaLabel={$t.comparison?.differenceRange || 'Difference Range'}
			/>
		</div>

		<!-- Quick Filters -->
		<span class="section-subtitle block-label"
			>{$t.comparison?.quickFilters || 'Quick Filters'}:</span
		>
	{/snippet}

	{#snippet chips()}
		{#each quickFilters as preset (preset.min + '-' + preset.max)}
			<FilterChip
				label={preset.label}
				selected={minDiff === preset.min && maxDiff === preset.max}
				variant={preset.variant ?? 'comparison'}
				onclick={() => setRange(preset.min, preset.max)}
			/>
		{/each}
	{/snippet}

	{#snippet footer()}
		<!-- Dimension Filters -->
		<div class="filter-section">
			<div class="section-header-inline">
				<span class="section-subtitle">
					{$t.comparison?.compareDimensions || 'Compare Dimensions'}:
				</span>
				<InfoTooltip
					ariaLabel={$t.comparison?.dimensionsExplanation ||
						'Select which dimensions to analyze for disagreements between models:'}
				>
					<p class="tooltip-text">
						{$t.comparison?.dimensionsExplanation ||
							'Select which dimensions to analyze for disagreements between models:'}
					</p>
					<ul class="tooltip-list">
						<li>
							<strong>{$t.analysis?.polaritySection || 'Polarity'}:</strong>
							{$t.comparison?.polarityExplanation || 'Positive/Negative sentiment differences'}
						</li>
						<li>
							<strong>{$t.analysis?.subjectivitySection || 'Subjectivity'}:</strong>
							{$t.comparison?.subjectivityExplanation ||
								'Objectivity vs. opinion differences (1-5 scale)'}
						</li>
						<li>
							<strong>{$t.analysis?.centralitySection || 'Centrality'}:</strong>
							{$t.comparison?.centralityExplanation ||
								'How central Islam/Muslims are to the article'}
						</li>
					</ul>
					<p class="tooltip-note">
						{$t.comparison?.dimensionsNote ||
							'Tip: Select only one dimension to focus your analysis on specific types of disagreements. Discrepancy scores will be recalculated based on your selection.'}
					</p>
				</InfoTooltip>
			</div>
			<div class="chips-row">
				{#each dimensionChips as dimension (dimension.value)}
					<FilterChip
						label={dimension.label}
						selected={selectedDimensions.includes(dimension.value)}
						variant="comparison"
						onclick={() => toggleDimension(dimension.value)}
					/>
				{/each}
			</div>
		</div>

		<!-- Non-Applicable Filter -->
		<div class="filter-section">
			<div class="toggle-row">
				<span class="section-subtitle">
					{$t.comparison?.excludeNonApplicable || 'Exclude "Non Applicable" Articles'}:
				</span>
				<ToggleSwitch
					checked={excludeNonApplicable}
					onChange={(value) => {
						excludeNonApplicable = value;
						updateFilters();
					}}
					ariaLabel="Toggle exclude non-applicable articles"
				/>
			</div>
			<p class="helper-text">
				{$t.comparison?.excludeNonApplicableDescription ||
					'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.'}
			</p>
		</div>
	{/snippet}
</FilterCard>

<style>
	/* Comparison accent on the shared card title (matches the previous
	   hand-rolled header). Scoped via the unique class passed to FilterCard. */
	:global(.filter-card.comparison-filter-card .filter-title) {
		color: var(--sentiment-comparison-light);
	}

	.filter-icon-container {
		/* Render the icon before the title inside FilterCard's flex header */
		order: -1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: var(--radius-panel);
		background: var(--sentiment-comparison-bg);
		border: 1px solid var(--sentiment-comparison-border);
	}

	.filter-icon-container :global(svg) {
		color: var(--sentiment-comparison-light);
	}

	.filter-section {
		margin-bottom: var(--space-5);
	}

	.filter-section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.section-header-inline {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-base);
		color: var(--text-secondary);
	}

	.section-subtitle {
		font-size: var(--font-size-base);
		color: var(--text-muted);
	}

	.block-label {
		display: block;
		margin-bottom: var(--space-2);
	}

	.reset-btn {
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-panel);
		cursor: pointer;
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.reset-btn:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.chips-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.helper-text {
		font-size: var(--font-size-xs);
		color: var(--text-subtle);
		margin: var(--space-1) 0 0 0;
	}

	/* Tooltip content (rendered inside InfoTooltip via snippet, so it keeps
	   this component's scope) */
	.tooltip-text {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		margin: 0 0 var(--space-2) 0;
	}

	.tooltip-list {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	.tooltip-list li {
		margin-bottom: var(--space-1);
	}

	.tooltip-list strong {
		color: var(--color-primary-400);
	}

	.tooltip-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin: var(--space-2) 0 0 0;
		font-style: italic;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.reset-btn {
			transition: none;
		}
	}
</style>
