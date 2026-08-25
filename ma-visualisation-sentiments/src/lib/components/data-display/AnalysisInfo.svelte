<script lang="ts">
	import { t, currentLanguage, type Language } from '$lib/i18n';
	import { num } from '$lib/i18n/utils';
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
		 * rather than in one line of the configuration list because the unit
		 * differs: Mistral bills in euros, three others in dollars, and Qwen ran
		 * on university GPU hours with no invoice at all. Recorded only for the
		 * generation whose invoices were kept.
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
				en: 'A smaller, cheaper version of GPT-5 from OpenAI, released in August 2025, with a 400,000-token context window.',
				fr: 'Une version plus petite et moins chère de GPT-5, publiée par OpenAI en août 2025, avec une fenêtre de contexte de 400 000 tokens.'
			},
			detail: {
				en: 'It is faster and cheaper to run than GPT-5, and is meant for narrowly defined tasks.',
				fr: 'Il tourne plus vite et coûte moins cher que GPT-5, et vise des tâches étroitement définies.'
			},
			inlineDescription: {
				en: ', OpenAI’s smaller GPT-5 variant, released in August 2025, with a 400,000-token context window.',
				fr: ', la déclinaison réduite de GPT-5 chez OpenAI, publiée en août 2025, avec une fenêtre de contexte de 400 000 tokens.'
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
				en: 'Google’s speed-oriented model, released in December 2025, with a one-million-token context window.',
				fr: 'Le modèle rapide de Google, publié en décembre 2025, avec une fenêtre de contexte d’un million de tokens.'
			},
			detail: {
				en: 'It is the fast member of the Gemini 3 family, tuned for throughput rather than depth.',
				fr: 'C’est le membre rapide de la famille Gemini 3, réglé pour le débit plutôt que pour la profondeur.'
			},
			inlineDescription: {
				en: ', Google’s speed-oriented model, released in December 2025, with a one-million-token context window.',
				fr: ', le modèle rapide de Google, publié en décembre 2025, avec une fenêtre de contexte d’un million de tokens.'
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
				en: 'The largest model in Mistral’s Ministral 3 family, released in December 2025. Mistral rates it as comparable to its own Small 3.2 24B.',
				fr: 'Le plus grand modèle de la famille Ministral 3 de Mistral, publié en décembre 2025. Mistral le juge comparable à son propre Small 3.2 24B.'
			},
			detail: {
				en: 'It is small enough to run on modest hardware, including locally.',
				fr: 'Il est assez léger pour tourner sur un matériel modeste, y compris en local.'
			},
			inlineDescription: {
				en: ', the largest model in Mistral’s Ministral 3 family, released in December 2025 and rated by Mistral as comparable to its own Small 3.2 24B.',
				fr: ', le plus grand modèle de la famille Ministral 3 de Mistral, publié en décembre 2025 et jugé par Mistral comparable à son propre Small 3.2 24B.'
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
				en: 'OpenAI’s reasoning model, run at medium reasoning effort, which is the reference setting for this panel.',
				fr: "Le modèle de raisonnement d'OpenAI, exécuté avec un effort de raisonnement moyen, réglage qui sert de référence à ce panel."
			},
			cost: {
				en: 'Full corpus pass: US$9.48',
				fr: 'Passage sur le corpus complet : 9,48 $ US'
			},
			inlineDescription: {
				en: ', OpenAI’s reasoning model, run at medium reasoning effort for the second annotation campaign.',
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
				en: 'Mistral’s small reasoning model, with open weights under an Apache 2.0 licence. It ran at high reasoning effort because its API refuses the lower settings.',
				fr: 'Le petit modèle de raisonnement de Mistral, à poids ouverts sous licence Apache 2.0. Il a tourné avec un effort de raisonnement élevé, son API refusant les réglages inférieurs.'
			},
			cost: {
				en: 'Full corpus pass: €6.48',
				fr: 'Passage sur le corpus complet : 6,48 €'
			},
			inlineDescription: {
				en: ', Mistral’s small reasoning model, run at high reasoning effort for the second annotation campaign.',
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
				en: 'A reasoning model with open weights under an MIT licence, served through OpenRouter rather than by its maker. It ran at high reasoning effort because it offers no middle setting.',
				fr: 'Un modèle de raisonnement à poids ouverts sous licence MIT, servi via OpenRouter plutôt que par son concepteur. Il a tourné avec un effort de raisonnement élevé, faute de réglage intermédiaire.'
			},
			cost: {
				en: 'Full corpus pass: US$10.96',
				fr: 'Passage sur le corpus complet : 10,96 $ US'
			},
			inlineDescription: {
				en: ', a reasoning model with open weights, served through a third party rather than by its maker.',
				fr: ', un modèle de raisonnement à poids ouverts, servi par un tiers plutôt que par son concepteur.'
			}
		},
		{
			id: 'gemma',
			logo: '/logo/Gemma_logo.png',
			logoAlt: 'Gemma logo',
			cardName: 'Gemma 4 31B',
			badgeName: 'Gemma 4 31B',
			docsUrl: 'https://huggingface.co/google/gemma-4-31b-it',
			cardDescription: {
				en: 'Google’s open-weights model, served through OpenRouter rather than by Google’s own API, whose free tier may use submitted content to improve its products — which whole archival articles cannot go through.',
				fr: 'Le modèle à poids ouverts de Google, servi via OpenRouter plutôt que par l’API de Google, dont l’offre gratuite peut exploiter les contenus soumis pour améliorer ses produits — ce à quoi des articles d’archives entiers ne peuvent être soumis.'
			},
			detail: {
				en: 'Its OpenRouter route collapses the reasoning-effort ladder: medium and high are indistinguishable. It is also the slowest member of the panel, at roughly 72 seconds per call.',
				fr: 'Sa route OpenRouter écrase l’échelle d’effort de raisonnement : moyen et élevé y sont indiscernables. C’est aussi le membre le plus lent du panel, à environ 72 secondes par appel.'
			},
			cost: {
				en: 'Full corpus pass: US$9.51',
				fr: 'Passage sur le corpus complet : 9,51 $ US'
			},
			inlineDescription: {
				en: ', Google’s open-weights model, served through OpenRouter rather than by Google’s own API.',
				fr: ', le modèle à poids ouverts de Google, servi via OpenRouter plutôt que par l’API de Google.'
			}
		},
		{
			id: 'qwen',
			logo: '/logo/Qwen_logo.png',
			logoAlt: 'Qwen logo',
			cardName: 'Qwen3.8 27B',
			badgeName: 'Qwen3.8 27B',
			docsUrl: 'https://huggingface.co/Qwen/Qwen3.8-27B',
			cardDescription: {
				en: 'Alibaba’s open-weights model, and the only member of the panel run on hardware the project controls: self-hosted with vLLM on the University of Bayreuth’s Festus cluster.',
				fr: 'Le modèle à poids ouverts d’Alibaba, et le seul membre du panel exécuté sur du matériel que le projet maîtrise : auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth.'
			},
			detail: {
				en: 'It is also the only member with a verified reasoning-effort ladder, so it genuinely ran at medium. Its coverage is 200 articles short of the rest of the panel, and that gap is permanent — see the limitations.',
				fr: 'C’est aussi le seul dont l’échelle d’effort de raisonnement a été vérifiée : il a réellement tourné à un niveau moyen. Sa couverture accuse 200 articles de moins que le reste du panel, et ce manque est définitif — voir les limites.'
			},
			cost: {
				en: 'No API fee: run on University of Bayreuth GPU hours.',
				fr: 'Aucun frais d’API : exécuté sur des heures GPU de l’université de Bayreuth.'
			},
			inlineDescription: {
				en: ', Alibaba’s open-weights model, self-hosted with vLLM on the University of Bayreuth’s Festus cluster.',
				fr: ', le modèle à poids ouverts d’Alibaba, auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth.'
			}
		}
	];

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
		<strong class="article-count">{$num(totalArticleCount)}</strong>
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
								? 'Every model in the panel read the same articles, so their answers can be set side by side:'
								: 'Chaque modèle du panel a lu les mêmes articles, ce qui permet de placer leurs réponses côte à côte :'}
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
								? 'Use the model picker in the header to switch between models, or turn on comparison mode to see where they differ.'
								: 'Utilisez le sélecteur de modèles dans l’en-tête pour passer d’un modèle à l’autre, ou activez le mode comparaison pour voir où ils diffèrent.'}
						</p>
					{:else}
						<p class="section-text">
							{$currentLanguage === 'en'
								? 'The ratings on screen come from '
								: 'Les notes affichées viennent de '}

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
					     a reasoning effort per model across a five-model panel. -->
					<ul class="config-list">
						{#each copy.config as line (line)}
							<li>{line}</li>
						{/each}
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en'
									? 'Every model reads the same articles independently, with no sight of the others’ answers'
									: 'Chaque modèle lit les mêmes articles de son côté, sans connaître les réponses des autres'}
							</li>
							<li>
								{$currentLanguage === 'en'
									? 'Differences between the models are computed afterwards, dimension by dimension'
									: 'Les écarts entre modèles sont calculés ensuite, dimension par dimension'}
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
								: 'Chaque modèle reçoit le même prompt, de sorte que la comparaison mesure les modèles et non leurs instructions :'
							: $t.analysis.promptDescription}
					</p>
					<ul class="config-list">
						{#each copy.promptFeatures as feature (feature)}
							<li>{feature}</li>
						{/each}
						{#if datasetState.isComparisonMode}
							<li>
								{$currentLanguage === 'en'
									? 'The prompt is identical for every model, so nothing in the instructions favours one of them'
									: 'Le prompt est identique pour tous les modèles, si bien que rien dans les instructions n’en favorise un'}
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
						{$currentLanguage === 'en' ? 'Reading the comparison' : 'Lire la comparaison'}
					</h4>
					<ul class="config-list">
						<li>
							{$currentLanguage === 'en'
								? 'Differences between models can come from their training data, their architecture and the way they were tuned, and need not mean that one is more accurate'
								: 'Les écarts entre modèles peuvent tenir à leurs données d’entraînement, à leur architecture et à la façon dont ils ont été réglés, sans qu’aucun soit pour autant plus juste'}
						</li>
						<li>
							{$currentLanguage === 'en'
								? 'No model is a ground truth. Where two of them disagree, the article is worth reading yourself'
								: 'Aucun modèle ne fait référence. Là où deux d’entre eux divergent, l’article mérite d’être lu'}
						</li>
						<li>
							{$currentLanguage === 'en'
								? 'These comparisons are most useful for spotting patterns across the corpus, and least useful as a verdict on any single article'
								: 'Ces comparaisons servent surtout à repérer des motifs à l’échelle du corpus, et fort peu à trancher sur un article isolé'}
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
		{$currentLanguage === 'en' ? 'The full analysis prompt' : 'Le prompt d’analyse complet'}
	{/snippet}

	{#if $currentLanguage === 'en'}
		<div class="translation-notice">
			<p>
				<strong>Note:</strong> this is a translation of the prompt. The models were instructed in French,
				because the corpus is in French.
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
	/* Auto-fit rather than a column count per breakpoint: the panel is three
	   cards on the archive and five on the current generation, so a hardcoded
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
