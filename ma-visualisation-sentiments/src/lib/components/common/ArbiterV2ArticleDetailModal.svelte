<!--
  ArbiterV2ArticleDetailModal

  The article behind a panel verdict: its metadata, the digitised page where
  the collection has one, the link to the record, why the panel's ratings put
  it in front of the arbiter, and then the verdict itself with every rating
  the judge was shown. The v1 counterpart is ArbiterArticleDetailModal; this
  is a sibling rather than a branch of it because the v1 modal is a pairwise
  comparison with an arbiter section underneath, and a panel of five is a
  different page.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { fmtDate } from '$lib/i18n/utils';
	import { getArticleUrl } from '$lib/utils/format';
	import { datasetIdsOf } from '$lib/domain/sentimentContract';
	import { hasPolarityValenceFlip } from '$lib/stores/derivations';
	import type { ArbiterV2Row } from '$lib/utils/arbiterV2';
	import IIIFViewer from '$lib/components/viz/IIIFViewer.svelte';
	import FullScreenModal from './FullScreenModal.svelte';
	import ArbiterV2VerdictPanel from './ArbiterV2VerdictPanel.svelte';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface ArbiterV2ArticleDetailModalProps {
		row: ArbiterV2Row | null;
		onClose: () => void;
	}

	let { row, onClose }: ArbiterV2ArticleDetailModalProps = $props();

	const open = $derived(row !== null);
	const title = $derived(row?.title || $t.arbiterV2.articleWithVerdict);
	const subtitle = $derived(row?.article ? `${row.journal} • ${$fmtDate(row.date)}` : '');

	const panelIds = datasetIdsOf('v2');

	/**
	 * Whether the panel reads the coverage as both favourable and hostile — the
	 * rule the published run selected on. Recomputed from the ratings rather
	 * than read from the file, which deliberately stores only the spread.
	 * Null until every panel dataset has loaded.
	 */
	const valenceFlip = $derived.by(() => {
		if (!row || !panelIds.every((id) => id in row.analyses)) return null;
		return hasPolarityValenceFlip(panelIds.map((id) => row.analyses[id]));
	});
</script>

{#if row}
	<FullScreenModal {open} {onClose} {title} {subtitle} accentVariant="arbiter">
		{#snippet headerIcon()}
			<ScaleIcon size={20} />
		{/snippet}

		<div class="detail">
			{#if row.article}
				<div class="meta-grid">
					<div class="meta-card">
						<span class="meta-label">{$t.filters.journal}</span>
						<p class="meta-value">{row.journal}</p>
					</div>
					<div class="meta-card">
						<span class="meta-label">{$t.article.publicationDate}</span>
						<p class="meta-value">{$fmtDate(row.date)}</p>
					</div>
					<div class="meta-card">
						<span class="meta-label">{$t.filters.country}</span>
						<p class="meta-value">{row.country || $t.messages.noData}</p>
					</div>
				</div>

				{#if row.article.iiif_manifest}
					<IIIFViewer
						manifestUrl={row.article.iiif_manifest}
						articleUrl={getArticleUrl(row.articleId)}
					/>
				{/if}
			{:else}
				<p class="meta-fallback">{$t.messages.noData}</p>
			{/if}

			<a
				href={getArticleUrl(row.articleId)}
				target="_blank"
				rel="noopener noreferrer"
				class="article-link"
			>
				<ExternalLinkIcon size={16} />
				{$t.article.consultOriginalArticle}
			</a>

			<!-- Why the panel's ratings put this article in front of the judge. -->
			<section class="selection">
				<div class="selection-head">
					<span class="meta-label">{$t.arbiterV2.whyReviewed}</span>
					{#if valenceFlip}
						<span class="flip-tag">{$t.arbiterV2.valenceFlipTag}</span>
					{/if}
				</div>
				<div class="spread-grid">
					<div class="spread-cell">
						<span class="spread-label">{$t.arbiterV2.polarity}</span>
						<span class="spread-value">{row.evaluation.spread.polarity_spread}</span>
					</div>
					<div class="spread-cell">
						<span class="spread-label">{$t.arbiterV2.subjectivity}</span>
						<span class="spread-value">{row.evaluation.spread.subjectivity_spread}</span>
					</div>
					<div class="spread-cell">
						<span class="spread-label">{$t.arbiterV2.centrality}</span>
						<span class="spread-value">{row.evaluation.spread.centrality_spread}</span>
					</div>
					<div class="spread-cell spread-total">
						<span class="spread-label">{$t.arbiterV2.spread}</span>
						<span class="spread-value">{row.evaluation.spread.total_spread}</span>
					</div>
				</div>
				<p class="selection-note">{$t.arbiterV2.whyReviewedNote}</p>
			</section>

			<ArbiterV2VerdictPanel {row} />
		</div>
	</FullScreenModal>
{/if}

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--space-4);
	}

	.meta-card {
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
		margin: var(--space-2) 0 0;
	}

	.meta-fallback {
		color: var(--text-muted);
		margin: 0;
	}

	.article-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		align-self: flex-start;
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

	.selection {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-discrepancy);
		padding: var(--space-5);
	}

	.selection-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.flip-tag {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		padding: var(--space-1) var(--space-2-5);
		color: var(--sentiment-discrepancy-light);
		background: var(--sentiment-discrepancy-bg);
		border: 1px solid var(--sentiment-discrepancy-border);
	}

	.spread-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}

	.spread-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3) 0;
		border: 1px solid var(--border-subtle);
	}

	.spread-total {
		background: var(--surface-subtle);
	}

	.spread-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.spread-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-2xl);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
	}

	.selection-note {
		font-family: var(--font-sans);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
		max-width: var(--prose-width);
		margin: var(--space-3) 0 0;
	}

	@media (min-width: 640px) {
		.spread-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.article-link {
			transition: none;
		}
	}
</style>
