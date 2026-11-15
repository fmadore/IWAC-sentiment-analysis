<!--
  ArbiterV2Methodology

  The methodology card for the generation-2 panel arbiter.

  A sibling of ArbiterMethodology rather than a branch inside it, for the same
  reason ArbiterV2View is a sibling of ArbiterView: almost every claim differs.
  The v1 card describes a pairwise Gemini judge reading the public projection;
  this one describes a panel-wide Claude Opus 5 judge reading the unmasked
  mirror. Merging them would mean a conditional on every sentence; they share
  leaf components only (MethodologyKeyInfo, MethodologySection,
  MethodologyScales, PromptBlocks).

  It says plainly that the v1 arbiter read partly-masked text. That is a real
  limitation of the archived generation, and a methodology card that omits it
  is not doing its job.

  The figures in the caveats are computed from the loaded file and the panel's
  ratings (`loneDissenters`, `strictLoneSplits`, `arbiterMatchRates`,
  `recusedOnlyFlips`, `panelUnanimity`), and the letters, panel size and pair
  count from the contract, never typed into the catalogue.
-->
<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import { num, pct } from '#lib/i18n/utils.js';
	import AccordionItem from '#lib/components/common/AccordionItem.svelte';
	import PromptModal from '#lib/components/common/PromptModal.svelte';
	import CollapsibleMethodologyCard from '#lib/components/common/CollapsibleMethodologyCard.svelte';
	import MethodologyKeyInfo from '#lib/components/common/MethodologyKeyInfo.svelte';
	import MethodologySection from '#lib/components/common/MethodologySection.svelte';
	import MethodologyScales from '#lib/components/common/MethodologyScales.svelte';
	import PromptBlocks from '#lib/components/common/PromptBlocks.svelte';
	import {
		ARBITER_PANEL_IDS,
		ARBITER_RECUSED_IDS,
		SENTIMENT_CONTRACT_V2,
		SUBJECTIVITY_LABELS_V2,
		datasetIdsOf
	} from '#lib/domain/sentimentContract.js';
	import {
		arbiterV2Evaluations,
		arbiterV2Rows,
		arbiterV2Statistics,
		articleState,
		datasetState
	} from '#lib/stores/index.js';
	import { ARBITER_BLIND_LABELS, type DatasetId } from '#lib/types/data.js';
	import {
		arbiterMatchRates,
		loneDissenters,
		panelUnanimity,
		recusedOnlyFlips,
		strictLoneSplits
	} from '#lib/utils/arbiterV2.js';
	import { subjectivityScaleItems } from '#lib/utils/scaleItems.js';
	import { createAccordion } from '#lib/utils/accordion.svelte.js';
	import GavelIcon from '@lucide/svelte/icons/gavel';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ScaleIcon from '@lucide/svelte/icons/scale';

	const accordion = createAccordion();

	const arbiterModel = SENTIMENT_CONTRACT_V2.arbiter.arbiterModel;
	const spreadThreshold = SENTIMENT_CONTRACT_V2.discrepancy.threeWaySpread.significantSpread;

	/**
	 * The arbiter's frame is `arbiter.eligibility`, not the dashboard's
	 * significant-spread rule, and the card has to say which one it means. A
	 * valence flip is two ranks wide, so it is worth paying to settle without
	 * being worth flagging to a reader as a significant discrepancy.
	 */
	const selectionRule = `polarity valence flip, or spread across the panel ≥ ${spreadThreshold}`;

	/**
	 * What the judge was shown, from the contract: the arbiter panel is exactly
	 * the models the published run read, one blind letter each.
	 */
	const judgedCount = ARBITER_PANEL_IDS.length;
	const panelValues = {
		firstLabel: ARBITER_BLIND_LABELS[0].toUpperCase(),
		lastLabel: ARBITER_BLIND_LABELS[judgedCount - 1].toUpperCase()
	};

	const keyInfo = $derived([
		{
			icon: EyeOffIcon,
			tone: 'blind' as const,
			title: $t.arbiterV2.blindEvaluation,
			description: fill($t.arbiterV2.blindEvaluationDesc, panelValues)
		},
		{
			icon: FileTextIcon,
			tone: 'arbiter' as const,
			title: $t.arbiterV2.fullText,
			description: $t.arbiterV2.fullTextDesc
		},
		{
			icon: ScaleIcon,
			tone: 'positive' as const,
			title: $t.arbiterV2.independentVerdict,
			description: $t.arbiterV2.independentVerdictDesc
		}
	]);

	/**
	 * v2 asks for — and stores — subjectivity as an ordinal label, so the card
	 * shows the wording the arbiter actually answered in. The 1-5 rank behind it
	 * is an implementation detail of the data files.
	 */
	const subjectivityItems = $derived(
		subjectivityScaleItems($t.arbiter, { badge: (step) => SUBJECTIVITY_LABELS_V2[step.value] })
	);

	/**
	 * The prompt the published verdicts were judged under, not the contract's
	 * default for new runs: the card shows what produced the file on screen. A
	 * file without the field predates it and is the v2.2.0 run.
	 */
	const publishedPromptVersion = $derived(
		arbiterV2Evaluations.current?.metadata.prompt_version ?? 'v2.2.0'
	);
	// v2.2.0 is the run whose scale reference was shorter than the codebook.
	const showPromptCaveat = $derived(publishedPromptVersion === 'v2.2.0');

	// ---- Caveat figures, from the loaded file ------------------------------

	const rows = $derived(arbiterV2Rows.current);
	const stats = $derived(arbiterV2Statistics.current);
	/** The panel the judge read — `metadata.models`, not the generation. */
	const judgedIds = $derived(stats.models.map((model) => model.modelId));
	const recusedIds = $derived(
		datasetIdsOf('v2').filter((id) => !(judgedIds as readonly DatasetId[]).includes(id))
	);

	function nameOf(modelId: DatasetId): string {
		return (
			stats.models.find((model) => model.modelId === modelId)?.name ??
			datasetState.getById(modelId)?.name ??
			modelId
		);
	}

	const figures = $derived.by(() => {
		const dissent = loneDissenters(rows, judgedIds);
		const matches = arbiterMatchRates(rows, judgedIds);
		const top = dissent.models[0];
		if (dissent.compared === 0 || !top || !matches.every((match) => match.loaded)) return null;
		const polarityMatches = (modelId: DatasetId) =>
			matches.find((match) => match.modelId === modelId)?.dimensions.polarity.exact.successes ?? 0;
		const others = judgedIds.filter((id) => id !== top.modelId).map((id) => polarityMatches(id));
		if (others.length === 0) return null;
		const recused = arbiterMatchRates(rows, recusedIds).find((match) => match.loaded);
		return {
			dissenter: nameOf(top.modelId),
			strict: strictLoneSplits(rows, judgedIds, top.modelId) ?? 0,
			count: top.total,
			negative: top.negative,
			total: dissent.compared,
			match: polarityMatches(top.modelId),
			othersLow: Math.min(...others),
			othersHigh: Math.max(...others),
			recused: recused
				? {
						name: nameOf(recused.modelId),
						match: recused.dimensions.polarity.exact.successes,
						flips: recusedOnlyFlips(articleState.datasets, datasetIdsOf('v2'), judgedIds)
					}
				: null
		};
	});

	/** Unanimity over the judged panel, across the corpus, for the choice of polarity. */
	const unanimity = $derived.by(() => {
		const centrality = panelUnanimity(articleState.datasets, ARBITER_PANEL_IDS, 'centrality');
		const polarity = panelUnanimity(articleState.datasets, ARBITER_PANEL_IDS, 'polarity');
		if (centrality?.share == null || polarity?.share == null) return null;
		return { centrality: centrality.share, polarity: polarity.share };
	});

	const whyPolarityText = $derived(
		unanimity
			? fill($t.arbiterV2.whyPolarityDesc, {
					models: $num(judgedCount),
					centrality: $pct(unanimity.centrality, 1),
					polarity: $pct(unanimity.polarity, 1)
				})
			: $t.arbiterV2.caveatFiguresPending
	);

	function fill(template: string, values: Record<string, string>): string {
		return Object.entries(values).reduce(
			(text, [key, value]) => text.replaceAll(`{${key}}`, value),
			template
		);
	}

	const frameCaveatText = $derived(
		figures
			? fill($t.arbiterV2.frameCaveatDesc, {
					dissenter: figures.dissenter,
					count: $num(figures.count),
					total: $num(figures.total),
					negative: $num(figures.negative),
					strict: $num(figures.strict),
					rest: $num(judgedIds.length - 1),
					match: $num(figures.match),
					othersLow: $num(figures.othersLow),
					othersHigh: $num(figures.othersHigh)
				})
			: $t.arbiterV2.caveatFiguresPending
	);

	const recusalText = $derived(
		figures?.recused && figures.recused.flips !== null
			? fill($t.arbiterV2.recusalDesc, {
					recused: figures.recused.name,
					flips: $num(figures.recused.flips),
					dissenter: figures.dissenter,
					total: $num(figures.total),
					match: $num(figures.recused.match),
					othersLow: $num(figures.othersLow),
					othersHigh: $num(figures.othersHigh)
				})
			: $t.arbiterV2.caveatFiguresPending
	);
</script>

<CollapsibleMethodologyCard
	variant="arbiter"
	openOnHash="methodology"
	title={$t.arbiterV2.methodologyTitle}
	subtitle={$t.arbiterV2.methodologySubtitle}
>
	{#snippet icon()}
		<div class="arbiter-icon-header">
			<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		</div>
	{/snippet}

	<MethodologyKeyInfo items={keyInfo} />

	<div class="accordion-container">
		<AccordionItem
			title={$t.arbiterV2.howItWorks}
			open={accordion.isOpen('how-it-works')}
			onToggle={() => accordion.toggle('how-it-works')}
		>
			<div class="methodology-content">
				<MethodologySection
					title={$t.arbiterV2.selectionProcess}
					text={$t.arbiterV2.selectionProcessDesc}
				/>
				<MethodologySection title={$t.arbiterV2.whyPolarity} text={whyPolarityText} />
				<MethodologySection title={$t.arbiterV2.frameCaveat} text={frameCaveatText} />
				{#if ARBITER_RECUSED_IDS.length}
					<MethodologySection title={$t.arbiterV2.recusal} text={recusalText} />
				{/if}
				<MethodologySection
					title={$t.arbiterV2.blindEvaluation}
					text={fill($t.arbiterV2.blindEvaluationDesc, panelValues)}
				/>
				<MethodologySection
					title={$t.arbiterV2.randomOrder}
					text={fill($t.arbiterV2.randomOrderDesc, panelValues)}
				/>
				<MethodologySection title={$t.arbiterV2.noiseCaveat} text={$t.arbiterV2.noiseCaveatDesc} />
				<MethodologySection
					title={$t.arbiterV2.reasoningEffort}
					text={$t.arbiterV2.reasoningEffortDesc}
				/>
				<MethodologySection title={$t.arbiterV2.howItWorks}>
					<ol>
						<li>{$t.arbiterV2.step1}</li>
						<li>{$t.arbiterV2.step2}</li>
						<li>{$t.arbiterV2.step3}</li>
						<li>{$t.arbiterV2.step4}</li>
					</ol>
				</MethodologySection>
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
				<p class="model-description">
					{fill($t.arbiterV2.arbiterModelDesc, {
						pairs: $num((judgedCount * (judgedCount - 1)) / 2)
					})}
				</p>
				<ul class="config-list">
					<li><strong>Model:</strong> {arbiterModel}</li>
					<li><strong>Mode:</strong> {SENTIMENT_CONTRACT_V2.arbiter.mode}</li>
					<li><strong>Selection:</strong> {selectionRule}</li>
					<li><strong>Output:</strong> structured JSON, schema-validated</li>
				</ul>
			</div>
		</AccordionItem>

		<AccordionItem
			title={$t.arbiter.evaluationScales}
			open={accordion.isOpen('scales')}
			onToggle={() => accordion.toggle('scales')}
		>
			<MethodologyScales {subjectivityItems} subjectivityChip="sentiment" />
		</AccordionItem>

		<AccordionItem
			title={$t.arbiterV2.viewPrompt}
			open={accordion.isOpen('prompt')}
			onToggle={() => accordion.toggle('prompt')}
		>
			<div class="prompt-section">
				<p class="prompt-text">{$t.arbiterV2.promptExplanation}</p>
				{#if showPromptCaveat}
					<p class="prompt-text">{$t.arbiterV2.promptVersionCaveat}</p>
				{/if}
				<button type="button" class="prompt-btn" onclick={() => (viewOptionsState.prompt = true)}>
					{$t.arbiterV2.viewFullPrompt}
				</button>
			</div>
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<PromptModal open={viewOptionsState.prompt} onClose={() => (viewOptionsState.prompt = false)}>
	{#snippet title()}
		<span class="arbiter-glyph"><GavelIcon size={20} /></span>
		{$t.arbiterV2.arbiterPrompt}
	{/snippet}

	<PromptBlocks
		blocks={(texts) => [
			{
				title: $t.arbiterV2.systemInstruction,
				body: texts.arbiterSystemInstructionV2(publishedPromptVersion)
			},
			{ title: $t.arbiterV2.userPromptTemplate, body: texts.ARBITER_USER_PROMPT_TEMPLATE_V2 }
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

	.model-description,
	.prompt-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
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
