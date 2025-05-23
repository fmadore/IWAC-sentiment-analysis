<script lang="ts">
  // Définir le type pour les sections ouvertes comme un tableau de chaînes
  let openSections = $state<string[]>([]);
</script>

<div class="card variant-glass p-4">
  <h2 class="h3 mb-3 text-white">À propos de l'analyse</h2>
  
  <p class="mb-4 text-white">Cette visualisation présente une analyse automatisée des sentiments concernant la représentation de l'islam et des musulmans dans la presse d'Afrique de l'Ouest francophone. Les résultats ont été générés par un grand modèle de langage (LLM) guidé par un prompt spécifiquement conçu pour cette tâche. Chaque article a été analysé selon trois dimensions complémentaires :</p>
  
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
            <li><span class="chip variant-filled-success">1</span> - Très objectif - Rapporte des faits vérifiables sans exprimer d'opinions personnelles</li>
            <li><span class="chip variant-soft-success">2</span> - Plutôt objectif - Principalement factuel mais peut contenir des traces subtiles d'opinions</li>
            <li><span class="chip variant-soft-primary">3</span> - Mixte - Contient un mélange équilibré de faits et d'opinions ou présente plusieurs points de vue</li>
            <li><span class="chip variant-soft-error">4</span> - Plutôt subjectif - Exprime clairement des opinions ou des jugements même s'il s'appuie sur certains faits</li>
            <li><span class="chip variant-filled-error">5</span> - Très subjectif - Fortement biaisé, exprime des opinions et des émotions intenses avec peu de présentation objective</li>
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
            <li><span class="chip variant-filled-tertiary">Très central</span> - L'article est principalement ou entièrement consacré à l'islam et/ou aux musulmans</li>
            <li><span class="chip variant-soft-tertiary">Central</span> - L'islam et/ou les musulmans sont un des sujets principaux de l'article</li>
            <li><span class="chip variant-soft-surface">Secondaire</span> - L'islam et/ou les musulmans sont mentionnés ou discutés, mais ne constituent pas le focus principal</li>
            <li><span class="chip variant-ghost">Marginal</span> - L'islam et/ou les musulmans sont brièvement mentionnés de manière anecdotique</li>
            <li><span class="chip variant-ghost">Non abordé</span> - L'article ne traite pas du tout de l'islam ou des musulmans</li>
          </ul>
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

<style>
  .chip {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    display: inline-block;
  }
  
  .accordion {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    overflow: hidden;
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
    transition: background 0.2s;
  }
  
  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .accordion-content {
    background: rgba(0, 0, 0, 0.2);
    color: white;
  }
</style>