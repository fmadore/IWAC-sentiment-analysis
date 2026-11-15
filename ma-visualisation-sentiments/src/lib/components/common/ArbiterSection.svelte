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
	import { getPairModelNames } from '#lib/types/data.js';
	import SentimentBadge from '#lib/components/common/SentimentBadge.svelte';
	import Spinner from './Spinner.svelte';
	import ConfidenceBadge from './ConfidenceBadge.svelte';
	import VerdictBadge from './VerdictBadge.svelte';
	import { t } from '#lib/i18n/index.js';
	import {
		getArbiterForArticle,
		arbiterModelAIsFirst,
		getActualModelName,
		arbiterLoadState,
		datasetState
	} from '#lib/stores/index.js';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

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

	type Verdict = NonNullable<typeof arbiterData>['polarity'];

	/** The three dimensions, in panel order: heading, badge family and score. */
	const DIMENSIONS = [
		{
			key: 'polarity',
			badge: 'polarity',
			heading: () => $t.arbiter.polarityVerdict,
			score: (verdict: Verdict) => verdict.score
		},
		{
			key: 'subjectivity',
			badge: 'subjectivity',
			heading: () => $t.arbiter.subjectivityVerdict,
			score: (verdict: Verdict) => parseInt(verdict.score) || null
		},
		{
			key: 'centrality',
			badge: 'centrality',
			heading: () => $t.arbiter.centralityVerdict,
			score: (verdict: Verdict) => verdict.score
		}
	] as const;

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

{#snippet dimensionPanel(dimension: (typeof DIMENSIONS)[number], verdict: Verdict)}
	<div class="arbiter-verdict-panel">
		<div class="flex items-center justify-between mb-3">
			<h5 class="verdict-heading">{dimension.heading()}</h5>
			<div class="flex items-center gap-2">
				<SentimentBadge type={dimension.badge} value={dimension.score(verdict)} size="sm" />
				<VerdictBadge
					verdict={verdict.preferred_model}
					label={getPreferredModelLabel(verdict.preferred_model)}
				/>
			</div>
		</div>
		<div class="space-y-2">
			<div>
				<span class="field-label">{$t.arbiter.arbiterJustification}</span>
				<p class="field-text mt-1">{decodeVerdictText(verdict.justification)}</p>
			</div>
			<div>
				<span class="field-label">{$t.arbiter.verdictExplanation}</span>
				<p class="field-text mt-1">{decodeVerdictText(verdict.verdict_explanation)}</p>
			</div>
		</div>
	</div>
{/snippet}

<div class="arbiter-section">
	<!-- Header with toggle -->
	<button
		class="arbiter-header w-full flex items-center justify-between gap-3 mb-4"
		onclick={() => (showArbiter = !showArbiter)}
		aria-expanded={showArbiter}
	>
		<div class="flex items-center gap-3">
			<div class="arbiter-icon">
				<GavelIcon size={24} />
			</div>
			<div class="text-left">
				<h4 class="section-title flex items-center gap-2">
					{$t.arbiter.title}
					<span class="model-tag">
						{$t.arbiter.modelName}
					</span>
				</h4>
				<p class="section-subtitle">{$t.arbiter.subtitle}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if arbiterData}
				<ConfidenceBadge level={arbiterData.confidence_level} />
			{/if}
			{#if showArbiter}
				<span class="toggle-chevron"><ChevronUpIcon size={20} /></span>
			{:else}
				<span class="toggle-chevron"><ChevronDownIcon size={20} /></span>
			{/if}
		</div>
	</button>

	{#if showArbiter}
		{#if arbiterLoadState.current.status === 'loading'}
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
						<p class="verdict-body">
							{decodeVerdictText(arbiterData.overall_explanation)}
						</p>
					</div>
				</div>
			</div>

			<!-- Dimension-by-dimension verdicts -->
			<div class="grid grid-cols-1 gap-4">
				{#each DIMENSIONS as dimension (dimension.key)}
					{@render dimensionPanel(dimension, arbiterData[dimension.key])}
				{/each}
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
		line-height: var(--line-height-relaxed);
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

	/* --text-muted: the floor for real text (--text-subtle is for rules). */
	.empty-hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.model-tag {
		display: inline-flex;
		align-items: center;
		padding: var(--space-0-5) var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-wider);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
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

	@media (prefers-reduced-motion: reduce) {
		.arbiter-header,
		.arbiter-verdict-panel {
			transition: none;
		}
	}
</style>
