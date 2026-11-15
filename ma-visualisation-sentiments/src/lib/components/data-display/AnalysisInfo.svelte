<script lang="ts">
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import { MODELS } from '#lib/data/modelMethodology.js';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { num, translateSentimentValue, translateSubjectivityScore } from '#lib/i18n/utils.js';
	import {
		centralityScaleItems,
		polarityScaleItems,
		subjectivityScaleItems
	} from '#lib/utils/scaleItems.js';
	import { datasetState, articleState, uiState } from '#lib/stores/index.js';
	import { updateURL } from '#lib/stores/url/index.js';
	import {
		ARCHIVED_GENERATION,
		SENTIMENT_CONTRACT_V2,
		generationOf
	} from '#lib/domain/sentimentContract.js';
	import AccordionItem from '#lib/components/common/AccordionItem.svelte';
	import PromptModal from '#lib/components/common/PromptModal.svelte';
	import CollapsibleMethodologyCard from '#lib/components/common/CollapsibleMethodologyCard.svelte';
	import SentimentScaleList, {
		type ScaleItem
	} from '#lib/components/common/SentimentScaleList.svelte';
	import { loadPromptTexts, promptTexts } from '#lib/data/promptTexts.svelte.js';
	import { asset } from '$app/paths';
	import { createAccordion } from '#lib/utils/accordion.svelte.js';
	import { hasSingleModelPicker } from '#lib/types/data.js';

	const accordion = createAccordion();

	// State for the prompt modal

	// Compute total article count from all datasets
	let totalArticleCount = $derived.by(() => {
		const datasets = articleState.datasets;
		const firstDataset = Object.values(datasets)[0];
		return firstDataset?.length ?? 0;
	});

	// Only the generation on screen: the grid describes the panel being shown,
	// and mixing both panels' cards would imply the eight were run under one
	// protocol.
	const generationModels = $derived(
		MODELS.filter((model) => generationOf(model.id) === datasetState.generation)
	);
	const selectedModel = $derived(MODELS.find((m) => m.id === datasetState.selected));

	// Each generation ran its own prompt text; the modal must show the one that
	// produced the scores on screen.
	const activePrompt = $derived(
		promptTexts.current
			? datasetState.generation === 'v2'
				? promptTexts.current.SENTIMENT_ANALYSIS_PROMPT_V2
				: promptTexts.current.SENTIMENT_ANALYSIS_PROMPT
			: null
	);

	// The prompt texts load when the reader asks for them. The click starts the
	// load; a modal restored from a `prompt=true` link or from history awaits
	// the same memoized promise inside its body (below), so no effect is needed.
	function openPrompt() {
		loadPromptTexts().catch((error) => console.error('Failed to load the prompt texts:', error));
		viewOptionsState.prompt = true;
	}

	// Pair and panel views show several models at once; the copy describing
	// "the model on screen" applies to the single-model views only.
	const panelView = $derived(!hasSingleModelPicker(uiState.activeView));

	type DimensionKey = 'polarity' | 'subjectivity' | 'centrality';

	// Everything the two campaigns disagree about — scale wording, run
	// configuration, what the prompt asks for. Same reasoning as activePrompt:
	// describing archived scores with the current prompt's wording would
	// misattribute them.
	const copy = $derived(datasetState.generation === 'v2' ? $t.analysisV2 : $t.analysisV1);

	// v2 added prose boundary rules to every dimension; v1 had none, so the
	// notes list simply renders nothing for the archive.
	const notes = $derived(
		datasetState.generation === 'v2'
			? {
					polarity: $t.analysisV2.polarityNotes,
					subjectivity: $t.analysisV2.subjectivityNotes,
					centrality: $t.analysisV2.centralityNotes
				}
			: { polarity: [], subjectivity: [], centrality: [] }
	);

	// The collection is published as two sites, one per language.
	const collectionUrl = $derived(
		$currentLanguage === 'en'
			? 'https://islam.zmo.de/s/westafrica/'
			: 'https://islam.zmo.de/s/afrique_ouest/page/accueil'
	);

	const MORETTI_URL =
		'https://newleftreview.org/issues/ii1/articles/franco-moretti-conjectures-on-world-literature';

	function viewArchive() {
		datasetState.setGeneration(ARCHIVED_GENERATION);
		updateURL(uiState.activeView);
	}

	// Evaluation-scale items: the steps and their variants come from
	// `utils/scaleItems.ts`; the badges are the translated labels and the
	// descriptions the generation's own wording. Reading `$currentLanguage`
	// makes the badges follow a language switch.
	const polarityItems: ScaleItem[] = $derived(
		polarityScaleItems(copy, {
			includeNotApplicable: true,
			badge: (step) => translateSentimentValue(step.value, $currentLanguage)
		})
	);

	// The badge stays the 1-5 rank the data files store, even though v2 asked
	// the models for the label — every chart, filter and export is keyed on the
	// rank, and showing two different scales for one dimension would not help.
	const subjectivityItems: ScaleItem[] = $derived(
		subjectivityScaleItems(copy, {
			label: (step) => translateSubjectivityScore(step.value, $currentLanguage)
		})
	);

	const centralityItems: ScaleItem[] = $derived(
		centralityScaleItems(copy, {
			badge: (step) => translateSentimentValue(step.value, $currentLanguage)
		})
	);

	// The accordion keys stay the historical French ones.
	const dimensions = $derived<
		{ id: DimensionKey; key: string; title: string; description: string; items: ScaleItem[] }[]
	>([
		{
			id: 'polarity',
			key: 'polarite',
			title: $t.analysis.polaritySection,
			description: copy.polarityDescription,
			items: polarityItems
		},
		{
			id: 'subjectivity',
			key: 'subjectivite',
			title: $t.analysis.subjectivitySection,
			description: copy.subjectivityDescription,
			items: subjectivityItems
		},
		{
			id: 'centrality',
			key: 'centralite',
			title: $t.analysis.centralitySection,
			description: copy.centralityDescription,
			items: centralityItems
		}
	]);
</script>

<CollapsibleMethodologyCard title={$t.analysis.title} variant="compact" openOnHash="methodology">
	<p class="info-description">
		{$t.analysis.methodologyIntro}<a
			href={MORETTI_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="info-link">{$t.analysis.methodologyIntroCitation}</a
		>{$t.analysis.methodologyIntroEnd}
	</p>

	<p class="info-description">
		{$t.analysis.methodologyCorpus}
		<strong class="article-count">{$num(totalArticleCount)}</strong>
		{$t.analysis.methodologyCorpusArticles}
		<a href={collectionUrl} target="_blank" rel="noopener noreferrer" class="info-link">
			<em>{$t.analysisInfo.collectionName}</em> ({$t.analysisInfo.collectionAcronym})
		</a>{$t.analysis.methodologyCorpusDeveloper}
		<a
			href="https://www.frederickmadore.com/"
			target="_blank"
			rel="noopener noreferrer"
			class="info-link">Frédérick Madore</a
		>{$t.analysis.methodologyCorpusEnd}
		<!-- The panel is named from the contract registry, so the sentence follows
		     the generation on screen instead of hardcoding one campaign's models. -->
		{#each generationModels as model, index (model.id)}{#if index > 0}{index ===
				generationModels.length - 1
					? $t.analysisInfo.listAnd
					: ', '}{/if}<a
				href={model.docsUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="info-link">{model.badgeName}</a
			>{/each}. {$t.analysis.methodologyCorpusDimensions}
	</p>

	<div class="accordion-container">
		<!-- One accordion per dimension: same shape, different scale and notes. -->
		{#snippet dimensionPanel(
			key: string,
			title: string,
			description: string,
			items: ScaleItem[],
			dimensionNotes: readonly string[]
		)}
			<AccordionItem {title} open={accordion.isOpen(key)} onToggle={() => accordion.toggle(key)}>
				<p class="panel-description">{description}</p>
				<SentimentScaleList {items} />
				{#if dimensionNotes.length > 0}
					<ul class="scale-notes">
						{#each dimensionNotes as note (note)}
							<li>{note}</li>
						{/each}
					</ul>
				{/if}
			</AccordionItem>
		{/snippet}

		{#each dimensions as dimension (dimension.key)}
			{@render dimensionPanel(
				dimension.key,
				dimension.title,
				dimension.description,
				dimension.items,
				notes[dimension.id]
			)}
		{/each}

		<!-- Methodology Section -->
		<AccordionItem
			title={$t.analysis.methodologyAiModel}
			open={accordion.isOpen('methodologie')}
			onToggle={() => accordion.toggle('methodologie')}
		>
			<div class="methodology-content">
				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.modelUsed}</h4>
					{#if panelView}
						<p class="section-text">{$t.analysisInfo.panelReadSame}</p>
						<div class="model-grid">
							{#each generationModels as model (model.id)}
								<div class="model-card">
									<div class="model-header">
										<img src={asset(model.logo)} alt={model.logoAlt} class="model-logo" />
										<span class="model-name">{model.cardName}</span>
									</div>
									<p class="model-description">{model.cardDescription[$currentLanguage]}</p>
									{#if model.detail}
										<p class="model-description">{model.detail[$currentLanguage]}</p>
									{/if}
									{#if model.cost}
										<p class="model-cost">{model.cost[$currentLanguage]}</p>
									{/if}
									<a
										class="model-link"
										href={model.docsUrl}
										target="_blank"
										rel="noopener noreferrer">{$t.analysisInfo.docs}</a
									>
								</div>
							{/each}
						</div>
						<p class="section-note">{$t.analysisInfo.panelSwitch}</p>
					{:else}
						<p class="section-text">
							{$t.analysisInfo.ratingsFrom}

							{#if selectedModel}
								<a
									href={selectedModel.docsUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="model-badge {selectedModel.id}">{selectedModel.badgeName}</a
								>{selectedModel.inlineDescription[$currentLanguage]}
								{#if selectedModel.detail}
									<span class="model-detail">{selectedModel.detail[$currentLanguage]}</span>
								{/if}
								{#if selectedModel.cost}
									<span class="model-detail">{selectedModel.cost[$currentLanguage]}</span>
								{/if}
							{/if}
						</p>
					{/if}

					{#if !datasetState.isArchived}
						<!-- The only route into the archived analysis. Deliberately a quiet
						     footnote: the earlier campaign stays citable without competing
						     with the current one for attention. -->
						<p class="archive-link-row">
							<button type="button" class="archive-link" onclick={viewArchive}>
								{$t.generations.archiveLinkLabel}
							</button>
							<span class="archive-link-note">{$t.generations.archiveLinkDescription}</span>
						</p>
					{/if}
				</div>

				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.technicalConfiguration}</h4>
					<!-- The run configuration is a fact about one campaign, so it comes
					     from the generation block rather than being assembled here. The
					     two runs share no parameter: v1 sent no reasoning setting at all
					     and pinned temperature on two of its three models, while v2 sets
					     a reasoning effort per model across a six-model panel. -->
					<ul class="config-list">
						{#each copy.config as line (line)}
							<li>{line}</li>
						{/each}
						{#if panelView}
							<li>{$t.analysisInfo.independentReading}</li>
							<li>{$t.analysisInfo.differencesAfterwards}</li>
						{/if}
					</ul>
				</div>

				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.analysisPrompt}</h4>
					<p class="section-text">
						{panelView ? $t.analysisInfo.samePrompt : $t.analysis.promptDescription}
					</p>
					<ul class="config-list">
						{#each copy.promptFeatures as feature (feature)}
							<li>{feature}</li>
						{/each}
						{#if panelView}
							<li>{$t.analysisInfo.identicalPrompt}</li>
						{/if}
					</ul>
					<button class="prompt-btn" onclick={openPrompt}>
						{$t.analysis.viewFullPrompt}
					</button>
				</div>
			</div>
		</AccordionItem>

		<!-- Limitations Section -->
		<AccordionItem
			title={$t.analysis.limitationsTitle}
			open={accordion.isOpen('limites')}
			onToggle={() => accordion.toggle('limites')}
		>
			<p class="panel-description">{$t.analysis.limitationsDescription}</p>
			{#if panelView}
				<div class="comparison-notice">
					<h4 class="section-title">{$t.analysisInfo.readingComparison}</h4>
					<ul class="config-list">
						{#each $t.analysisInfo.comparisonCaveats as caveat (caveat)}
							<li>{caveat}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<!-- Prompt Modal -->
<PromptModal open={viewOptionsState.prompt} onClose={() => (viewOptionsState.prompt = false)}>
	{#snippet title()}
		{$t.analysisInfo.promptTitle}
	{/snippet}

	{#if $t.analysisInfo.translationNote}
		<div class="translation-notice">
			<p>
				<strong>{$t.analysisInfo.translationNoteLabel}</strong>
				{$t.analysisInfo.translationNote}
			</p>
		</div>
	{/if}

	<div class="prompt-code-container">
		<!-- The prompt was rewritten between generations, so showing the current
		     text next to archived scores would misattribute them. -->
		<!-- Memoized: resolves at once when the click already loaded it. -->
		{#await loadPromptTexts()}
			<p class="prompt-loading" role="status">{$t.messages.loading}</p>
		{:then}
			{#if activePrompt}
				<pre class="prompt-code">{activePrompt[$currentLanguage]}</pre>
				{#if datasetState.generation === 'v2'}
					<p class="prompt-fingerprint">
						{$t.analysisInfo.promptFingerprint.replace(
							'{fingerprint}',
							SENTIMENT_CONTRACT_V2.provenance.sentimentPromptFingerprint
						)}
					</p>
				{/if}
			{/if}
		{:catch}
			<p class="prompt-loading" role="status">{$t.messages.dataLoadError}</p>
		{/await}
	</div>
</PromptModal>

<style>
	/* ==========================================================================
     CARD BODY CONTENT
     ========================================================================== */
	.article-count {
		color: var(--color-primary-300);
		font-weight: var(--font-weight-semibold);
		font-variant-numeric: tabular-nums;
	}

	.info-description {
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
		font-size: var(--font-size-base);
		margin-bottom: var(--space-5);
		max-width: var(--prose-width);
	}

	.info-link {
		color: var(--color-primary-300);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.info-link:hover {
		color: var(--color-primary-200);
	}

	/* ==========================================================================
     ACCORDION CONTAINER
     ========================================================================== */
	.accordion-container {
		display: flex;
		flex-direction: column;
		gap: 0;
		background: var(--surface-nested);
		border: 1px solid var(--border-subtle);
		overflow: hidden;
	}

	/* ==========================================================================
     PANEL CONTENT STYLES
     ========================================================================== */
	.panel-description {
		color: var(--text-secondary);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		margin-bottom: var(--space-4);
		max-width: var(--prose-width);
	}

	/* The prompt's prose boundary rules. They decide how an ambiguous article is
	   coded, so they belong beside the scale — but under it, in a quieter
	   register, because the labels are what a reader looks up. */
	.scale-notes {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-2-5);
		padding: 0;
		margin: var(--space-4) 0 0;
		max-width: var(--prose-width);
	}

	.scale-notes li {
		border-left: 1px solid var(--border-subtle);
		padding-left: var(--space-3);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
	}

	/* ==========================================================================
     METHODOLOGY SECTION
     ========================================================================== */
	.methodology-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.methodology-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section-title {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--text-primary);
		margin: 0;
	}

	.section-text {
		color: var(--text-secondary);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		margin: 0;
	}

	.section-note {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-style: italic;
		margin: 0;
	}

	.archive-link-row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		margin: var(--space-3) 0 0;
		font-size: var(--font-size-sm);
	}

	/* A link, not a button box: this is a footnote, not a call to action. */
	.archive-link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--text-secondary);
		font-size: inherit;
		font-family: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}

	.archive-link:hover {
		color: var(--text-primary);
	}

	.archive-link-note {
		color: var(--text-muted);
	}

	.config-list {
		list-style: disc;
		padding-left: var(--space-5);
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
	}

	.config-list li {
		margin-bottom: var(--space-1);
	}

	/* ==========================================================================
     MODEL CARDS
     ========================================================================== */
	/* Auto-fit rather than a column count per breakpoint: the panel is three
	   cards on the archive and six on the current generation, so a hardcoded
	   `repeat(3, 1fr)` would strand two cards in a half-empty row on one of
	   them. The floor token does the reflow; no media query restates it. */
	.model-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--width-model-card-min)), 1fr));
		gap: var(--space-3-5);
		margin-top: var(--space-2);
	}

	.model-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		padding: var(--space-4);
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			box-shadow var(--timing-normal) var(--easing-default),
			transform var(--timing-normal) var(--easing-default);
	}

	.model-card:hover {
		background: var(--surface-card-hover);
		border-color: var(--border-hover);
	}

	.model-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}

	.model-name {
		font-weight: var(--font-weight-semibold);
		font-size: var(--font-size-base);
		color: var(--text-primary);
	}

	.model-description {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: var(--line-height-normal);
		margin: 0 0 var(--space-2) 0;
	}

	/* A measured figure, so it reads as data rather than prose: same size as the
	   description above it, tabular so three cards line their amounts up. */
	.model-cost {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-normal);
		margin: 0 0 var(--space-2) 0;
	}

	.model-link {
		font-size: var(--font-size-xs);
		color: var(--color-primary-300);
		text-decoration: none;
		transition: color var(--timing-fast) var(--easing-default);
	}

	.model-link:hover {
		color: var(--color-primary-200);
	}

	.model-logo {
		width: var(--size-icon-lg);
		height: var(--size-icon-lg);
		object-fit: contain;
		flex-shrink: 0;
	}

	.model-badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2-5);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		border-radius: var(--radius-hairline);
		text-decoration: none;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default);
	}

	.model-badge.chatgpt {
		background: color-mix(in oklab, var(--color-primary-500) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 32%, transparent);
		color: var(--color-primary-300);
	}

	.model-badge.chatgpt:hover {
		background: color-mix(in oklab, var(--color-primary-500) 28%, transparent);
	}

	.model-badge.gemini {
		background: color-mix(in oklab, var(--color-secondary-500) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-secondary-500) 32%, transparent);
		color: var(--color-secondary-300);
	}

	.model-badge.gemini:hover {
		background: color-mix(in oklab, var(--color-secondary-500) 28%, transparent);
	}

	/* Mistral's own brand red — deliberately off the OKLCH ramps, via the
	   --brand-* tokens so the literal lives in exactly one place. */
	.model-badge.mistral {
		background: color-mix(in oklab, var(--brand-mistral) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-mistral) 32%, transparent);
		color: var(--brand-mistral-light);
	}

	.model-badge.mistral:hover {
		background: color-mix(in oklab, var(--brand-mistral) 28%, transparent);
	}

	/* Generation 2. Luna and mistral-small reuse their vendor's badge colour;
	   the two generations never render together, so there is no ambiguity. */
	.model-badge.luna {
		background: color-mix(in oklab, var(--color-primary-500) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 32%, transparent);
		color: var(--color-primary-300);
	}

	.model-badge.luna:hover {
		background: color-mix(in oklab, var(--color-primary-500) 28%, transparent);
	}

	.model-badge.mistral-small {
		background: color-mix(in oklab, var(--brand-mistral) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-mistral) 32%, transparent);
		color: var(--brand-mistral-light);
	}

	.model-badge.mistral-small:hover {
		background: color-mix(in oklab, var(--brand-mistral) 28%, transparent);
	}

	.model-badge.deepseek {
		background: color-mix(in oklab, var(--brand-deepseek) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-deepseek) 32%, transparent);
		color: var(--brand-deepseek-light);
	}

	.model-badge.deepseek:hover {
		background: color-mix(in oklab, var(--brand-deepseek) 28%, transparent);
	}

	.model-badge.gemma {
		background: color-mix(in oklab, var(--brand-gemma) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-gemma) 32%, transparent);
		color: var(--brand-gemma-light);
	}

	.model-badge.gemma:hover {
		background: color-mix(in oklab, var(--brand-gemma) 28%, transparent);
	}

	.model-badge.qwen {
		background: color-mix(in oklab, var(--brand-qwen) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-qwen) 32%, transparent);
		color: var(--brand-qwen-light);
	}

	.model-badge.qwen:hover {
		background: color-mix(in oklab, var(--brand-qwen) 28%, transparent);
	}

	.model-badge.haiku {
		background: color-mix(in oklab, var(--brand-claude) 18%, transparent);
		border: 1px solid color-mix(in oklab, var(--brand-claude) 32%, transparent);
		color: var(--brand-claude-light);
	}

	.model-badge.haiku:hover {
		background: color-mix(in oklab, var(--brand-claude) 28%, transparent);
	}

	.model-detail {
		display: block;
		margin-top: var(--space-2);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		font-style: italic;
	}

	/* ==========================================================================
     PROMPT BUTTON
     ========================================================================== */
	.prompt-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		margin-top: var(--space-3);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		background: color-mix(in oklab, var(--color-primary-500) 14%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-primary-500) 26%, transparent);
		border-radius: var(--radius-panel);
		color: var(--color-primary-200);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			border-color var(--timing-fast) var(--easing-default),
			transform var(--timing-fast) var(--easing-default);
	}

	.prompt-btn:hover {
		background: color-mix(in oklab, var(--color-primary-500) 24%, transparent);
		border-color: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
	}

	/* ==========================================================================
     COMPARISON NOTICE
     ========================================================================== */
	.comparison-notice {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: color-mix(in oklab, var(--color-warning-500) 8%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-warning-500) 25%, transparent);
	}

	.comparison-notice::before {
		content: 'Note';
		display: block;
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: 600;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--color-warning-300);
		margin-bottom: var(--space-2);
	}

	.comparison-notice .section-title {
		color: var(--color-warning-300);
		margin-bottom: var(--space-2);
	}

	.comparison-notice .config-list {
		color: var(--text-secondary);
	}

	/* ==========================================================================
     PROMPT MODAL BODY CONTENT
     (styles for content rendered inside PromptModal from this component)
     ========================================================================== */
	.translation-notice {
		padding: var(--space-3-5) var(--space-4);
		margin-bottom: var(--space-4);
		background: color-mix(in oklab, var(--color-warning-500) 8%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-warning-500) 25%, transparent);
	}

	.translation-notice p {
		color: var(--color-warning-300);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-normal);
		margin: 0;
	}

	.prompt-code-container {
		background: color-mix(in oklab, var(--color-surface-950) 80%, transparent);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-panel);
		padding: var(--space-4);
		overflow-x: auto;
	}

	.prompt-code {
		font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', 'Courier New', monospace;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.prompt-fingerprint {
		margin: var(--space-3) 0 0;
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* ==========================================================================
     RESPONSIVE
     ========================================================================== */
	@media (min-width: 640px) {
		.info-description {
			font-size: var(--font-size-base);
		}
	}

	/* ==========================================================================
     REDUCED MOTION
     ========================================================================== */
	@media (prefers-reduced-motion: reduce) {
		.model-card,
		.prompt-btn {
			transition: none;
			animation: none;
		}
	}
</style>
