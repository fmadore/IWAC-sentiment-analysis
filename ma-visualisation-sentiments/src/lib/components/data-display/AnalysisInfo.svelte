<script lang="ts">
	import { t, currentLanguage, type Language } from '$lib/i18n';
	import { datasetState, articleState, uiState } from '$lib/stores';
	import { updateURL } from '$lib/stores/url';
	import { ARCHIVED_GENERATION, generationOf, type DatasetId } from '$lib/domain/sentimentContract';
	import { AccordionItem, PromptModal } from '$lib/components/common';
	import CollapsibleMethodologyCard from '$lib/components/common/CollapsibleMethodologyCard.svelte';
	import SentimentScaleList, {
		type ScaleItem
	} from '$lib/components/common/SentimentScaleList.svelte';
	import { SENTIMENT_ANALYSIS_PROMPT, SENTIMENT_ANALYSIS_PROMPT_V2 } from '$lib/data/prompts';
	import { base } from '$app/paths';
	import { createAccordion } from '$lib/utils/accordion.svelte';

	const accordion = createAccordion();

	// State for the prompt modal
	let showPromptModal = $state(false);

	// Compute total article count from all datasets
	let totalArticleCount = $derived.by(() => {
		const datasets = articleState.datasets;
		const firstDataset = Object.values(datasets)[0];
		return firstDataset?.length ?? 0;
	});

	type LocalizedText = Record<Language, string>;

	interface ModelInfo {
		id: DatasetId;
		logo: string;
		logoAlt: string;
		/** Name shown on the comparison-grid card */
		cardName: string;
		/** Name shown in the single-model badge link */
		badgeName: string;
		docsUrl: string;
		/** First card paragraph (comparison grid) */
		cardDescription: LocalizedText;
		/**
		 * Second card paragraph (grid) / detail line (single-model view).
		 * Optional: the generation-2 cards carry the run configuration only, so
		 * a claim about a model's behaviour has somewhere to be checked.
		 */
		detail?: LocalizedText;
		/**
		 * What one full pass over the corpus cost, measured against the
		 * provider's own billing rather than inferred from a rate card — the
		 * rate cards in the pipeline's registry have been wrong by 5×. Per model
		 * rather than in one line of the configuration list because the currency
		 * differs: Mistral bills in euros, the other two in dollars. Recorded
		 * only for the generation whose invoices were kept.
		 */
		cost?: LocalizedText;
		/** Sentence following the badge link in the single-model view */
		inlineDescription: LocalizedText;
	}

	const MODELS: ModelInfo[] = [
		{
			id: 'chatgpt',
			logo: '/logo/ChatGPT_logo.svg',
			logoAlt: 'ChatGPT logo',
			cardName: 'ChatGPT (GPT-5 mini)',
			badgeName: 'GPT-5 mini',
			docsUrl: 'https://platform.openai.com/docs/models/gpt-5-mini',
			cardDescription: {
				en: "OpenAI's efficient model with a 400,000-token context window, released August 2025. Enhanced reasoning and cost-effectiveness.",
				fr: "Modèle efficace d'OpenAI avec une fenêtre de contexte de 400 000 tokens, publié en août 2025. Raisonnement amélioré et coût optimisé."
			},
			detail: {
				en: "GPT-5 mini is a faster, more cost-efficient version of GPT-5. It's great for well-defined tasks and precise prompts.",
				fr: 'GPT-5 mini est une version plus rapide et économique de GPT-5. Idéal pour des tâches bien définies et des invites précises.'
			},
			inlineDescription: {
				en: ", OpenAI's efficient model with a 400,000-token context window and enhanced reasoning capabilities, released in August 2025.",
				fr: ", le modèle efficace d'OpenAI avec une fenêtre de contexte de 400 000 tokens et des capacités de raisonnement améliorées, publié en août 2025."
			}
		},
		{
			id: 'gemini',
			logo: '/logo/Gemini_logo.svg',
			logoAlt: 'Gemini logo',
			cardName: 'Gemini 3 Flash',
			badgeName: 'Gemini 3 Flash',
			docsUrl: 'https://ai.google.dev/gemini-api/docs/models#gemini-3-flash',
			cardDescription: {
				en: "Google's latest Flash model with advanced reasoning capabilities and a 1 million token context window, released December 2025.",
				fr: 'Le dernier modèle Flash de Google avec des capacités de raisonnement avancées et une fenêtre de contexte de 1 million de tokens, publié en décembre 2025.'
			},
			detail: {
				en: 'Gemini 3 Flash is optimized for speed and efficiency while maintaining high-quality outputs for text analysis tasks.',
				fr: "Gemini 3 Flash est optimisé pour la rapidité et l'efficacité tout en maintenant des sorties de haute qualité pour les tâches d'analyse textuelle."
			},
			inlineDescription: {
				en: ", Google's latest Flash model with advanced reasoning capabilities and a 1 million token context window, released December 2025.",
				fr: ', le dernier modèle Flash de Google avec des capacités de raisonnement avancées et une fenêtre de contexte de 1 million de tokens, publié en décembre 2025.'
			}
		},
		{
			id: 'mistral',
			logo: '/logo/Mistral_AI_logo.svg',
			logoAlt: 'Mistral logo',
			cardName: 'Ministral 3 14B',
			badgeName: 'Ministral 3 14B',
			docsUrl: 'https://docs.mistral.ai/models/ministral-3-14b-25-12',
			cardDescription: {
				en: "Mistral's largest model in the Ministral 3 family, offering state-of-the-art capabilities comparable to Mistral Small 3.2 24B, released December 2025.",
				fr: 'Le plus grand modèle de Mistral dans la famille Ministral 3, offrant des capacités de pointe comparables à Mistral Small 3.2 24B, publié en décembre 2025.'
			},
			detail: {
				en: 'Ministral 3 14B delivers high performance across diverse hardware and is optimized for efficient local deployment.',
				fr: 'Ministral 3 14B offre des performances élevées sur divers matériels et est optimisé pour un déploiement local efficace.'
			},
			inlineDescription: {
				en: ", Mistral's largest model in the Ministral 3 family, offering state-of-the-art capabilities comparable to Mistral Small 3.2 24B, released December 2025.",
				fr: ', le plus grand modèle de Mistral dans la famille Ministral 3, offrant des capacités de pointe comparables à Mistral Small 3.2 24B, publié en décembre 2025.'
			}
		},
		{
			id: 'luna',
			logo: '/logo/ChatGPT_logo.svg',
			logoAlt: 'OpenAI logo',
			cardName: 'GPT-5.6 Luna',
			badgeName: 'GPT-5.6 Luna',
			docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
			cardDescription: {
				en: "OpenAI's reasoning model for the second campaign, run at medium reasoning effort — the panel's reference setting.",
				fr: "Le modèle de raisonnement d'OpenAI pour la seconde campagne, exécuté avec un effort de raisonnement moyen — le réglage de référence du panel."
			},
			cost: {
				en: 'Full corpus pass: US$9.48',
				fr: 'Passage sur le corpus complet : 9,48 $ US'
			},
			inlineDescription: {
				en: ", OpenAI's reasoning model, run at medium reasoning effort for the second annotation campaign.",
				fr: ", le modèle de raisonnement d'OpenAI, exécuté avec un effort de raisonnement moyen pour la seconde campagne d'annotation."
			}
		},
		{
			id: 'mistral-small',
			logo: '/logo/Mistral_AI_logo.svg',
			logoAlt: 'Mistral logo',
			cardName: 'Mistral Small 4 (2603)',
			badgeName: 'Mistral Small 4',
			docsUrl: 'https://docs.mistral.ai/models/model-cards/mistral-small-4-0-26-03',
			cardDescription: {
				en: "Mistral's small reasoning model, open weights under Apache 2.0, run at high reasoning effort — its API rejects the lower levels.",
				fr: 'Le petit modèle de raisonnement de Mistral, à poids ouverts sous licence Apache 2.0, exécuté avec un effort de raisonnement élevé — son API refuse les niveaux inférieurs.'
			},
			cost: {
				en: 'Full corpus pass: €6.48',
				fr: 'Passage sur le corpus complet : 6,48 €'
			},
			inlineDescription: {
				en: ", Mistral's small reasoning model, run at high reasoning effort for the second annotation campaign.",
				fr: ', le petit modèle de raisonnement de Mistral, exécuté avec un effort de raisonnement élevé pour la seconde campagne.'
			}
		},
		{
			id: 'deepseek',
			logo: '/logo/DeepSeek_logo.svg',
			logoAlt: 'DeepSeek logo',
			cardName: 'DeepSeek v4 Flash (0731)',
			badgeName: 'DeepSeek v4 Flash',
			docsUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731',
			cardDescription: {
				en: 'An open-weights reasoning model under an MIT licence, served through OpenRouter rather than by its vendor, and run at high reasoning effort — it has no middle level.',
				fr: "Un modèle de raisonnement à poids ouverts sous licence MIT, servi via OpenRouter plutôt que par son fournisseur, et exécuté avec un effort de raisonnement élevé — il n'a pas de niveau intermédiaire."
			},
			cost: {
				en: 'Full corpus pass: US$10.96',
				fr: 'Passage sur le corpus complet : 10,96 $ US'
			},
			inlineDescription: {
				en: ', an open-weights reasoning model, the only member of the panel not served by its vendor directly.',
				fr: ", un modèle de raisonnement à poids ouverts, le seul membre du panel qui n'est pas servi directement par son fournisseur."
			}
		}
	];

	// Only the generation on screen: the grid describes the panel being shown,
	// and mixing six cards would imply the six were run under one protocol.
	const generationModels = $derived(
		MODELS.filter((model) => generationOf(model.id) === datasetState.generation)
	);
	const selectedModel = $derived(MODELS.find((m) => m.id === datasetState.selected));

	// Each generation ran its own prompt text; the modal must show the one that
	// produced the scores on screen.
	const activePrompt = $derived(
		datasetState.generation === 'v2' ? SENTIMENT_ANALYSIS_PROMPT_V2 : SENTIMENT_ANALYSIS_PROMPT
	);

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
		updateURL(uiState.activeView, datasetState.isComparisonMode);
	}

	// Evaluation-scale items (badge class + label + description)
	const polarityItems: ScaleItem[] = $derived([
		{
			variant: 'polarity-very-positive',
			badge: $t.sentiment.veryPositive,
			description: copy.polarityVeryPositive
		},
		{
			variant: 'polarity-positive',
			badge: $t.sentiment.positive,
			description: copy.polarityPositive
		},
		{
			variant: 'polarity-neutral',
			badge: $t.sentiment.neutral,
			description: copy.polarityNeutral
		},
		{
			variant: 'polarity-negative',
			badge: $t.sentiment.negative,
			description: copy.polarityNegative
		},
		{
			variant: 'polarity-very-negative',
			badge: $t.sentiment.veryNegative,
			description: copy.polarityVeryNegative
		},
		{
			variant: 'polarity-na',
			badge: $t.sentiment.notApplicable,
			description: copy.polarityNotApplicable
		}
	]);

	// The badge stays the 1-5 rank the data files store, even though v2 asked
	// the models for the label — every chart, filter and export is keyed on the
	// rank, and showing two different scales for one dimension would not help.
	const subjectivityItems: ScaleItem[] = $derived([
		{
			variant: 'subjectivity-1',
			badge: '1',
			label: $t.subjectivity.factual,
			description: copy.subjectivity1
		},
		{
			variant: 'subjectivity-2',
			badge: '2',
			label: $t.subjectivity.ratherFactual,
			description: copy.subjectivity2
		},
		{
			variant: 'subjectivity-3',
			badge: '3',
			label: $t.subjectivity.mixed,
			description: copy.subjectivity3
		},
		{
			variant: 'subjectivity-4',
			badge: '4',
			label: $t.subjectivity.ratherSubjective,
			description: copy.subjectivity4
		},
		{
			variant: 'subjectivity-5',
			badge: '5',
			label: $t.subjectivity.subjective,
			description: copy.subjectivity5
		}
	]);

	const centralityItems: ScaleItem[] = $derived([
		{
			variant: 'centrality-very-central',
			badge: $t.centrality.veryCentral,
			description: copy.centralityVeryCentral
		},
		{
			variant: 'centrality-central',
			badge: $t.centrality.central,
			description: copy.centralityCentral
		},
		{
			variant: 'centrality-secondary',
			badge: $t.centrality.secondary,
			description: copy.centralitySecondary
		},
		{
			variant: 'centrality-marginal',
			badge: $t.centrality.marginal,
			description: copy.centralityMarginal
		},
		{
			variant: 'centrality-not-addressed',
			badge: $t.centrality.notAddressed,
			description: copy.centralityNotAddressed
		}
	]);
</script>

<CollapsibleMethodologyCard title={$t.analysis.title}>
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
		<strong class="article-count">{totalArticleCount.toLocaleString()}</strong>
		{$t.analysis.methodologyCorpusArticles}
		<a href={collectionUrl} target="_blank" rel="noopener noreferrer" class="info-link">
			{#if $currentLanguage === 'en'}
				<em>Islam West Africa Collection</em> (IWAC)
			{:else}
				<em>Collection Islam Afrique de l'Ouest</em> (CIAO)
			{/if}
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
					? $currentLanguage === 'en'
						? ' and '
						: ' et '
					: ', '}{/if}<a
				href={model.docsUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="info-link">{model.badgeName}</a
			>{/each}. {$t.analysis.methodologyCorpusDimensions}
	</p>

	<div class="accordion-container">
		<!-- Polarity Section -->
		<AccordionItem
			title={$t.analysis.polaritySection}
			open={accordion.isOpen('polarite')}
			onToggle={() => accordion.toggle('polarite')}
		>
			<p class="panel-description">{copy.polarityDescription}</p>
			<SentimentScaleList items={polarityItems} />
			{#if notes.polarity.length > 0}
				<ul class="scale-notes">
					{#each notes.polarity as note (note)}
						<li>{note}</li>
					{/each}
				</ul>
			{/if}
		</AccordionItem>

		<!-- Subjectivity Section -->
		<AccordionItem
			title={$t.analysis.subjectivitySection}
			open={accordion.isOpen('subjectivite')}
			onToggle={() => accordion.toggle('subjectivite')}
		>
			<p class="panel-description">{copy.subjectivityDescription}</p>
			<SentimentScaleList items={subjectivityItems} />
			{#if notes.subjectivity.length > 0}
				<ul class="scale-notes">
					{#each notes.subjectivity as note (note)}
						<li>{note}</li>
					{/each}
				</ul>
			{/if}
		</AccordionItem>

		<!-- Centrality Section -->
		<AccordionItem
			title={$t.analysis.centralitySection}
			open={accordion.isOpen('centralite')}
			onToggle={() => accordion.toggle('centralite')}
		>
			<p class="panel-description">{copy.centralityDescription}</p>
			<SentimentScaleList items={centralityItems} />
			{#if notes.centrality.length > 0}
				<ul class="scale-notes">
					{#each notes.centrality as note (note)}
						<li>{note}</li>
					{/each}
				</ul>
			{/if}
		</AccordionItem>

		<!-- Methodology Section -->
		<AccordionItem
			title={$t.analysis.methodologyAiModel}
			open={accordion.isOpen('methodologie')}
			onToggle={() => accordion.toggle('methodologie')}
		>
			<div class="methodology-content">
				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.modelUsed}</h4>
					{#if datasetState.isComparisonMode}
						<p class="section-text">
							{$currentLanguage === 'en'
								? 'The analysis uses three large language models (LLMs) to provide comparative insights:'
								: "L'analyse utilise trois grands modèles de langage (LLM) pour fournir des insights comparatifs :"}
						</p>
						<div class="model-grid">
							{#each generationModels as model (model.id)}
								<div class="model-card">
									<div class="model-header">
										<img src="{base}{model.logo}" alt={model.logoAlt} class="model-logo" />
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
										rel="noopener noreferrer">Docs →</a
									>
								</div>
							{/each}
						</div>
						<p class="section-note">
							{$currentLanguage === 'en'
								? 'Use the dataset picker in the header to switch between models or enable comparison mode to analyze differences in their outputs.'
								: "Utilisez le sélecteur de jeu de données dans l'en-tête pour basculer entre les modèles ou activer le mode comparaison pour analyser les différences dans leurs sorties."}
						</p>
					{:else}
						<p class="section-text">
							{$currentLanguage === 'en'
								? 'The analysis was performed using '
								: "L'analyse a été réalisée avec "}

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
					     and pinned temperature on two of its three models. -->
					<ul class="config-list">
						{#each copy.config as line (line)}
							<li>{line}</li>
						{/each}
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en'
									? 'Parallel processing: every model analyzes the same articles independently'
									: 'Traitement parallèle : chaque modèle analyse les mêmes articles de manière indépendante'}
							</li>
							<li>
								{$currentLanguage === 'en'
									? 'Discrepancy detection: Automatic identification of differences in sentiment analysis'
									: "Détection des divergences : Identification automatique des différences dans l'analyse de sentiment"}
							</li>
						{/if}
					</ul>
				</div>

				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.analysisPrompt}</h4>
					<p class="section-text">
						{datasetState.isComparisonMode
							? $currentLanguage === 'en'
								? 'Every model receives the same prompt, so the comparison measures the models rather than their instructions:'
								: 'Chaque modèle reçoit le même prompt : la comparaison mesure donc les modèles et non leurs instructions :'
							: $t.analysis.promptDescription}
					</p>
					<ul class="config-list">
						{#each copy.promptFeatures as feature (feature)}
							<li>{feature}</li>
						{/each}
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en'
									? 'Identical prompt ensures fair comparison between models'
									: 'Le prompt identique assure une comparaison équitable entre les modèles'}
							</li>
						{/if}
					</ul>
					<button class="prompt-btn" onclick={() => (showPromptModal = true)}>
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
			{#if datasetState.isComparisonMode}
				<div class="comparison-notice">
					<h4 class="section-title">
						{$currentLanguage === 'en'
							? 'Comparison Mode Considerations'
							: 'Considérations du mode comparaison'}
					</h4>
					<ul class="config-list">
						<li>
							{$currentLanguage === 'en'
								? 'Model differences may reflect varying training data, architectures, and optimization objectives rather than inherent accuracy'
								: "Les différences entre modèles peuvent refléter des données d'entraînement, des architectures et des objectifs d'optimisation variables plutôt qu'une précision inhérente"}
						</li>
						<li>
							{$currentLanguage === 'en'
								? 'Neither model should be considered a ground truth; discrepancies highlight areas requiring human expert review'
								: "Aucun modèle ne doit être considéré comme une vérité absolue ; les divergences soulignent les domaines nécessitant un examen d'expert humain"}
						</li>
						<li>
							{$currentLanguage === 'en'
								? 'Comparison results are most valuable when used to identify patterns and trends rather than definitive judgments'
								: 'Les résultats de comparaison sont plus utiles pour identifier des motifs et tendances que pour des jugements définitifs'}
						</li>
					</ul>
				</div>
			{/if}
		</AccordionItem>
	</div>
</CollapsibleMethodologyCard>

<!-- Prompt Modal -->
<PromptModal open={showPromptModal} onClose={() => (showPromptModal = false)}>
	{#snippet title()}
		{$currentLanguage === 'en' ? 'Complete Analysis Prompt' : "Prompt d'analyse complet"}
	{/snippet}

	{#if $currentLanguage === 'en'}
		<div class="translation-notice">
			<p>
				<strong>Note:</strong> This is a translation of the original French prompt used for the analysis.
				The AI model received instructions in French as the corpus consists of French-language articles.
			</p>
		</div>
	{/if}

	<div class="prompt-code-container">
		<!-- The prompt was rewritten between generations, so showing the current
		     text next to archived scores would misattribute them. -->
		<pre class="prompt-code">{activePrompt[$currentLanguage]}</pre>
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
	.model-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-3-5);
		margin-top: var(--space-2);
	}

	@media (min-width: 640px) {
		.model-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.model-grid {
			grid-template-columns: repeat(3, 1fr);
		}
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
