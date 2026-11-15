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
  carries ids only, so the view loads every panel model's scores in the
  background, independently of the pairwise comparison mode.
-->
<script lang="ts">
	import DetailLinkNotice from '#lib/components/common/DetailLinkNotice.svelte';
	import { arbiterSelectionState } from '#lib/stores/view-options.svelte.js';
	import { dec, num, pct } from '#lib/i18n/utils.js';
	import { untrack } from 'svelte';
	import { loadSecondJudges, secondJudgeEvaluations } from '#lib/stores/arbiterV2.svelte.js';
	import { SENTIMENT_CONTRACT_V2 } from '#lib/domain/sentimentContract.js';
	import { compareJudges } from '#lib/utils/arbiterV2.js';
	import ShareBar, { type ShareSegment } from '#lib/components/common/ShareBar.svelte';
	import {
		arbiterV2Evaluations,
		arbiterV2Legend,
		arbiterV2LoadState,
		arbiterV2Rows,
		arbiterV2Statistics,
		retryArbiterV2Evaluations,
		articleState,
		datasetState,
		type ArbiterV2Dimension
	} from '#lib/stores/index.js';
	import { t } from '#lib/i18n/index.js';
	import ChartCard from '#lib/components/ui/ChartCard.svelte';
	import Spinner from '#lib/components/common/Spinner.svelte';
	import ResourceLoadError from '#lib/components/common/ResourceLoadError.svelte';
	import ArbiterV2ArticleDetailModal from '#lib/components/common/ArbiterV2ArticleDetailModal.svelte';
	import { getConfidenceLabel } from '#lib/utils/arbiter.js';
	import ArbiterCoverage from './ArbiterCoverage.svelte';
	import ArbiterV2StatsCards from './ArbiterV2StatsCards.svelte';
	import ArbiterV2ArticleTable from './ArbiterV2ArticleTable.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import TableIcon from '@lucide/svelte/icons/table';
	import EmptyState from '#lib/components/common/EmptyState.svelte';

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

	const selected = $derived(
		rows.find((row) => row.articleId === arbiterSelectionState.articleId) ?? null
	);

	function dimensionName(dimension: ArbiterV2Dimension): string {
		return $t.arbiterV2[dimension];
	}

	/** Per-dimension verdicts as bar segments: one per model, then the two non-answers. */
	function dimensionSegments(breakdown: (typeof stats.dimensions)[number]): ShareSegment[] {
		return [
			...stats.models.map((model) => ({
				key: model.modelId,
				label: `${model.name} (${model.label.toUpperCase()})`,
				count: breakdown.byModel[model.modelId] ?? 0,
				color: datasetState.getById(model.modelId)?.color
			})),
			{
				key: 'multiple',
				label: $t.arbiterV2.multiple,
				count: breakdown.multiple,
				pattern: 'hatch' as const
			},
			{ key: 'none', label: $t.arbiterV2.none, count: breakdown.none, pattern: 'hatch' as const }
		];
	}

	const confidenceSegments = $derived<ShareSegment[]>([
		{
			key: 'high',
			label: getConfidenceLabel('high', $t),
			count: stats.confidence.high,
			color: 'var(--sentiment-arbiter)'
		},
		{
			key: 'medium',
			label: getConfidenceLabel('medium', $t),
			count: stats.confidence.medium,
			color: 'var(--sentiment-arbiter-light)'
		},
		{
			key: 'low',
			label: getConfidenceLabel('low', $t),
			count: stats.confidence.low,
			pattern: 'hatch'
		}
	]);

	// The second judge is optional and unpublished until it runs: request it
	// once the published file is in, and show nothing when it 404s.
	$effect(() => {
		if (hasData) untrack(() => loadSecondJudges(fetch));
	});
	const secondJudge = $derived(secondJudgeEvaluations.current);
	const judgeComparison = $derived(compareJudges(data, secondJudge));
	const secondJudgeNote = $derived.by(() => {
		if (!secondJudge || judgeComparison.sharedArticles === 0) return '';
		const developer = secondJudge.metadata.arbiter_developer ?? '';
		const developers = SENTIMENT_CONTRACT_V2.developers as Record<string, { displayName: string }>;
		return $t.arbiterV2.secondJudgeNote
			.replace('{judge}', secondJudge.metadata.arbiter_name ?? secondJudge.metadata.arbiter_model)
			.replace('{developer}', developers[developer]?.displayName ?? developer)
			.replace('{shared}', $num(judgeComparison.sharedArticles));
	});

	// Loading is the page's: `+page.svelte` requests the arbiter file and the
	// whole panel's scores whenever this view is on screen.
	const loadState = $derived(arbiterV2LoadState.current);
</script>

{#if hasData && arbiterSelectionState.articleId && !selected}<DetailLinkNotice
		onClose={() => (arbiterSelectionState.articleId = null)}
	/>{/if}

<div class="arbiter-view">
	<header class="arbiter-header mb-6">
		<div class="arbiter-eyebrow">
			<GavelIcon size={12} strokeWidth={2.25} aria-hidden="true" />
			<span>{stats.arbiterModel || $t.arbiterV2.modelName}</span>
		</div>
		<h1 class="arbiter-title">{$t.arbiterV2.viewTitle}</h1>
		<p class="arbiter-lede">{$t.arbiterV2.viewSubtitle}</p>
	</header>

	{#if loadState.status === 'error'}
		<ResourceLoadError error={loadState.error} onRetry={() => retryArbiterV2Evaluations(fetch)} />
	{:else if loadState.status === 'idle' || loadState.status === 'loading'}
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
			<ArbiterV2StatsCards {stats} {rows} {data} {corpusTotal} />
		</div>

		<div class="panels-grid mb-6">
			<ChartCard variant="arbiter">
				<h2 class="panel-title">{$t.arbiterV2.byDimension}</h2>
				<div class="dimension-list">
					{#each stats.dimensions as breakdown (breakdown.dimension)}
						<div class="dimension-row">
							<span class="dimension-name">{dimensionName(breakdown.dimension)}</span>
							<ShareBar
								segments={dimensionSegments(breakdown)}
								label={dimensionName(breakdown.dimension)}
							/>
						</div>
					{/each}
				</div>
			</ChartCard>

			<ChartCard variant="arbiter">
				<h2 class="panel-title">{$t.arbiterV2.confidenceDistribution}</h2>
				<ShareBar
					segments={confidenceSegments}
					total={stats.totalEvaluated}
					label={$t.arbiterV2.confidenceDistribution}
				/>
			</ChartCard>
		</div>

		{#if secondJudgeNote}
			<ChartCard variant="arbiter">
				<h2 class="panel-title">{$t.arbiterV2.secondJudgeTitle}</h2>
				<p class="section-lede">{secondJudgeNote}</p>
				<div class="judge-scroll">
					<table class="judge-table">
						<caption class="judge-caption">{$t.arbiterV2.secondJudgeTitle}</caption>
						<thead>
							<tr>
								<th scope="col">{$t.arbiterV2.judgeDimension}</th>
								<th scope="col">{$t.arbiterV2.judgeShared}</th>
								<th scope="col">{$t.arbiterV2.exactMatch}</th>
								<th scope="col">{$t.arbiterV2.withinOne}</th>
								<th scope="col">{$t.arbiterV2.judgeKappa}</th>
							</tr>
						</thead>
						<tbody>
							{#each judgeComparison.dimensions as row (row.dimension)}
								<tr>
									<th scope="row">{dimensionName(row.dimension)}</th>
									<td>{$num(row.shared)}</td>
									<td>
										{row.exact.n > 0 ? $pct(row.exact.share ?? 0, 1) : '—'}
										{#if row.exact.n > 0}
											<span class="judge-ci">
												{$t.arbiterV2.interval}
												{$pct(row.exact.low, 1)}–{$pct(row.exact.high, 1)}
											</span>
										{/if}
									</td>
									<td>
										{row.withinOne.n > 0 ? $pct(row.withinOne.share ?? 0, 1) : '—'}
										{#if row.withinOne.n > 0 && row.withinOne.n !== row.shared}
											<span class="judge-ci">n {$num(row.withinOne.n)}</span>
										{/if}
									</td>
									<td>{row.kappa === null ? '—' : $dec(row.kappa, 2)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</ChartCard>
		{/if}

		<section class="evaluated-articles-section mt-8">
			<div class="section-header mb-4">
				<div class="section-eyebrow">
					<TableIcon size={12} strokeWidth={2.25} aria-hidden="true" />
					<span>{$t.arbiterV2.evaluatedArticles}</span>
				</div>
				<p class="section-lede">{$t.arbiterV2.evaluatedArticlesSubtitle}</p>
			</div>

			<ArbiterV2ArticleTable
				{rows}
				{legend}
				onSelect={(row) => (arbiterSelectionState.articleId = row.articleId)}
			/>
		</section>
	{:else}
		<EmptyState title={$t.arbiterV2.noData} lede={$t.arbiterV2.noDataDescription} />
	{/if}
</div>

<ArbiterV2ArticleDetailModal
	row={selected}
	onClose={() => (arbiterSelectionState.articleId = null)}
/>

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
		/* 26 → 34px, between two steps of the type scale. */
		font-size: clamp(var(--font-size-2xl), calc(var(--font-size-xl) + 1.5vw), var(--font-size-3xl));
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--width-chart-min)), 1fr));
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

	.judge-scroll {
		overflow-x: auto;
		margin-top: var(--space-3);
	}

	.judge-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
	}

	.judge-table th,
	.judge-table td {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
		text-align: left;
		color: var(--text-secondary);
	}

	.judge-table thead th {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
		background: var(--surface-card-elevated);
	}

	.judge-caption {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.judge-ci {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
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

	@media (min-width: 640px) {
		.dimension-row {
			grid-template-columns: 10rem 1fr;
			gap: var(--space-4);
		}
	}
</style>
