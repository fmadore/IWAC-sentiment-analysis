<!--
  ArbiterV2Methodology

  The methodology card for the generation-2 panel arbiter.

  A sibling of ArbiterMethodology rather than a branch inside it, for the same
  reason ArbiterV2View is a sibling of ArbiterView: almost every claim differs.
  The v1 card describes a pairwise Gemini judge reading the public projection;
  this one describes a panel-wide Claude Opus 5 judge reading the unmasked
  mirror. Merging them would mean a conditional on every sentence.

  It says plainly that the v1 arbiter read partly-masked text. That is a real
  limitation of the archived generation, and a methodology card that omits it
  is not doing its job.
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { AccordionItem, PromptModal } from '$lib/components/common';
	import CollapsibleMethodologyCard from '$lib/components/common/CollapsibleMethodologyCard.svelte';
	import SentimentScaleList, {
		type ScaleItem
	} from '$lib/components/common/SentimentScaleList.svelte';
	import {
		ARBITER_SYSTEM_INSTRUCTION_V2,
		ARBITER_USER_PROMPT_TEMPLATE_V2
	} from '$lib/data/prompts';
	import { SENTIMENT_CONTRACT_V2 } from '$lib/domain/sentimentContract';
	import { createAccordion } from '$lib/utils/accordion.svelte';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ScaleIcon from '@lucide/svelte/icons/scale';

	const accordion = createAccordion();
	let showPromptModal = $state(false);

	const arbiterModel = SENTIMENT_CONTRACT_V2.arbiter.arbiterModel;
	const spreadThreshold = SENTIMENT_CONTRACT_V2.discrepancy.threeWaySpread.significantSpread;

	const polarityItems: ScaleItem[] = $derived([
		{
			variant: 'polarity-very-positive',
			badge: 'Très positif',
			description: $t.arbiter.polarityVeryPositive
		},
		{ variant: 'polarity-positive', badge: 'Positif', description: $t.arbiter.polarityPositive },
		{ variant: 'polarity-neutral', badge: 'Neutre', description: $t.arbiter.polarityNeutral },
		{ variant: 'polarity-negative', badge: 'Négatif', description: $t.arbiter.polarityNegative },
		{
			variant: 'polarity-very-negative',
			badge: 'Très négatif',
			description: $t.arbiter.polarityVeryNegative
		}
	]);

	/**
	 * v2 asks for — and stores — subjectivity as an ordinal label, so the card
	 * shows the wording the arbiter actually answered in. The 1-5 rank behind it
	 * is an implementation detail of the data files.
	 */
	const subjectivityItems: ScaleItem[] = $derived([
		{ variant: 'subjectivity-1', badge: 'Très objectif', description: $t.arbiter.subjectivity1 },
		{
			variant: 'subjectivity-2',
			badge: 'Plutôt objectif',
			description: $t.arbiter.subjectivity2
		},
		{ variant: 'subjectivity-3', badge: 'Mixte', description: $t.arbiter.subjectivity3 },
		{
			variant: 'subjectivity-4',
			badge: 'Plutôt subjectif',
			description: $t.arbiter.subjectivity4
		},
		{ variant: 'subjectivity-5', badge: 'Très subjectif', description: $t.arbiter.subjectivity5 }
	]);

	const centralityItems: ScaleItem[] = $derived([
		{
			variant: 'centrality-very-central',
			badge: 'Très central',
			description: $t.arbiter.centralityVeryCentral
		},
		{ variant: 'centrality-central', badge: 'Central', description: $t.arbiter.centralityCentral },
		{
			variant: 'centrality-secondary',
			badge: 'Secondaire',
			description: $t.arbiter.centralitySecondary
		},
		{
			variant: 'centrality-marginal',
			badge: 'Marginal',
			description: $t.arbiter.centralityMarginal
		},
		{
			variant: 'centrality-not-addressed',
			badge: 'Non abordé',
			description: $t.arbiter.centralityNotAddressed
		}
	]);
</script>

<CollapsibleMethodologyCard
	variant="arbiter"
	title={$t.arbiterV2.methodologyTitle}
	subtitle={$t.arbiterV2.methodologySubtitle}
>
	{#snippet icon()}
		<div class="arbiter-icon-header">
			<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		</div>
	{/snippet}

	<div class="key-info-grid">
		<div class="key-info-card">
			<div class="key-info-icon blind"><EyeOffIcon size={20} /></div>
			<div>
				<h4 class="key-info-title">{$t.arbiterV2.blindEvaluation}</h4>
				<p class="key-info-desc">{$t.arbiterV2.blindEvaluationDesc}</p>
			</div>
		</div>
		<div class="key-info-card">
			<div class="key-info-icon text"><FileTextIcon size={20} /></div>
			<div>
				<h4 class="key-info-title">{$t.arbiterV2.fullText}</h4>
				<p class="key-info-desc">{$t.arbiterV2.fullTextDesc}</p>
			</div>
		</div>
		<div class="key-info-card">
			<div class="key-info-icon scale"><ScaleIcon size={20} /></div>
			<div>
				<h4 class="key-info-title">{$t.arbiterV2.independentVerdict}</h4>
				<p class="key-info-desc">{$t.arbiterV2.independentVerdictDesc}</p>
			</div>
		</div>
	</div>

	<div class="accordion-container">
		<AccordionItem
			title={$t.arbiterV2.howItWorks}
			open={accordion.isOpen('how-it-works')}
			onToggle={() => accordion.toggle('how-it-works')}
		>
			<div class="methodology-content">
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiterV2.selectionProcess}</h4>
					<p class="section-text">{$t.arbiterV2.selectionProcessDesc}</p>
				</div>
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiterV2.blindEvaluation}</h4>
					<p class="section-text">{$t.arbiterV2.blindEvaluationDesc}</p>
				</div>
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiterV2.reasoningEffort}</h4>
					<p class="section-text">{$t.arbiterV2.reasoningEffortDesc}</p>
				</div>
				<div class="methodology-section">
					<h4 class="section-title">{$t.arbiterV2.howItWorks}</h4>
					<ol class="process-list">
						<li>{$t.arbiterV2.step1}</li>
						<li>{$t.arbiterV2.step2}</li>
						<li>{$t.arbiterV2.step3}</li>
						<li>{$t.arbiterV2.step4}</li>
					</ol>
				</div>
			</div>
		</AccordionItem>

		<AccordionItem
			title={$t.arbiterV2.arbiterModel}
			open={accordion.isOpen('arbiter-model')}
			onToggle={() => accordion.toggle('arbiter-model')}
		>
			<div class="model-card-single">
				<div class="model-header">
					<span class="arbiter-glyph model-glyph"><GavelIcon size={24} /></span>
					<div>
						<h4 class="model-name">{$t.arbiterV2.modelName}</h4>
						<span class="model-badge">{$t.arbiterV2.arbiterRole}</span>
					</div>
				</div>
				<p class="model-description">{$t.arbiterV2.arbiterModelDesc}</p>
				<ul class="config-list">
					<li><strong>Model:</strong> {arbiterModel}</li>
					<li><strong>Mode:</strong> {SENTIMENT_CONTRACT_V2.arbiter.mode}</li>
					<li><strong>Selection:</strong> spread across the panel ≥ {spreadThreshold}</li>
					<li><strong>Output:</strong> structured JSON, schema-validated</li>
				</ul>
			</div>
		</AccordionItem>

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
					<SentimentScaleList variant="chip" chipKind="sentiment" items={subjectivityItems} />
				</div>
				<div class="scale-section">
					<h4 class="section-title">{$t.filters.centrality}</h4>
					<SentimentScaleList variant="chip" chipKind="centrality" items={centralityItems} />
				</div>
			</div>
		</AccordionItem>

		<AccordionItem
			title={$t.arbiterV2.viewPrompt}
			open={accordion.isOpen('prompt')}
			onToggle={() => accordion.toggle('prompt')}
		>
			<div class="prompt-section">
				<p class="section-text">{$t.arbiterV2.promptExplanation}</p>
				<button class="prompt-btn" onclick={() => (showPromptModal = true)}>
					{$t.arbiterV2.viewFullPrompt}
				</button>
			</div>
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<PromptModal open={showPromptModal} onClose={() => (showPromptModal = false)}>
	{#snippet title()}
		<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		{$t.arbiterV2.arbiterPrompt}
	{/snippet}

	<div class="prompt-section-header">
		<h4>{$t.arbiterV2.systemInstruction}</h4>
	</div>
	<div class="prompt-code-container">
		<pre class="prompt-code">{ARBITER_SYSTEM_INSTRUCTION_V2}</pre>
	</div>

	<div class="prompt-section-header">
		<h4>{$t.arbiterV2.userPromptTemplate}</h4>
	</div>
	<div class="prompt-code-container">
		<pre class="prompt-code">{ARBITER_USER_PROMPT_TEMPLATE_V2}</pre>
	</div>
</PromptModal>

<style>
	.arbiter-icon-header {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-md);
		height: var(--size-control-md);
		border-radius: var(--radius-panel);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.key-info-grid {
		display: grid;
		grid-template-columns: 1fr;
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
		border-radius: var(--radius-panel);
	}

	.key-info-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-panel);
		flex-shrink: 0;
	}

	.key-info-icon.blind {
		background: var(--sentiment-subjectivity-3-bg);
		border: 1px solid var(--sentiment-subjectivity-3-border);
		color: var(--sentiment-subjectivity-3);
	}

	.key-info-icon.text {
		background: var(--sentiment-arbiter-bg);
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
		color: var(--text-primary);
		margin-bottom: var(--space-1);
	}

	.key-info-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-snug);
	}

	.accordion-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--surface-nested);
		border-radius: var(--radius-panel);
		padding: var(--space-2);
		border: 1px solid var(--border-subtle);
	}

	.methodology-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.methodology-section {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-radius: var(--radius-panel);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--sentiment-arbiter);
		margin-bottom: var(--space-2);
	}

	.section-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
		max-width: var(--prose-width);
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
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.model-card-single {
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		padding: var(--space-4);
	}

	.model-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.model-glyph {
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		justify-content: center;
		border-radius: var(--radius-panel);
		background: var(--sentiment-arbiter-bg);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.model-name {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
	}

	.model-badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-hairline);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		background: var(--sentiment-arbiter-bg);
		color: var(--sentiment-arbiter-light);
		border: 1px solid var(--sentiment-arbiter-border);
	}

	.model-description {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-normal);
		margin-bottom: var(--space-3);
		max-width: var(--prose-width);
	}

	.scales-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.scale-section {
		padding: var(--space-3);
		background: var(--surface-nested);
		border-radius: var(--radius-panel);
	}

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
		border-radius: var(--radius-panel);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.prompt-btn:hover {
		background: color-mix(in oklab, var(--sentiment-arbiter) 20%, transparent);
		border-color: var(--sentiment-arbiter);
	}

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
		border-radius: var(--radius-panel);
		overflow: hidden;
	}

	.prompt-code {
		padding: var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
	}

	.arbiter-glyph {
		display: inline-flex;
		align-items: center;
		color: var(--sentiment-arbiter);
	}

	@media (min-width: 640px) {
		.key-info-grid {
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		}

		.prompt-code {
			font-size: var(--font-size-xs);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.prompt-btn {
			transition: none;
		}
	}
</style>
