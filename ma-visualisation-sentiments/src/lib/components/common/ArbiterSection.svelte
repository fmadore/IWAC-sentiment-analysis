<!--
  ArbiterSection Component
  
  Displays the Arbiter (Gemini 3 Pro) verdict for a comparison article.
  Shows overall verdict, dimension-by-dimension analysis, and confidence level.
  
  Features:
  - Collapsible section with toggle
  - Overall verdict display
  - Per-dimension verdict panels (polarity, subjectivity, centrality)
  - Preferred model indicators with blind assignment decoding
  - Loading and empty states
  
  Usage:
  <ArbiterSection articleId={article['o:id']} />
-->
<script lang="ts">
	import { getPairModelNames } from '$lib/types/data';
	import { SentimentBadge } from '$lib/components/common';
	import { t } from '$lib/i18n';
	import {
		getArbiterForArticle,
		arbiterModelAIsFirst,
		getActualModelName,
		uiState,
		datasetState
	} from '$lib/stores';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import MinusCircleIcon from '@lucide/svelte/icons/minus-circle';

	interface ArbiterSectionProps {
		/** The article ID to fetch arbiter data for */
		articleId: string | number;
		/** Whether the section is initially expanded */
		initiallyOpen?: boolean;
	}

	let { articleId, initiallyOpen = true }: ArbiterSectionProps = $props();

	// State for arbiter section visibility
	// We intentionally only capture the initial value - changes to initiallyOpen prop are ignored
	// svelte-ignore state_referenced_locally
	let showArbiter = $state(initiallyOpen);

	// Get arbiter data for this article
	const arbiterData = $derived(getArbiterForArticle(articleId));

	// Get model names from the current comparison pair
	const modelNames = $derived(getPairModelNames(datasetState.pair, datasetState.available));

	// Get preferred model label using dynamic model names
	// Uses getActualModelName which maps arbiter's model_a/model_b to actual model names via arbiter_model_a/b metadata
	function getPreferredModelLabel(
		preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'
	): string {
		switch (preferredModel) {
			case 'model_a':
			case 'model_b':
				return `${$t.arbiter?.prefers || 'Prefers'} ${getActualModelName(preferredModel)}`;
			case 'both':
				return $t.arbiter?.prefersBoth || 'Both equal';
			case 'neither':
				return $t.arbiter?.prefersNeither || 'Neither accurate';
			default:
				return preferredModel;
		}
	}

	// Get preferred model class
	function getPreferredModelClass(
		preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'
	): string {
		switch (preferredModel) {
			case 'model_a':
				return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
			case 'model_b':
				return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
			case 'both':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
			case 'neither':
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
			default:
				return 'variant-ghost';
		}
	}

	// Get icon type for preferred model
	function getPreferredModelIconType(
		preferredModel: 'model_a' | 'model_b' | 'both' | 'neither'
	): 'check' | 'both' | 'neither' {
		if (preferredModel === 'model_a' || preferredModel === 'model_b') return 'check';
		if (preferredModel === 'both') return 'both';
		return 'neither';
	}

	// Get confidence level label
	function getConfidenceLevelLabel(level: string): string {
		switch (level) {
			case 'high':
				return $t.arbiter?.confidenceHigh || 'High confidence';
			case 'medium':
				return $t.arbiter?.confidenceMedium || 'Medium confidence';
			case 'low':
				return $t.arbiter?.confidenceLow || 'Low confidence';
			default:
				return level;
		}
	}

	// Get confidence badge class
	function getConfidenceBadgeClass(level: string): string {
		switch (level) {
			case 'high':
				return 'bg-green-500/20 text-green-400 border-green-500/30';
			case 'medium':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
			case 'low':
				return 'bg-red-500/20 text-red-400 border-red-500/30';
			default:
				return 'variant-ghost';
		}
	}

	// Decode Model A/B references in text to actual model names
	// Uses arbiter_model_a/arbiter_model_b from metadata to get the correct mapping
	// Handles both English (Model A/B) and French (modèle A/B) variations
	// Also handles French articles (le/Le) before model references
	function decodeVerdictText(text: string): string {
		if (!text) return text;

		const { modelAName, modelBName } = modelNames;
		const modelAIsFirst = arbiterModelAIsFirst.current;

		// Map arbiter's Model A/B to actual model names based on blind assignment
		// When modelAIsFirst is true: arbiter's Model A = first model (modelAName)
		// When modelAIsFirst is false: arbiter's Model A = second model (modelBName)
		const arbiterModelAName = modelAIsFirst ? modelAName : modelBName;
		const arbiterModelBName = modelAIsFirst ? modelBName : modelAName;

		// Replace Model A/B references (case insensitive) - handles both English and French
		// Order matters: replace "le/Le modèle X" first to avoid leaving orphan articles
		return (
			text
				// French with article: "le modèle A" -> "Gemini" (remove the article entirely)
				.replace(/\b[Ll]e [Mm]odèle A\b/g, arbiterModelAName)
				.replace(/\b[Ll]e [Mm]odèle B\b/g, arbiterModelBName)
				// French with article: "du modèle A" -> "de Gemini"
				.replace(/\b[Dd]u [Mm]odèle A\b/g, `de ${arbiterModelAName}`)
				.replace(/\b[Dd]u [Mm]odèle B\b/g, `de ${arbiterModelBName}`)
				// French with article: "au modèle A" -> "à Gemini"
				.replace(/\b[Aa]u [Mm]odèle A\b/g, `à ${arbiterModelAName}`)
				.replace(/\b[Aa]u [Mm]odèle B\b/g, `à ${arbiterModelBName}`)
				// English with article: "the Model A" -> "Gemini"
				.replace(/\b[Tt]he [Mm]odel A\b/g, arbiterModelAName)
				.replace(/\b[Tt]he [Mm]odel B\b/g, arbiterModelBName)
				// Plain references (no article)
				.replace(/\b[Mm]odel A\b/g, arbiterModelAName)
				.replace(/\b[Mm]odel B\b/g, arbiterModelBName)
				.replace(/\bmodel_a\b/gi, arbiterModelAName)
				.replace(/\bmodel_b\b/gi, arbiterModelBName)
				.replace(/\b[Mm]odèle A\b/g, arbiterModelAName)
				.replace(/\b[Mm]odèle B\b/g, arbiterModelBName)
		);
	}
</script>

<div class="arbiter-section">
	<!-- Header with toggle -->
	<button
		class="arbiter-header w-full flex items-center justify-between gap-3 mb-4"
		onclick={() => (showArbiter = !showArbiter)}
	>
		<div class="flex items-center gap-3">
			<div class="arbiter-icon">
				<GavelIcon size={24} class="text-amber-400" />
			</div>
			<div class="text-left">
				<h4 class="h4 text-white flex items-center gap-2">
					{$t.arbiter.title}
					<span class="badge badge-sm bg-amber-500/20 text-amber-300 border-amber-500/30">
						{$t.arbiter.modelName}
					</span>
				</h4>
				<p class="text-xs text-white/60">{$t.arbiter.subtitle}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if arbiterData}
				<span class="badge badge-sm {getConfidenceBadgeClass(arbiterData.confidence_level)}">
					{getConfidenceLevelLabel(arbiterData.confidence_level)}
				</span>
			{/if}
			{#if showArbiter}
				<ChevronUpIcon size={20} class="text-white/60" />
			{:else}
				<ChevronDownIcon size={20} class="text-white/60" />
			{/if}
		</div>
	</button>

	{#if showArbiter}
		{#if uiState.isLoadingArbiter}
			<div class="flex items-center justify-center p-8">
				<div class="loading-spinner"></div>
				<span class="ml-3 text-white/60">{$t.arbiter.loadingArbiter}</span>
			</div>
		{:else if arbiterData}
			<!-- Overall Verdict -->
			<div class="overall-verdict-panel">
				<div class="flex items-start gap-3">
					<SparklesIcon size={20} class="text-amber-400 mt-1 flex-shrink-0" />
					<div>
						<h5 class="font-semibold text-white mb-2">{$t.arbiter.overallVerdict}</h5>
						<p class="text-white/70 text-sm mb-2">
							<strong class="text-amber-400"
								>{getPreferredModelLabel(arbiterData.overall_winner)}</strong
							>
						</p>
						<p class="text-white/90 leading-relaxed">
							{decodeVerdictText(arbiterData.overall_explanation)}
						</p>
					</div>
				</div>
			</div>

			<!-- Dimension-by-dimension verdicts -->
			<div class="grid grid-cols-1 gap-4">
				<!-- Polarity Verdict -->
				<div class="arbiter-verdict-panel">
					<div class="flex items-center justify-between mb-3">
						<h5 class="font-semibold text-white">{$t.arbiter.polarityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge type="polarity" value={arbiterData.polarity.score} size="sm" />
							<span
								class="badge badge-sm {getPreferredModelClass(
									arbiterData.polarity.preferred_model
								)}"
							>
								{#if getPreferredModelIconType(arbiterData.polarity.preferred_model) === 'check'}
									<CheckCircleIcon size={12} class="mr-1" />
								{:else if getPreferredModelIconType(arbiterData.polarity.preferred_model) === 'both'}
									<MinusCircleIcon size={12} class="mr-1" />
								{:else}
									<XCircleIcon size={12} class="mr-1" />
								{/if}
								{getPreferredModelLabel(arbiterData.polarity.preferred_model)}
							</span>
						</div>
					</div>
					<div class="space-y-2">
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.arbiterJustification}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.polarity.justification)}
							</p>
						</div>
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.verdictExplanation}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.polarity.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>

				<!-- Subjectivity Verdict -->
				<div class="arbiter-verdict-panel">
					<div class="flex items-center justify-between mb-3">
						<h5 class="font-semibold text-white">{$t.arbiter.subjectivityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge
								type="subjectivity"
								value={parseInt(arbiterData.subjectivity.score) || null}
								size="sm"
							/>
							<span
								class="badge badge-sm {getPreferredModelClass(
									arbiterData.subjectivity.preferred_model
								)}"
							>
								{#if getPreferredModelIconType(arbiterData.subjectivity.preferred_model) === 'check'}
									<CheckCircleIcon size={12} class="mr-1" />
								{:else if getPreferredModelIconType(arbiterData.subjectivity.preferred_model) === 'both'}
									<MinusCircleIcon size={12} class="mr-1" />
								{:else}
									<XCircleIcon size={12} class="mr-1" />
								{/if}
								{getPreferredModelLabel(arbiterData.subjectivity.preferred_model)}
							</span>
						</div>
					</div>
					<div class="space-y-2">
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.arbiterJustification}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.subjectivity.justification)}
							</p>
						</div>
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.verdictExplanation}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.subjectivity.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>

				<!-- Centrality Verdict -->
				<div class="arbiter-verdict-panel">
					<div class="flex items-center justify-between mb-3">
						<h5 class="font-semibold text-white">{$t.arbiter.centralityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge type="centrality" value={arbiterData.centrality.score} size="sm" />
							<span
								class="badge badge-sm {getPreferredModelClass(
									arbiterData.centrality.preferred_model
								)}"
							>
								{#if getPreferredModelIconType(arbiterData.centrality.preferred_model) === 'check'}
									<CheckCircleIcon size={12} class="mr-1" />
								{:else if getPreferredModelIconType(arbiterData.centrality.preferred_model) === 'both'}
									<MinusCircleIcon size={12} class="mr-1" />
								{:else}
									<XCircleIcon size={12} class="mr-1" />
								{/if}
								{getPreferredModelLabel(arbiterData.centrality.preferred_model)}
							</span>
						</div>
					</div>
					<div class="space-y-2">
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.arbiterJustification}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.centrality.justification)}
							</p>
						</div>
						<div>
							<span class="text-xs uppercase font-bold text-white/50"
								>{$t.arbiter.verdictExplanation}</span
							>
							<p class="text-white/80 text-sm mt-1">
								{decodeVerdictText(arbiterData.centrality.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- No arbiter data available -->
			<div class="flex flex-col items-center justify-center p-8 text-center">
				<GavelIcon size={48} class="text-white/30 mb-4" />
				<h5 class="font-semibold text-white/80 mb-2">{$t.arbiter.noArbiterData}</h5>
				<p class="text-white/60 text-sm max-w-md">{$t.arbiter.noArbiterDataDescription}</p>
				<p class="text-white/40 text-xs mt-2">{$t.arbiter.runArbiterScript}</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.arbiter-section {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
		padding: var(--space-5);
	}

	.arbiter-header {
		cursor: pointer;
		transition: background-color var(--timing-fast) var(--easing-default);
		padding: var(--space-2);
		margin: calc(-1 * var(--space-2));
	}

	.arbiter-header:hover {
		background: var(--surface-hover);
	}

	.arbiter-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border: 1px solid var(--sentiment-arbiter-border);
		background: var(--sentiment-arbiter-bg);
	}

	.overall-verdict-panel {
		background: var(--surface-subtle);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.arbiter-verdict-panel {
		border: 1px solid var(--border-subtle);
		padding: var(--space-4);
		background: var(--surface-subtle);
		transition: border-color var(--timing-fast) var(--easing-default);
	}

	.arbiter-verdict-panel:hover {
		border-color: var(--sentiment-arbiter-border);
	}

	.badge {
		padding: var(--space-1) var(--space-2-5);
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		border-radius: 0;
		border: 1px solid var(--border-default);
		cursor: default;
	}

	.badge-sm {
		padding: var(--space-0-5) var(--space-2);
		font-size: 0.625rem;
	}

	.loading-spinner {
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		border: 2px solid var(--border-subtle);
		border-top-color: var(--sentiment-arbiter);
		border-radius: var(--radius-full);
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.arbiter-header,
		.arbiter-verdict-panel,
		.loading-spinner {
			transition: none;
			animation: none;
		}
	}
</style>
