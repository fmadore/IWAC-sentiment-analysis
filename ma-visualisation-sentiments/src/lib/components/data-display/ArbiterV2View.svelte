<!--
  ArbiterV2View — the generation-2 three-way arbiter

  One judge (Claude Opus 5) sees all three anonymised analyses of an article at
  once and returns a single set of verdicts, so there is no model pair to pick
  here and no `model_a_is_first` to unwind. The sampling frame goes above the
  percentages for the same reason as in the v1 view: every share below is
  conditional on the three models having already disagreed.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { num } from '$lib/i18n/utils';
	import {
		arbiterV2Evaluations,
		arbiterV2Statistics,
		loadArbiterV2Evaluations,
		uiState,
		articleState,
		datasetState,
		ARBITER_V2_DIMENSIONS,
		type ArbiterV2Dimension
	} from '$lib/stores';
	import { SUBJECTIVITY_LABELS_V2, type SubjectivityScore } from '$lib/domain/sentimentContract';
	import type { ArbiterV2Preference } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { ChartCard } from '$lib/components/ui';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import PaginationControls from '$lib/components/common/PaginationControls.svelte';
	import { createPagination } from '$lib/utils/pagination.svelte';
	import { getConfidenceBadgeClass, getConfidenceLabel } from '$lib/utils/arbiter';
	import ArbiterCoverage from './ArbiterCoverage.svelte';
	import ArbiterV2StatsCards from './ArbiterV2StatsCards.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import TableIcon from '@lucide/svelte/icons/table';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const stats = $derived(arbiterV2Statistics.current);
	const data = $derived(arbiterV2Evaluations.current);
	const hasData = $derived(stats.hasData);

	/**
	 * Corpus denominator. The arbiter metadata's `total_articles` counts what the
	 * arbiter was *given*, so the corpus size comes from the loaded datasets, as
	 * in the v1 view. All three v2 models cover the same base, so the smallest
	 * loaded set is the honest floor.
	 */
	const corpusTotal = $derived.by(() => {
		const sizes = datasetState.availableInGeneration
			.map((dataset) => articleState.datasets[dataset.id]?.length ?? 0)
			.filter((size) => size > 0);
		return sizes.length > 0 ? Math.min(...sizes) : 0;
	});

	/** Widest disagreement first — the same order the run itself prioritised. */
	const rows = $derived(
		[...(data?.evaluations ?? [])].sort((a, b) => b.spread.total_spread - a.spread.total_spread)
	);

	const pagination = createPagination({
		totalItems: () => rows.length,
		initialItemsPerPage: 25,
		itemsPerPageOptions: [25, 50, 100]
	});

	const pageRows = $derived(rows.slice(pagination.startIndex, pagination.endIndex));

	let expanded = $state<string | null>(null);

	function toggle(articleId: string) {
		expanded = expanded === articleId ? null : articleId;
	}

	/** The display name behind an anonymised verdict label. */
	function verdictLabel(preference: ArbiterV2Preference): string {
		if (preference === 'multiple') return $t.arbiterV2.multiple;
		if (preference === 'none') return $t.arbiterV2.none;
		const modelId = data?.metadata.blind_permutation[preference];
		return stats.models.find((model) => model.modelId === modelId)?.name ?? preference;
	}

	function verdictColor(preference: ArbiterV2Preference): string {
		if (preference === 'multiple' || preference === 'none') return 'var(--text-muted)';
		const modelId = data?.metadata.blind_permutation[preference];
		return (
			datasetState.available.find((dataset) => dataset.id === modelId)?.color ??
			'var(--sentiment-arbiter)'
		);
	}

	/**
	 * Subjectivity is stored as the shared 1-5 rank so every numeric code path
	 * keeps working; the arbiter answered in the v2 label wording, so that is
	 * what gets rendered back.
	 */
	function displayScore(dimension: ArbiterV2Dimension, score: string): string {
		if (dimension !== 'subjectivity') return score;
		const rank = Number(score);
		return SUBJECTIVITY_LABELS_V2[rank as SubjectivityScore] ?? score;
	}

	function dimensionName(dimension: ArbiterV2Dimension): string {
		return $t.arbiterV2[dimension];
	}

	onMount(() => {
		loadArbiterV2Evaluations(fetch);
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
			<ArbiterCoverage
				evaluated={stats.totalEvaluated}
				{corpusTotal}
				note={$t.arbiterV2.samplingFrameNote}
			/>
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

			<ChartCard variant="table">
				<ul class="verdict-list">
					{#each pageRows as row (row.article_id)}
						{@const open = expanded === row.article_id}
						<li class="verdict-row" data-open={open}>
							<button class="verdict-summary" onclick={() => toggle(row.article_id)}>
								<span class="verdict-id">#{row.article_id}</span>
								<span class="verdict-spread">
									{$t.arbiterV2.spread}
									<strong>{row.spread.total_spread}</strong>
								</span>
								<span
									class="verdict-winner"
									style="color: {verdictColor(row.arbiter.overall_winner)}"
								>
									{verdictLabel(row.arbiter.overall_winner)}
								</span>
								<span class="badge {getConfidenceBadgeClass(row.arbiter.confidence_level)}">
									{getConfidenceLabel(row.arbiter.confidence_level, $t)}
								</span>
								<span class="verdict-chevron" data-open={open}>
									<ChevronDownIcon size={16} aria-hidden="true" />
								</span>
								<span class="sr-only">
									{open ? $t.arbiterV2.hideReasoning : $t.arbiterV2.showReasoning}
								</span>
							</button>

							{#if open}
								<div class="verdict-detail">
									<p class="verdict-overall">{row.arbiter.overall_explanation}</p>
									{#each ARBITER_V2_DIMENSIONS as dimension (dimension)}
										{@const verdict = row.arbiter[dimension]}
										<div class="verdict-dimension">
											<div class="verdict-dimension-head">
												<span class="verdict-dimension-name">{dimensionName(dimension)}</span>
												<span class="verdict-dimension-score">
													{$t.arbiterV2.arbiterScore}: {displayScore(dimension, verdict.score)}
												</span>
												<span
													class="verdict-dimension-pref"
													style="color: {verdictColor(verdict.preferred)}"
												>
													{verdictLabel(verdict.preferred)}
												</span>
											</div>
											<p class="verdict-text">{verdict.justification}</p>
											<p class="verdict-text muted">{verdict.verdict_explanation}</p>
										</div>
									{/each}
								</div>
							{/if}
						</li>
					{/each}
				</ul>

				{#if rows.length > pagination.itemsPerPage}
					<PaginationControls {pagination} showItemsPerPage />
				{/if}
			</ChartCard>
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

	.verdict-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.verdict-row {
		border-bottom: 1px solid var(--border-subtle);
	}

	.verdict-summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-2);
		background: transparent;
		border: 0;
		text-align: left;
		cursor: pointer;
		color: var(--text-secondary);
		transition: background-color var(--timing-fast) var(--easing-default);
	}

	.verdict-summary:hover {
		background: var(--surface-hover);
	}

	.verdict-id {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
	}

	.verdict-spread {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--text-subtle);
	}

	.verdict-spread strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.verdict-winner {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
	}

	.verdict-chevron {
		margin-left: auto;
		display: inline-flex;
		color: var(--text-muted);
		transition: transform var(--timing-fast) var(--easing-default);
	}

	.verdict-chevron[data-open='true'] {
		transform: rotate(180deg);
	}

	.verdict-detail {
		padding: var(--space-2) var(--space-2) var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.verdict-overall {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}

	.verdict-dimension {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-left: 2px solid var(--sentiment-arbiter-border);
	}

	.verdict-dimension-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.verdict-dimension-name {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--sentiment-arbiter-light);
	}

	.verdict-dimension-score,
	.verdict-dimension-pref {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.verdict-dimension-pref {
		font-weight: var(--font-weight-semibold);
	}

	.verdict-text {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		max-width: var(--prose-width);
		margin: 0;
	}

	.verdict-text.muted {
		color: var(--text-muted);
		margin-top: var(--space-2);
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

	@media (prefers-reduced-motion: reduce) {
		.verdict-chevron,
		.verdict-summary {
			transition: none;
		}
	}
</style>
