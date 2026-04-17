<!--
  ArbiterView Component
  
  Dedicated view for exploring arbiter (Gemini 3 Pro) evaluation results.
  Provides comprehensive visualizations and statistics for model comparison verdicts.
  
  Features:
  - Model pair selection
  - Overall statistics cards
  - Verdict distribution chart (pie/bar)
  - Breakdown by dimension (polarity, subjectivity, centrality)
  - Confidence level distribution
  - Filterable and interactive
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		arbiterEvaluations,
		arbiterStatistics,
		loadArbiterEvaluations,
		setupArbiterPairReactivity,
		isLoadingArbiter,
		comparisonPair,
		availableDatasets
	} from '$lib/stores';
	import { getModelsFromPair } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { ChartCard } from '$lib/components/ui';
	import ModelPairPicker from '$lib/components/ui/ModelPairPicker.svelte';
	import ArbiterStatsCards from './ArbiterStatsCards.svelte';
	import ArbiterArticleTable from './ArbiterArticleTable.svelte';
	import {
		ArbiterVerdictChart,
		ArbiterDimensionChart,
		ArbiterConfidenceChart
	} from '$lib/components/viz';
	import { ArbiterArticleDetailModal } from '$lib/components/common';
	import type { ArbiterAnalysis } from '$lib/types/data';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import TableIcon from '@lucide/svelte/icons/table';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	// Selected dimension filter (null = all dimensions)
	let selectedDimension = $state<'polarity' | 'subjectivity' | 'centrality' | null>(null);

	// Modal state for article detail
	let selectedArticleId = $state<string | null>(null);
	let selectedArbiterData = $state<ArbiterAnalysis | null>(null);

	// Handler for article selection from table
	function handleSelectArticle(articleId: string, arbiterData: ArbiterAnalysis) {
		selectedArticleId = articleId;
		selectedArbiterData = arbiterData;
	}

	// Handler for closing modal
	function handleCloseModal() {
		selectedArticleId = null;
		selectedArbiterData = null;
	}

	// Cleanup function for arbiter reactivity
	let cleanupArbiter: (() => void) | null = $state(null);

	// Get model names from current pair
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair($comparisonPair);
		const datasets = $availableDatasets;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

	// Check if we have arbiter data
	const hasData = $derived(
		arbiterEvaluations.current !== null &&
			arbiterEvaluations.current.evaluations &&
			arbiterEvaluations.current.evaluations.length > 0
	);

	const stats = $derived(arbiterStatistics.current);

	// Setup reactivity on mount
	onMount(() => {
		// Setup arbiter pair reactivity
		cleanupArbiter = setupArbiterPairReactivity(fetch);

		// Initial load
		loadArbiterEvaluations(fetch);

		return () => {
			if (cleanupArbiter) {
				cleanupArbiter();
			}
		};
	});

	// Dimension filter options
	const dimensionOptions = [
		{ value: null, label: $t.arbiter.allDimensions },
		{ value: 'polarity' as const, label: $t.arbiter.polarity },
		{ value: 'subjectivity' as const, label: $t.arbiter.subjectivity },
		{ value: 'centrality' as const, label: $t.arbiter.centrality }
	];
</script>

<div class="arbiter-view">
	<!-- Header Section -->
	<div class="arbiter-header mb-6">
		<div class="flex items-start gap-4">
			<div class="arbiter-icon">
				<GavelIcon size={32} class="text-amber-400" />
			</div>
			<div class="flex-1">
				<h1 class="h2 mb-2 text-white arbiter-title">
					{$t.arbiter.viewTitle}
				</h1>
				<p class="text-base text-surface-300 leading-relaxed max-w-3xl">
					{$t.arbiter.viewSubtitle}
				</p>
			</div>
		</div>
	</div>

	<!-- Model Pair Picker -->
	<div class="pair-picker-section mb-6">
		<div class="flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-3">
				<span class="text-white/60 text-sm">{$t.arbiter.selectModelPair}:</span>
				<ModelPairPicker />
			</div>
			<div class="arbiter-model-badge">
				<SparklesIcon size={14} class="text-amber-400" />
				<span class="text-xs text-white/70">{$t.arbiter.modelName}</span>
			</div>
		</div>
	</div>

	{#if $isLoadingArbiter}
		<!-- Loading State -->
		<div class="loading-section">
			<ChartCard>
				<div class="flex flex-col items-center justify-center py-16">
					<div class="loading-spinner mb-4"></div>
					<p class="text-white/80">{$t.arbiter.loadingArbiter}</p>
				</div>
			</ChartCard>
		</div>
	{:else if hasData}
		<!-- Stats Cards -->
		<div class="stats-section mb-6">
			<ArbiterStatsCards
				{stats}
				modelAName={modelNames.modelAName}
				modelBName={modelNames.modelBName}
			/>
		</div>

		<!-- Dimension Filter -->
		<div class="filter-section mb-6">
			<div class="flex flex-wrap items-center gap-3">
				<span class="text-white/60 text-sm">{$t.arbiter.filterByDimension}:</span>
				<div class="dimension-chips flex flex-wrap gap-2">
					{#each dimensionOptions as option (option.value ?? 'all')}
						<button
							class="dimension-chip"
							class:active={selectedDimension === option.value}
							onclick={() => (selectedDimension = option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Charts Grid -->
		<div class="charts-grid">
			<!-- Verdict Distribution Chart -->
			<ChartCard variant="arbiter">
				<h3 class="h4 mb-4 text-white">{$t.arbiter.verdictDistribution}</h3>
				<ArbiterVerdictChart
					dimension={selectedDimension}
					modelAName={modelNames.modelAName}
					modelBName={modelNames.modelBName}
				/>
			</ChartCard>

			<!-- Confidence Distribution Chart -->
			<ChartCard variant="arbiter">
				<h3 class="h4 mb-4 text-white">{$t.arbiter.confidenceDistribution}</h3>
				<ArbiterConfidenceChart />
			</ChartCard>

			<!-- Dimension Breakdown Chart (Full Width) -->
			<ChartCard variant="arbiter" class="full-width">
				<h3 class="h4 mb-4 text-white">{$t.arbiter.verdictsByDimension}</h3>
				<ArbiterDimensionChart
					modelAName={modelNames.modelAName}
					modelBName={modelNames.modelBName}
				/>
			</ChartCard>
		</div>

		<!-- Evaluated Articles Section -->
		<div class="evaluated-articles-section mt-8">
			<div class="section-header mb-4">
				<div class="flex items-center gap-3">
					<div class="section-icon">
						<TableIcon size={24} class="text-amber-400" />
					</div>
					<div>
						<h2 class="h3 text-white section-title">
							{$t.arbiter?.evaluatedArticles || 'Evaluated Articles'}
						</h2>
						<p class="text-sm text-white/60">
							{$t.arbiter?.evaluatedArticlesSubtitle ||
								'Articles analyzed by the arbiter for disagreement resolution'}
						</p>
					</div>
				</div>
			</div>
			<ArbiterArticleTable onSelectArticle={handleSelectArticle} />
		</div>
	{:else}
		<!-- No Data State -->
		<ChartCard>
			<div class="empty-state flex flex-col items-center justify-center py-16 text-center">
				<AlertCircleIcon size={48} class="text-white/40 mb-4" />
				<h3 class="h4 mb-2 text-white">{$t.arbiter.noDataForPair}</h3>
				<p class="text-white/60 max-w-md">
					{$t.arbiter.runScript}
				</p>
			</div>
		</ChartCard>
	{/if}
</div>

<!-- Article Detail Modal -->
<ArbiterArticleDetailModal
	articleId={selectedArticleId}
	arbiterData={selectedArbiterData}
	onClose={handleCloseModal}
/>

<style>
	.evaluated-articles-section {
		border-top: 1px solid color-mix(in oklab, var(--sentiment-arbiter) 15%, transparent);
		padding-top: var(--space-8);
	}

	.section-header {
		padding-bottom: var(--space-4);
	}

	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-xl);
		height: var(--size-control-xl);
		border-radius: var(--radius-xl);
		background: var(--sentiment-arbiter-icon-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.section-title {
		background: linear-gradient(135deg, var(--sentiment-arbiter-light), var(--sentiment-arbiter));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.arbiter-view {
		width: 100%;
	}

	.arbiter-header {
		border-bottom: 1px solid var(--border-default);
		padding-bottom: var(--space-6);
	}

	.arbiter-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: var(--radius-xl);
		background: var(--sentiment-arbiter-icon-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.arbiter-title {
		font-size: 1.75rem; /* between 3xl and 4xl */
		font-weight: var(--font-weight-bold);
		background: linear-gradient(135deg, var(--sentiment-arbiter-light), var(--sentiment-arbiter));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.arbiter-model-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-full);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.dimension-chip {
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-full);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
	}

	.dimension-chip:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.dimension-chip.active {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--sentiment-arbiter) 25%, transparent),
			color-mix(in oklab, var(--sentiment-arbiter-light) 15%, transparent)
		);
		border-color: var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: var(--space-6);
	}

	.charts-grid :global(.full-width) {
		grid-column: 1 / -1;
	}

	/* Loading spinner */
	.loading-spinner {
		width: var(--size-control-xl);
		height: var(--size-control-xl);
		border: 3px solid var(--border-default);
		border-top-color: var(--sentiment-arbiter);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}

		.arbiter-title {
			font-size: var(--font-size-3xl);
		}

		.arbiter-icon {
			width: var(--size-control-xl);
			height: var(--size-control-xl);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}
	}
</style>
