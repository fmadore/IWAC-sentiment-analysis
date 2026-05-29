<!--
  ArbiterArticleDetailModal Component

  Article details with arbiter evaluation: metadata, side-by-side model
  comparison, and the arbiter verdict. Uses the shared FullScreenModal
  wrapper (like ArticleDetailModal / ComparisonDetailModal) for consistent
  chrome, scroll locking and Escape handling.
-->
<script lang="ts">
	import type { ArbiterAnalysis } from '$lib/types/data';
	import { comparisonState, datasetState } from '$lib/stores';
	import { getModelsFromPair } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils';
	import { formatDate, getArticleUrl } from '$lib/utils/format';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import { SentimentBadge, ArbiterSection } from '$lib/components/common';
	import FullScreenModal from './FullScreenModal.svelte';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface ArbiterArticleDetailModalProps {
		articleId: string | null;
		arbiterData: ArbiterAnalysis | null;
		onClose: () => void;
	}

	let { articleId, arbiterData, onClose }: ArbiterArticleDetailModalProps = $props();

	const open = $derived(!!(articleId && arbiterData));

	// Get comparison data for this article
	const comparison = $derived.by(() => {
		if (!articleId) return null;
		const comparisons = comparisonState.data;
		return comparisons?.find((c) => String(c.article['o:id']) === String(articleId)) || null;
	});

	// Get model names
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair(datasetState.pair);
		const datasets = datasetState.available;
		const modelAName = datasets.find((d) => d.id === modelAId)?.name || modelAId;
		const modelBName = datasets.find((d) => d.id === modelBId)?.name || modelBId;
		return { modelAName, modelBName };
	});

	const modalTitle = $derived(
		comparison?.article['o:title'] ||
			$t.arbiter?.articleWithArbiter ||
			'Article with Arbiter Verdict'
	);
	const modalSubtitle = $derived(
		comparison
			? `${getJournalName(comparison.article)} • ${formatDate(comparison.article.publication_date)}`
			: ''
	);
</script>

{#if articleId && arbiterData}
	<FullScreenModal
		{open}
		{onClose}
		title={modalTitle}
		subtitle={modalSubtitle}
		accentVariant="arbiter"
	>
		{#snippet headerIcon()}
			<ScaleIcon size={20} />
		{/snippet}

		{#if comparison}
			<!-- Article Metadata -->
			<div class="article-metadata mb-6">
				<div class="meta-grid">
					<div class="meta-card card preset-glass p-4">
						<span class="meta-label">{$t.filters?.journal || 'Newspaper'}</span>
						<p class="meta-value">{getJournalName(comparison.article)}</p>
					</div>
					<div class="meta-card card preset-glass p-4">
						<span class="meta-label">{$t.article?.publicationDate || 'Publication Date'}</span>
						<p class="meta-value">{formatDate(comparison.article.publication_date)}</p>
					</div>
				</div>

				{#if comparison.article.iiif_manifest}
					<IIIFViewer
						manifestUrl={comparison.article.iiif_manifest}
						articleUrl={getArticleUrl(comparison.article['o:id'])}
					/>
				{/if}
				<a
					href={getArticleUrl(comparison.article['o:id'])}
					target="_blank"
					rel="noopener noreferrer"
					class="article-link"
				>
					<ExternalLinkIcon size={16} />
					{$t.article?.consultOriginalArticle || 'View original article →'}
				</a>
			</div>

			<!-- Model Comparison -->
			<div class="model-comparison mb-6">
				<h4 class="section-title">
					{$t.comparison?.compareDimensions || 'Compare Dimensions'}
				</h4>

				<div class="comparison-grid">
					<!-- Model A Column -->
					<div class="model-column model-a">
						<div class="model-header">
							<span class="model-name">{modelNames.modelAName}</span>
						</div>
						<div class="dimension-values">
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.polarity || 'Polarity'}</span>
								<SentimentBadge type="polarity" value={comparison.modelA?.polarite} size="sm" />
							</div>
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
								<SentimentBadge
									type="subjectivity"
									value={comparison.modelA?.subjectivite_score}
									size="sm"
								/>
							</div>
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.centrality || 'Centrality'}</span>
								<SentimentBadge
									type="centrality"
									value={comparison.modelA?.centralite_islam_musulmans}
									size="sm"
								/>
							</div>
						</div>
					</div>

					<!-- VS Divider -->
					<div class="vs-divider">
						<span>VS</span>
					</div>

					<!-- Model B Column -->
					<div class="model-column model-b">
						<div class="model-header">
							<span class="model-name">{modelNames.modelBName}</span>
						</div>
						<div class="dimension-values">
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.polarity || 'Polarity'}</span>
								<SentimentBadge type="polarity" value={comparison.modelB?.polarite} size="sm" />
							</div>
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
								<SentimentBadge
									type="subjectivity"
									value={comparison.modelB?.subjectivite_score}
									size="sm"
								/>
							</div>
							<div class="dimension-row">
								<span class="dimension-label">{$t.comparison?.centrality || 'Centrality'}</span>
								<SentimentBadge
									type="centrality"
									value={comparison.modelB?.centralite_islam_musulmans}
									size="sm"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Arbiter Section -->
			<ArbiterSection {articleId} initiallyOpen={true} />
		{:else}
			<!-- Article not found in comparison data -->
			<div class="article-metadata mb-6">
				<h3 class="article-title">Article {articleId}</h3>
				<p class="text-white/60">{$t.messages?.noData || 'Article data not available'}</p>
			</div>

			<!-- Still show arbiter section -->
			<ArbiterSection {articleId} initiallyOpen={true} />
		{/if}
	</FullScreenModal>
{/if}

<style>
	.article-title {
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin-bottom: var(--space-4);
		line-height: var(--line-height-snug);
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.meta-card {
		background: var(--surface-subtle) !important;
		border: 1px solid var(--border-default) !important;
	}

	.meta-label {
		display: block;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.meta-value {
		color: var(--text-primary);
		font-weight: var(--font-weight-medium);
	}

	.article-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--sentiment-arbiter-light);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.article-link:hover {
		color: var(--text-primary);
		border-bottom-color: currentColor;
	}

	.section-title {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		margin-bottom: var(--space-4);
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}

	.comparison-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--space-4);
		align-items: start;
	}

	.model-column {
		background: var(--surface-subtle);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: var(--space-4);
	}

	.model-a {
		border-top: 2px solid var(--sentiment-trends);
	}

	.model-b {
		border-top: 2px solid var(--sentiment-subjectivity-3);
	}

	.model-header {
		text-align: center;
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.model-name {
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-base);
		color: var(--text-primary);
	}

	.model-a .model-name {
		color: var(--sentiment-trends);
	}

	.model-b .model-name {
		color: var(--sentiment-subjectivity-3);
	}

	.dimension-values {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.dimension-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.dimension-label {
		font-size: var(--font-size-2xs);
		text-transform: uppercase;
		color: var(--text-subtle);
	}

	.vs-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: 0;
		background: transparent;
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 0.625rem;
		letter-spacing: 0.1em;
	}

	@media (max-width: 640px) {
		.article-title {
			font-size: var(--font-size-2xl);
		}

		.comparison-grid {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}

		.vs-divider {
			width: 100%;
			height: auto;
			padding: var(--space-2);
			border-radius: var(--radius-md);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-link {
			transition: none;
		}
	}
</style>
