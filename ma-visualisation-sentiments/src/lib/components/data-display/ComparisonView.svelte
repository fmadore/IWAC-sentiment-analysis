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
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ModelPairPicker from '$lib/components/ui/ModelPairPicker.svelte';
	import { DisagreementBreakdownChart } from '$lib/components/viz';
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
			<span class="empty-icon mx-auto mb-4"><AlertCircleIcon size={48} /></span>
			<h3 class="mb-2 empty-title">
				{$t.comparison.enableComparisonMode}
			</h3>
			<p class="empty-body mx-auto">
				{$t.comparison.enableComparisonDescription}
			</p>
		</div>
	{:else if uiState.isLoadingComparison}
		<!-- Loading state for comparison data -->
		<div class="loading-section mb-6">
			<div class="comparison-loading-card p-8 text-center">
				<Spinner
					size="2xl"
					--spinner-track="var(--border-default)"
					--spinner-accent="var(--sentiment-comparison)"
				/>
				<p class="loading-note">{$t.messages.loading}</p>
			</div>
		</div>
	{:else}
		<!-- Model Pair Picker -->
		<div class="pair-picker-section comparison-pair-picker mb-4">
			<div class="flex items-center gap-3">
				<span class="control-label">{$t.comparison.selectModelPair}</span>
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
			<!-- Where the disagreement sits. The stats above give a corpus-wide
			     mean; this locates it in time and space, which is what separates
			     "these models differ" from "these models differ about X". -->
			<div class="breakdown-section mb-6">
				<DisagreementBreakdownChart />
			</div>

			<div class="comparison-content">
				<ComparisonTable />
			</div>
		{:else}
			<div class="empty-results comparison-empty-results p-8 text-center">
				<span class="empty-icon mx-auto mb-4"><AlertCircleIcon size={48} /></span>
				<h3 class="mb-2 empty-title">
					{$t.comparison.noDiscrepancies}
				</h3>
				<p class="empty-body mx-auto">
					{$t.comparison.adjustFilters}
				</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Hosts the disagreement breakdown between the stat cards and the table. */
	.breakdown-section {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
	}

	.comparison-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
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
	@media (min-width: 640px) {
		.comparison-view {
			gap: var(--space-6);
		}
	}

	/* ---- Text roles, replacing Tailwind colour utilities. ---- */
	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: color-mix(in oklab, var(--sentiment-comparison-accent) 60%, transparent);
	}

	.empty-title {
		font-size: var(--font-size-2xl);
		color: var(--text-primary);
	}

	.empty-body {
		max-width: 28rem;
		color: var(--text-muted);
	}

	.loading-note {
		color: var(--text-secondary);
	}

	.control-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}
</style>
