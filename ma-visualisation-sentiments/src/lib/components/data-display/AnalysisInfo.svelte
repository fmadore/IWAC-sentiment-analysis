<script lang="ts">
	import { t, currentLanguage, type Language } from '$lib/i18n';
	import { datasetState, articleState } from '$lib/stores';
	import { AccordionItem, PromptModal } from '$lib/components/common';
	import CollapsibleMethodologyCard from '$lib/components/common/CollapsibleMethodologyCard.svelte';
	import SentimentScaleList from '$lib/components/common/SentimentScaleList.svelte';
	import { SENTIMENT_ANALYSIS_PROMPT } from '$lib/data/prompts';
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
		id: 'chatgpt' | 'gemini' | 'mistral';
		logo: string;
		logoAlt: string;
		/** Name shown on the comparison-grid card */
		cardName: string;
		/** Name shown in the single-model badge link */
		badgeName: string;
		docsUrl: string;
		/** First card paragraph (comparison grid) */
		cardDescription: LocalizedText;
		/** Second card paragraph (grid) / detail line (single-model view) */
		detail: LocalizedText;
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
		}
	];

	const selectedModel = $derived(MODELS.find((m) => m.id === datasetState.selected));

	// Evaluation-scale items (badge class + label + description)
	const polarityItems = $derived([
		{
			badgeClass: 'sentiment-very-positive',
			badge: $t.sentiment.veryPositive,
			description: $t.analysis.veryPositiveDesc
		},
		{
			badgeClass: 'sentiment-positive',
			badge: $t.sentiment.positive,
			description: $t.analysis.positiveDesc
		},
		{
			badgeClass: 'sentiment-neutral',
			badge: $t.sentiment.neutral,
			description: $t.analysis.neutralDesc
		},
		{
			badgeClass: 'sentiment-negative',
			badge: $t.sentiment.negative,
			description: $t.analysis.negativeDesc
		},
		{
			badgeClass: 'sentiment-very-negative',
			badge: $t.sentiment.veryNegative,
			description: $t.analysis.veryNegativeDesc
		},
		{
			badgeClass: 'sentiment-na',
			badge: $t.sentiment.notApplicable,
			description: $t.analysis.notApplicableNote
		}
	]);

	const subjectivityItems = $derived([
		{
			badgeClass: 'subjectivity-1',
			badge: '1',
			label: $t.subjectivity.factual,
			description: $t.analysis.factualDesc
		},
		{
			badgeClass: 'subjectivity-2',
			badge: '2',
			label: $t.subjectivity.ratherFactual,
			description: $t.analysis.ratherFactualDesc
		},
		{
			badgeClass: 'subjectivity-3',
			badge: '3',
			label: $t.subjectivity.mixed,
			description: $t.analysis.mixedDesc
		},
		{
			badgeClass: 'subjectivity-4',
			badge: '4',
			label: $t.subjectivity.ratherSubjective,
			description: $t.analysis.ratherSubjectiveDesc
		},
		{
			badgeClass: 'subjectivity-5',
			badge: '5',
			label: $t.subjectivity.subjective,
			description: $t.analysis.subjectiveDesc
		}
	]);

	const centralityItems = $derived([
		{
			badgeClass: 'centrality-very-central',
			badge: $t.centrality.veryCentral,
			description: $t.analysis.veryCentralDesc
		},
		{
			badgeClass: 'centrality-central',
			badge: $t.centrality.central,
			description: $t.analysis.centralDesc
		},
		{
			badgeClass: 'centrality-secondary',
			badge: $t.centrality.secondary,
			description: $t.analysis.secondaryDesc
		},
		{
			badgeClass: 'centrality-marginal',
			badge: $t.centrality.marginal,
			description: $t.analysis.marginalDesc
		},
		{
			badgeClass: 'centrality-not-addressed',
			badge: $t.centrality.notAddressed,
			description: $t.analysis.notAddressedDesc
		}
	]);
</script>

<CollapsibleMethodologyCard title={$t.analysis.title}>
	<p class="info-description">
		{$t.analysis.methodologyIntro}
	</p>

	<p class="info-description">
		{$t.analysis.methodologyCorpus}
		<strong class="article-count">{totalArticleCount.toLocaleString()}</strong>
		{$t.analysis.methodologyCorpusArticles}
		<a
			href="https://islam.zmo.de/s/westafrica/"
			target="_blank"
			rel="noopener noreferrer"
			class="info-link"
		>
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
	</p>

	<div class="accordion-container">
		<!-- Polarity Section -->
		<AccordionItem
			title={$t.analysis.polaritySection}
			open={accordion.isOpen('polarite')}
			onToggle={() => accordion.toggle('polarite')}
		>
			<p class="panel-description">{$t.analysis.polarityDescription}</p>
			<SentimentScaleList items={polarityItems} />
		</AccordionItem>

		<!-- Subjectivity Section -->
		<AccordionItem
			title={$t.analysis.subjectivitySection}
			open={accordion.isOpen('subjectivite')}
			onToggle={() => accordion.toggle('subjectivite')}
		>
			<p class="panel-description">{$t.analysis.subjectivityDescription}</p>
			<SentimentScaleList items={subjectivityItems} />
		</AccordionItem>

		<!-- Centrality Section -->
		<AccordionItem
			title={$t.analysis.centralitySection}
			open={accordion.isOpen('centralite')}
			onToggle={() => accordion.toggle('centralite')}
		>
			<p class="panel-description">{$t.analysis.centralityDescription}</p>
			<SentimentScaleList items={centralityItems} />
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
							{#each MODELS as model (model.id)}
								<div class="model-card">
									<div class="model-header">
										<img src="{base}{model.logo}" alt={model.logoAlt} class="model-logo" />
										<span class="model-name">{model.cardName}</span>
									</div>
									<p class="model-description">{model.cardDescription[$currentLanguage]}</p>
									<p class="model-description">{model.detail[$currentLanguage]}</p>
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
									class="model-badge {selectedModel.id}"
								>
									{selectedModel.badgeName}
								</a>
								{selectedModel.inlineDescription[$currentLanguage]}
								<span class="model-detail">{selectedModel.detail[$currentLanguage]}</span>
							{/if}
						</p>
					{/if}
				</div>

				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.technicalConfiguration}</h4>
					<ul class="config-list">
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en' ? 'Gemini: ' : 'Gemini : '}{$t.analysis
									.temperatureConfig}
							</li>
						{:else if datasetState.selected === 'gemini'}
							<li>{$t.analysis.temperatureConfig}</li>
						{/if}
						<li>{$t.analysis.outputFormat}</li>
						<li>{$t.analysis.cacheSystem}</li>
						<li>{$t.analysis.errorHandling}</li>
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en'
									? 'Parallel processing: Both models analyze the same articles independently'
									: 'Traitement parallèle : Les deux modèles analysent les mêmes articles de manière indépendante'}
							</li>
							<li>
								{$currentLanguage === 'en'
									? 'Discrepancy detection: Automatic identification of differences in sentiment analysis'
									: "Détection des divergences : Identification automatique des différences dans l'analyse de sentiment"}
							</li>
						{/if}
						<li>
							{$currentLanguage === 'en'
								? 'API parameters: temperature=0.2, thinking_level="low" (Gemini 3)'
								: 'Paramètres API : temperature=0.2, thinking_level="low" (Gemini 3)'}
						</li>
					</ul>
				</div>

				<div class="methodology-section">
					<h4 class="section-title">{$t.analysis.analysisPrompt}</h4>
					<p class="section-text">
						{datasetState.isComparisonMode
							? $currentLanguage === 'en'
								? 'Both models use the same standardized prompt to ensure consistent analysis criteria across different AI systems:'
								: "Les deux modèles utilisent le même prompt standardisé pour assurer des critères d'analyse cohérents entre les différents systèmes d'IA :"
							: $t.analysis.promptDescription}
					</p>
					<ul class="config-list">
						<li>{$t.analysis.promptFeature1}</li>
						<li>{$t.analysis.promptFeature2}</li>
						<li>{$t.analysis.promptFeature3}</li>
						<li>{$t.analysis.promptFeature4}</li>
						<li>{$t.analysis.promptFeature5}</li>
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
		<pre class="prompt-code">{SENTIMENT_ANALYSIS_PROMPT[$currentLanguage]}</pre>
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
		font-size: var(--font-size-md);
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
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3-5);
		margin-top: var(--space-2);
	}

	@media (max-width: 900px) {
		.model-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.model-grid {
			grid-template-columns: 1fr;
		}
	}

	.model-card {
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
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
		border-radius: var(--radius-sm);
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

	/* Mistral brand red — intentionally hardcoded */
	.model-badge.mistral {
		background: color-mix(in oklab, #f54e42 18%, transparent);
		border: 1px solid color-mix(in oklab, #f54e42 32%, transparent);
		color: #f87a71;
	}

	.model-badge.mistral:hover {
		background: color-mix(in oklab, #f54e42 28%, transparent);
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
		border-radius: var(--radius-md);
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
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.14em;
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
		border-radius: var(--radius-lg);
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
	@media (max-width: 640px) {
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
