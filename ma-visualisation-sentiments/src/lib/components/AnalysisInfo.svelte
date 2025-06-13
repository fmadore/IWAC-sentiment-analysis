<script lang="ts">
  // Définir le type pour les sections ouvertes comme un tableau de chaînes
  let openSections = $state<string[]>([]);
  
  // État pour la modal du prompt
  let showPromptModal = $state(false);
  
  // Fonction pour gérer les événements clavier de la modal
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showPromptModal = false;
    }
  }
</script>

<div class="card variant-glass p-4">
  <h2 class="h3 mb-3 text-white">À propos de l'analyse</h2>
  
  <p class="mb-4 text-white">Cette visualisation présente une analyse automatisée des sentiments concernant la représentation de l'islam et des musulmans dans la presse d'Afrique de l'Ouest francophone. Les articles analysés sont issus de la <a href="https://islam.zmo.de/s/afrique_ouest/page/accueil" target="_blank" rel="noopener noreferrer" class="text-blue-300 hover:text-blue-200 underline" style="cursor: pointer !important;"><em>Collection Islam Afrique de l'Ouest</em></a> (<em>Islam West Africa Collection</em>, IWAC), une base de données numérique collaborative et en libre accès développée par <a href="https://www.frederickmadore.com/" target="_blank" rel="noopener noreferrer" class="text-blue-300 hover:text-blue-200 underline" style="cursor: pointer !important;">Frédérick Madore</a>. Les résultats ont été générés par un grand modèle de langage (LLM) guidé par un prompt spécifiquement conçu pour cette tâche. Chaque article a été analysé selon trois dimensions complémentaires, dont les détails méthodologiques et les limites sont présentés ci-dessous :</p>
  
  <div class="accordion">
    <div class="accordion-item">
      <h3 class="h5">
        <button class="accordion-header" onclick={() => openSections = openSections.includes('polarite') ? openSections.filter(s => s !== 'polarite') : [...openSections, 'polarite']}>
          Polarité
        </button>
      </h3>
      {#if openSections.includes('polarite')}
        <div class="accordion-content p-3">
          <p class="mb-2">La polarité évalue le sentiment général exprimé dans l'article envers l'islam et/ou les musulmans :</p>
          <ul class="list-disc ml-5 space-y-1">
            <li><span class="chip variant-filled-success">Très positif</span> - Portrait extrêmement favorable, enthousiaste, élogieux</li>
            <li><span class="chip variant-soft-success">Positif</span> - Portrait favorable, optimiste</li>
            <li><span class="chip variant-soft-primary">Neutre</span> - Pas de sentiment clair ou équilibre entre aspects positifs et négatifs</li>
            <li><span class="chip variant-soft-error">Négatif</span> - Portrait défavorable, critique, pessimiste</li>
            <li><span class="chip variant-filled-error">Très négatif</span> - Portrait extrêmement défavorable, alarmiste, très critique</li>
            <li><span class="chip variant-ghost">Non applicable</span> - L'article ne traite pas de l'islam ou des musulmans</li>
          </ul>
        </div>
      {/if}
    </div>
    
    <div class="accordion-item">
      <h3 class="h5">
        <button class="accordion-header" onclick={() => openSections = openSections.includes('subjectivite') ? openSections.filter(s => s !== 'subjectivite') : [...openSections, 'subjectivite']}>
          Subjectivité
        </button>
      </h3>
      {#if openSections.includes('subjectivite')}
        <div class="accordion-content p-3">
          <p class="mb-2">La subjectivité (note de 1 à 5) évalue le degré d'objectivité/subjectivité de l'article dans sa manière de représenter l'islam et/ou les musulmans :</p>
          <ul class="list-disc ml-5 space-y-1">
            <li><span class="chip variant-filled-success">1</span> <strong>Très objectif</strong> - Rapporte des faits vérifiables sans exprimer d'opinions personnelles</li>
            <li><span class="chip variant-soft-success">2</span> <strong>Plutôt objectif</strong> - Principalement factuel mais peut contenir des traces subtiles d'opinions</li>
            <li><span class="chip variant-soft-primary">3</span> <strong>Mixte</strong> - Contient un mélange équilibré de faits et d'opinions ou présente plusieurs points de vue</li>
            <li><span class="chip variant-soft-error">4</span> <strong>Plutôt subjectif</strong> - Exprime clairement des opinions ou des jugements même s'il s'appuie sur certains faits</li>
            <li><span class="chip variant-filled-error">5</span> <strong>Très subjectif</strong> - Fortement biaisé, exprime des opinions et des émotions intenses avec peu de présentation objective</li>
          </ul>
        </div>
      {/if}
    </div>
    
    <div class="accordion-item">
      <h3 class="h5">
        <button class="accordion-header" onclick={() => openSections = openSections.includes('centralite') ? openSections.filter(s => s !== 'centralite') : [...openSections, 'centralite']}>
          Centralité
        </button>
      </h3>
      {#if openSections.includes('centralite')}
        <div class="accordion-content p-3">
          <p class="mb-2">La centralité évalue l'importance du sujet de l'islam et des musulmans dans l'article :</p>
          <ul class="list-disc ml-5 space-y-1">
            <li><span class="chip variant-filled-tertiary">Très central</span> L'article est principalement ou entièrement consacré à l'islam et/ou aux musulmans</li>
            <li><span class="chip variant-soft-tertiary">Central</span> L'islam et/ou les musulmans sont un des sujets principaux de l'article</li>
            <li><span class="chip variant-soft-surface">Secondaire</span> L'islam et/ou les musulmans sont mentionnés ou discutés, mais ne constituent pas le focus principal</li>
            <li><span class="chip variant-ghost">Marginal</span> L'islam et/ou les musulmans sont brièvement mentionnés de manière anecdotique</li>
            <li><span class="chip variant-ghost">Non abordé</span> L'article ne traite pas du tout de l'islam ou des musulmans</li>
          </ul>
        </div>
      {/if}
    </div>
    
    <div class="accordion-item">
      <h3 class="h5">
        <button class="accordion-header" onclick={() => openSections = openSections.includes('methodologie') ? openSections.filter(s => s !== 'methodologie') : [...openSections, 'methodologie']}>
          Méthodologie et modèle d'IA
        </button>
      </h3>
      {#if openSections.includes('methodologie')}
        <div class="accordion-content p-3">
          <div class="space-y-4">
            <div>
              <h4 class="h6 mb-2 text-white font-semibold">Modèle utilisé</h4>
              <p class="mb-2 text-white">L'analyse a été réalisée avec <a href="https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash" target="_blank" rel="noopener noreferrer" class="text-blue-300 hover:text-blue-200 underline" style="cursor: pointer !important;"><span class="chip variant-soft-secondary">Gemini 2.5 Flash Preview</span></a>, un grand modèle de langage développé par Google. Ce modèle a été choisi pour son excellent rapport qualité-prix, offrant des performances satisfaisantes pour l'analyse de texte en français à un coût accessible.</p>
            </div>
            
            <div>
              <h4 class="h6 mb-2 text-white font-semibold">Configuration technique</h4>
              <ul class="list-disc ml-5 space-y-1 text-white text-sm">
                <li>Température : 0.2 (pour une sortie déterministe)</li>
                <li>Format de sortie : JSON structuré avec validation Pydantic</li>
                <li>Système de cache pour éviter les analyses redondantes</li>
                <li>Gestion automatique des erreurs avec tentatives multiples</li>
              </ul>
            </div>
            
            <div>
              <h4 class="h6 mb-2 text-white font-semibold">Prompt d'analyse</h4>
              <p class="mb-2 text-white text-sm">Le modèle reçoit un prompt spécialisé qui :</p>
              <ul class="list-disc ml-5 space-y-1 text-white text-sm">
                <li>Définit le rôle d'expert en analyse de sentiments pour l'Afrique de l'Ouest francophone</li>
                <li>Spécifie les critères d'évaluation pour chaque dimension (polarité, subjectivité, centralité)</li>
                <li>Fournit des barèmes détaillés avec des exemples concrets</li>
                <li>Demande une justification pour chaque classification</li>
                <li>Impose un format de sortie JSON structuré pour garantir la cohérence</li>
              </ul>
              <button 
                class="btn variant-soft-primary mt-3 text-sm"
                onclick={() => showPromptModal = true}
              >
                Voir le prompt complet
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <div class="accordion-item">
      <h3 class="h5">
        <button class="accordion-header" onclick={() => openSections = openSections.includes('limites') ? openSections.filter(s => s !== 'limites') : [...openSections, 'limites']}>
          Limites et précautions
        </button>
      </h3>
      {#if openSections.includes('limites')}
        <div class="accordion-content p-3">
          <p class="text-white">Cette analyse automatisée constitue un outil d'aide à la recherche. Les résultats peuvent nécessiter une validation humaine pour les cas complexes ou ambigus. Les justifications fournies par l'IA permettent d'évaluer la pertinence de chaque classification.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal pour afficher le prompt complet -->
{#if showPromptModal}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-backdrop" 
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="prompt-modal-title"
    onclick={() => showPromptModal = false}
    onkeydown={handleModalKeydown}
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="modal-content" 
      role="document"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="modal-header">
        <h3 id="prompt-modal-title" class="h3 text-white">Prompt d'analyse complet</h3>
        <button 
          class="btn-close" 
          onclick={() => showPromptModal = false}
          aria-label="Fermer la modal"
          type="button"
        >
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <div class="prompt-container">
          <pre class="prompt-text">{`Vous êtes un expert en analyse de sentiments, spécialisé dans l'étude des représentations de l'islam et des musulmans dans les médias, notamment en Afrique de l'Ouest francophone. Votre tâche est d'analyser le texte fourni sous cet angle spécifique et de renvoyer une analyse structurée en JSON.

Votre analyse doit spécifiquement évaluer comment l'islam et/ou les musulmans sont dépeints ou représentés dans l'article. La subjectivité et la polarité doivent être jugées par rapport à cette représentation. Si l'islam et les musulmans ne sont qu'un sujet marginal ou non pertinent dans l'article, indiquez-le clairement.

Pour le texte de l'article suivant :
---
{article_text}
---

Veuillez fournir les informations suivantes au format JSON respectant le schéma Pydantic SentimentAnalysisOutput:
{
  "centralite_islam_musulmans": "<Très central | Central | Secondaire | Marginal | Non abordé>",
  "centralite_justification": "<Courte justification (1 phrase) expliquant le niveau de centralité de l'islam/des musulmans dans l'article>",
  "subjectivite_score": <score_de_1_a_5_ou_null_si_non_aborde>,
  "subjectivite_justification": "<justification_en_1_2_phrases expliquant pourquoi ce score de subjectivité a été attribué concernant la manière dont l'article traite de l'islam et/ou des musulmans, ou 'Non applicable si le sujet n'est pas abordé'>",
  "polarite": "<Très positif | Positif | Neutre | Négatif | Très négatif | Non applicable>",
  "polarite_justification": "<justification_en_1_2_phrases expliquant pourquoi cette polarité a été attribuée en ce qui concerne le portrait de l'islam et/ou des musulmans dans l'article, ou 'Non applicable si le sujet n'est pas abordé'>"
}

Voici les barèmes à utiliser :

Centralité de l'islam et des musulmans dans l'article :
- Très central : L'article est principalement ou entièrement consacré à l'islam et/ou aux musulmans.
- Central : L'islam et/ou les musulmans sont un des sujets principaux de l'article.
- Secondaire : L'islam et/ou les musulmans sont mentionnés ou discutés, mais ne constituent pas le focus principal de l'article.
- Marginal : L'islam et/ou les musulmans sont brièvement mentionnés de manière anecdotique ou périphérique.
- Non abordé : L'article ne traite pas du tout de l'islam ou des musulmans.

Subjectivité (note de 1 à 5) – Évaluez le degré d'objectivité/subjectivité de l'article DANS SA MANIÈRE DE REPRÉSENTER l'islam et/ou les musulmans (Attribuez 'null' si 'Non abordé' pour la centralité) :
1 : Très objectif (rapporte des faits vérifiables sur l'islam/les musulmans sans exprimer d'opinions ou de sentiments personnels à leur sujet, style purement informatif sur ce thème).
2 : Plutôt objectif (principalement factuel concernant l'islam/les musulmans, mais peut contenir des traces subtiles d'opinions ou des choix de mots suggérant une perspective limitée sur ce thème).
3 : Mixte (contient un mélange équilibré de faits et d'opinions/sentiments personnels concernant l'islam/les musulmans, ou présente plusieurs points de vue sur ce thème).
4 : Plutôt subjectif (exprime clairement des opinions, des sentiments ou des jugements sur l'islam/les musulmans, même s'il s'appuie sur certains faits pour les étayer).
5 : Très subjectif (fortement biaisé dans sa représentation de l'islam/des musulmans, exprime des opinions et des émotions intenses à leur sujet, avec peu ou pas de présentation objective des faits, style éditorial ou billet d'humeur sur ce thème).

Polarité – Évaluez le sentiment général exprimé DANS L'ARTICLE ENVERS l'islam et/ou les musulmans, ou concernant leur représentation (Attribuez 'Non applicable' si 'Non abordé' pour la centralité) :
- Très positif : Le portrait de l'islam/des musulmans est extrêmement favorable, enthousiaste, élogieux.
- Positif : Le portrait de l'islam/des musulmans est favorable, optimiste.
- Neutre : Pas de sentiment clair envers l'islam/des musulmans ou équilibre entre aspects positifs et négatifs dans leur représentation ; ton factuel sans charge émotionnelle marquée à leur égard.
- Négatif : Le portrait de l'islam/des musulmans est défavorable, critique, pessimiste.
- Très négatif : Le portrait de l'islam/des musulmans est extrêmement défavorable, alarmiste, très critique.

Si la centralité est "Non abordé", le "subjectivite_score" doit être null, et "polarite", "subjectivite_justification", et "polarite_justification" doivent être "Non applicable". Le JSON doit toujours être valide.
Par exemple, si "centralite_islam_musulmans" est "Non abordé":
{
  "centralite_islam_musulmans": "Non abordé",
  "centralite_justification": "L'article ne mentionne ni l'islam ni les musulmans.",
  "subjectivite_score": null,
  "subjectivite_justification": "Non applicable car le sujet n'est pas abordé.",
  "polarite": "Non applicable",
  "polarite_justification": "Non applicable car le sujet n'est pas abordé."
}

Assurez-vous que votre réponse est uniquement le JSON structuré demandé, sans texte ou formatage supplémentaire avant ou après le JSON.`}</pre>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          class="btn variant-filled-primary" 
          onclick={() => showPromptModal = false}
          type="button"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    display: inline-block;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    transition: all var(--transition-fast);
  }
  
  .accordion {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
  }
  
  .accordion-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .accordion-item:last-child {
    border-bottom: none;
  }
  
  .accordion-header {
    width: 100%;
    text-align: left;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: none;
    font-size: inherit;
    font-family: inherit;
  }
  
  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }
  
  .accordion-content {
    background: rgba(0, 0, 0, 0.2);
    color: white;
    backdrop-filter: blur(8px);
  }
  
  .h6 {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }
  
  /* Styles pour la modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-xl);
    max-width: 90vw;
    max-height: 90vh;
    width: 800px;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-2xl);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
  }
  
  .btn-close {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-md);
    transition: all var(--transition-normal);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-close:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-1px);
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
  }
  
  .prompt-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-md);
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
  }
  
  .prompt-text {
    color: #e2e8f0;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all var(--transition-normal);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
  }
  
  .variant-soft-primary {
    background: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  
  .variant-soft-primary:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .variant-filled-primary {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    border: none;
  }
  
  .variant-filled-primary:hover {
    background: linear-gradient(135deg, #2563EB, #7C3AED);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }
</style>