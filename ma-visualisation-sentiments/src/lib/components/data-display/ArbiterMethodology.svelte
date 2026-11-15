<!--
  ArbiterMethodology Component

  The methodology of the archived (generation 1) pairwise arbiter, Gemini 3
  Pro: the blind evaluation, the process, the model, the scales and the prompt.

  A sibling of ArbiterV2Methodology, not a branch of it: almost every claim
  differs. The two share leaf components only — the key-fact row
  (MethodologyKeyInfo), the titled sections (MethodologySection), the scales
  (MethodologyScales) and the prompt dialog body (PromptBlocks, which also
  loads the prompt texts when the dialog opens).

  Usage:
  <ArbiterMethodology />
-->
<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import AccordionItem from '#lib/components/common/AccordionItem.svelte';
	import PromptModal from '#lib/components/common/PromptModal.svelte';
	import CollapsibleMethodologyCard from '#lib/components/common/CollapsibleMethodologyCard.svelte';
	import MethodologyKeyInfo from '#lib/components/common/MethodologyKeyInfo.svelte';
	import MethodologySection from '#lib/components/common/MethodologySection.svelte';
	import MethodologyScales from '#lib/components/common/MethodologyScales.svelte';
	import PromptBlocks from '#lib/components/common/PromptBlocks.svelte';
	import { subjectivityScaleItems } from '#lib/utils/scaleItems.js';
	import { createAccordion } from '#lib/utils/accordion.svelte.js';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import { asset } from '$app/paths';

	const accordion = createAccordion();

	const keyInfo = $derived([
		{
			icon: EyeOffIcon,
			tone: 'blind' as const,
			title: $t.arbiter.blindEvaluation,
			description: $t.arbiter.blindEvaluationDesc
		},
		{
			icon: BrainIcon,
			tone: 'arbiter' as const,
			title: $t.arbiter.highReasoning,
			description: $t.arbiter.highReasoningDesc
		},
		{
			icon: ScaleIcon,
			tone: 'positive' as const,
			title: $t.arbiter.independentVerdict,
			description: $t.arbiter.independentVerdictDesc
		}
	]);

	// v1 stored subjectivity as a 1–5 rank, and the badge shows the rank.
	const subjectivityItems = $derived(subjectivityScaleItems($t.arbiter));
</script>

<CollapsibleMethodologyCard
	variant="arbiter"
	openOnHash="methodology"
	title={$t.arbiter.methodologyTitle}
	subtitle={$t.arbiter.methodologySubtitle}
>
	{#snippet icon()}
		<div class="arbiter-icon-header">
			<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		</div>
	{/snippet}

	<MethodologyKeyInfo items={keyInfo} />

	<div class="accordion-container">
		<AccordionItem
			title={$t.arbiter.howItWorks}
			open={accordion.isOpen('how-it-works')}
			onToggle={() => accordion.toggle('how-it-works')}
		>
			<div class="methodology-content">
				<MethodologySection
					title={$t.arbiter.selectionProcess}
					text={$t.arbiter.selectionProcessDesc}
				/>
				<MethodologySection
					title={$t.arbiter.blindAssignment}
					text={$t.arbiter.blindAssignmentDesc}
				/>
				<MethodologySection title={$t.arbiter.evaluationProcess}>
					<ol>
						<li>{$t.arbiter.step1}</li>
						<li>{$t.arbiter.step2}</li>
						<li>{$t.arbiter.step3}</li>
						<li>{$t.arbiter.step4}</li>
					</ol>
				</MethodologySection>
			</div>
		</AccordionItem>

		<AccordionItem
			title={$t.arbiter.arbiterModel}
			open={accordion.isOpen('arbiter-model')}
			onToggle={() => accordion.toggle('arbiter-model')}
		>
			<div class="model-card-single">
				<div class="model-header">
					<img src={asset('logo/Gemini_logo.svg')} alt="" class="model-logo" />
					<div>
						<h4 class="model-name">Gemini 3 Pro</h4>
						<span class="model-badge">{$t.arbiter.arbiterRole}</span>
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

		<AccordionItem
			title={$t.arbiter.evaluationScales}
			open={accordion.isOpen('scales')}
			onToggle={() => accordion.toggle('scales')}
		>
			<MethodologyScales {subjectivityItems} />
		</AccordionItem>

		<AccordionItem
			title={$t.arbiter.viewPrompt}
			open={accordion.isOpen('prompt')}
			onToggle={() => accordion.toggle('prompt')}
		>
			<div class="prompt-section">
				<p class="prompt-text">{$t.arbiter.promptExplanation}</p>
				<button type="button" class="prompt-btn" onclick={() => (viewOptionsState.prompt = true)}>
					{$t.arbiter.viewFullPrompt}
				</button>
			</div>
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<PromptModal open={viewOptionsState.prompt} onClose={() => (viewOptionsState.prompt = false)}>
	{#snippet title()}
		<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		{$t.arbiter.arbiterPrompt}
	{/snippet}

	<PromptBlocks
		blocks={(texts) => [
			{ title: $t.arbiter.systemInstruction, body: texts.ARBITER_SYSTEM_INSTRUCTION },
			{ title: $t.arbiter.userPromptTemplate, body: texts.ARBITER_USER_PROMPT_TEMPLATE }
		]}
	/>
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

	.arbiter-glyph {
		display: inline-flex;
		align-items: center;
		color: var(--sentiment-arbiter);
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

	.model-logo {
		width: var(--size-control-lg);
		height: var(--size-control-lg);
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
		background: var(--sentiment-polarity-neutral-bg);
		color: var(--sentiment-polarity-neutral);
		border: 1px solid var(--sentiment-polarity-neutral-border);
	}

	.model-description,
	.prompt-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-normal);
		max-width: var(--prose-width);
	}

	.model-description {
		margin-bottom: var(--space-3);
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

	@media (prefers-reduced-motion: reduce) {
		.prompt-btn {
			transition: none;
		}
	}
</style>
