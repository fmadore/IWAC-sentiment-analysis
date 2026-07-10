<!--
  ArbiterMethodology Component

  Displays the methodology specific to the Arbiter (Gemini 3 Pro) evaluation process.
  Shows the blind evaluation process, system instructions, and prompt details.

  Features:
  - Collapsible section with toggle
  - Explanation of the blind evaluation process
  - System instruction and evaluation scales
  - User prompt template

  Usage:
  <ArbiterMethodology />
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { AccordionItem, PromptModal } from '$lib/components/common';
	import CollapsibleMethodologyCard from '$lib/components/common/CollapsibleMethodologyCard.svelte';
	import SentimentScaleList from '$lib/components/common/SentimentScaleList.svelte';
	import { ARBITER_SYSTEM_INSTRUCTION, ARBITER_USER_PROMPT_TEMPLATE } from '$lib/data/prompts';
	import { createAccordion } from '$lib/utils/accordion.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import { base } from '$app/paths';

	// State for accordion sections
	const accordion = createAccordion();

	// State for the prompt modal
	let showPromptModal = $state(false);

	// Evaluation-scale items (chip class + label + description)
	const polarityItems = $derived([
		{
			badgeClass: 'very-positive',
			badge: 'Très positif',
			description: $t.arbiter.polarityVeryPositive
		},
		{ badgeClass: 'positive', badge: 'Positif', description: $t.arbiter.polarityPositive },
		{ badgeClass: 'neutral', badge: 'Neutre', description: $t.arbiter.polarityNeutral },
		{ badgeClass: 'negative', badge: 'Négatif', description: $t.arbiter.polarityNegative },
		{
			badgeClass: 'very-negative',
			badge: 'Très négatif',
			description: $t.arbiter.polarityVeryNegative
		}
	]);

	const subjectivityItems = $derived([
		{ badgeClass: '', badge: '1', description: $t.arbiter.subjectivity1 },
		{ badgeClass: '', badge: '2', description: $t.arbiter.subjectivity2 },
		{ badgeClass: '', badge: '3', description: $t.arbiter.subjectivity3 },
		{ badgeClass: '', badge: '4', description: $t.arbiter.subjectivity4 },
		{ badgeClass: '', badge: '5', description: $t.arbiter.subjectivity5 }
	]);

	const centralityItems = $derived([
		{
			badgeClass: 'very-central',
			badge: 'Très central',
			description: $t.arbiter.centralityVeryCentral
		},
		{ badgeClass: 'central', badge: 'Central', description: $t.arbiter.centralityCentral },
		{ badgeClass: 'secondary', badge: 'Secondaire', description: $t.arbiter.centralitySecondary },
		{ badgeClass: 'marginal', badge: 'Marginal', description: $t.arbiter.centralityMarginal },
		{
			badgeClass: 'not-addressed',
			badge: 'Non abordé',
			description: $t.arbiter.centralityNotAddressed
		}
	]);
</script>

<CollapsibleMethodologyCard
	variant="arbiter"
	title={$t.arbiter.methodologyTitle}
	subtitle={$t.arbiter.methodologySubtitle}
>
	{#snippet icon()}
		<div class="arbiter-icon-header">
			<GavelIcon size={20} class="text-amber-400" />
		</div>
	{/snippet}

	<!-- Key Info Section -->
	<div class="key-info-grid">
		<div class="key-info-card">
			<div class="key-info-icon blind">
				<EyeOffIcon size={20} />
			</div>
			<div>
				<h4 class="key-info-title">{$t.arbiter.blindEvaluation}</h4>
				<p class="key-info-desc">{$t.arbiter.blindEvaluationDesc}</p>
			</div>
		</div>
		<div class="key-info-card">
			<div class="key-info-icon arbiter">
				<BrainIcon size={20} />
			</div>
			<div>
				<h4 class="key-info-title">{$t.arbiter.highReasoning}</h4>
				<p class="key-info-desc">{$t.arbiter.highReasoningDesc}</p>
			</div>
		</div>
		<div class="key-info-card">
			<div class="key-info-icon scale">
				<ScaleIcon size={20} />
			</div>
			<div>
				<h4 class="key-info-title">{$t.arbiter.independentVerdict}</h4>
				<p class="key-info-desc">{$t.arbiter.independentVerdictDesc}</p>
			</div>
		</div>
	</div>

	<!-- Accordion Sections -->
	<div class="accordion-container">
		<!-- How it works -->
		<AccordionItem
			title={$t.arbiter.howItWorks}
			open={accordion.isOpen('how-it-works')}
			onToggle={() => accordion.toggle('how-it-works')}
		>
			<div class="methodology-content">
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiter.selectionProcess}</h4>
					<p class="section-text">{$t.arbiter.selectionProcessDesc}</p>
				</div>
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiter.blindAssignment}</h4>
					<p class="section-text">{$t.arbiter.blindAssignmentDesc}</p>
				</div>
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiter.evaluationProcess}</h4>
					<ol class="process-list">
						<li>{$t.arbiter.step1}</li>
						<li>{$t.arbiter.step2}</li>
						<li>{$t.arbiter.step3}</li>
						<li>{$t.arbiter.step4}</li>
					</ol>
				</div>
			</div>
		</AccordionItem>

		<!-- Arbiter Model -->
		<AccordionItem
			title={$t.arbiter.arbiterModel}
			open={accordion.isOpen('arbiter-model')}
			onToggle={() => accordion.toggle('arbiter-model')}
		>
			<div class="model-card-single">
				<div class="model-header">
					<img src="{base}/logo/Gemini_logo.svg" alt="Gemini Logo" class="model-logo" />
					<div>
						<h4 class="model-name">Gemini 3 Pro</h4>
						<span class="model-badge gemini">{$t.arbiter.arbiterRole}</span>
					</div>
				</div>
				<p class="model-description">{$t.arbiter.geminiArbiterDesc}</p>
				<ul class="config-list">
					<li><strong>Model:</strong> gemini-3.0-pro-preview</li>
					<li><strong>Thinking Level:</strong> High (extended reasoning)</li>
					<li><strong>Temperature:</strong> 0.2 (consistent outputs)</li>
					<li><strong>Output:</strong> Structured JSON via Pydantic</li>
				</ul>
			</div>
		</AccordionItem>

		<!-- Evaluation Scales -->
		<AccordionItem
			title={$t.arbiter.evaluationScales}
			open={accordion.isOpen('scales')}
			onToggle={() => accordion.toggle('scales')}
		>
			<div class="scales-content">
				<div class="scale-section">
					<h4 class="section-title">{$t.filters.polarity}</h4>
					<SentimentScaleList variant="chip" chipKind="sentiment" items={polarityItems} />
				</div>
				<div class="scale-section">
					<h4 class="section-title">{$t.filters.subjectivity}</h4>
					<SentimentScaleList variant="chip" chipKind="subjectivity" items={subjectivityItems} />
				</div>
				<div class="scale-section">
					<h4 class="section-title">{$t.filters.centrality}</h4>
					<SentimentScaleList variant="chip" chipKind="centrality" items={centralityItems} />
				</div>
			</div>
		</AccordionItem>

		<!-- View Prompt -->
		<AccordionItem
			title={$t.arbiter.viewPrompt}
			open={accordion.isOpen('prompt')}
			onToggle={() => accordion.toggle('prompt')}
		>
			<div class="prompt-section">
				<p class="section-text">{$t.arbiter.promptExplanation}</p>
				<button class="prompt-btn" onclick={() => (showPromptModal = true)}>
					{$t.arbiter.viewFullPrompt}
				</button>
			</div>
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<!-- Prompt Modal -->
<PromptModal open={showPromptModal} onClose={() => (showPromptModal = false)}>
	{#snippet title()}
		<GavelIcon size={20} class="text-amber-400" />
		{$t.arbiter.arbiterPrompt}
	{/snippet}

	<div class="prompt-section-header">
		<h4>{$t.arbiter.systemInstruction}</h4>
	</div>
	<div class="prompt-code-container">
		<pre class="prompt-code">{ARBITER_SYSTEM_INSTRUCTION}</pre>
	</div>

	<div class="prompt-section-header">
		<h4>{$t.arbiter.userPromptTemplate}</h4>
	</div>
	<div class="prompt-code-container">
		<pre class="prompt-code">{ARBITER_USER_PROMPT_TEMPLATE}</pre>
	</div>
</PromptModal>

<style>
	/* ==========================================================================
     Header Icon
     ========================================================================== */
	.arbiter-icon-header {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: var(--radius-md);
		background: var(--sentiment-arbiter-icon-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	/* ==========================================================================
     Key Info Grid
     ========================================================================== */
	.key-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.key-info-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
	}

	.key-info-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-lg);
		flex-shrink: 0;
	}

	.key-info-icon.blind {
		background: var(--sentiment-subjectivity-3-bg);
		border: 1px solid var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.key-info-icon.arbiter {
		background: var(--sentiment-arbiter-icon-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		color: var(--sentiment-arbiter);
	}

	.key-info-icon.scale {
		background: var(--sentiment-polarity-very-positive-bg);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
		color: var(--sentiment-polarity-positive);
	}

	.key-info-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-surface-50);
		margin-bottom: var(--space-1);
	}

	.key-info-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
	}

	/* ==========================================================================
     Accordion Styles
     ========================================================================== */
	.accordion-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--surface-nested);
		border-radius: var(--radius-xl);
		padding: var(--space-2);
		border: 1px solid var(--border-subtle);
	}

	/* ==========================================================================
     Methodology Content Styles
     ========================================================================== */
	.methodology-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.methodology-section {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-radius: var(--radius-md);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
		margin-bottom: var(--space-2);
	}

	.section-text {
		font-size: var(--font-size-sm);
		color: var(--color-surface-50);
		opacity: 0.85;
		line-height: var(--line-height-normal);
	}

	.process-list {
		list-style: decimal;
		padding-left: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.process-list li {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-snug);
	}

	.config-list {
		list-style: disc;
		padding-left: var(--space-5);
		margin-top: var(--space-3);
	}

	.config-list li {
		font-size: var(--font-size-sm);
		color: var(--color-surface-50);
		opacity: 0.8;
		line-height: var(--line-height-relaxed);
	}

	/* ==========================================================================
     Model Card Styles
     ========================================================================== */
	.model-card-single {
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: var(--space-4);
	}

	.model-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.model-logo {
		width: var(--size-control-lg);
		height: var(--size-control-lg);
	}

	.model-name {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-surface-50);
	}

	.model-badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-2xs);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.model-badge.gemini {
		background: var(--sentiment-polarity-neutral-bg);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}

	.model-description {
		font-size: var(--font-size-sm);
		color: var(--color-surface-50);
		opacity: 0.8;
		line-height: var(--line-height-normal);
		margin-bottom: var(--space-3);
	}

	/* ==========================================================================
     Scales Content Styles
     ========================================================================== */
	.scales-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.scale-section {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-radius: var(--radius-md);
	}

	/* ==========================================================================
     Prompt Section Styles
     ========================================================================== */
	.prompt-section {
		padding: var(--space-3);
	}

	.prompt-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding: var(--space-2-5) var(--space-4);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.prompt-btn:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 20%, transparent);
		border-color: var(--sentiment-arbiter);
	}

	/* ==========================================================================
     Prompt Body Content Styles (rendered inside shared PromptModal)
     ========================================================================== */
	.prompt-section-header {
		margin-bottom: var(--space-3);
	}

	.prompt-section-header h4 {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
	}

	.prompt-section-header:not(:first-child) {
		margin-top: var(--space-6);
	}

	.prompt-code-container {
		background: color-mix(in oklab, var(--color-surface-950) 80%, transparent);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.prompt-code {
		padding: var(--space-4);
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: var(--font-size-xs);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
	}

	/* ==========================================================================
     Responsive Styles
     ========================================================================== */
	@media (max-width: 640px) {
		.key-info-grid {
			grid-template-columns: 1fr;
		}

		.prompt-code {
			font-size: var(--font-size-2xs);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.prompt-btn {
			transition: none;
		}
	}
</style>
