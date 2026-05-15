<!--
  ArbiterArticleDetailModal Component
  
  Modal for displaying article details with arbiter evaluation.
  Shows article metadata, both models' sentiment analyses, and the arbiter verdict.
  
  Features:
  - Article metadata (title, date, journal, link)
  - Side-by-side model comparison
  - Arbiter verdict section
  - Overlay click to close
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
	import XIcon from '@lucide/svelte/icons/x';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface ArbiterArticleDetailModalProps {
		articleId: string | null;
		arbiterData: ArbiterAnalysis | null;
		onClose: () => void;
	}

	let { articleId, arbiterData, onClose }: ArbiterArticleDetailModalProps = $props();

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

	// Handle overlay click
	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if articleId && arbiterData}
	<!-- Modal Overlay -->
	<div
		class="modal-overlay"
		onclick={handleOverlayClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{$t.arbiter?.articleWithArbiter || 'Article with Arbiter Verdict'}
				</h2>
				<button class="close-button" onclick={onClose} aria-label={$t.common?.close || 'Close'}>
					<XIcon size={24} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				{#if comparison}
					<!-- Article Metadata -->
					<div class="article-metadata mb-6">
						<h3 class="article-title">
							{comparison.article['o:title'] || $t.article?.titleNotAvailable}
						</h3>

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
										<span class="dimension-label"
											>{$t.comparison?.subjectivity || 'Subjectivity'}</span
										>
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
										<span class="dimension-label"
											>{$t.comparison?.subjectivity || 'Subjectivity'}</span
										>
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
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: color-mix(in oklab, black 75%, transparent);
		z-index: var(--z-modal);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		overflow-y: auto;
	}

	.modal-content {
		background: var(--surface-card-elevated);
		border: 1px solid var(--border-default);
		border-top: 2px solid var(--sentiment-arbiter);
		border-radius: var(--radius-md);
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		background: var(--surface-card-elevated);
		z-index: 1;
	}

	.modal-title {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.005em;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-sm);
		background: transparent;
		border: 1px solid var(--border-default);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.close-button:hover {
		background: var(--surface-hover);
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.modal-body {
		padding: var(--space-6);
	}

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

	/* Responsive */
	@media (max-width: 640px) {
		.modal-content {
			max-height: 95vh;
		}

		.modal-header {
			padding: var(--space-4);
		}

		.modal-body {
			padding: var(--space-4);
		}

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

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.close-button,
		.article-link {
			transition: none;
		}
	}
</style>
