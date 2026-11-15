<!--
  ArbiterV2StatsCards

  The panel arbiter's headline: how often each model's rating is the arbiter's
  own rating, per dimension, with a Wilson 95% interval and n. Computed live
  from the loaded file and the panel's ratings.

  WHY NOT THE WIN TALLY. The cards used to lead with "preferred overall" wins
  per model. On the published run that ranking separates models that give the
  judge's own polarity about equally often (190–205 of 301 for four of them)
  and mostly follows closeness on subjectivity: the model that matches the
  judge's polarity most often is named winner second least. The tally is kept,
  demoted to a secondary block with a sentence saying what it follows. No
  figure about the run is typed here or in the catalogue; every number comes
  from the functions in `utils/arbiterV2.ts`, which a test pins to the file.

  WHOSE PANEL. Match rates and the dissenter sentence run over
  `metadata.models` — the five the judge read. The recused model (the
  generation minus that list, from `datasetIdsOf('v2')`) gets its own row,
  marked as not judged and unlettered, because comparing it with the verdict
  afterwards is the only thing recusal allows.

  Nothing here counts the models: the table grows a row per model, and the
  bars and legends wrap.
-->
<script lang="ts">
	import type { ArbiterV2Statistics } from '#lib/stores/arbiterV2.svelte.js';
	import { datasetState } from '#lib/stores/datasets.svelte.js';
	import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
	import type { ArbiterV2EvaluationData, DatasetId } from '#lib/types/data.js';
	import {
		ARBITER_V2_DIMENSIONS,
		arbiterMatchRates,
		judgeSubjectiveCount,
		loneDissenters,
		type ArbiterModelMatch,
		type ArbiterV2Row
	} from '#lib/utils/arbiterV2.js';
	import type { Proportion } from '#lib/utils/stats.js';
	import { num, pct } from '#lib/i18n/utils.js';
	import { t } from '#lib/i18n/index.js';
	import { asset } from '$app/paths';
	import ShareBar, { type ShareSegment } from '#lib/components/common/ShareBar.svelte';
	import StatCard from '#lib/components/common/StatCard.svelte';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';

	interface ArbiterV2StatsCardsProps {
		stats: ArbiterV2Statistics;
		/** The verdicts joined to the panel's ratings. */
		rows: ArbiterV2Row[];
		data: ArbiterV2EvaluationData | null;
		/** Articles in the corpus, for the frame's share; 0 while loading. */
		corpusTotal: number;
	}

	let { stats, rows, data, corpusTotal }: ArbiterV2StatsCardsProps = $props();

	const judgedIds = $derived(stats.models.map((model) => model.modelId));
	const recusedIds = $derived(
		datasetIdsOf('v2').filter((id) => !(judgedIds as readonly DatasetId[]).includes(id))
	);
	const matches = $derived(arbiterMatchRates(rows, judgedIds));
	const recusedMatches = $derived(arbiterMatchRates(rows, recusedIds));
	const panelLoaded = $derived(matches.every((match) => match.loaded));
	const dissent = $derived(loneDissenters(rows, judgedIds));
	const subjective = $derived(judgeSubjectiveCount(data));

	function nameOf(modelId: DatasetId): string {
		return (
			stats.models.find((model) => model.modelId === modelId)?.name ??
			datasetState.getById(modelId)?.name ??
			modelId
		);
	}

	function colorOf(modelId: DatasetId): string | undefined {
		return datasetState.getById(modelId)?.color;
	}

	function labelOf(modelId: DatasetId): string | null {
		return stats.models.find((model) => model.modelId === modelId)?.label.toUpperCase() ?? null;
	}

	function interval(value: Proportion): string {
		return `${$pct(value.low, 1)}–${$pct(value.high, 1)}`;
	}

	const dissentSentence = $derived.by(() => {
		const [first, second] = dissent.models;
		if (dissent.compared === 0 || !first || first.total === 0) return '';
		return $t.arbiterV2.loneDissenterNote
			.replace('{model}', nameOf(first.modelId))
			.replace('{count}', $num(first.total))
			.replace('{total}', $num(dissent.compared))
			.replace('{negative}', $num(first.negative))
			.replace('{next}', $num(second?.total ?? 0));
	});

	const frameSentence = $derived.by(() => {
		if (corpusTotal <= 0 || stats.totalEvaluated <= 0 || subjective.n === 0) return '';
		return $t.arbiterV2.frameShareNote
			.replace('{share}', $pct(stats.totalEvaluated / corpusTotal, 1))
			.replace('{evaluated}', $num(stats.totalEvaluated))
			.replace('{corpus}', $num(corpusTotal))
			.replace('{subjective}', $num(subjective.successes))
			.replace('{subjectiveShare}', $pct(subjective.share ?? 0, 0));
	});

	const winnerSegments = $derived<ShareSegment[]>([
		...stats.models.map((model) => ({
			key: model.modelId,
			label: `${model.name} (${model.label.toUpperCase()})`,
			count: model.overallWins,
			color: colorOf(model.modelId)
		})),
		{
			key: 'multiple',
			label: $t.arbiterV2.multiple,
			count: stats.overallMultiple,
			pattern: 'hatch'
		},
		{ key: 'none', label: $t.arbiterV2.none, count: stats.overallNone, pattern: 'hatch' }
	]);
</script>

{#snippet matchRow(match: ArbiterModelMatch, recused: boolean)}
	{@const dataset = datasetState.getById(match.modelId)}
	<tr data-recused={recused}>
		<th scope="row" class="model-cell">
			<!-- Flex lives on an inner wrapper: on the <th> itself it would
			     override display: table-cell and collapse the row. -->
			<span class="model-wrap" style:--model-color={colorOf(match.modelId)}>
				<span class="model-mark">
					{#if dataset?.logo}
						<img src={asset(dataset.logo)} alt="" class="model-logo" />
					{/if}
				</span>
				<span class="model-text">
					<span class="model-name">{nameOf(match.modelId)}</span>
					{#if recused}
						<span class="model-tag">{$t.arbiterV2.recusedRow}</span>
					{:else}
						<span class="model-tag">{$t.arbiterV2.blindLabel} {labelOf(match.modelId)}</span>
					{/if}
				</span>
			</span>
		</th>
		{#each ARBITER_V2_DIMENSIONS as dimension (dimension)}
			{@const rate = match.dimensions[dimension]}
			<td class="rate-cell">
				{#if rate.exact.n > 0}
					<span class="rate-value">{$pct(rate.exact.share ?? 0, 1)}</span>
					<span class="rate-detail">
						{$t.arbiterV2.interval}
						{interval(rate.exact)} · n {$num(rate.exact.n)}
					</span>
					{#if rate.withinOne.n > 0}
						<span class="rate-detail">
							{$t.arbiterV2.withinOne}
							{$pct(rate.withinOne.share ?? 0, 1)}
							{#if rate.withinOne.n !== rate.exact.n}· n {$num(rate.withinOne.n)}{/if}
						</span>
					{/if}
				{:else}
					<span class="rate-detail">—</span>
				{/if}
			</td>
		{/each}
	</tr>
{/snippet}

<div class="headline">
	<StatCard
		layout="inline"
		label={$t.arbiterV2.articlesEvaluated}
		value={$num(stats.totalEvaluated)}
		accent="neutral"
	>
		{#snippet icon()}<BarChart3Icon size={20} aria-hidden="true" />{/snippet}
	</StatCard>

	<section class="match-section" aria-labelledby="arbiter-match-title">
		<h2 id="arbiter-match-title" class="match-title">{$t.arbiterV2.matchRatesTitle}</h2>
		<p class="match-note">{$t.arbiterV2.matchRatesNote}</p>

		{#if !panelLoaded}
			<p class="match-note">{$t.arbiterV2.panelLoading}</p>
		{:else}
			<div class="table-scroll">
				<table class="match-table">
					<caption class="visually-hidden">{$t.arbiterV2.matchRatesTitle}</caption>
					<thead>
						<tr>
							<th scope="col">{$t.arbiterV2.matchModel}</th>
							{#each ARBITER_V2_DIMENSIONS as dimension (dimension)}
								<th scope="col">{$t.arbiterV2[dimension]} · {$t.arbiterV2.exactMatch}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each matches as match (match.modelId)}
							{@render matchRow(match, false)}
						{/each}
						{#each recusedMatches.filter((match) => match.loaded) as match (match.modelId)}
							{@render matchRow(match, true)}
						{/each}
					</tbody>
				</table>
			</div>
			{#if recusedIds.length > 0}
				<p class="match-note">
					{$t.arbiterV2.recusedRowNote.replace(
						'{models}',
						recusedIds.map((id) => nameOf(id)).join(', ')
					)}
				</p>
			{/if}
		{/if}
	</section>
</div>

<div class="caveats">
	<p class="tie-note">{$t.arbiterV2.dimensionTieNote}</p>
	{#if dissentSentence}<p class="tie-note">{dissentSentence}</p>{/if}
	{#if frameSentence}<p class="tie-note">{frameSentence}</p>{/if}
</div>

{#if stats.totalEvaluated > 0}
	<section class="overall-section mt-4" aria-labelledby="arbiter-winner-title">
		<div class="overall-header">
			<h2 id="arbiter-winner-title" class="overall-title">{$t.arbiterV2.winnerTallyTitle}</h2>
			<span class="overall-subtitle">{$t.arbiterV2.overallVerdictsNote}</span>
		</div>
		<p class="match-note">{$t.arbiterV2.winnerTallyNote}</p>
		<ShareBar
			segments={winnerSegments}
			total={stats.totalEvaluated}
			label={$t.arbiterV2.winnerTallyTitle}
		/>
	</section>
{/if}

<style>
	.headline {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-4);
	}

	.match-table thead th {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.match-section,
	.overall-section {
		padding: var(--pad-card-compact);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		min-width: 0;
	}

	.match-title,
	.overall-title {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.match-note,
	.tie-note {
		margin: var(--space-2) 0;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
	}

	.caveats {
		margin-top: var(--space-3);
		padding-top: var(--space-2);
		border-top: 1px dashed var(--border-subtle);
	}

	.table-scroll {
		overflow-x: auto;
		margin-top: var(--space-3);
	}

	.match-table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	.match-table thead th {
		text-align: left;
		padding: var(--space-2) var(--space-3);
		background: var(--surface-card-elevated);
		border-bottom: 1px solid var(--border-default);
	}

	.match-table td,
	.match-table tbody th {
		padding: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
		vertical-align: top;
		text-align: left;
	}

	/* The recused row is a comparison, not a judged analysis: set apart by a
	   dashed rule and a word, never by colour alone. */
	.match-table tr[data-recused='true'] td,
	.match-table tr[data-recused='true'] th {
		border-top: 1px dashed var(--border-strong);
	}

	.model-cell {
		min-width: 12rem;
		font-weight: 400;
	}

	.model-wrap {
		--model-color: var(--border-default);
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.model-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		flex-shrink: 0;
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-bottom: 2px solid var(--model-color);
	}

	.model-logo {
		width: var(--size-icon-md);
		height: var(--size-icon-md);
		object-fit: contain;
	}

	.model-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.model-name {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

	.model-tag {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		letter-spacing: var(--tracking-wide);
		color: var(--text-muted);
	}

	.rate-cell {
		min-width: 9rem;
	}

	.rate-value {
		display: block;
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.1;
	}

	.rate-detail {
		display: block;
		margin-top: var(--space-1);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.overall-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
	}

	.overall-subtitle {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (min-width: 640px) {
		.match-section,
		.overall-section {
			padding: var(--pad-card);
		}
	}
</style>
