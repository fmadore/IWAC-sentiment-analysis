<!--
  PanelRatingsStrip

  The whole panel's reading of one article: every model of the article's own
  generation (`datasetIdsOf`), dimension by dimension, with the selected model
  highlighted. A model whose dataset has not landed yet shows as loading — the
  page requests the generation's panel whenever an article detail is open
  (see `requirements` in +page.svelte), so nothing is fetched from here.

  A null rating is "not annotated" (the model never produced one), shown with
  the shared not-annotated badge and never folded into "Non applicable".
-->
<script module lang="ts">
	import type { Article } from '#lib/types/data.js';

	// One id index per loaded corpus array. The arrays are raw state replaced
	// wholesale on each load, so identity is a sound cache key.
	const indexes = new WeakMap<Article[], Map<string, Article>>();

	function indexOf(articles: Article[]): Map<string, Article> {
		let index = indexes.get(articles);
		if (!index) {
			index = new Map(articles.map((article) => [String(article['o:id']), article]));
			indexes.set(articles, index);
		}
		return index;
	}
</script>

<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { articleState, datasetState } from '#lib/stores/index.js';
	import { datasetIdsOf, generationOf } from '#lib/domain/sentimentContract.js';
	import { analysisValue, ARBITER_V2_DIMENSIONS } from '#lib/utils/arbiterV2.js';
	import PanelRatingChip from './PanelRatingChip.svelte';

	let { article }: { article: Article } = $props();

	const DIMENSIONS = ARBITER_V2_DIMENSIONS;

	const rows = $derived.by(() => {
		const id = String(article['o:id']);
		return datasetIdsOf(generationOf(article.dataset_id)).map((modelId) => {
			const articles = articleState.datasets[modelId];
			const loaded = !!articles && articles.length > 0;
			const found = loaded ? indexOf(articles).get(id) : undefined;
			return {
				modelId,
				name: datasetState.getById(modelId)?.name ?? modelId,
				color: datasetState.getById(modelId)?.color ?? 'var(--border-strong)',
				loaded,
				analysis: found?.sentiment_analysis ?? null,
				selected: modelId === article.dataset_id
			};
		});
	});

	function dimensionName(dimension: (typeof DIMENSIONS)[number]): string {
		return $t.arbiterV2[dimension];
	}
</script>

<section class="panel-ratings" aria-labelledby="panel-ratings-title">
	<h4 class="panel-ratings-title" id="panel-ratings-title">{$t.panelRatings.title}</h4>
	<p class="panel-ratings-note">{$t.panelRatings.note}</p>
	{#each DIMENSIONS as dimension (dimension)}
		<div class="panel-dimension">
			<span class="panel-dimension-label">{dimensionName(dimension)}</span>
			<ul class="panel-chips">
				{#each rows as row (row.modelId)}
					<PanelRatingChip
						name={row.name}
						color={row.color}
						{dimension}
						value={analysisValue(row.analysis, dimension)}
						loaded={row.loaded}
						pendingLabel={$t.messages.loading}
						tag={row.selected ? $t.panelRatings.selected : undefined}
						highlighted={row.selected}
					/>
				{/each}
			</ul>
		</div>
	{/each}
</section>

<style>
	.panel-ratings {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-5);
	}

	.panel-ratings-title {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
	}

	.panel-ratings-note {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: 0;
	}

	.panel-dimension {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.panel-dimension-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	.panel-chips {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-2);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	@media (min-width: 640px) {
		.panel-chips {
			grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		}
	}
</style>
