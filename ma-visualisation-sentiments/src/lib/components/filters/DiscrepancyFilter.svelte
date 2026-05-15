<script lang="ts">
	import { filterState } from '$lib/stores';
	import { t } from '$lib/i18n';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import SlidersIcon from '@lucide/svelte/icons/sliders';

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
			dimensions: selectedDimensions as ('polarity' | 'subjectivity' | 'centrality')[],
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

	function toggleExcludeNonApplicable() {
		excludeNonApplicable = !excludeNonApplicable;
		updateFilters();
	}
</script>

<div class="filter-card comparison-filter-card">
	<div class="filter-header">
		<div class="filter-icon-container">
			<FilterIcon size={20} class="header-icon" />
		</div>
		<h3 class="filter-title comparison-filter-title">
			{$t.comparison?.filterByDiscrepancy || 'Filter by Discrepancy'}
		</h3>
	</div>

	<!-- Difference Range -->
	<div class="filter-section">
		<div class="section-header">
			<label class="section-label">
				<SlidersIcon size={16} />
				{$t.comparison?.differenceRange || 'Difference Range'}: {minDiff} - {maxDiff}
			</label>
			<button class="reset-btn" onclick={resetFilters}>
				{$t.filters?.reset || 'Reset'}
			</button>
		</div>

		<div class="range-container">
			<div class="range-track"></div>
			<div
				class="range-highlight"
				style="left: {minDiff * 20}%; width: {(maxDiff - minDiff) * 20}%"
			></div>

			<input
				type="range"
				min="0"
				max="5"
				step="1"
				bind:value={minDiff}
				onchange={updateFilters}
				class="range-slider range-min"
			/>
			<input
				type="range"
				min="0"
				max="5"
				step="1"
				bind:value={maxDiff}
				onchange={updateFilters}
				class="range-slider range-max"
			/>

			<!-- Range labels -->
			<div class="range-labels">
				{#each [0, 1, 2, 3, 4, 5] as value (value)}
					<span class="range-label" style="left: {value * 20}%">{value}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Quick Filters -->
	<div class="filter-section">
		<span class="section-subtitle">{$t.comparison?.quickFilters || 'Quick Filters'}:</span>
		<div class="filter-chips">
			<button
				class="filter-chip"
				data-selected={minDiff === 1 && maxDiff === 1}
				onclick={() => setRange(1, 1)}
			>
				1 {$t.comparison?.pointDifference || 'point difference'}
			</button>
			<button
				class="filter-chip"
				data-selected={minDiff === 2 && maxDiff === 2}
				onclick={() => setRange(2, 2)}
			>
				2 {$t.comparison?.pointsDifference || 'points difference'}
			</button>
			<button
				class="filter-chip"
				data-selected={minDiff === 3 && maxDiff === 5}
				onclick={() => setRange(3, 5)}
			>
				3+ {$t.comparison?.pointsDifference || 'points difference'}
			</button>
			<button
				class="filter-chip warning"
				data-selected={minDiff === 0 && maxDiff === 5}
				onclick={() => setRange(0, 5)}
			>
				{$t.common?.all || 'All'}
			</button>
		</div>
	</div>

	<!-- Dimension Filters -->
	<div class="filter-section">
		<div class="section-header-inline">
			<span class="section-subtitle"
				>{$t.comparison?.compareDimensions || 'Compare Dimensions'}:</span
			>
			<div class="info-tooltip">
				<span class="info-icon">ⓘ</span>
				<div class="tooltip-content">
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
				</div>
			</div>
		</div>
		<div class="filter-chips">
			<button
				class="filter-chip"
				data-selected={selectedDimensions.includes('polarity')}
				onclick={() => toggleDimension('polarity')}
			>
				{$t.analysis?.polaritySection || 'Polarity'}
			</button>
			<button
				class="filter-chip"
				data-selected={selectedDimensions.includes('subjectivity')}
				onclick={() => toggleDimension('subjectivity')}
			>
				{$t.analysis?.subjectivitySection || 'Subjectivity'}
			</button>
			<button
				class="filter-chip"
				data-selected={selectedDimensions.includes('centrality')}
				onclick={() => toggleDimension('centrality')}
			>
				{$t.analysis?.centralitySection || 'Centrality'}
			</button>
		</div>
	</div>

	<!-- Non-Applicable Filter -->
	<div class="filter-section">
		<div class="toggle-row">
			<span class="section-subtitle"
				>{$t.comparison?.excludeNonApplicable || 'Exclude "Non Applicable" Articles'}:</span
			>
			<button
				class="toggle-switch"
				data-active={excludeNonApplicable}
				onclick={toggleExcludeNonApplicable}
				aria-label="Toggle exclude non-applicable articles"
			>
				<div class="toggle-thumb"></div>
			</button>
		</div>
		<p class="helper-text">
			{$t.comparison?.excludeNonApplicableDescription ||
				'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.'}
		</p>
	</div>
</div>

<style>
	.filter-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		transition: border-color var(--timing-normal) var(--easing-default);
	}

	/* Comparison-specific filter card — neutral glass like other filter cards */
	.comparison-filter-card {
		position: relative;
		overflow: hidden;
	}

	.filter-card:hover {
		border-color: var(--border-hover);
	}

	.filter-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.filter-icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: var(--radius-md);
		background: var(--sentiment-comparison-icon-bg);
		border: 1px solid var(--sentiment-comparison-border);
	}

	.filter-header :global(svg) {
		color: var(--sentiment-comparison-light);
	}

	.filter-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
	}

	.comparison-filter-title {
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

	.reset-btn {
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-md);
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

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1-5) var(--space-3);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-sm);
		cursor: pointer;
		white-space: nowrap;
		background: var(--surface-muted);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.filter-chip:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.filter-chip[data-selected='true'] {
		background: var(--sentiment-comparison-bg);
		border-color: var(--sentiment-comparison-border);
		color: var(--sentiment-comparison-light);
	}

	.filter-chip.warning[data-selected='true'] {
		background: color-mix(in oklab, var(--color-warning-500) 18%, transparent);
		border-color: color-mix(in oklab, var(--color-warning-500) 45%, transparent);
		color: var(--color-warning-300);
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

	.range-container {
		position: relative;
		height: 60px;
		margin: 0 var(--space-2-5);
	}

	.range-track {
		position: absolute;
		top: 20px;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--surface-subtle);
		border-radius: var(--space-0-5);
	}

	.range-highlight {
		position: absolute;
		top: 20px;
		height: 4px;
		background: var(--sentiment-comparison-light);
		border-radius: var(--space-0-5);
		transition:
			left var(--timing-fast) var(--easing-default),
			width var(--timing-fast) var(--easing-default);
	}

	.range-slider {
		position: absolute;
		top: 10px;
		width: 100%;
		height: 24px;
		background: transparent;
		pointer-events: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.range-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		border-radius: 50%;
		background: white;
		border: 2px solid var(--sentiment-comparison);
		cursor: pointer;
		pointer-events: auto;
		box-shadow: 0 2px 8px color-mix(in oklab, black 30%, transparent);
		transition:
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.range-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--sentiment-comparison) 40%, transparent);
	}

	.range-slider::-moz-range-thumb {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		border-radius: 50%;
		background: white;
		border: 2px solid var(--sentiment-comparison);
		cursor: pointer;
		pointer-events: auto;
		box-shadow: 0 2px 8px color-mix(in oklab, black 30%, transparent);
		transition:
			transform var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-fast) var(--easing-default);
	}

	.range-slider::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px color-mix(in oklab, var(--sentiment-comparison) 40%, transparent);
	}

	.range-min {
		z-index: 2;
	}

	.range-max {
		z-index: 1;
	}

	.range-labels {
		position: absolute;
		top: 40px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
	}

	.range-label {
		position: absolute;
		transform: translateX(-50%);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Toggle switch styles */
	.toggle-switch {
		position: relative;
		width: var(--size-control-xl);
		height: var(--size-icon-lg);
		background: var(--surface-active);
		border-radius: var(--radius-xl);
		border: none;
		cursor: pointer;
		transition: background-color var(--timing-normal) var(--easing-default);
		outline: none;
	}

	.toggle-switch:hover {
		background: var(--border-strong);
	}

	.toggle-switch[data-active='true'] {
		background: var(--sentiment-comparison);
	}

	.toggle-switch[data-active='true']:hover {
		background: var(--sentiment-comparison-light);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		background: white;
		border-radius: 50%;
		transition: transform var(--timing-normal) var(--easing-default);
		box-shadow: 0 2px 4px color-mix(in oklab, black 20%, transparent);
	}

	.toggle-switch[data-active='true'] .toggle-thumb {
		transform: translateX(20px);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.filter-card {
			padding: var(--space-3-5);
		}

		.range-container {
			margin: 0 5px;
		}

		.filter-chip {
			padding: var(--space-1) var(--space-2-5);
			font-size: var(--font-size-2xs);
		}

		.toggle-switch {
			width: var(--size-control-lg);
			height: 22px;
		}

		.toggle-thumb {
			width: 18px;
			height: 18px;
		}

		.toggle-switch[data-active='true'] .toggle-thumb {
			transform: translateX(18px);
		}
	}

	/* Info tooltip styles */
	.info-tooltip {
		position: relative;
		display: inline-block;
	}

	.info-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size-icon-sm);
		height: var(--size-icon-sm);
		background: var(--surface-active);
		color: var(--text-secondary);
		border-radius: var(--radius-full);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-bold);
		cursor: help;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.info-icon:hover {
		background: var(--border-strong);
		color: var(--text-primary);
	}

	.tooltip-content {
		position: absolute;
		top: calc(var(--space-2-5) * -1);
		left: 50%;
		transform: translateX(-50%) translateY(-100%);
		background: var(--tooltip-bg, #13161c);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		padding: var(--space-3);
		min-width: 320px;
		max-width: 400px;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity var(--timing-normal) var(--easing-default),
			visibility var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
		z-index: var(--z-modal);
		box-shadow: var(--shadow-xl);
	}

	.info-tooltip:hover .tooltip-content {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(-100%) translateY(-8px);
	}

	.tooltip-content::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: color-mix(in oklab, black 95%, transparent);
	}

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

	/* Responsive tooltip */
	@media (max-width: 640px) {
		.tooltip-content {
			min-width: 280px;
			left: 0;
			transform: translateY(-100%);
		}

		.info-tooltip:hover .tooltip-content {
			transform: translateY(-100%) translateY(-8px);
		}

		.tooltip-content::after {
			left: 24px;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.filter-card,
		.filter-chip,
		.toggle-switch,
		.toggle-thumb,
		.range-highlight {
			transition: none;
		}
	}
</style>
