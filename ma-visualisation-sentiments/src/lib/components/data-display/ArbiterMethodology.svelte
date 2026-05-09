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
	import { createAccordion } from '$lib/utils/accordion.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import { base } from '$app/paths';

	// State for the main methodology panel
	let isMethodologyOpen = $state(false);

	// State for accordion sections
	const accordion = createAccordion();

	// State for the prompt modal
	let showPromptModal = $state(false);
</script>

<div class="info-card">
	<!-- Collapsible Header -->
	<button
		class="info-header-btn"
		onclick={() => (isMethodologyOpen = !isMethodologyOpen)}
		aria-expanded={isMethodologyOpen}
	>
		<div class="flex items-center gap-3">
			<div class="arbiter-icon-header">
				<GavelIcon size={20} class="text-amber-400" />
			</div>
			<div class="text-left">
				<span class="info-title">{$t.arbiter.methodologyTitle}</span>
				<p class="text-xs text-white/60 mt-0.5">{$t.arbiter.methodologySubtitle}</p>
			</div>
		</div>
		<span class="header-icon" data-state={isMethodologyOpen ? 'open' : 'closed'}>
			<ChevronDownIcon size={20} />
		</span>
	</button>

	{#if isMethodologyOpen}
		<div class="info-content" data-state={isMethodologyOpen ? 'open' : 'closed'}>
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
							<ul class="sentiment-list">
								<li>
									<span class="sentiment-label very-positive">Très positif</span>
									<span class="sentiment-desc">{$t.arbiter.polarityVeryPositive}</span>
								</li>
								<li>
									<span class="sentiment-label positive">Positif</span>
									<span class="sentiment-desc">{$t.arbiter.polarityPositive}</span>
								</li>
								<li>
									<span class="sentiment-label neutral">Neutre</span>
									<span class="sentiment-desc">{$t.arbiter.polarityNeutral}</span>
								</li>
								<li>
									<span class="sentiment-label negative">Négatif</span>
									<span class="sentiment-desc">{$t.arbiter.polarityNegative}</span>
								</li>
								<li>
									<span class="sentiment-label very-negative">Très négatif</span>
									<span class="sentiment-desc">{$t.arbiter.polarityVeryNegative}</span>
								</li>
							</ul>
						</div>
						<div class="scale-section">
							<h4 class="section-title">{$t.filters.subjectivity}</h4>
							<ul class="sentiment-list">
								<li>
									<span class="subjectivity-label">1</span>
									<span class="sentiment-desc">{$t.arbiter.subjectivity1}</span>
								</li>
								<li>
									<span class="subjectivity-label">2</span>
									<span class="sentiment-desc">{$t.arbiter.subjectivity2}</span>
								</li>
								<li>
									<span class="subjectivity-label">3</span>
									<span class="sentiment-desc">{$t.arbiter.subjectivity3}</span>
								</li>
								<li>
									<span class="subjectivity-label">4</span>
									<span class="sentiment-desc">{$t.arbiter.subjectivity4}</span>
								</li>
								<li>
									<span class="subjectivity-label">5</span>
									<span class="sentiment-desc">{$t.arbiter.subjectivity5}</span>
								</li>
							</ul>
						</div>
						<div class="scale-section">
							<h4 class="section-title">{$t.filters.centrality}</h4>
							<ul class="sentiment-list">
								<li>
									<span class="centrality-label very-central">Très central</span>
									<span class="sentiment-desc">{$t.arbiter.centralityVeryCentral}</span>
								</li>
								<li>
									<span class="centrality-label central">Central</span>
									<span class="sentiment-desc">{$t.arbiter.centralityCentral}</span>
								</li>
								<li>
									<span class="centrality-label secondary">Secondaire</span>
									<span class="sentiment-desc">{$t.arbiter.centralitySecondary}</span>
								</li>
								<li>
									<span class="centrality-label marginal">Marginal</span>
									<span class="sentiment-desc">{$t.arbiter.centralityMarginal}</span>
								</li>
								<li>
									<span class="centrality-label not-addressed">Non abordé</span>
									<span class="sentiment-desc">{$t.arbiter.centralityNotAddressed}</span>
								</li>
							</ul>
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
		</div>
	{/if}
</div>

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
		<pre
			class="prompt-code">{`You are an expert arbiter evaluating sentiment analysis of news articles about Islam and Muslims in Francophone West Africa.

Your role is to:
1. Analyze articles independently and provide your own assessment
2. Compare the analyses from two AI models (Model A and Model B)
3. Determine which model's analysis is more accurate
4. Provide clear, well-reasoned justifications for your decisions

## Evaluation Scales Reference:

### Polarity (Sentiment toward Islam/Muslims):
- **Très positif**: Extremely favorable, enthusiastic, praising portrait
- **Positif**: Favorable, optimistic portrait
- **Neutre**: No clear sentiment or balance between positive/negative; factual tone
- **Négatif**: Unfavorable, critical, pessimistic portrait
- **Très négatif**: Extremely unfavorable, alarmist, very critical portrait

### Subjectivity Score (1-5):
- **1 (Very Objective)**: Reports verifiable facts without personal opinions, purely informative
- **2 (Rather Objective)**: Mainly factual, may contain subtle traces of opinions
- **3 (Mixed)**: Balanced mix of facts and opinions, or presents multiple viewpoints
- **4 (Rather Subjective)**: Clearly expresses opinions and judgments
- **5 (Very Subjective)**: Heavily biased, intense opinions with little factual presentation

### Centrality:
- **Très central**: Islam/Muslims are the main subject of the article
- **Central**: Important theme but shared with other subjects
- **Secondaire**: Mentioned significantly but secondarily
- **Marginal**: Briefly or anecdotally mentioned
- **Non abordé**: No mention of Islam or Muslims

## Guidelines:
- Be thorough and analytical in your evaluation
- Consider the cultural and regional context of Francophone West Africa
- Provide specific textual evidence when possible
- Be honest about uncertainty when the correct answer is ambiguous
- Use French terminology for scores (as shown above)`}</pre>
	</div>

	<div class="prompt-section-header">
		<h4>{$t.arbiter.userPromptTemplate}</h4>
	</div>
	<div class="prompt-code-container">
		<pre class="prompt-code">{`Evaluate the following article and the two model analyses.

## Article Information
**Title:** {title}

**Full Text:**
{article_text}

---

## Model A Analysis:
- **Polarity (sentiment toward Islam/Muslims):** {model_a.polarite}
  - Justification: {model_a.polarite_justification}
- **Subjectivity Score (1=very objective, 5=very subjective):** {model_a.subjectivite_score}
  - Justification: {model_a.subjectivite_justification}
- **Centrality of Islam/Muslims:** {model_a.centralite_islam_musulmans}
  - Justification: {model_a.centralite_justification}

## Model B Analysis:
- **Polarity:** {model_b.polarite}
  - Justification: {model_b.polarite_justification}
- **Subjectivity Score:** {model_b.subjectivite_score}
  - Justification: {model_b.subjectivite_justification}
- **Centrality:** {model_b.centralite_islam_musulmans}
  - Justification: {model_b.centralite_justification}

---

Provide your independent evaluation for each dimension, determine which model is more accurate, and explain your reasoning.`}</pre>
	</div>
</PromptModal>

<style>
	/* ==========================================================================
     Info Card Base Styles
     ========================================================================== */
	.info-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-top: 2px solid var(--sentiment-arbiter);
		margin-bottom: var(--space-6);
		overflow: hidden;
	}

	/* ==========================================================================
     Header Button Styles
     ========================================================================== */
	.info-header-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
	}

	.info-header-btn:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 5%, transparent);
	}

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

	.header-icon {
		color: var(--color-surface-50);
		opacity: 0.6;
		transition: transform var(--timing-fast) var(--easing-default);
	}

	.header-icon[data-state='open'] {
		transform: rotate(180deg);
	}

	.info-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-surface-50);
	}

	/* ==========================================================================
     Content Styles
     ========================================================================== */
	.info-content {
		padding: 0 var(--space-5) var(--space-5);
	}

	/* Key Info Grid */
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

	.sentiment-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.sentiment-list li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--font-size-sm);
	}

	.sentiment-label {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-xs);
		min-width: 90px;
		text-align: center;
	}

	.sentiment-label.very-positive {
		background: var(--sentiment-polarity-very-positive-bg);
		color: var(--sentiment-polarity-very-positive);
		border: 1px solid var(--sentiment-polarity-very-positive-border);
	}
	.sentiment-label.positive {
		background: var(--sentiment-polarity-positive-bg);
		color: var(--sentiment-polarity-positive);
		border: 1px solid var(--sentiment-polarity-positive-border);
	}
	.sentiment-label.neutral {
		background: var(--sentiment-polarity-neutral-bg);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}
	.sentiment-label.negative {
		background: var(--sentiment-polarity-negative-bg);
		color: var(--sentiment-polarity-negative);
		border: 1px solid var(--sentiment-polarity-negative-border);
	}
	.sentiment-label.very-negative {
		background: var(--sentiment-polarity-very-negative-bg);
		color: var(--sentiment-polarity-very-negative);
		border: 1px solid var(--sentiment-polarity-very-negative-border);
	}

	.subjectivity-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		border-radius: var(--radius-full);
		background: var(--sentiment-subjectivity-3-bg);
		color: var(--sentiment-subjectivity-3);
		border: 1px solid var(--sentiment-subjectivity-3-border);
	}
	/* 28px kept — not a standard control size token */

	.centrality-label {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-xs);
		min-width: 90px;
		text-align: center;
	}

	.centrality-label.very-central {
		background: var(--sentiment-centrality-very-central-bg);
		color: var(--sentiment-centrality-very-central);
		border: 1px solid var(--sentiment-centrality-very-central-border);
	}
	.centrality-label.central {
		background: var(--sentiment-centrality-central-bg);
		color: var(--sentiment-centrality-central);
		border: 1px solid var(--sentiment-centrality-central-border);
	}
	.centrality-label.secondary {
		background: var(--sentiment-centrality-secondary-bg);
		color: var(--sentiment-centrality-secondary);
		border: 1px solid var(--sentiment-centrality-secondary-border);
	}
	.centrality-label.marginal {
		background: var(--sentiment-centrality-marginal-bg);
		color: var(--sentiment-centrality-marginal);
		border: 1px solid var(--sentiment-centrality-marginal-border);
	}
	.centrality-label.not-addressed {
		background: var(--sentiment-centrality-not-addressed-bg);
		color: var(--sentiment-centrality-not-addressed);
		border: 1px solid var(--sentiment-centrality-not-addressed-border);
	}

	.sentiment-desc {
		color: var(--color-surface-50);
		opacity: 0.7;
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
		background: color-mix(in oklab, black 40%, transparent);
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
		.info-header-btn,
		.header-icon {
			transition: none;
		}
	}
</style>
