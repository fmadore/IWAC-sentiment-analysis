<script lang="ts">
	import DetailLinkNotice from '#lib/components/common/DetailLinkNotice.svelte';
	import { pendingComparisonArticleState } from '#lib/stores/url/index.js';
	import { articleState } from '#lib/stores/articles.svelte.js';
	import { datasetReadiness } from '#lib/utils/datasetReadiness.js';
	import { getPairModels } from '#lib/domain/sentimentContract.js';
	import DatasetLoadError from '../common/DatasetLoadError.svelte';
	import { comparisonState, datasetState } from '#lib/stores/index.js';
	import CountryFilter from '#lib/components/filters/CountryFilter.svelte';
	import JournalFilter from '#lib/components/filters/JournalFilter.svelte';
	import DiscrepancyFilter from '#lib/components/filters/DiscrepancyFilter.svelte';
	import ComparisonTable from './ComparisonTable.svelte';
	import ComparisonStats from './ComparisonStats.svelte';
	import ComparisonDetailModal from '#lib/components/common/ComparisonDetailModal.svelte';
	import Spinner from '#lib/components/common/Spinner.svelte';
	import ModelPairPicker from '#lib/components/ui/ModelPairPicker.svelte';
	import DisagreementBreakdownChart from '#lib/components/viz/DisagreementBreakdownChart.svelte';
	import { t } from '#lib/i18n/index.js';
	import ColumnsIcon from '@lucide/svelte/icons/columns-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	import EmptyState from '#lib/components/common/EmptyState.svelte';
	import {
		handlePendingComparisonArticleSelection,
		clearSelectedComparison
	} from '#lib/stores/url/index.js';

	const loadStatus = $derived(
		datasetReadiness(getPairModels(datasetState.pair), articleState.loadStates)
	);
	const hasData = $derived(comparisonState.filtered.length > 0);
	const showDetailModal = $derived(comparisonState.selected !== null);

	function closeDetailModal() {
		// Clear the comparison and update URL to remove the articleId param
		clearSelectedComparison();
	}

	// The pair's datasets and arbiter file are requested by `+page.svelte`, which
	// re-requests them whenever the pair changes.

	// Watch for comparison data loading and handle pending selection from URL
	$effect(() => {
		const comparisons = comparisonState.data;
		if (comparisons && comparisons.length > 0) {
			// Try to handle any pending comparison article selection from URL
			handlePendingComparisonArticleSelection();
		}
	});
</script>

{#if loadStatus.ready && pendingComparisonArticleState.current !== null}
	<DetailLinkNotice onClose={clearSelectedComparison} />
{/if}

<!-- Comparison Detail Modal (full-screen) -->
<ComparisonDetailModal
	comparison={comparisonState.selected}
	open={showDetailModal}
	onClose={closeDetailModal}
/>

<div class="comparison-view">
	{#if !datasetState.isComparisonMode}
		<!-- Not in comparison mode -->
		<div class="comparison-empty">
			<EmptyState
				title={$t.comparison.enableComparisonMode}
				lede={$t.comparison.enableComparisonDescription}
			>
				{#snippet icon()}<ColumnsIcon size={48} />{/snippet}
			</EmptyState>
		</div>
	{:else if loadStatus.failed.length > 0}
		<DatasetLoadError ids={loadStatus.failed} />
	{:else if !loadStatus.ready}
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
			<ModelPairPicker />
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
			<div class="comparison-empty">
				<EmptyState title={$t.comparison.noDiscrepancies} lede={$t.comparison.adjustFilters}>
					{#snippet icon()}<SearchIcon size={48} />{/snippet}
				</EmptyState>
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

	.comparison-empty {
		margin: var(--space-8) auto;
		max-width: 600px;
		width: 100%;
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
	.loading-note {
		color: var(--text-secondary);
	}
</style>
