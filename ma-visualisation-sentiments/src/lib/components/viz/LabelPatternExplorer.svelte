<script lang="ts">
	import { t, currentLanguage } from '$lib/i18n';
	import { num, pct, translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { articleState } from '$lib/stores/articles.svelte';
	import { datasetState } from '$lib/stores/datasets.svelte';
	import { viewOptionsState } from '$lib/stores/view-options.svelte';
	import { getModelDisplayNames, getJournalName } from '$lib/utils/format';
	import { dimensionScale, type ConsensusRow } from '$lib/utils/consensus';
	import {
		buildLabelPatterns,
		filterLabelPatterns,
		type PatternKind
	} from '$lib/utils/labelPatterns';
	import type { AgreementDimension } from '$lib/utils/agreementData';
	import type { Article } from '$lib/types/data';
	import SectionHead from '../common/SectionHead.svelte';
	import SentimentBadge from '../common/SentimentBadge.svelte';
	import ChartDataTable from '../common/ChartDataTable.svelte';

	let {
		rows,
		models,
		dimension,
		includeDeclined
	}: {
		rows: ConsensusRow[];
		models: readonly string[];
		dimension: AgreementDimension;
		includeDeclined: boolean;
	} = $props();
	const names = $derived(getModelDisplayNames(models, datasetState.availableInGeneration));
	const aggregate = $derived(buildLabelPatterns(rows, dimension, models.length, includeDeclined));
	const patterns = $derived(filterLabelPatterns(aggregate.patterns, viewOptionsState.patternKind));
	const shown = $derived(
		viewOptionsState.patternLimit === 'all'
			? patterns
			: patterns.slice(0, Number(viewOptionsState.patternLimit))
	);
	const selected = $derived(
		patterns.find((pattern) => pattern.key === viewOptionsState.labelPattern)
	);
	const scale = $derived(dimensionScale(dimension, true));
	const byId = $derived(
		new Map(
			(articleState.datasets[datasetState.selected] ?? []).map((article) => [
				String(article['o:id']),
				article
			])
		)
	);
	const selectedArticles = $derived(
		(selected?.articleIds ?? [])
			.map((id) => byId.get(id))
			.filter((article): article is Article => article !== undefined)
	);
	const shownArticles = $derived(selectedArticles.slice(0, viewOptionsState.patternArticles));
	const kinds = $derived({
		all: $t.agreementResearch.allPatterns,
		unanimous: $t.agreementResearch.unanimousPatterns,
		lone: $t.agreementResearch.lonePatterns,
		split: $t.agreementResearch.splitPatterns
	});
	function rawLabel(value: number): string | number {
		return dimension === 'subjectivity'
			? value
			: (scale.labels[scale.ordinals.indexOf(value)] ?? String(value));
	}
	function label(value: number): string {
		return dimension === 'subjectivity'
			? translateSubjectivityScore(value, $currentLanguage)
			: translateSentimentValue(String(rawLabel(value)), $currentLanguage);
	}
	function selectPattern(key: string) {
		viewOptionsState.labelPattern = key;
		viewOptionsState.patternArticles = 25;
	}
</script>

<SectionHead title={$t.agreementResearch.patternsTitle} lede={$t.agreementResearch.patternsNote} />
<div class="chart-toolbar mb-4">
	<label class="toolbar-label" for="pattern-kind">{$t.agreementResearch.patternKind}</label>
	<select
		id="pattern-kind"
		class="select select-sm"
		value={viewOptionsState.patternKind}
		onchange={(event) => (viewOptionsState.patternKind = event.currentTarget.value as PatternKind)}
	>
		{#each Object.entries(kinds) as [key, text] (key)}<option value={key}>{text}</option>{/each}
	</select>
	<label class="toolbar-label" for="pattern-limit">{$t.agreementResearch.patternLimit}</label>
	<select id="pattern-limit" class="select select-sm" bind:value={viewOptionsState.patternLimit}>
		{#each ['10', '25', '50', 'all'] as limit (limit)}<option value={limit}
				>{limit === 'all' ? $t.agreementResearch.allPatterns : $num(Number(limit))}</option
			>{/each}
	</select>
</div>

<p class="chart-note" aria-live="polite">
	{$t.agreementResearch.patternsSummary
		.replace('{shown}', $num(shown.length))
		.replace('{total}', $num(patterns.length))
		.replace('{articles}', $num(aggregate.n))}
</p>

{#if shown.length > 0}
	<div class="pattern-table-wrap">
		<table class="table pattern-table">
			<caption class="sr-only">{$t.agreementResearch.patternsTitle}</caption>
			<thead
				><tr>
					<th scope="col">{$t.agreementResearch.pattern}</th>
					{#each names as name, index (models[index])}<th scope="col">{name}</th>{/each}
					<th scope="col">{$t.agreementResearch.splitSize}</th>
					<th scope="col">{$t.agreementResearch.articles}</th>
					<th scope="col">{$t.agreementResearch.share}</th>
				</tr></thead
			>
			<tbody>
				{#each shown as pattern (pattern.key)}
					<tr data-selected={selected?.key === pattern.key}>
						<th scope="row"
							><button
								type="button"
								class="pattern-button"
								aria-expanded={selected?.key === pattern.key}
								aria-controls="pattern-articles"
								aria-label={$t.agreementResearch.selectPattern.replace(
									'{pattern}',
									pattern.values.map(label).join(' / ')
								)}
								onclick={() => selectPattern(pattern.key)}>{pattern.key}</button
							></th
						>
						{#each pattern.values as value, index (index)}<td
								><SentimentBadge type={dimension} value={rawLabel(value)} size="sm" /></td
							>{/each}
						<td>{pattern.splitSizes.join('–')}</td>
						<td
							><span class="count-cell"
								><span
									class="count-bar"
									aria-hidden="true"
									style:width="{(pattern.count / (shown[0]?.count || 1)) * 100}%"
								></span><span class="count-value">{$num(pattern.count)}</span></span
							></td
						>
						<td>{$pct(pattern.share, 1)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}<p class="chart-empty">{$t.table.noFilteredArticles}</p>{/if}

<ChartDataTable
	columns={[
		{ label: $t.agreementResearch.pattern },
		...names.map((name) => ({ label: name })),
		{ label: $t.agreementResearch.splitSize },
		{ label: $t.agreementResearch.articles, format: 'integer' },
		{ label: $t.agreementResearch.share, format: 'percent', digits: 2 }
	]}
	rows={patterns.map((pattern) => [
		pattern.key,
		...pattern.values.map(label),
		pattern.splitSizes.join('–'),
		pattern.count,
		pattern.share
	])}
	caption={$t.agreementResearch.patternsTitle}
	filenamePrefix={`label-patterns-${datasetState.generation}-${dimension}`}
/>

<section
	id="pattern-articles"
	class="pattern-details"
	aria-label={$t.agreementResearch.patternArticles}
>
	<h3>{$t.agreementResearch.patternArticles}</h3>
	{#if selected}
		<p class="chart-note">
			{$t.agreementResearch.patternSelection}: {selected.values.map(label).join(' / ')}
		</p>
		<p class="chart-note" aria-live="polite">
			{$t.agreementResearch.articleCount
				.replace('{shown}', $num(shownArticles.length))
				.replace('{total}', $num(selectedArticles.length))}
		</p>
		<div class="pattern-table-wrap">
			<table class="table article-pattern-table">
				<caption class="sr-only">{$t.agreementResearch.patternArticles} — {selected.key}</caption>
				<thead
					><tr
						><th scope="col">{$t.agreementResearch.articleTitle}</th><th scope="col"
							>{$t.agreementResearch.articleJournal}</th
						><th scope="col">{$t.agreementResearch.articleYear}</th></tr
					></thead
				>
				<tbody>
					{#each shownArticles as article (article['o:id'])}
						<tr>
							<th scope="row"
								><button
									type="button"
									class="article-button"
									aria-label={$t.agreementResearch.openArticle.replace(
										'{title}',
										article['o:title'] || String(article['o:id'])
									)}
									onclick={() => (articleState.selected = article)}
									>{article['o:title'] || article['o:id']}</button
								></th
							>
							<td>{getJournalName(article)}</td><td
								>{article.publication_date?.slice(0, 4) || '—'}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if shownArticles.length < selectedArticles.length}<button
				type="button"
				class="pattern-button more-button"
				onclick={() => (viewOptionsState.patternArticles += 25)}
				>{$t.agreementResearch.loadMore}</button
			>{/if}
	{:else}<p class="chart-note">
			{viewOptionsState.labelPattern
				? $t.agreementResearch.missingPattern
				: $t.agreementResearch.noPattern}
		</p>{/if}
</section>

<style>
	.pattern-table-wrap {
		overflow-x: auto;
	}
	.pattern-table th,
	.pattern-table td {
		white-space: nowrap;
	}
	.pattern-table tr[data-selected='true'] {
		background: var(--surface-hover);
	}
	.pattern-button,
	.article-button {
		display: inline-flex;
		align-items: center;
		min-height: var(--size-control-lg);
		padding: var(--space-2) var(--space-3);
		gap: var(--space-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		background: var(--surface-subtle);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-align: left;
		cursor: pointer;
	}
	.pattern-button:hover,
	.article-button:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}
	.pattern-button[aria-expanded='true'] {
		color: var(--accent);
		border-color: var(--border-active);
	}
	.article-button {
		padding: var(--space-2);
		background: transparent;
		border-color: transparent;
	}
	.article-pattern-table th {
		width: 65%;
	}
	.count-cell {
		position: relative;
		display: block;
		min-width: 6rem;
		padding: var(--space-2);
	}
	.count-bar {
		position: absolute;
		inset: 0 auto 0 0;
		background: color-mix(in oklab, var(--status-info) 22%, transparent);
	}
	.count-value {
		position: relative;
		font-family: var(--font-mono);
	}
	.pattern-details {
		margin-top: var(--space-5);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-subtle);
	}
	.pattern-details h3 {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		color: var(--text-primary);
		margin-bottom: var(--space-3);
	}
	.more-button {
		margin-top: var(--space-3);
	}
</style>
