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
	import type { ArbiterAnalysis, ComparisonData } from '$lib/types/data';
	import { comparisonData, availableDatasets, comparisonPair } from '$lib/stores';
	import { getModelsFromPair } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils';
	import { formatDate, getArticleUrl } from '$lib/utils/format';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import { SentimentBadge, ArbiterSection } from '$lib/components/common';
	import { get } from 'svelte/store';
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
		const comparisons = get(comparisonData);
		return comparisons?.find((c) => String(c.article['o:id']) === String(articleId)) || null;
	});

	// Get model names
	const modelNames = $derived.by(() => {
		const [modelAId, modelBId] = getModelsFromPair($comparisonPair);
		const datasets = $availableDatasets;
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
							<IIIFViewer manifestUrl={comparison.article.iiif_manifest} articleUrl={getArticleUrl(comparison.article['o:id'])} />
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
		background: color-mix(in oklab, black 70%, transparent);
		backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-content {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 95%, transparent),
			color-mix(in oklab, var(--sentiment-arbiter) 5%, var(--color-surface-900))
		);
		border: 1px solid var(--sentiment-arbiter-border);
		border-radius: var(--radius-xl);
		width: 100%;
		max-width: 900px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			var(--shadow-xl),
			0 0 40px var(--sentiment-arbiter-bg);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--sentiment-arbiter-border);
		position: sticky;
		top: 0;
		background: inherit;
		z-index: 1;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		background: linear-gradient(135deg, var(--sentiment-arbiter-light), var(--sentiment-arbiter));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		background: var(--surface-hover);
		border: 1px solid var(--border-default);
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.close-button:hover {
		background: var(--surface-elevated);
		transform: scale(1.05);
	}

	.modal-body {
		padding: var(--space-6);
	}

	.article-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-4);
		line-height: 1.3;
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
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.meta-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.article-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-primary-400);
		font-weight: 500;
		text-decoration: none;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.article-link:hover {
		color: var(--color-primary-300);
		transform: translateX(4px);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
		border-radius: var(--radius-lg);
		padding: var(--space-4);
	}

	.model-a {
		border-color: color-mix(in oklab, #10b981 30%, transparent);
	}

	.model-b {
		border-color: color-mix(in oklab, #8b5cf6 30%, transparent);
	}

	.model-header {
		text-align: center;
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.model-name {
		font-weight: 600;
		font-size: 0.875rem;
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
		font-size: 0.625rem;
		text-transform: uppercase;
		color: var(--text-subtle);
	}

	.vs-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
		font-weight: 700;
		font-size: 0.75rem;
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
			font-size: 1.25rem;
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

		.close-button:hover,
		.article-link:hover {
			transform: none;
		}
	}
</style>
