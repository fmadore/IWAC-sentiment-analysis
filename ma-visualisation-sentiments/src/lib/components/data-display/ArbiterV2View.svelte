<!--
  ArbiterV2View — the generation-2 panel arbiter

  One judge (Claude Opus 5) sees every anonymised analysis of an article at once
  and returns a single set of verdicts, so there is no model pair to pick here
  and no `model_a_is_first` to unwind. The sampling frame goes above the
  percentages for the same reason as in the v1 view: every share below is
  conditional on the panel having already disagreed.

  The article list at the foot is joined to the corpus, so a verdict can be
  read against the article it judges: title and newspaper in the row, and the
  page, the five ratings and the reasoning behind a click. The arbiter file
  carries ids only, so the join needs every panel model's scores — the view
  is entered in comparison mode with two loaded, and asks for the rest in the
  background.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { num } from '$lib/i18n/utils';
	import {
		arbiterV2Evaluations,
		arbiterV2Legend,
		arbiterV2Rows,
		arbiterV2Statistics,
		loadArbiterV2Evaluations,
		loadArbiterV2Panel,
		uiState,
		articleState,
		datasetState,
		type ArbiterV2Dimension,
		type ArbiterV2Row
	} from '$lib/stores';
	import type { ArbiterV2Preference } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { ChartCard } from '$lib/components/ui';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ArbiterV2ArticleDetailModal from '$lib/components/common/ArbiterV2ArticleDetailModal.svelte';
	import { getConfidenceLabel } from '$lib/utils/arbiter';
	import ArbiterCoverage from './ArbiterCoverage.svelte';
	import ArbiterV2StatsCards from './ArbiterV2StatsCards.svelte';
	import ArbiterV2ArticleTable from './ArbiterV2ArticleTable.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import TableIcon from '@lucide/svelte/icons/table';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	const stats = $derived(arbiterV2Statistics.current);
	const data = $derived(arbiterV2Evaluations.current);
	const hasData = $derived(stats.hasData);
	const rows = $derived(arbiterV2Rows.current);
	const legend = $derived(arbiterV2Legend.current);

	/**
	 * Corpus denominator. The arbiter metadata's `total_articles` counts what the
	 * arbiter was *given*, so the corpus size comes from the loaded datasets, as
	 * in the v1 view. Every model ships one row per article, so the smallest
	 * loaded set is simply the corpus.
	 *
	 * This counts rows, not annotations, and the two have come apart: Qwen3.8
	 * 27B carries 200 rows whose scores are null, permanently. That is right
	 * here — the frame being described is "of the whole corpus, this many were
	 * arbitrated" — but it means this number must not be reused as a per-model
	 * coverage denominator.
	 */
	const corpusTotal = $derived.by(() => {
		const sizes = datasetState.availableInGeneration
			.map((dataset) => articleState.datasets[dataset.id]?.length ?? 0)
			.filter((size) => size > 0);
		return sizes.length > 0 ? Math.min(...sizes) : 0;
	});

	/**
	 * The conditionality note names the rule the run selected on, read from the
	 * file rather than assumed: a future run under a different rule must not
	 * ship a sentence describing this one. Files from before the rule was
	 * recorded selected on spread alone.
	 */
	const samplingFrameNote = $derived.by(() => {
		switch (data?.metadata.selection.arbiter_rule ?? 'spread') {
			case 'valence':
				return $t.arbiterV2.samplingFrameNote;
			case 'spread-or-valence':
				return $t.arbiterV2.samplingFrameNoteUnion;
			default:
				return $t.arbiterV2.samplingFrameNoteSpread;
		}
	});

	let selected = $state<ArbiterV2Row | null>(null);

	function verdictColor(preference: ArbiterV2Preference): string {
		if (preference === 'multiple' || preference === 'none') return 'var(--text-muted)';
		const modelId = data?.metadata.blind_permutation[preference];
		return (
			datasetState.available.find((dataset) => dataset.id === modelId)?.color ??
			'var(--sentiment-arbiter)'
		);
	}

	function dimensionName(dimension: ArbiterV2Dimension): string {
		return $t.arbiterV2[dimension];
	}

	onMount(() => {
		loadArbiterV2Evaluations(fetch);
		loadArbiterV2Panel(fetch).catch((error) =>
			console.error('Failed to load the panel datasets for the arbiter view:', error)
		);
	});
</script>

<div class="arbiter-view">
	<header class="arbiter-header mb-6">
		<div class="arbiter-eyebrow">
			<GavelIcon size={12} strokeWidth={2.25} aria-hidden="true" />
			<span>{stats.arbiterModel || $t.arbiterV2.modelName}</span>
		</div>
		<h1 class="arbiter-title">{$t.arbiterV2.viewTitle}</h1>
		<p class="arbiter-lede">{$t.arbiterV2.viewSubtitle}</p>
	</header>

	{#if uiState.isLoadingArbiter}
		<ChartCard>
			<div class="flex flex-col items-center justify-center py-16">
				<Spinner
					size="2xl"
					--spinner-track="var(--border-default)"
					--spinner-accent="var(--sentiment-arbiter)"
				/>
				<p class="loading-note">{$t.arbiterV2.loading}</p>
			</div>
		</ChartCard>
	{:else if hasData}
		<!-- Sampling frame first: the shares below are conditional on it. -->
		<div class="mb-6">
			<ArbiterCoverage evaluated={stats.totalEvaluated} {corpusTotal} note={samplingFrameNote} />
		</div>

		<div class="mb-6">
			<ArbiterV2StatsCards {stats} />
		</div>

		<div class="panels-grid mb-6">
			<ChartCard variant="arbiter">
				<h2 class="panel-title">{$t.arbiterV2.byDimension}</h2>
				<div class="dimension-list">
					{#each stats.dimensions as breakdown (breakdown.dimension)}
						{@const total =
							stats.models.reduce(
								(sum, model) => sum + (breakdown.byModel[model.modelId] ?? 0),
								0
							) +
							breakdown.multiple +
							breakdown.none}
						<div class="dimension-row">
							<span class="dimension-name">{dimensionName(breakdown.dimension)}</span>
							<div class="dimension-bar">
								{#each stats.models as model (model.modelId)}
									{@const count = breakdown.byModel[model.modelId] ?? 0}
									{#if count > 0}
										<div
											class="bar-segment"
											style="width: {(count / total) * 100}%; background: {verdictColor(
												model.label
											)}"
											title="{model.name}: {count}"
										></div>
									{/if}
								{/each}
								{#if breakdown.multiple + breakdown.none > 0}
									<div
										class="bar-segment tie-segment"
										style="width: {((breakdown.multiple + breakdown.none) / total) * 100}%"
										title="{$t.arbiterV2.multiple} / {$t.arbiterV2.none}: {breakdown.multiple +
											breakdown.none}"
									></div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</ChartCard>

			<ChartCard variant="arbiter">
				<h2 class="panel-title">{$t.arbiterV2.confidenceDistribution}</h2>
				<div class="dimension-list">
					{#each ['high', 'medium', 'low'] as const as level (level)}
						{@const count = stats.confidence[level]}
						<div class="dimension-row">
							<span class="dimension-name">{getConfidenceLabel(level, $t)}</span>
							<div class="dimension-bar">
								<div
									class="bar-segment confidence-segment"
									data-level={level}
									style="width: {stats.totalEvaluated > 0
										? (count / stats.totalEvaluated) * 100
										: 0}%"
								></div>
							</div>
							<span class="dimension-count">{$num(count)}</span>
						</div>
					{/each}
				</div>
			</ChartCard>
		</div>

		<section class="evaluated-articles-section mt-8">
			<div class="section-header mb-4">
				<div class="section-eyebrow">
					<TableIcon size={12} strokeWidth={2.25} aria-hidden="true" />
					<span>{$t.arbiterV2.evaluatedArticles}</span>
				</div>
				<p class="section-lede">{$t.arbiterV2.evaluatedArticlesSubtitle}</p>
			</div>

			<ArbiterV2ArticleTable {rows} {legend} onSelect={(row) => (selected = row)} />
		</section>
	{:else}
		<ChartCard>
			<div class="empty-state flex flex-col items-center justify-center py-16 text-center">
				<span class="empty-icon mb-4"><AlertCircleIcon size={48} /></span>
				<h2 class="panel-title mb-2">{$t.arbiterV2.noData}</h2>
				<p class="empty-body">{$t.arbiterV2.noDataDescription}</p>
			</div>
		</ChartCard>
	{/if}
</div>

<ArbiterV2ArticleDetailModal row={selected} onClose={() => (selected = null)} />

<style>
	.arbiter-view {
		width: 100%;
	}

	.arbiter-header {
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: var(--space-6);
	}

	.arbiter-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--sentiment-arbiter-light);
		margin-bottom: var(--space-3);
	}

	.arbiter-title {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem);
		font-weight: 600;
		line-height: 1.05;
		color: var(--text-primary);
		margin: 0 0 var(--space-3);
		letter-spacing: var(--tracking-snug);
	}

	.arbiter-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-base);
		line-height: 1.6;
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}

	.panels-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--width-chart-min), 1fr));
		gap: var(--space-6);
	}

	.panel-title {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-4);
	}

	.dimension-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.dimension-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-2);
		align-items: center;
	}

	.dimension-name {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.dimension-count {
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.dimension-bar {
		display: flex;
		height: var(--size-icon-md);
		background: var(--surface-muted);
		overflow: hidden;
	}

	.bar-segment {
		height: 100%;
	}

	.tie-segment {
		background: var(--surface-muted);
		border-left: 1px solid var(--border-subtle);
	}

	.confidence-segment {
		background: var(--sentiment-arbiter);
	}

	.confidence-segment[data-level='medium'] {
		background: var(--sentiment-arbiter-light);
	}

	.confidence-segment[data-level='low'] {
		background: var(--border-default);
	}

	.evaluated-articles-section {
		border-top: 1px solid var(--border-subtle);
		padding-top: var(--space-8);
	}

	.section-header {
		padding-bottom: var(--space-4);
	}

	.section-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--sentiment-arbiter-light);
		margin-bottom: var(--space-2);
	}

	.section-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		line-height: 1.5;
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: 0;
	}

	.loading-note {
		color: var(--text-secondary);
	}

	.empty-icon {
		display: inline-flex;
		align-items: center;
		color: var(--text-subtle);
	}

	.empty-body {
		max-width: 34rem;
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
	}

	@media (min-width: 640px) {
		.dimension-row {
			grid-template-columns: 10rem 1fr auto;
			gap: var(--space-4);
		}
	}
</style>
