<script lang="ts">
	import type { Article } from '$lib/types/data';
	import { getJournalName } from '$lib/utils';
	import { formatDate, getArticleUrl } from '$lib/utils/format';
	import { t } from '$lib/i18n';
	import { SentimentBadge } from '$lib/components/common';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';

	// Props: Accept article as a prop
	let { article }: { article: Article | null } = $props();
</script>

{#if article}
	<div class="space-y-6">
		<h3 class="h3 text-white text-balance article-detail-title">
			{article['o:title'] ?? $t.article.titleNotAvailable}
		</h3>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="article-meta-card card preset-glass p-4 hover-lift-sm">
				<span class="text-xs uppercase font-bold opacity-75 text-white/60"
					>{$t.filters.journal}</span
				>
				<p class="text-white mt-2 font-medium">{getJournalName(article)}</p>
			</div>
			<div class="article-meta-card card preset-glass p-4 hover-lift-sm">
				<span class="text-xs uppercase font-bold opacity-75 text-white/60"
					>{$t.article.publicationDate}</span
				>
				<p class="text-white mt-2 font-medium">{formatDate(article.publication_date)}</p>
			</div>
		</div>

		{#if article.iiif_manifest}
			<IIIFViewer manifestUrl={article.iiif_manifest} articleUrl={getArticleUrl(article['o:id'])} />
		{/if}

		<div class="article-meta-card card preset-glass p-4 hover-lift-sm">
			<span class="text-xs uppercase font-bold opacity-75 text-white/60"
				>{$t.article.linkToFullArticle}</span
			>
			<p class="text-white mt-2">
				<a
					href={getArticleUrl(article['o:id'])}
					target="_blank"
					class="anchor hover-glow focus-ring"
				>
					{$t.article.consultOriginalArticle}
				</a>
			</p>
		</div>

		{#if article.sentiment_analysis}
			<!-- Centralité -->
			<div class="card preset-glass-lg p-5 hover-lift-sm border-gradient centrality-section">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
					<SentimentBadge
						type="centrality"
						value={article.sentiment_analysis.centralite_islam_musulmans ?? 'Non abordé'}
						size="lg"
					/>
					<span class="text-sm uppercase font-bold opacity-75 text-white/80"
						>{$t.analysis.centralitySection}</span
					>
				</div>

				{#if article.sentiment_analysis.centralite_justification}
					<div class="mt-4">
						<span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block"
							>{$t.article.justification}</span
						>
						<blockquote
							class="blockquote-centrality card preset-glass p-4 italic text-white/90 leading-relaxed"
						>
							{article.sentiment_analysis.centralite_justification}
						</blockquote>
					</div>
				{/if}
			</div>

			<!-- Polarité -->
			<div class="card preset-glass-lg p-5 hover-lift-sm border-gradient polarity-section">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
					<SentimentBadge type="polarity" value={article.sentiment_analysis.polarite} size="lg" />
					<span class="text-sm uppercase font-bold opacity-75 text-white/80"
						>{$t.analysis.polaritySection}</span
					>
				</div>

				{#if article.sentiment_analysis.polarite_justification}
					<div class="mt-4">
						<span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block"
							>{$t.article.justification}</span
						>
						<blockquote
							class="blockquote-polarity card preset-glass p-4 italic text-white/90 leading-relaxed"
						>
							{article.sentiment_analysis.polarite_justification}
						</blockquote>
					</div>
				{/if}
			</div>

			<!-- Subjectivité -->
			<div class="card preset-glass-lg p-5 hover-lift-sm border-gradient subjectivity-section">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
					<SentimentBadge
						type="subjectivity"
						value={article.sentiment_analysis.subjectivite_score}
						size="lg"
					/>
					<span class="text-sm uppercase font-bold opacity-75 text-white/80"
						>{$t.filters.subjectivityScore}</span
					>
				</div>

				{#if article.sentiment_analysis.subjectivite_justification}
					<div class="mt-4">
						<span class="text-xs uppercase font-bold opacity-75 text-white/60 mb-2 block"
							>{$t.article.justification}</span
						>
						<blockquote
							class="blockquote-subjectivity card preset-glass p-4 italic text-white/90 leading-relaxed"
						>
							{article.sentiment_analysis.subjectivite_justification}
						</blockquote>
					</div>
				{/if}
			</div>
		{:else}
			<div class="card preset-glass p-6 text-center hover-lift-sm">
				<p class="text-white/80 text-balance">{$t.article.noAnalysisData}</p>
			</div>
		{/if}
	</div>
{:else}
	<div
		class="article-empty-state card preset-glass p-8 flex flex-col items-center justify-center min-h-[300px] text-center hover-lift-sm"
	>
		<div class="mb-4 opacity-50">
			<svg class="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		</div>
		<h4 class="h4 text-white/80 mb-2">{$t.article.noArticleSelected}</h4>
		<p class="text-white/60 text-balance max-w-md">{$t.article.selectArticlePrompt}</p>
	</div>
{/if}

<style>
	/* ==============================================
     Title Styling
     ============================================== */
	.article-detail-title {
		background: var(--gradient-header);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* ==============================================
     Metadata Cards
     ============================================== */
	.article-meta-card {
		background: color-mix(in oklab, var(--color-primary-500) 5%, transparent) !important;
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 15%, transparent) !important;
	}

	.article-meta-card:hover {
		background: color-mix(in oklab, var(--color-primary-500) 8%, transparent) !important;
		border-color: color-mix(in oklab, var(--color-primary-500) 25%, transparent) !important;
	}

	/* ==============================================
     Empty State
     ============================================== */
	.article-empty-state {
		background: color-mix(in oklab, var(--color-primary-500) 5%, transparent) !important;
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 15%, transparent) !important;
	}

	/* ==============================================
     Section Styles with Dimension Accents
     ============================================== */

	/* Centrality Section - Gold/Yellow accent (matches semantic colors) */
	.centrality-section {
		position: relative;
		overflow: hidden;
	}

	.centrality-section::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-centrality-very-central),
			var(--sentiment-centrality-central)
		);
		opacity: 0.8;
	}

	.blockquote-centrality {
		border-left: 4px solid var(--sentiment-centrality-central) !important;
	}

	/* Polarity Section - Blue/Green accent */
	.polarity-section {
		position: relative;
		overflow: hidden;
	}

	.polarity-section::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-polarity-very-positive),
			var(--sentiment-polarity-neutral)
		);
		opacity: 0.8;
	}

	.blockquote-polarity {
		border-left: 4px solid var(--sentiment-polarity-neutral) !important;
	}

	/* Subjectivity Section - Purple/Cyan accent */
	.subjectivity-section {
		position: relative;
		overflow: hidden;
	}

	.subjectivity-section::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-subjectivity-1),
			var(--sentiment-subjectivity-3)
		);
		opacity: 0.8;
	}

	.blockquote-subjectivity {
		border-left: 4px solid var(--sentiment-subjectivity-3) !important;
	}

	/* ==============================================
     Anchor/Link Styling
     ============================================== */
	.anchor {
		color: var(--color-primary-400);
		text-decoration: none;
		font-weight: 500;
		transition: all var(--timing-fast) var(--easing-default);
		border-bottom: 1px solid color-mix(in oklab, var(--color-primary-400) 30%, transparent);
		padding-bottom: 1px;
	}

	.anchor:hover {
		color: var(--color-primary-300);
		border-bottom-color: color-mix(in oklab, var(--color-primary-300) 60%, transparent);
		transform: translateY(-1px);
	}

	/* ==============================================
     Blockquote Styling
     ============================================== */
	blockquote {
		position: relative;
		font-style: italic;
		line-height: 1.6;
	}

	blockquote::before {
		content: '"';
		position: absolute;
		top: -0.5rem;
		left: -0.5rem;
		font-size: 2rem;
		color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
		font-family: serif;
	}

	/* ==============================================
     Hover Effects
     ============================================== */
	:global(.hover-lift-sm:hover) {
		transform: translateY(-2px);
		box-shadow:
			0 10px 25px -5px color-mix(in oklab, black 30%, transparent),
			0 10px 10px -5px color-mix(in oklab, black 10%, transparent),
			0 0 20px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
		border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
	}

	:global(.border-gradient) {
		position: relative;
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	:global(.border-gradient::before) {
		content: '';
		position: absolute;
		top: -1px;
		left: -1px;
		right: -1px;
		bottom: -1px;
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-primary-500) 30%, transparent),
			color-mix(in oklab, var(--color-secondary-500) 30%, transparent),
			color-mix(in oklab, var(--color-tertiary-500) 30%, transparent)
		);
		border-radius: inherit;
		z-index: -1;
		opacity: 0;
		transition: opacity var(--timing-normal) var(--easing-default);
	}

	:global(.border-gradient:hover::before) {
		opacity: 1;
	}

	/* ==============================================
     Cursor Behavior
     ============================================== */
	:global(.card) {
		cursor: default;
	}

	:global(.card *) {
		cursor: inherit;
	}

	:global(.anchor) {
		cursor: pointer !important;
	}

	/* ==============================================
     Responsive Adjustments
     ============================================== */
	@media (max-width: 640px) {
		blockquote {
			font-size: 0.875rem;
			padding: 0.75rem;
		}

		:global(.hover-lift-sm:hover) {
			transform: translateY(-1px);
		}
	}

	/* ==============================================
     Reduced Motion
     ============================================== */
	@media (prefers-reduced-motion: reduce) {
		.anchor,
		:global(.hover-lift-sm),
		:global(.border-gradient::before) {
			transition: none;
		}
	}
</style>
