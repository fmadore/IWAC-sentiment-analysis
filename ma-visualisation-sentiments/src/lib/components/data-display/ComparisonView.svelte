<script lang="ts">
	import {
		comparisonState,
		datasetState,
		uiState,
		setupArbiterPairReactivity,
		loadArbiterEvaluations
	} from '$lib/stores';
	import { CountryFilter, JournalFilter, DiscrepancyFilter } from '$lib/components/filters';
	import ComparisonTable from './ComparisonTable.svelte';
	import ComparisonStats from './ComparisonStats.svelte';
	import { ComparisonDetailModal } from '$lib/components/common';
	import ModelPairPicker from '$lib/components/ui/ModelPairPicker.svelte';
	import { t } from '$lib/i18n';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import {
		updateURL,
		handlePendingComparisonArticleSelection,
		clearSelectedComparison
	} from '$lib/stores/url';
	import { onMount } from 'svelte';

	const hasData = $derived(comparisonState.filtered.length > 0);
	const showDetailModal = $derived(comparisonState.selected !== null);

	function closeDetailModal() {
		// Clear the comparison and update URL to remove the articleId param
		clearSelectedComparison();
	}

	// Track previous comparison to detect changes
	let previousComparisonId: string | number | null = $state(null);

	// Cleanup function for arbiter reactivity
	let cleanupArbiter: (() => void) | null = $state(null);

	// Setup arbiter reactivity on mount
	onMount(() => {
		// Setup arbiter pair reactivity - this will reload arbiter data when pair changes
		cleanupArbiter = setupArbiterPairReactivity(fetch);

		// Initial load of arbiter data (in case it wasn't loaded during prefetch)
		loadArbiterEvaluations(fetch);

		return () => {
			if (cleanupArbiter) {
				cleanupArbiter();
			}
		};
	});

	// Watch for selectedComparison changes and update URL
	$effect(() => {
		const currentComparison = comparisonState.selected;
		const currentId = currentComparison?.article['o:id'] ?? null;

		// Only update URL if the selection actually changed
		if (currentId !== previousComparisonId) {
			previousComparisonId = currentId;
			// Update URL with the new comparison article ID (or remove it if null)
			updateURL(undefined, true);
		}
	});

	// Watch for comparison data loading and handle pending selection from URL
	$effect(() => {
		const comparisons = comparisonState.data;
		if (comparisons && comparisons.length > 0) {
			// Try to handle any pending comparison article selection from URL
			handlePendingComparisonArticleSelection();
		}
	});
</script>

<!-- Comparison Detail Modal (full-screen) -->
<ComparisonDetailModal
	comparison={comparisonState.selected}
	open={showDetailModal}
	onClose={closeDetailModal}
/>

<div class="comparison-view">
	{#if !datasetState.isComparisonMode}
		<!-- Not in comparison mode -->
		<div class="empty-state comparison-empty-state p-8 text-center">
			<AlertCircleIcon size={48} class="mx-auto mb-4 text-purple-400/60" />
			<h3 class="h3 mb-2 text-white">
				{$t.comparison?.enableComparisonMode || 'Enable Comparison Mode'}
			</h3>
			<p class="text-white/60 max-w-md mx-auto">
				{$t.comparison?.enableComparisonDescription ||
					'Click the comparison button in the dataset picker to compare ChatGPT and Gemini analyses.'}
			</p>
		</div>
	{:else if uiState.isLoadingComparison}
		<!-- Loading state for comparison data -->
		<div class="loading-section mb-6">
			<div class="comparison-loading-card p-8 text-center">
				<div class="loading-spinner comparison-spinner mb-4"></div>
				<p class="text-white/80">{$t.messages?.loading || 'Loading comparison data...'}</p>
			</div>
		</div>
	{:else}
		<!-- Model Pair Picker -->
		<div class="pair-picker-section comparison-pair-picker mb-4">
			<div class="flex items-center gap-3">
				<span class="text-white/60 text-sm">{$t.comparison?.selectModelPair || 'Compare:'}</span>
				<ModelPairPicker />
			</div>
		</div>

		<!-- Stats Overview -->
		<div class="stats-section mb-6">
			<ComparisonStats />
		</div>

		<!-- Filters — comparison owns its own facets (Country/Journal scope the
			 corpus; DiscrepancyFilter scopes by divergence). Country and Journal
			 write the shared filterState that filterComparisons() reads. -->
		<div class="filters-section mb-6">
			<div class="comparison-facets">
				<CountryFilter />
				<JournalFilter />
			</div>
			<DiscrepancyFilter />
		</div>

		<!-- Results -->
		{#if hasData}
			<div class="comparison-content">
				<ComparisonTable />
			</div>
		{:else}
			<div class="empty-results comparison-empty-results p-8 text-center">
				<AlertCircleIcon size={48} class="mx-auto mb-4 text-purple-400/60" />
				<h3 class="h4 mb-2 text-white">
					{$t.comparison?.noDiscrepancies || 'No Discrepancies Found'}
				</h3>
				<p class="text-white/60 max-w-md mx-auto">
					{$t.comparison?.adjustFilters ||
						'Try adjusting your filters to see articles with differences between models.'}
				</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.comparison-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	/* Comparison's own filter section: Country/Journal facets above the
	   DiscrepancyFilter. Facets sit side by side on wide viewports, stack below. */
	.filters-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.comparison-facets {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
		gap: var(--space-4);
		align-items: start;
	}

	.empty-state,
	.empty-results {
		margin: var(--space-8) auto;
		max-width: 600px;
	}

	.comparison-empty-state,
	.comparison-empty-results {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.comparison-loading-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	/* Loading spinner - using CSS custom properties */
	.loading-spinner {
		width: var(--size-control-xl);
		height: var(--size-control-xl);
		border: 3px solid var(--border-default);
		border-top-color: var(--text-secondary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	.comparison-spinner {
		border-top-color: var(--sentiment-comparison);
	}

	/* Pair picker section — z-index ensures dropdown floats above stats cards */
	.comparison-pair-picker {
		position: relative;
		z-index: 10;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.comparison-view {
			gap: var(--space-4);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}
	}
</style>
