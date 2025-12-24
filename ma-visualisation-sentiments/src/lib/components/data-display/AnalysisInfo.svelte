<script lang="ts">
  import { t, currentLanguage } from '$lib/i18n';
  import { selectedDataset, comparisonMode, datasetArticles } from '$lib/stores';
  import { AccordionItem } from '$lib/components/common';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  
  // Define the type for open sections as an array of strings
  let openSections = $state<string[]>([]);
  
  // State for the main methodology panel
  let isMethodologyOpen = $state(false);
  
  // State for the prompt modal
  let showPromptModal = $state(false);
  
  // Compute total article count from all datasets
  let totalArticleCount = $derived.by(() => {
    const datasets = $datasetArticles;
    // Get the count from the first available dataset (they should all have the same articles)
    const firstDataset = Object.values(datasets)[0];
    return firstDataset?.length ?? 0;
  });
  
  // Toggle function for accordion sections
  function toggleSection(section: string) {
    if (openSections.includes(section)) {
      openSections = openSections.filter(s => s !== section);
    } else {
      openSections = [...openSections, section];
    }
  }
  
  // Function to handle modal keyboard events
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showPromptModal = false;
    }
  }
</script>

<div class="info-card">
  <!-- Collapsible Header -->
  <button 
    class="info-header-btn" 
    onclick={() => isMethodologyOpen = !isMethodologyOpen}
    aria-expanded={isMethodologyOpen}
  >
    <h2 class="info-title">{$t.analysis.title}</h2>
    <span class="header-icon" data-state={isMethodologyOpen ? 'open' : 'closed'}>
      <ChevronDownIcon size={20} />
    </span>
  </button>
  
  {#if isMethodologyOpen}
  <div class="info-content" data-state="open">
    <p class="info-description">
      {$t.analysis.methodologyIntro}
    </p>
    
    <p class="info-description">
      {$t.analysis.methodologyCorpus} 
      <strong class="article-count">{totalArticleCount.toLocaleString()}</strong> 
      {$t.analysis.methodologyCorpusArticles} 
      <a href="https://islam.zmo.de/s/westafrica/" target="_blank" rel="noopener noreferrer" class="info-link">
        {#if $currentLanguage === 'en'}
          <em>Islam West Africa Collection</em> (IWAC)
        {:else}
          <em>Collection Islam Afrique de l'Ouest</em> (CIAO)
        {/if}
      </a>{$t.analysis.methodologyCorpusDeveloper}
      <a href="https://www.frederickmadore.com/" target="_blank" rel="noopener noreferrer" class="info-link">Frédérick Madore</a>{$t.analysis.methodologyCorpusEnd}
    </p>
  
    <div class="accordion-container">
    <!-- Polarity Section -->
    <AccordionItem 
      title={$t.analysis.polaritySection}
      open={openSections.includes('polarite')}
      onToggle={() => toggleSection('polarite')}
    >
      <p class="panel-description">{$t.analysis.polarityDescription}</p>
      <ul class="sentiment-list">
        <li><span class="badge sentiment-very-positive">{$t.sentiment.veryPositive}</span> <span class="sentiment-desc">— {$t.analysis.veryPositiveDesc}</span></li>
        <li><span class="badge sentiment-positive">{$t.sentiment.positive}</span> <span class="sentiment-desc">— {$t.analysis.positiveDesc}</span></li>
        <li><span class="badge sentiment-neutral">{$t.sentiment.neutral}</span> <span class="sentiment-desc">— {$t.analysis.neutralDesc}</span></li>
        <li><span class="badge sentiment-negative">{$t.sentiment.negative}</span> <span class="sentiment-desc">— {$t.analysis.negativeDesc}</span></li>
        <li><span class="badge sentiment-very-negative">{$t.sentiment.veryNegative}</span> <span class="sentiment-desc">— {$t.analysis.veryNegativeDesc}</span></li>
        <li><span class="badge sentiment-na">{$t.sentiment.notApplicable}</span> <span class="sentiment-desc">— {$t.analysis.notApplicableNote}</span></li>
      </ul>
    </AccordionItem>
    
    <!-- Subjectivity Section -->
    <AccordionItem 
      title={$t.analysis.subjectivitySection}
      open={openSections.includes('subjectivite')}
      onToggle={() => toggleSection('subjectivite')}
    >
      <p class="panel-description">{$t.analysis.subjectivityDescription}</p>
      <ul class="sentiment-list">
        <li><span class="badge subjectivity-1">1</span> <strong class="subjectivity-label">{$t.subjectivity.factual}</strong> <span class="sentiment-desc">— {$t.analysis.factualDesc}</span></li>
        <li><span class="badge subjectivity-2">2</span> <strong class="subjectivity-label">{$t.subjectivity.ratherFactual}</strong> <span class="sentiment-desc">— {$t.analysis.ratherFactualDesc}</span></li>
        <li><span class="badge subjectivity-3">3</span> <strong class="subjectivity-label">{$t.subjectivity.mixed}</strong> <span class="sentiment-desc">— {$t.analysis.mixedDesc}</span></li>
        <li><span class="badge subjectivity-4">4</span> <strong class="subjectivity-label">{$t.subjectivity.ratherSubjective}</strong> <span class="sentiment-desc">— {$t.analysis.ratherSubjectiveDesc}</span></li>
        <li><span class="badge subjectivity-5">5</span> <strong class="subjectivity-label">{$t.subjectivity.subjective}</strong> <span class="sentiment-desc">— {$t.analysis.subjectiveDesc}</span></li>
      </ul>
    </AccordionItem>
    
    <!-- Centrality Section -->
    <AccordionItem 
      title={$t.analysis.centralitySection}
      open={openSections.includes('centralite')}
      onToggle={() => toggleSection('centralite')}
    >
      <p class="panel-description">{$t.analysis.centralityDescription}</p>
      <ul class="sentiment-list">
        <li><span class="badge centrality-very-central">{$t.centrality.veryCentral}</span> <span class="sentiment-desc">— {$t.analysis.veryCentralDesc}</span></li>
        <li><span class="badge centrality-central">{$t.centrality.central}</span> <span class="sentiment-desc">— {$t.analysis.centralDesc}</span></li>
        <li><span class="badge centrality-secondary">{$t.centrality.secondary}</span> <span class="sentiment-desc">— {$t.analysis.secondaryDesc}</span></li>
        <li><span class="badge centrality-marginal">{$t.centrality.marginal}</span> <span class="sentiment-desc">— {$t.analysis.marginalDesc}</span></li>
        <li><span class="badge centrality-not-addressed">{$t.centrality.notAddressed}</span> <span class="sentiment-desc">— {$t.analysis.notAddressedDesc}</span></li>
      </ul>
    </AccordionItem>
    
    <!-- Methodology Section -->
    <AccordionItem 
      title={$t.analysis.methodologyAiModel}
      open={openSections.includes('methodologie')}
      onToggle={() => toggleSection('methodologie')}
    >
      <div class="methodology-content">
        <div class="methodology-section">
          <h4 class="section-title">{$t.analysis.modelUsed}</h4>
          {#if $comparisonMode}
            <p class="section-text">
              {$currentLanguage === 'en' ? 'The analysis uses two large language models (LLMs) to provide comparative insights:' : 'L\'analyse utilise deux grands modèles de langage (LLM) pour fournir des insights comparatifs :'}
            </p>
            <div class="model-grid">
              <div class="model-card">
                <div class="model-header">
                  <span class="model-icon">🤖</span>
                  <span class="model-name">ChatGPT (GPT-5 mini)</span>
                </div>
                <p class="model-description">
                  {$currentLanguage === 'en' ? 'OpenAI\'s efficient model with a 400,000-token context window, released August 2025. Enhanced reasoning and cost-effectiveness.' : 'Modèle efficace d\'OpenAI avec une fenêtre de contexte de 400 000 tokens, publié en août 2025. Raisonnement amélioré et coût optimisé.'}
                </p>
                <p class="model-description">
                  {$currentLanguage === 'en' 
                    ? "GPT-5 mini is a faster, more cost-efficient version of GPT-5. It's great for well-defined tasks and precise prompts." 
                    : "GPT-5 mini est une version plus rapide et économique de GPT-5. Idéal pour des tâches bien définies et des invites précises."}
                </p>
                <a class="model-link" href="https://platform.openai.com/docs/models/gpt-5-mini" target="_blank" rel="noopener noreferrer">Docs →</a>
              </div>
              <div class="model-card">
                <div class="model-header">
                  <span class="model-icon">✨</span>
                  <span class="model-name">Gemini 3 Flash</span>
                </div>
                <p class="model-description">
                  {$currentLanguage === 'en' ? 'Google\'s latest Flash model with advanced reasoning capabilities and a 1 million token context window, released December 2025.' : 'Le dernier modèle Flash de Google avec des capacités de raisonnement avancées et une fenêtre de contexte de 1 million de tokens, publié en décembre 2025.'}
                </p>
                <p class="model-description">
                  {$currentLanguage === 'en' 
                    ? "Gemini 3 Flash is optimized for speed and efficiency while maintaining high-quality outputs for text analysis tasks." 
                    : "Gemini 3 Flash est optimisé pour la rapidité et l'efficacité tout en maintenant des sorties de haute qualité pour les tâches d'analyse textuelle."}
                </p>
                <a class="model-link" href="https://ai.google.dev/gemini-api/docs/models#gemini-3-flash" target="_blank" rel="noopener noreferrer">Docs →</a>
              </div>
            </div>
            <p class="section-note">
              {$currentLanguage === 'en' ? 'Use the dataset picker in the header to switch between models or enable comparison mode to analyze differences in their outputs.' : 'Utilisez le sélecteur de jeu de données dans l\'en-tête pour basculer entre les modèles ou activer le mode comparaison pour analyser les différences dans leurs sorties.'}
            </p>
          {:else}
            <p class="section-text">
              {$selectedDataset === 'chatgpt' 
                ? ($currentLanguage === 'en' ? 'The analysis was performed using ' : 'L\'analyse a été réalisée avec ')
                : ($currentLanguage === 'en' ? 'The analysis was performed using ' : 'L\'analyse a été réalisée avec ')}
              
              {#if $selectedDataset === 'chatgpt'}
                <a href="https://platform.openai.com/docs/models/gpt-5-mini" target="_blank" rel="noopener noreferrer" class="model-badge chatgpt">
                  GPT-5 mini
                </a>
                {$currentLanguage === 'en' 
                  ? ', OpenAI\'s efficient model with a 400,000-token context window and enhanced reasoning capabilities, released in August 2025.' 
                  : ', le modèle efficace d\'OpenAI avec une fenêtre de contexte de 400 000 tokens et des capacités de raisonnement améliorées, publié en août 2025.'}
                <span class="model-detail">{$currentLanguage === 'en' 
                  ? "GPT-5 mini is a faster, more cost-efficient version of GPT-5. It's great for well-defined tasks and precise prompts." 
                  : "GPT-5 mini est une version plus rapide et économique de GPT-5. Idéal pour des tâches bien définies et des invites précises."}</span>
              {:else}
                <a href="https://ai.google.dev/gemini-api/docs/models#gemini-3-flash" target="_blank" rel="noopener noreferrer" class="model-badge gemini">
                  Gemini 3 Flash
                </a>
                {$currentLanguage === 'en' 
                  ? ', Google\'s latest Flash model with advanced reasoning capabilities and a 1 million token context window, released December 2025.' 
                  : ', le dernier modèle Flash de Google avec des capacités de raisonnement avancées et une fenêtre de contexte de 1 million de tokens, publié en décembre 2025.'}
                <span class="model-detail">{$currentLanguage === 'en' 
                  ? "Gemini 3 Flash is optimized for speed and efficiency while maintaining high-quality outputs for text analysis tasks." 
                  : "Gemini 3 Flash est optimisé pour la rapidité et l'efficacité tout en maintenant des sorties de haute qualité pour les tâches d'analyse textuelle."}</span>
              {/if}
            </p>
          {/if}
        </div>
        
        <div class="methodology-section">
          <h4 class="section-title">{$t.analysis.technicalConfiguration}</h4>
          <ul class="config-list">
            {#if $comparisonMode}
              <li>{($currentLanguage === 'en' ? 'Gemini: ' : 'Gemini : ')}{$t.analysis.temperatureConfig}</li>
            {:else if $selectedDataset === 'gemini'}
              <li>{$t.analysis.temperatureConfig}</li>
            {/if}
            <li>{$t.analysis.outputFormat}</li>
            <li>{$t.analysis.cacheSystem}</li>
            <li>{$t.analysis.errorHandling}</li>
            {#if $comparisonMode}
              <li>{$currentLanguage === 'en' ? 'Parallel processing: Both models analyze the same articles independently' : 'Traitement parallèle : Les deux modèles analysent les mêmes articles de manière indépendante'}</li>
              <li>{$currentLanguage === 'en' ? 'Discrepancy detection: Automatic identification of differences in sentiment analysis' : 'Détection des divergences : Identification automatique des différences dans l\'analyse de sentiment'}</li>
            {/if}
            <li>{$currentLanguage === 'en' ? 'API parameters: temperature=0.2, thinking_level="low" (Gemini 3)' : 'Paramètres API : temperature=0.2, thinking_level="low" (Gemini 3)'}</li>
          </ul>
        </div>
        
        <div class="methodology-section">
          <h4 class="section-title">{$t.analysis.analysisPrompt}</h4>
          <p class="section-text">
            {$comparisonMode 
              ? ($currentLanguage === 'en' 
                ? 'Both models use the same standardized prompt to ensure consistent analysis criteria across different AI systems:'
                : 'Les deux modèles utilisent le même prompt standardisé pour assurer des critères d\'analyse cohérents entre les différents systèmes d\'IA :')
              : $t.analysis.promptDescription}
          </p>
          <ul class="config-list">
            <li>{$t.analysis.promptFeature1}</li>
            <li>{$t.analysis.promptFeature2}</li>
            <li>{$t.analysis.promptFeature3}</li>
            <li>{$t.analysis.promptFeature4}</li>
            <li>{$t.analysis.promptFeature5}</li>
            {#if $comparisonMode}
              <li>{$currentLanguage === 'en' ? 'Identical prompt ensures fair comparison between models' : 'Le prompt identique assure une comparaison équitable entre les modèles'}</li>
            {/if}
          </ul>
          <button 
            class="prompt-btn"
            onclick={() => showPromptModal = true}
          >
            {$t.analysis.viewFullPrompt}
          </button>
        </div>
      </div>
    </AccordionItem>
    
    <!-- Limitations Section -->
    <AccordionItem 
      title={$t.analysis.limitationsTitle}
      open={openSections.includes('limites')}
      onToggle={() => toggleSection('limites')}
    >
      <p class="panel-description">{$t.analysis.limitationsDescription}</p>
      {#if $comparisonMode}
        <div class="comparison-notice">
          <h4 class="section-title">
            {$currentLanguage === 'en' ? 'Comparison Mode Considerations' : 'Considérations du mode comparaison'}
          </h4>
          <ul class="config-list">
            <li>{$currentLanguage === 'en' ? 'Model differences may reflect varying training data, architectures, and optimization objectives rather than inherent accuracy' : 'Les différences entre modèles peuvent refléter des données d\'entraînement, des architectures et des objectifs d\'optimisation variables plutôt qu\'une précision inhérente'}</li>
            <li>{$currentLanguage === 'en' ? 'Neither model should be considered a ground truth; discrepancies highlight areas requiring human expert review' : 'Aucun modèle ne doit être considéré comme une vérité absolue ; les divergences soulignent les domaines nécessitant un examen d\'expert humain'}</li>
            <li>{$currentLanguage === 'en' ? 'Comparison results are most valuable when used to identify patterns and trends rather than definitive judgments' : 'Les résultats de comparaison sont plus utiles pour identifier des motifs et tendances que pour des jugements définitifs'}</li>
          </ul>
        </div>
      {/if}
    </AccordionItem>
  </div>
  </div>
  {/if}
</div>

<!-- Prompt Modal -->
{#if showPromptModal}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="prompt-modal-backdrop" 
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="prompt-modal-title"
    onclick={() => showPromptModal = false}
    onkeydown={handleModalKeydown}
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="prompt-modal" 
      role="document"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="prompt-modal-header">
        <h3 id="prompt-modal-title" class="prompt-modal-title">{$currentLanguage === 'en' ? 'Complete Analysis Prompt' : 'Prompt d\'analyse complet'}</h3>
        <button 
          class="modal-close-btn" 
          onclick={() => showPromptModal = false}
          aria-label={$currentLanguage === 'en' ? 'Close modal' : 'Fermer la modal'}
          type="button"
        >
          ✕
        </button>
      </div>
      
      <div class="prompt-modal-body">
        {#if $currentLanguage === 'en'}
          <div class="translation-notice">
            <p>
              <strong>Note:</strong> This is a translation of the original French prompt used for the analysis. 
              The AI model received instructions in French as the corpus consists of French-language articles.
            </p>
          </div>
        {/if}
        
        <div class="prompt-code-container">
          <pre class="prompt-code">{$currentLanguage === 'en' ? 
            `# Sentiment Analysis: Representation of Islam and Muslims in Francophone West African Media

You are an expert analyst of representations of Islam and Muslims in the media, with a particular focus on Francophone West Africa. Analyze the provided text by evaluating the centrality, subjectivity, and polarity concerning the treatment of Islam and/or Muslims.

Start by generating a concise checklist (3 to 7 points) listing the conceptual steps needed to complete the evaluation.

## Instructions
- All justifications must be in French.
- Do not complete or invent information if the text is insufficient; be cautious and respond "Not applicable" or "Not addressed" if necessary.

After generation, internally verify the consistency of the assigned values (e.g., if centrality = "Not addressed", then subjectivite_score = null and justifications indicate this, etc.). Correct any detected inconsistency before finalizing.

## Evaluation Scale with Examples
### Centrality
Evaluates the importance given to themes related to Islam and Muslims in the article.
- Very central: Islam/Muslims constitute the main subject of the article.
- Central: Important theme but shared with other subjects.
- Secondary: Mentioned significantly but secondary.
- Marginal: Mentioned briefly or anecdotally.
- Not addressed: No mention of Islam or Muslims.

### Subjectivity
Assign a subjectivity score based on the tone and presence of opinions or facts concerning Islam/Muslims in the article.
1: Very objective – Reports verifiable facts about Islam/Muslims without expressing personal opinions or feelings about them, purely informative style on this theme.
2: Rather objective – Mainly factual concerning Islam/Muslims, but may contain subtle traces of opinions or word choices suggesting a limited perspective on this theme.
3: Mixed – Contains a balanced mix of facts and personal opinions/feelings concerning Islam/Muslims, or presents multiple viewpoints on this theme.
4: Rather subjective – Clearly expresses opinions, feelings, or judgments about Islam/Muslims, even if based on some facts to support them.
5: Very subjective – Heavily biased in its representation of Islam/Muslims, expresses intense opinions and emotions about them, with little or no objective presentation of facts, editorial or opinion piece style on this theme.

### Polarity
Evaluates the general sentiment expressed in the article towards Islam and/or Muslims, or concerning their representation.
- Very positive: The portrayal of Islam/Muslims is extremely favorable, enthusiastic, laudatory.
- Positive: The portrayal of Islam/Muslims is favorable, optimistic.
- Neutral: No clear sentiment towards Islam/Muslims or balance between positive and negative aspects in their representation; factual tone without marked emotional charge towards them.
- Negative: The portrayal of Islam/Muslims is unfavorable, critical, pessimistic.
- Very negative: The portrayal of Islam/Muslims is extremely unfavorable, alarmist, very critical.
- Not applicable: The article does not deal with Islam or Muslims.

- If centrality = "Not addressed", then:
    - subjectivite_score = null
    - subjectivite_justification = "Not applicable as the subject is not addressed."
    - polarite = "Not applicable"
    - polarite_justification = "Not applicable as the subject is not addressed."` 
            : 
            `# Analyse de Sentiment : représentation de l'islam et des musulmans dans les médias d'Afrique de l'Ouest francophone

Vous êtes un analyste expert des représentations de l'islam et des musulmans dans les médias, avec un focus particulier sur l'Afrique de l'Ouest francophone. Analysez le texte fourni en évaluant la centralité, la subjectivité et la polarité concernant le traitement de l'islam et/ou des musulmans.

Commencez par générer une checklist concise (3 à 7 points) listant les étapes conceptuelles nécessaires pour réaliser l'évaluation.

## Instructions
- Toutes les justifications doivent être en français.
- Ne complétez pas ou n'inventez pas d'informations si le texte est insuffisant ; soyez précautionneux et répondez « Non applicable » ou « Non abordé » si nécessaire.

Après génération, vérifiez en interne la cohérence des valeurs attribuées (ex : si centralité = « Non abordé », alors subjectivite_score = null et les justifications l'indiquent, etc.). Corrigez toute incohérence détectée avant de finaliser.

## Barème d'évaluation avec exemples
### Centralité
Évalue l'importance accordée aux thèmes liés à l'islam et aux musulmans dans l'article.
- Très central : L'islam/musulmans constituent le sujet principal de l'article.
- Central : Thème important mais partagé avec d'autres sujets.
- Secondaire : Mentionné de manière significative mais secondaire.
- Marginal : Évoqué brièvement ou de manière anecdotique.
- Non abordé : Aucune mention de l'islam ou des musulmans.

### Subjectivité
Attribuez une note de subjectivité en vous appuyant sur le ton et la présence d'opinions ou de faits concernant l'islam/les musulmans dans l'article.
1 : Très objectif – Rapporte des faits vérifiables sur l'islam/les musulmans sans exprimer d'opinions ou de sentiments personnels à leur sujet, style purement informatif sur ce thème.
2 : Plutôt objectif – Principalement factuel concernant l'islam/les musulmans, mais peut contenir des traces subtiles d'opinions ou des choix de mots suggérant une perspective limitée sur ce thème.
3 : Mixte – Contient un mélange équilibré de faits et d'opinions/sentiments personnels concernant l'islam/les musulmans, ou présente plusieurs points de vue sur ce thème.
4 : Plutôt subjectif – Exprime clairement des opinions, des sentiments ou des jugements sur l'islam/les musulmans, même s'il s'appuie sur certains faits pour les étayer.
5 : Très subjectif – Fortement biaisé dans sa représentation de l'islam/des musulmans, exprime des opinions et des émotions intenses à leur sujet, avec peu ou pas de présentation objective des faits, style éditorial ou billet d'humeur sur ce thème.

### Polarité
Évalue le sentiment général exprimé dans l'article envers l'islam et/ou les musulmans, ou concernant leur représentation.
- Très positif : Le portrait de l'islam/des musulmans est extrêmement favorable, enthousiaste, élogieux.
- Positif : Le portrait de l'islam/des musulmans est favorable, optimiste.
- Neutre : Pas de sentiment clair envers l'islam/des musulmans ou équilibre entre aspects positifs et négatifs dans leur représentation ; ton factuel sans charge émotionnelle marquée à leur égard.
- Négatif : Le portrait de l'islam/des musulmans est défavorable, critique, pessimiste.
- Très négatif : Le portrait de l'islam/des musulmans est extrêmement défavorable, alarmiste, très critique.
- Non applicable : L'article ne traite pas de l'islam ou des musulmans.

- Si centralité = « Non abordé », alors :
    - subjectivite_score = null
    - subjectivite_justification = "Non applicable car le sujet n'est pas abordé."
    - polarite = "Non applicable"
    - polarite_justification = "Non applicable car le sujet n'est pas abordé."`}</pre>
        </div>
      </div>
      
      <div class="prompt-modal-footer">
        <button 
          class="close-btn" 
          onclick={() => showPromptModal = false}
          type="button"
        >
          {$t.common.close}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ==========================================================================
     INFO CARD - Main Container
     ========================================================================== */
  .info-card {
    background: color-mix(in oklab, var(--color-surface-900) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-md));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 1rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 
      0 4px 24px color-mix(in oklab, black 10%, transparent),
      inset 0 1px 0 color-mix(in oklab, var(--color-surface-50) 6%, transparent);
  }

  /* ==========================================================================
     COLLAPSIBLE HEADER BUTTON
     ========================================================================== */
  .info-header-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .info-header-btn:hover .info-title {
    opacity: 0.9;
  }

  .info-header-btn:hover .header-icon {
    background: color-mix(in oklab, var(--color-surface-50) 12%, transparent);
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
    transition: all var(--timing-fast) var(--easing-default);
    flex-shrink: 0;
  }

  .header-icon[data-state="open"] {
    transform: rotate(180deg);
    color: var(--color-primary-400);
  }

  .info-content {
    margin-top: 1rem;
    animation: slideDown 0.25s var(--easing-default);
  }

  .info-content[data-state="open"] {
    display: block;
  }

  .info-title {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  /* Article count highlight */
  .article-count {
    color: var(--color-primary-400);
    font-weight: 700;
  }

  .info-description {
    color: color-mix(in oklab, var(--color-surface-50) 85%, transparent);
    line-height: 1.7;
    font-size: 0.9375rem;
    margin-bottom: 1.25rem;
  }

  .info-link {
    color: var(--color-primary-400);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--timing-fast) var(--easing-default);
  }

  .info-link:hover {
    color: var(--color-primary-300);
  }

  /* ==========================================================================
     ACCORDION CONTAINER
     ========================================================================== */
  .accordion-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: color-mix(in oklab, var(--color-surface-950) 60%, transparent);
    backdrop-filter: blur(var(--glass-blur-sm));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border-radius: 0.875rem;
    overflow: hidden;
  }

  /* ==========================================================================
     PANEL CONTENT STYLES
     ========================================================================== */
  .panel-description {
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .sentiment-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .sentiment-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .sentiment-desc {
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
  }

  .subjectivity-label {
    color: var(--color-surface-50);
    font-weight: 500;
  }

  /* ==========================================================================
     METHODOLOGY SECTION
     ========================================================================== */
  .methodology-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .methodology-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
  }

  .section-text {
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
  }

  .section-note {
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    font-size: 0.8125rem;
    font-style: italic;
    margin: 0;
  }

  .config-list {
    list-style: disc;
    padding-left: 1.25rem;
    margin: 0;
    color: color-mix(in oklab, var(--color-surface-50) 75%, transparent);
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  .config-list li {
    margin-bottom: 0.25rem;
  }

  /* ==========================================================================
     MODEL CARDS
     ========================================================================== */
  .model-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
    margin-top: 0.5rem;
  }

  @media (max-width: 640px) {
    .model-grid {
      grid-template-columns: 1fr;
    }
  }

  .model-card {
    background: color-mix(in oklab, var(--color-surface-900) 60%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    border-radius: 0.75rem;
    padding: 1rem;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .model-card:hover {
    background: color-mix(in oklab, var(--color-surface-900) 70%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px color-mix(in oklab, black 15%, transparent);
  }

  .model-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .model-icon {
    font-size: 1.25rem;
  }

  .model-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-surface-50);
  }

  .model-description {
    font-size: 0.75rem;
    color: color-mix(in oklab, var(--color-surface-50) 65%, transparent);
    line-height: 1.5;
    margin: 0 0 0.5rem 0;
  }

  .model-link {
    font-size: 0.75rem;
    color: var(--color-primary-400);
    text-decoration: none;
    transition: color var(--timing-fast) var(--easing-default);
  }

  .model-link:hover {
    color: var(--color-primary-300);
  }

  .model-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: 0.375rem;
    text-decoration: none;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .model-badge.chatgpt {
    background: color-mix(in oklab, var(--color-primary-500) 20%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-primary-500) 30%, transparent);
    color: var(--color-primary-300);
  }

  .model-badge.chatgpt:hover {
    background: color-mix(in oklab, var(--color-primary-500) 30%, transparent);
  }

  .model-badge.gemini {
    background: color-mix(in oklab, var(--color-secondary-500) 20%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-secondary-500) 30%, transparent);
    color: var(--color-secondary-300);
  }

  .model-badge.gemini:hover {
    background: color-mix(in oklab, var(--color-secondary-500) 30%, transparent);
  }

  .model-detail {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: color-mix(in oklab, var(--color-surface-50) 60%, transparent);
    font-style: italic;
  }

  /* ==========================================================================
     PROMPT BUTTON
     ========================================================================== */
  .prompt-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    background: color-mix(in oklab, var(--color-primary-500) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-primary-500) 25%, transparent);
    border-radius: 0.5rem;
    color: var(--color-primary-300);
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .prompt-btn:hover {
    background: color-mix(in oklab, var(--color-primary-500) 25%, transparent);
    border-color: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
    transform: translateY(-1px);
  }

  /* ==========================================================================
     COMPARISON NOTICE
     ========================================================================== */
  .comparison-notice {
    margin-top: 1rem;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-warning-500) 10%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-warning-500) 25%, transparent);
    border-radius: 0.625rem;
  }

  .comparison-notice .section-title {
    color: var(--color-warning-300);
    margin-bottom: 0.5rem;
  }

  .comparison-notice .config-list {
    color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
  }

  /* ==========================================================================
     PROMPT MODAL
     ========================================================================== */
  .prompt-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--color-surface-950) 85%, transparent);
    backdrop-filter: blur(var(--glass-blur-sm));
    animation: fadeIn 0.2s var(--easing-default);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .prompt-modal {
    width: 100%;
    max-width: 850px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: color-mix(in oklab, var(--color-surface-900) 95%, transparent);
    backdrop-filter: blur(var(--glass-blur-lg));
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-radius: 1rem;
    box-shadow: 
      0 16px 64px color-mix(in oklab, black 30%, transparent),
      0 0 40px color-mix(in oklab, var(--color-primary-500) 10%, transparent);
    animation: scaleIn 0.25s var(--easing-default);
    overflow: hidden;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .prompt-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent, 
      var(--color-primary-500), 
      var(--color-secondary-500), 
      transparent
    );
    opacity: 0.6;
  }

  .prompt-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    background: color-mix(in oklab, var(--color-surface-50) 3%, transparent);
  }

  .prompt-modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-surface-50);
    margin: 0;
  }

  .modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);
    border-radius: 0.5rem;
    color: color-mix(in oklab, var(--color-surface-50) 80%, transparent);
    font-size: 1rem;
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .modal-close-btn:hover {
    background: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
    border-color: color-mix(in oklab, var(--color-surface-50) 20%, transparent);
    color: var(--color-surface-50);
    transform: translateY(-1px);
  }

  .prompt-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .translation-notice {
    padding: 0.875rem 1rem;
    margin-bottom: 1rem;
    background: color-mix(in oklab, var(--color-warning-500) 12%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-warning-500) 25%, transparent);
    border-radius: 0.625rem;
  }

  .translation-notice p {
    color: var(--color-warning-300);
    font-size: 0.8125rem;
    line-height: 1.5;
    margin: 0;
  }

  .prompt-code-container {
    background: color-mix(in oklab, var(--color-surface-950) 80%, transparent);
    border: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
    border-radius: 0.625rem;
    padding: 1rem;
    overflow-x: auto;
  }

  .prompt-code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: color-mix(in oklab, var(--color-surface-50) 85%, transparent);
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }

  .prompt-modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
    background: color-mix(in oklab, var(--color-surface-50) 2%, transparent);
  }

  .close-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    background: linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500));
    border: none;
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all var(--timing-fast) var(--easing-default);
  }

  .close-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary-500) 30%, transparent);
  }

  /* ==========================================================================
     RESPONSIVE
     ========================================================================== */
  @media (max-width: 640px) {
    .info-card {
      padding: 1rem;
      border-radius: 0.875rem;
    }

    .info-title {
      font-size: 1.125rem;
    }

    .info-description {
      font-size: 0.875rem;
    }

    .header-icon {
      width: 1.75rem;
      height: 1.75rem;
    }

    .prompt-modal {
      max-height: 95vh;
      border-radius: 0.875rem;
    }

    .prompt-modal-header {
      padding: 1rem;
    }

    .prompt-modal-body {
      padding: 1rem;
    }
  }

  /* ==========================================================================
     REDUCED MOTION
     ========================================================================== */
  @media (prefers-reduced-motion: reduce) {
    .model-card,
    .prompt-btn,
    .modal-close-btn,
    .close-btn,
    .prompt-modal,
    .prompt-modal-backdrop,
    .info-content,
    .header-icon,
    .info-header-btn {
      transition: none;
      animation: none;
    }
  }
</style>
