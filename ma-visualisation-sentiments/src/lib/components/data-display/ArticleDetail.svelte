<script lang="ts">
	import type { Article } from '$lib/types/data';
	import { getJournalName } from '$lib/utils';
	import { formatDate, getArticleUrl } from '$lib/utils/format';
	import { t } from '$lib/i18n';
	import { SentimentBadge } from '$lib/components/common';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';

	let { article }: { article: Article | null } = $props();
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
				<p class="meta-value">{formatDate(article.publication_date)}</p>
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

				{#if article.sentiment_analysis.centralite_justification}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{article.sentiment_analysis.centralite_justification}
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

				{#if article.sentiment_analysis.polarite_justification}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{article.sentiment_analysis.polarite_justification}
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

				{#if article.sentiment_analysis.subjectivite_justification}
					<div class="justification-block">
						<span class="justification-label">{$t.article.justification}</span>
						<blockquote class="justification">
							{article.sentiment_analysis.subjectivite_justification}
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
	<div class="article-empty-state">
		<div class="article-empty-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		</div>
		<h4 class="article-empty-title">{$t.article.noArticleSelected}</h4>
		<p class="article-empty-lede">{$t.article.selectArticlePrompt}</p>
	</div>
{/if}

<style>
	.article-detail-title {
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 1.1rem + 1vw, 1.875rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text-primary);
		letter-spacing: -0.005em;
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
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
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
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--chrome-accent);
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
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.14em;
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
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.justification {
		position: relative;
		font-family: var(--font-display);
		font-size: 1rem;
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
		font-size: 2.5rem;
		font-style: normal;
		line-height: 1;
		color: var(--text-faint);
	}

	.article-empty,
	.article-empty-state {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
	}

	.article-empty {
		padding: var(--space-6);
		text-align: center;
	}

	.article-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		padding: var(--space-8);
		text-align: center;
	}

	.article-empty-icon {
		width: 3rem;
		height: 3rem;
		color: var(--text-faint);
		margin-bottom: var(--space-3);
	}

	.article-empty-icon svg {
		width: 100%;
		height: 100%;
	}

	.article-empty-title {
		font-family: var(--font-display);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.article-empty-lede {
		font-family: var(--font-sans);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		max-width: 40ch;
		margin: 0 auto;
	}

	@media (max-width: 640px) {
		.justification {
			font-size: 0.9375rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-anchor {
			transition: none;
		}
	}
</style>
