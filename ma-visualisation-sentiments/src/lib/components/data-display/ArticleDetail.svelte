<script lang="ts">
	import type { Article } from '$lib/types/data';
	import { getJournalName } from '$lib/utils/format';
	import { getArticleUrl } from '$lib/utils/format';
	import { t } from '$lib/i18n';
	import { fmtDate } from '$lib/i18n/utils';
	import { SentimentBadge } from '$lib/components/common';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import { untrack } from 'svelte';
	import { loadJustifications, justificationsOf } from '$lib/stores';

	let { article }: { article: Article | null } = $props();

	// The model's justification prose is fetched on demand — the charts never
	// need it, so it isn't part of the initial dataset payload. It is merged
	// into the existing analysis object, and `justificationsOf` re-reads it when
	// it lands, without re-rendering anything else. The load runs untracked so
	// this effect follows the article, not every dataset's load state.
	$effect(() => {
		const datasetId = article?.dataset_id;
		const articleId = article?.['o:id'];
		if (datasetId && articleId !== undefined) {
			untrack(() => loadJustifications(datasetId, fetch, [articleId])).catch((error) =>
				console.error('Failed to load article justification:', error)
			);
		}
	});

	const prose = $derived(justificationsOf(article?.sentiment_analysis));
</script>

{#if article}
	<div class="space-y-6">
		<h3 class="article-detail-title">
			{article['o:title'] ?? $t.article.titleNotAvailable}
		</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="article-meta-card">
				<span class="meta-label">{$t.filters.journal}</span>
				<p class="meta-value">{getJournalName(article)}</p>
			</div>
			<div class="article-meta-card">
				<span class="meta-label">{$t.article.publicationDate}</span>
				<p class="meta-value">{$fmtDate(article.publication_date)}</p>
			</div>
		</div>

		{#if article.iiif_manifest}
			<IIIFViewer manifestUrl={article.iiif_manifest} articleUrl={getArticleUrl(article['o:id'])} />
		{/if}

		<div class="article-meta-card">
			<span class="meta-label">{$t.article.linkToFullArticle}</span>
			<p class="meta-value">
				<a
					href={getArticleUrl(article['o:id'])}
					target="_blank"
					rel="noopener noreferrer"
					class="article-anchor focus-ring"
				>
					{$t.article.consultOriginalArticle}
				</a>
			</p>
		</div>

		{#if article.sentiment_analysis}
			<!-- Centralité -->
			<section class="dimension-section centrality-section">
				<header class="dimension-head">
					<SentimentBadge
						type="centrality"
						value={article.sentiment_analysis.centralite_islam_musulmans ?? 'Non abordé'}
						size="lg"
					/>
					<span class="dimension-label">{$t.analysis.centralitySection}</span>
				</header>

				{#if prose.centrality}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{prose.centrality}
						</blockquote>
					</div>
				{/if}
			</section>

			<!-- Polarité -->
			<section class="dimension-section polarity-section">
				<header class="dimension-head">
					<SentimentBadge type="polarity" value={article.sentiment_analysis.polarite} size="lg" />
					<span class="dimension-label">{$t.analysis.polaritySection}</span>
				</header>

				{#if prose.polarity}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{prose.polarity}
						</blockquote>
					</div>
				{/if}
			</section>

			<!-- Subjectivité -->
			<section class="dimension-section subjectivity-section">
				<header class="dimension-head">
					<SentimentBadge
						type="subjectivity"
						value={article.sentiment_analysis.subjectivite_score}
						size="lg"
					/>
					<span class="dimension-label">{$t.filters.subjectivityScore}</span>
				</header>

				{#if prose.subjectivity}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{prose.subjectivity}
						</blockquote>
					</div>
				{/if}
			</section>
		{:else}
			<div class="article-empty">
				<p class="article-empty-lede">{$t.article.noAnalysisData}</p>
			</div>
		{/if}
	</div>
{:else}
	<EmptyState title={$t.article.noArticleSelected} lede={$t.article.selectArticlePrompt} />
{/if}

<style>
	.article-detail-title {
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 1.1rem + 1vw, 1.875rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text-primary);
		letter-spacing: var(--tracking-snug);
		margin: 0;
		max-width: 60ch;
	}

	.article-meta-card {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
	}

	.meta-label {
		display: block;
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.meta-value {
		font-family: var(--font-sans);
		font-size: var(--font-size-base);
		color: var(--text-primary);
		margin-top: var(--space-2);
	}

	.article-anchor {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		border-bottom: 1px solid currentColor;
		padding-bottom: 1px;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.article-anchor:hover {
		color: var(--text-primary);
	}

	.dimension-section {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-5);
	}

	.centrality-section {
		border-top: 2px solid var(--sentiment-centrality-very-central);
	}

	.polarity-section {
		border-top: 2px solid var(--sentiment-polarity-neutral);
	}

	.subjectivity-section {
		border-top: 2px solid var(--sentiment-subjectivity-3);
	}

	.dimension-head {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-bottom: var(--space-4);
		margin-bottom: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
	}

	@media (min-width: 640px) {
		.dimension-head {
			flex-direction: row;
			align-items: center;
			gap: var(--space-3);
		}
	}

	.dimension-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.justification-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.justification-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.justification {
		position: relative;
		font-family: var(--font-display);
		font-size: var(--font-size-base);
		font-style: italic;
		line-height: 1.65;
		color: var(--text-secondary);
		padding-left: var(--space-6);
		margin: 0;
	}

	.justification::before {
		content: '\201C';
		position: absolute;
		top: -0.5rem;
		left: 0;
		font-family: var(--font-display);
		font-size: var(--size-quote-glyph);
		font-style: normal;
		line-height: 1;
		color: var(--text-faint);
	}

	.article-empty {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-6);
		text-align: center;
	}

	.article-empty-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		max-width: 40ch;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		.justification {
			font-size: var(--font-size-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-anchor {
			transition: none;
		}
	}
</style>
