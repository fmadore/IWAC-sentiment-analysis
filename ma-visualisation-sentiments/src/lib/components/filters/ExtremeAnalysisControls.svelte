<!--
  ExtremeAnalysisControls Component

  Controls for the extreme-analysis view: category select, keyword-type
  toggle, and keyword count. Built on the shared FilterCard design-system
  component with an extreme-accent top border.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import type { ExtremeCategory, KeywordType } from '$lib/types/extremeAnalysis';
	import { FilterCard } from '$lib/components/common';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

	// Props
	interface Props {
		selectedCategory: ExtremeCategory;
		selectedKeywordType: KeywordType;
		showTopN: number;
		onCategoryChange: (category: ExtremeCategory) => void;
		onKeywordTypeChange: (type: KeywordType) => void;
		onTopNChange: (value: number) => void;
	}

	let {
		selectedCategory,
		selectedKeywordType,
		showTopN,
		onCategoryChange,
		onKeywordTypeChange,
		onTopNChange
	}: Props = $props();

	// Handle category change
	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onCategoryChange(target.value as ExtremeCategory);
	}

	// Handle keyword type change
	function handleKeywordTypeChange(type: KeywordType) {
		onKeywordTypeChange(type);
	}

	// Handle number change
	function handleTopNChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onTopNChange(parseInt(target.value, 10));
	}
</script>

<FilterCard title={$t.extremeAnalysis.analysisControls} class="extreme-controls-card">
	{#snippet header()}
		<span class="extreme-controls-icon">
			<SlidersHorizontalIcon size={18} class="text-orange-400" />
		</span>
	{/snippet}

	{#snippet chips()}
		<div class="controls-grid">
			<!-- Category Select -->
			<div class="control-group">
				<label for="category-select" class="control-label">
					{$t.extremeAnalysis.selectCategory}
				</label>
				<select
					id="category-select"
					bind:value={selectedCategory}
					onchange={handleCategoryChange}
					class="select-input"
				>
					<option value="subjectivity_extreme_high">
						{$t.extremeAnalysis.categories.subjectivityHigh}
					</option>
					<option value="subjectivity_extreme_low">
						{$t.extremeAnalysis.categories.subjectivityLow}
					</option>
					<option value="polarity_very_negative">
						{$t.extremeAnalysis.categories.polarityNegative}
					</option>
					<option value="polarity_very_positive">
						{$t.extremeAnalysis.categories.polarityPositive}
					</option>
					<option value="centrality_very_central">
						{$t.extremeAnalysis.categories.centralityHigh}
					</option>
					<option value="centrality_not_central">
						{$t.extremeAnalysis.categories.centralityLow}
					</option>
				</select>
			</div>

			<!-- Keyword Type Toggle -->
			<div class="control-group">
				<span class="control-label" id="keyword-type-label">
					{$t.extremeAnalysis.selectKeywordType}
				</span>
				<div class="btn-group-toggle">
					<button
						class="btn-toggle {selectedKeywordType === 'subject' ? 'active' : ''}"
						onclick={() => handleKeywordTypeChange('subject')}
						aria-pressed={selectedKeywordType === 'subject'}
					>
						{$t.extremeAnalysis.subjectKeywords}
					</button>
					<button
						class="btn-toggle {selectedKeywordType === 'spatial' ? 'active' : ''}"
						onclick={() => handleKeywordTypeChange('spatial')}
						aria-pressed={selectedKeywordType === 'spatial'}
					>
						{$t.extremeAnalysis.spatialKeywords}
					</button>
				</div>
			</div>

			<!-- Keywords Count -->
			<div class="control-group">
				<label for="keywords-count" class="control-label">
					{$t.extremeAnalysis.numberOfKeywords || 'Number of Keywords'}
				</label>
				<input
					id="keywords-count"
					type="number"
					min="5"
					max="25"
					bind:value={showTopN}
					onchange={handleTopNChange}
					class="number-input"
				/>
			</div>
		</div>
	{/snippet}
</FilterCard>

<style>
	/* Extreme accent on the shared card (matches the previous hand-rolled
	   chrome). Scoped via the unique class passed to FilterCard. */
	:global(.filter-card.extreme-controls-card) {
		border-top: 2px solid var(--sentiment-extreme);
	}

	.extreme-controls-icon {
		/* Render the icon before the title inside FilterCard's flex header */
		order: -1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		background: var(--sentiment-extreme-bg);
		border: 1px solid var(--sentiment-extreme-border);
	}

	/* Controls stack vertically: this component only renders inside the
	   narrow FiltersPanel rail (320px) / mobile drawer, where the old
	   three-across grid clipped the third control on desktop. Media
	   queries can't help — they track the viewport, not the rail. */
	.controls-grid {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.control-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--text-secondary);
	}

	/* Select Input */
	.select-input {
		background: var(--surface-subtle);
		border: 1px solid var(--border-hover);
		color: var(--text-primary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
		font-size: var(--font-size-sm);
		min-height: 38px;
		width: 100%;
		cursor: pointer;
		outline: none;
	}

	.select-input:hover {
		background: var(--surface-hover);
		border-color: var(--border-active);
	}

	.select-input:focus {
		border-color: color-mix(in oklab, var(--sentiment-extreme) 50%, transparent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--sentiment-extreme) 10%, transparent);
	}

	/* Fix dropdown options styling */
	.select-input option {
		background: var(--color-surface-800);
		color: var(--text-primary);
		padding: var(--space-2);
		border: none;
	}

	.select-input option:hover {
		background: var(--color-surface-700);
	}

	.select-input option:checked {
		background: var(--color-primary-500);
		color: white;
	}

	/* Button Toggle Group */
	.btn-group-toggle {
		display: flex;
		gap: 0;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--surface-subtle);
		border: 1px solid var(--border-hover);
	}

	.btn-toggle {
		flex: 1;
		padding: var(--space-2) var(--space-3-5);
		border: none;
		background: transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.btn-toggle:not(:last-child) {
		border-right: 1px solid var(--border-hover);
	}

	.btn-toggle:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.btn-toggle.active {
		background: var(--sentiment-extreme-bg);
		color: var(--sentiment-extreme-accent);
		font-weight: var(--font-weight-semibold);
	}

	/* Number Input */
	.number-input {
		background: var(--surface-subtle);
		border: 1px solid var(--border-hover);
		color: var(--text-primary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
		font-size: var(--font-size-sm);
		min-height: 38px;
		width: 100%;
		max-width: 100px;
		outline: none;
	}

	.number-input:hover {
		background: var(--surface-hover);
		border-color: var(--border-active);
	}

	.number-input:focus {
		border-color: color-mix(in oklab, var(--sentiment-extreme) 50%, transparent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--sentiment-extreme) 10%, transparent);
	}

	/* Chrome, Safari, Edge, Opera */
	.number-input::-webkit-outer-spin-button,
	.number-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	.number-input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	@media (max-width: 768px) {
		.control-group {
			width: 100%;
		}

		.control-label {
			font-size: var(--font-size-sm);
		}

		.select-input,
		.btn-toggle,
		.number-input {
			font-size: var(--font-size-sm);
			padding: var(--space-2) var(--space-3);
			min-height: 38px;
		}

		.number-input {
			max-width: 100px;
		}
	}

	@media (max-width: 480px) {
		.controls-grid {
			gap: var(--space-3);
		}

		.control-label {
			font-size: var(--font-size-xs);
		}

		.select-input,
		.btn-toggle,
		.number-input {
			font-size: var(--font-size-xs);
			padding: var(--space-1-5) var(--space-2-5);
			min-height: 34px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.select-input,
		.btn-toggle,
		.number-input {
			transition: none;
		}
	}
</style>
