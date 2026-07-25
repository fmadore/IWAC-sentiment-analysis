<!--
  ComparisonDetail Component
  
  Displays detailed comparison between ChatGPT and Gemini analysis for an article.
  Shows article metadata, discrepancy summary, dimension comparisons, and arbiter verdict.
  
  Features:
  - Article metadata display (journal, date, link)
  - Overall discrepancy summary with per-dimension breakdown
  - Side-by-side comparison panels for each dimension
  - Arbiter section for AI judge verdict
  
  Refactored to use:
  - ComparisonPanel for dimension comparisons
  - ArbiterSection for arbiter verdict
-->
<script lang="ts">
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import type { ComparisonData } from '$lib/types/data';
	import { ComparisonPanel, ArbiterSection } from '$lib/components/common';
	import { getJournalName } from '$lib/utils/format';
	import { formatDate, getArticleUrl, getModelDisplayName } from '$lib/utils/format';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import { getDiffClass, getDiffBadgeClass } from '$lib/utils/discrepancy';
	import { t } from '$lib/i18n';
	import { datasetState, getArbiterForArticle, loadJustifications } from '$lib/stores';

	// Props: Accept comparison data as a prop
	let { comparison }: { comparison: ComparisonData | null } = $props();

	// Both models' justification prose loads on demand (see articles.svelte.ts);
	// a comparison detail needs each side's reasoning, not just the scores.
	$effect(() => {
		if (comparison) {
			loadJustifications(comparison.modelAId);
			loadJustifications(comparison.modelBId);
		}
	});

	// Check if arbiter data exists for this article
	const hasArbiterData = $derived(
		comparison ? getArbiterForArticle(comparison.article['o:id']) !== null : false
	);

	const modelAName = $derived(
		comparison ? getModelDisplayName(comparison.modelAId, datasetState.available) : 'Model A'
	);
	const modelBName = $derived(
		comparison ? getModelDisplayName(comparison.modelBId, datasetState.available) : 'Model B'
	);
</script>

{#if comparison}
	<div class="space-y-6">
		<h3 class="comparison-detail-title">
			{comparison.article['o:title'] ?? $t.article.titleNotAvailable}
		</h3>

		<!-- Article metadata -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="comparison-metadata-card">
				<span class="meta-label">{$t.filters.journal}</span>
				<p class="meta-value">{getJournalName(comparison.article)}</p>
			</div>
			<div class="comparison-metadata-card">
				<span class="meta-label">{$t.article.publicationDate}</span>
				<p class="meta-value">{formatDate(comparison.article.publication_date)}</p>
			</div>
		</div>

		<!-- Article viewer -->
		{#if comparison.article.iiif_manifest}
			<IIIFViewer
				manifestUrl={comparison.article.iiif_manifest}
				articleUrl={getArticleUrl(comparison.article['o:id'])}
			/>
		{/if}

		<!-- Link to full article -->
		<div class="comparison-metadata-card">
			<span class="meta-label">{$t.article.linkToFullArticle}</span>
			<p class="meta-value">
				<a
					href={getArticleUrl(comparison.article['o:id'])}
					target="_blank"
					rel="noopener noreferrer"
					class="comparison-anchor focus-ring"
				>
					{$t.article.consultOriginalArticle}
				</a>
			</p>
		</div>

		<!-- Overall discrepancy summary -->
		<div class="comparison-section discrepancy-section">
			<div class="section-head">
				<span class="section-eyebrow">{$t.comparison.totalDiscrepancy}</span>
				<span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
					{comparison.discrepancies.totalDiff}
					{comparison.discrepancies.totalDiff === 1
						? $t.comparison.pointDifference
						: $t.comparison.pointsDifference}
				</span>
			</div>
			<div class="diff-grid">
				<div class="diff-cell">
					<div class="diff-cell-label">{$t.comparison.polarity}</div>
					<div class="diff-cell-value {getDiffClass(comparison.discrepancies.polarityDiff)}">
						{comparison.discrepancies.polarityDiff > 0
							? `±${comparison.discrepancies.polarityDiff}`
							: '='}
					</div>
				</div>
				<div class="diff-cell">
					<div class="diff-cell-label">{$t.comparison.subjectivity}</div>
					<div class="diff-cell-value {getDiffClass(comparison.discrepancies.subjectivityDiff)}">
						{comparison.discrepancies.subjectivityDiff > 0
							? `±${comparison.discrepancies.subjectivityDiff}`
							: '='}
					</div>
				</div>
				<div class="diff-cell">
					<div class="diff-cell-label">{$t.comparison.centrality}</div>
					<div class="diff-cell-value {getDiffClass(comparison.discrepancies.centralityDiff)}">
						{comparison.discrepancies.centralityDiff > 0
							? `±${comparison.discrepancies.centralityDiff}`
							: '='}
					</div>
				</div>
			</div>
		</div>

		<!-- Centralité Comparison -->
		<div class="comparison-section centrality-section">
			<div class="section-head">
				<span class="section-eyebrow">{$t.analysis.centralitySection}</span>
				<span class="badge {getDiffBadgeClass(comparison.discrepancies.centralityDiff)}">
					{comparison.discrepancies.centralityDiff > 0
						? `±${comparison.discrepancies.centralityDiff}`
						: '='}
				</span>
			</div>
			<ComparisonPanel
				dimension="centrality"
				{modelAName}
				modelAValue={comparison.modelA?.centralite_islam_musulmans}
				modelAJustification={comparison.modelA?.centralite_justification}
				{modelBName}
				modelBValue={comparison.modelB?.centralite_islam_musulmans}
				modelBJustification={comparison.modelB?.centralite_justification}
			/>
		</div>

		<!-- Polarité Comparison -->
		<div class="comparison-section polarity-section">
			<div class="section-head">
				<span class="section-eyebrow">{$t.analysis.polaritySection}</span>
				<span class="badge {getDiffBadgeClass(comparison.discrepancies.polarityDiff)}">
					{comparison.discrepancies.polarityDiff > 0
						? `±${comparison.discrepancies.polarityDiff}`
						: '='}
				</span>
			</div>
			<ComparisonPanel
				dimension="polarity"
				{modelAName}
				modelAValue={comparison.modelA?.polarite}
				modelAJustification={comparison.modelA?.polarite_justification}
				{modelBName}
				modelBValue={comparison.modelB?.polarite}
				modelBJustification={comparison.modelB?.polarite_justification}
			/>
		</div>

		<!-- Subjectivité Comparison -->
		<div class="comparison-section subjectivity-section">
			<div class="section-head">
				<span class="section-eyebrow">{$t.filters.subjectivityScore}</span>
				<span class="badge {getDiffBadgeClass(comparison.discrepancies.subjectivityDiff)}">
					{comparison.discrepancies.subjectivityDiff > 0
						? `±${comparison.discrepancies.subjectivityDiff}`
						: '='}
				</span>
			</div>
			<ComparisonPanel
				dimension="subjectivity"
				{modelAName}
				modelAValue={comparison.modelA?.subjectivite_score}
				modelAJustification={comparison.modelA?.subjectivite_justification}
				{modelBName}
				modelBValue={comparison.modelB?.subjectivite_score}
				modelBJustification={comparison.modelB?.subjectivite_justification}
			/>
		</div>

		<!-- Arbiter (Gemini 3 Pro) Verdict Section - Only shown when arbiter data exists -->
		{#if hasArbiterData}
			<ArbiterSection articleId={comparison.article['o:id']} />
		{/if}
	</div>
{:else}
	<EmptyState title={$t.article.noArticleSelected} lede={$t.article.selectArticlePrompt} />
{/if}

<style>
	.comparison-detail-title {
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 1.1rem + 1vw, 1.875rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text-primary);
		letter-spacing: -0.005em;
		margin: 0;
		max-width: 60ch;
	}

	.comparison-metadata-card {
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

	.comparison-anchor {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--sentiment-comparison-light);
		text-decoration: none;
		border-bottom: 1px solid currentColor;
		padding-bottom: 1px;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.comparison-anchor:hover {
		color: var(--text-primary);
	}

	.comparison-section {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: var(--space-5);
	}

	.discrepancy-section {
		border-top: 2px solid var(--sentiment-discrepancy);
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

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.section-eyebrow {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2-5);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		border-radius: 0;
		border: 1px solid var(--border-default);
		background: var(--surface-subtle);
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.badge-lg {
		padding: var(--space-1-5) var(--space-3);
		font-size: 0.75rem;
	}

	.diff-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.diff-cell {
		text-align: center;
		padding: var(--space-3) 0;
		border-left: 1px solid var(--border-subtle);
	}

	.diff-cell:first-child {
		border-left: none;
	}

	.diff-cell-label {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-2);
	}

	.diff-cell-value {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	@media (max-width: 640px) {
		.badge-lg {
			padding: var(--space-1) var(--space-2);
			font-size: 0.625rem;
		}

		.diff-grid {
			grid-template-columns: 1fr;
		}

		.diff-cell {
			border-left: none;
			border-top: 1px solid var(--border-subtle);
		}

		.diff-cell:first-child {
			border-top: none;
		}
	}
</style>
