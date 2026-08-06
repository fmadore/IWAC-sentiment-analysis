<!--
  ArbiterArticleDetailModal Component

  Article details with arbiter evaluation: metadata, side-by-side model
  comparison, and the arbiter verdict. Uses the shared FullScreenModal
  wrapper (like ArticleDetailModal / ComparisonDetailModal) for consistent
  chrome, scroll locking and Escape handling.
-->
<script lang="ts">
	import type { ArbiterAnalysis } from '$lib/types/data';
	import { comparisonState, datasetState, loadJustifications } from '$lib/stores';
	import { getPairModelNames } from '$lib/types/data';
	import { t } from '$lib/i18n';
	import { getJournalName } from '$lib/utils/format';
	import { formatDate, getArticleUrl } from '$lib/utils/format';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import { ComparisonPanel, ArbiterSection } from '$lib/components/common';
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
	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	// Both models' justification prose loads on demand (see articles.svelte.ts).
	$effect(() => {
		if (comparison) {
			loadJustifications(comparison.modelAId);
			loadJustifications(comparison.modelBId);
		}
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

			<!-- Model Comparison — shared ComparisonPanel (same component as ComparisonDetail) -->
			<div class="model-comparison mb-6">
				<h4 class="section-title">
					{$t.comparison?.compareDimensions || 'Compare Dimensions'}
				</h4>

				<div class="dimension-sections">
					<div>
						<span class="dimension-eyebrow">{$t.comparison?.polarity || 'Polarity'}</span>
						<ComparisonPanel
							compact
							dimension="polarity"
							modelAName={modelNames.modelAName}
							modelAValue={comparison.modelA?.polarite}
							modelAJustification={comparison.modelA?.polarite_justification}
							modelBName={modelNames.modelBName}
							modelBValue={comparison.modelB?.polarite}
							modelBJustification={comparison.modelB?.polarite_justification}
						/>
					</div>
					<div>
						<span class="dimension-eyebrow">{$t.comparison?.subjectivity || 'Subjectivity'}</span>
						<ComparisonPanel
							compact
							dimension="subjectivity"
							modelAName={modelNames.modelAName}
							modelAValue={comparison.modelA?.subjectivite_score}
							modelAJustification={comparison.modelA?.subjectivite_justification}
							modelBName={modelNames.modelBName}
							modelBValue={comparison.modelB?.subjectivite_score}
							modelBJustification={comparison.modelB?.subjectivite_justification}
						/>
					</div>
					<div>
						<span class="dimension-eyebrow">{$t.comparison?.centrality || 'Centrality'}</span>
						<ComparisonPanel
							compact
							dimension="centrality"
							modelAName={modelNames.modelAName}
							modelAValue={comparison.modelA?.centralite_islam_musulmans}
							modelAJustification={comparison.modelA?.centralite_justification}
							modelBName={modelNames.modelBName}
							modelBValue={comparison.modelB?.centralite_islam_musulmans}
							modelBJustification={comparison.modelB?.centralite_justification}
						/>
					</div>
				</div>
			</div>

			<!-- Arbiter Section -->
			<ArbiterSection {articleId} initiallyOpen={true} />
		{:else}
			<!-- Article not found in comparison data -->
			<div class="article-metadata mb-6">
				<h3 class="article-title">Article {articleId}</h3>
				<p class="metadata-fallback">{$t.messages?.noData || 'Article data not available'}</p>
			</div>

			<!-- Still show arbiter section -->
			<ArbiterSection {articleId} initiallyOpen={true} />
		{/if}
	</FullScreenModal>
{/if}

<style>
	.article-title {
		font-size: var(--font-size-2xl);
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
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: var(--tracking-wider);
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
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-muted);
		margin-bottom: var(--space-4);
		text-transform: uppercase;
		letter-spacing: var(--tracking-widest);
	}

	.dimension-sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.dimension-eyebrow {
		display: block;
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	@media (min-width: 640px) {
		.article-title {
			font-size: var(--font-size-3xl);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-link {
			transition: none;
		}
	}

	.metadata-fallback {
		color: var(--text-muted);
	}
</style>
