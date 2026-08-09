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
	import Spinner from './Spinner.svelte';
	import {
		getVerdictBadgeClass,
		getConfidenceBadgeClass,
		getConfidenceLabel
	} from '$lib/utils/arbiter';
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
				return `${$t.arbiter.prefers} ${getActualModelName(preferredModel)}`;
			case 'both':
				return $t.arbiter.prefersBoth;
			case 'neither':
				return $t.arbiter.prefersNeither;
			default:
				return preferredModel;
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
				<GavelIcon size={24} />
			</div>
			<div class="text-left">
				<h4 class="section-title flex items-center gap-2">
					{$t.arbiter.title}
					<span class="badge badge-sm badge-model">
						{$t.arbiter.modelName}
					</span>
				</h4>
				<p class="section-subtitle">{$t.arbiter.subtitle}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if arbiterData}
				<span class="badge badge-sm {getConfidenceBadgeClass(arbiterData.confidence_level)}">
					{getConfidenceLabel(arbiterData.confidence_level, $t)}
				</span>
			{/if}
			{#if showArbiter}
				<span class="toggle-chevron"><ChevronUpIcon size={20} /></span>
			{:else}
				<span class="toggle-chevron"><ChevronDownIcon size={20} /></span>
			{/if}
		</div>
	</button>

	{#if showArbiter}
		{#if uiState.isLoadingArbiter}
			<div class="flex items-center justify-center p-8">
				<Spinner
					size="lg"
					--spinner-track="var(--border-subtle)"
					--spinner-accent="var(--sentiment-arbiter)"
				/>
				<span class="ml-3 loading-label">{$t.arbiter.loadingArbiter}</span>
			</div>
		{:else if arbiterData}
			<!-- Overall Verdict -->
			<div class="overall-verdict-panel">
				<div class="flex items-start gap-3">
					<span class="verdict-icon mt-1 flex-shrink-0"><SparklesIcon size={20} /></span>
					<div>
						<h5 class="verdict-heading mb-2">{$t.arbiter.overallVerdict}</h5>
						<p class="verdict-preferred mb-2">
							<strong class="verdict-model"
								>{getPreferredModelLabel(arbiterData.overall_winner)}</strong
							>
						</p>
						<p class="verdict-body leading-relaxed">
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
						<h5 class="verdict-heading">{$t.arbiter.polarityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge type="polarity" value={arbiterData.polarity.score} size="sm" />
							<span
								class="badge badge-sm {getVerdictBadgeClass(arbiterData.polarity.preferred_model)}"
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
							<span class="field-label">{$t.arbiter.arbiterJustification}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.polarity.justification)}
							</p>
						</div>
						<div>
							<span class="field-label">{$t.arbiter.verdictExplanation}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.polarity.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>

				<!-- Subjectivity Verdict -->
				<div class="arbiter-verdict-panel">
					<div class="flex items-center justify-between mb-3">
						<h5 class="verdict-heading">{$t.arbiter.subjectivityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge
								type="subjectivity"
								value={parseInt(arbiterData.subjectivity.score) || null}
								size="sm"
							/>
							<span
								class="badge badge-sm {getVerdictBadgeClass(
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
							<span class="field-label">{$t.arbiter.arbiterJustification}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.subjectivity.justification)}
							</p>
						</div>
						<div>
							<span class="field-label">{$t.arbiter.verdictExplanation}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.subjectivity.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>

				<!-- Centrality Verdict -->
				<div class="arbiter-verdict-panel">
					<div class="flex items-center justify-between mb-3">
						<h5 class="verdict-heading">{$t.arbiter.centralityVerdict}</h5>
						<div class="flex items-center gap-2">
							<SentimentBadge type="centrality" value={arbiterData.centrality.score} size="sm" />
							<span
								class="badge badge-sm {getVerdictBadgeClass(
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
							<span class="field-label">{$t.arbiter.arbiterJustification}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.centrality.justification)}
							</p>
						</div>
						<div>
							<span class="field-label">{$t.arbiter.verdictExplanation}</span>
							<p class="field-text mt-1">
								{decodeVerdictText(arbiterData.centrality.verdict_explanation)}
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- No arbiter data available -->
			<div class="flex flex-col items-center justify-center p-8 text-center">
				<span class="empty-icon mb-4"><GavelIcon size={48} /></span>
				<h5 class="empty-title mb-2">{$t.arbiter.noArbiterData}</h5>
				<p class="empty-body">{$t.arbiter.noArbiterDataDescription}</p>
				<p class="empty-hint mt-2">{$t.arbiter.runArbiterScript}</p>
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
		/* Lucide icons stroke with currentColor, so the wrapper tints them. */
		color: var(--sentiment-arbiter);
	}

	/* ---- Text roles.
	   These replace a layer of Tailwind colour utilities that set
	   design-meaningful properties outside the token system. Tailwind still does
	   the layout here; colour and type go through tokens in this block. ---- */
	.section-title {
		font-size: var(--font-size-xl);
		color: var(--text-primary);
	}

	.section-subtitle {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.loading-label {
		color: var(--text-muted);
	}

	.toggle-chevron,
	.verdict-icon,
	.empty-icon {
		display: inline-flex;
		align-items: center;
	}

	.toggle-chevron {
		color: var(--text-muted);
	}

	.verdict-icon {
		color: var(--sentiment-arbiter);
	}

	.verdict-heading {
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.verdict-preferred {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.verdict-model {
		color: var(--sentiment-arbiter);
	}

	.verdict-body {
		color: var(--text-primary);
	}

	/* Uppercase mono eyebrow over each justification field. --text-muted, not
	   --text-subtle: subtle sits near 3:1 and this is a label, not a rule. */
	.field-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
	}

	.field-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.empty-title {
		font-weight: var(--font-weight-semibold);
		color: var(--text-secondary);
	}

	.empty-body {
		font-size: var(--font-size-sm);
		max-width: 28rem;
		color: var(--text-muted);
	}

	.empty-icon {
		color: var(--text-subtle);
	}

	.empty-hint {
		font-size: var(--font-size-xs);
		color: var(--text-subtle);
	}

	.badge-model {
		background: var(--sentiment-arbiter-bg);
		border-color: var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter-light);
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
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		border-radius: 0;
		border: 1px solid var(--border-default);
		cursor: default;
	}

	.badge-sm {
		padding: var(--space-0-5) var(--space-2);
		font-size: var(--font-size-eyebrow);
	}

	@media (prefers-reduced-motion: reduce) {
		.arbiter-header,
		.arbiter-verdict-panel {
			transition: none;
		}
	}
</style>
