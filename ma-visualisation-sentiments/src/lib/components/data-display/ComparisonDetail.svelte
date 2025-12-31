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
	import type { ComparisonData } from '$lib/types/data';
	import { ComparisonPanel, ArbiterSection } from '$lib/components/common';
	import { getJournalName } from '$lib/utils';
	import { t, currentLanguage } from '$lib/i18n';
	import { availableDatasets, getArbiterForArticle } from '$lib/stores';

	// Props: Accept comparison data as a prop
	let { comparison }: { comparison: ComparisonData | null } = $props();

	// Check if arbiter data exists for this article
	const hasArbiterData = $derived(
		comparison ? $getArbiterForArticle(comparison.article['o:id']) !== null : false
	);

	// Get model display names from availableDatasets
	function getModelName(modelId: string): string {
		let datasets: { id: string; name: string }[] = [];
		availableDatasets.subscribe((d) => (datasets = d))();
		return datasets.find((d) => d.id === modelId)?.name || modelId;
	}

	const modelAName = $derived(comparison ? getModelName(comparison.modelAId) : 'Model A');
	const modelBName = $derived(comparison ? getModelName(comparison.modelBId) : 'Model B');

	// Fonction pour formater les dates
	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return $t.messages.noData;

		try {
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) {
				return dateStr;
			}

			const locale = $currentLanguage === 'en' ? 'en-US' : 'fr-FR';
			return date.toLocaleDateString(locale, {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (error) {
			console.error('Erreur lors du formatage de la date:', error);
			return dateStr || '';
		}
	}

	// Fonction pour construire l'URL de l'article complet
	function getArticleUrl(id: string | number | null | undefined): string {
		if (!id) return '#';
		return `https://islam.zmo.de/s/afrique_ouest/item/${id}`;
	}

	// Fonction pour obtenir la classe de différence
	function getDiffClass(diff: number): string {
		if (diff === 0) return 'text-white/40';
		if (diff === 1) return 'text-yellow-400';
		if (diff === 2) return 'text-orange-400';
		return 'text-red-400';
	}

	function getDiffBadgeClass(diff: number): string {
		if (diff === 0) return 'variant-ghost';
		if (diff === 1) return 'variant-soft-warning';
		if (diff === 2) return 'variant-soft-error';
		return 'variant-filled-error';
	}
</script>

{#if comparison}
	<div class="space-y-6">
		<h3 class="h3 text-white text-balance">
			{comparison.article['o:title'] ?? $t.article.titleNotAvailable}
		</h3>

		<!-- Article metadata -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="card variant-glass glass-heavy p-4 hover-lift-sm border-gradient">
				<span class="text-xs uppercase font-bold opacity-75 text-white/60"
					>{$t.filters.journal}</span
				>
				<p class="text-white mt-2 font-medium">{getJournalName(comparison.article)}</p>
			</div>
			<div class="card variant-glass glass-heavy p-4 hover-lift-sm border-gradient">
				<span class="text-xs uppercase font-bold opacity-75 text-white/60"
					>{$t.article.publicationDate}</span
				>
				<p class="text-white mt-2 font-medium">{formatDate(comparison.article.publication_date)}</p>
			</div>
		</div>

		<!-- Link to full article -->
		<div class="card variant-glass glass-heavy p-4 hover-lift-sm border-gradient">
			<span class="text-xs uppercase font-bold opacity-75 text-white/60"
				>{$t.article.linkToFullArticle}</span
			>
			<p class="text-white mt-2">
				<a
					href={getArticleUrl(comparison.article['o:id'])}
					target="_blank"
					class="anchor hover-glow focus-ring"
				>
					{$t.article.consultOriginalArticle}
				</a>
			</p>
		</div>

		<!-- Overall discrepancy summary -->
		<div
			class="discrepancy-section card variant-glass glass-heavy p-5 hover-lift-sm border-gradient discrepancy-gradient"
		>
			<div class="flex items-center justify-between mb-4">
				<h4 class="h4 text-white">{$t.comparison.totalDiscrepancy}</h4>
				<span class="badge badge-lg {getDiffBadgeClass(comparison.discrepancies.totalDiff)}">
					{comparison.discrepancies.totalDiff}
					{comparison.discrepancies.totalDiff === 1
						? $t.comparison.pointDifference
						: $t.comparison.pointsDifference}
				</span>
			</div>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<div class="text-sm text-white/60 mb-1">{$t.comparison.polarity}</div>
					<div class="text-lg font-semibold {getDiffClass(comparison.discrepancies.polarityDiff)}">
						{comparison.discrepancies.polarityDiff > 0
							? `±${comparison.discrepancies.polarityDiff}`
							: '='}
					</div>
				</div>
				<div>
					<div class="text-sm text-white/60 mb-1">{$t.comparison.subjectivity}</div>
					<div
						class="text-lg font-semibold {getDiffClass(comparison.discrepancies.subjectivityDiff)}"
					>
						{comparison.discrepancies.subjectivityDiff > 0
							? `±${comparison.discrepancies.subjectivityDiff}`
							: '='}
					</div>
				</div>
				<div>
					<div class="text-sm text-white/60 mb-1">{$t.comparison.centrality}</div>
					<div
						class="text-lg font-semibold {getDiffClass(comparison.discrepancies.centralityDiff)}"
					>
						{comparison.discrepancies.centralityDiff > 0
							? `±${comparison.discrepancies.centralityDiff}`
							: '='}
					</div>
				</div>
			</div>
		</div>

		<!-- Centralité Comparison -->
		<div
			class="centrality-section card variant-glass glass-heavy p-5 hover-lift-sm border-gradient centrality-gradient"
		>
			<div class="flex items-center gap-3 mb-4">
				<h4 class="h4 text-white">{$t.analysis.centralitySection}</h4>
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
				borderColorA="border-l-blue-400/50"
				borderColorB="border-l-green-400/50"
			/>
		</div>

		<!-- Polarité Comparison -->
		<div
			class="polarity-section card variant-glass glass-heavy p-5 hover-lift-sm border-gradient polarity-gradient"
		>
			<div class="flex items-center gap-3 mb-4">
				<h4 class="h4 text-white">{$t.analysis.polaritySection}</h4>
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
				borderColorA="border-l-purple-400/50"
				borderColorB="border-l-purple-400/50"
			/>
		</div>

		<!-- Subjectivité Comparison -->
		<div
			class="subjectivity-section card variant-glass glass-heavy p-5 hover-lift-sm border-gradient subjectivity-gradient"
		>
			<div class="flex items-center gap-3 mb-4">
				<h4 class="h4 text-white">{$t.filters.subjectivityScore}</h4>
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
				borderColorA="border-l-green-400/50"
				borderColorB="border-l-green-400/50"
			/>
		</div>

		<!-- Arbiter (Gemini 3 Pro) Verdict Section - Only shown when arbiter data exists -->
		{#if hasArbiterData}
			<ArbiterSection articleId={comparison.article['o:id']} />
		{/if}
	</div>
{:else}
	<div
		class="card variant-glass glass-heavy p-8 flex flex-col items-center justify-center min-h-[300px] text-center hover-lift-sm border-gradient"
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
	.badge {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 9999px;
		transition: all var(--timing-fast) var(--easing-default);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
		cursor: default;
	}

	.badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in oklab, black 20%, transparent);
		border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
	}

	.badge-lg {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: default;
	}

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

	/* ============================================ */
	/* Glass Heavy - Darker glass effect */
	/* ============================================ */

	:global(.glass-heavy) {
		background: color-mix(in oklab, var(--color-surface-900) 92%, transparent) !important;
		backdrop-filter: blur(var(--glass-blur-lg));
	}

	/* ============================================ */
	/* Section Styles with Accent Lines */
	/* ============================================ */

	/* Discrepancy Section - Red/Orange accent */
	.discrepancy-section {
		position: relative;
		overflow: hidden;
	}

	.discrepancy-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-discrepancy),
			var(--sentiment-discrepancy-light),
			var(--sentiment-discrepancy)
		);
		opacity: 0.8;
	}

	.discrepancy-gradient {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-discrepancy) 4%, var(--color-surface-900))
		) !important;
	}

	/* Centrality Section - Gold/Yellow accent */
	.centrality-section {
		position: relative;
		overflow: hidden;
	}

	.centrality-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-centrality-very-central),
			var(--sentiment-centrality-central),
			var(--sentiment-centrality-very-central)
		);
		opacity: 0.8;
	}

	.centrality-gradient {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-centrality-very-central) 4%, var(--color-surface-900))
		) !important;
	}

	/* Polarity Section - Blue/Green accent */
	.polarity-section {
		position: relative;
		overflow: hidden;
	}

	.polarity-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-polarity-positive),
			var(--sentiment-polarity-neutral),
			var(--sentiment-polarity-negative)
		);
		opacity: 0.8;
	}

	.polarity-gradient {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-polarity-neutral) 4%, var(--color-surface-900))
		) !important;
	}

	/* Subjectivity Section - Purple/Cyan accent */
	.subjectivity-section {
		position: relative;
		overflow: hidden;
	}

	.subjectivity-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			var(--sentiment-subjectivity-1),
			var(--sentiment-subjectivity-3),
			var(--sentiment-subjectivity-5)
		);
		opacity: 0.8;
	}

	.subjectivity-gradient {
		background: linear-gradient(
			135deg,
			color-mix(in oklab, var(--color-surface-900) 92%, transparent),
			color-mix(in oklab, var(--sentiment-subjectivity-3) 4%, var(--color-surface-900))
		) !important;
	}

	/* Hover effects for cards */
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

	/* Ensure proper cursor behavior */
	:global(.card) {
		cursor: default;
	}

	:global(.card *) {
		cursor: inherit;
	}

	/* Override cursor for clickable elements */
	:global(.anchor) {
		cursor: pointer !important;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		.badge-lg {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		/* Reduce hover effects on mobile */
		:global(.hover-lift-sm:hover) {
			transform: translateY(-1px);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.badge,
		.anchor,
		:global(.hover-lift-sm),
		:global(.border-gradient::before) {
			transition: none;
			animation: none;
		}
	}
</style>
