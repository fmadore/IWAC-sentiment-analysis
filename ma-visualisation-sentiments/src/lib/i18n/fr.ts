import type { Translations } from './types.js';

export const fr: Translations = {
  // App header and branding
  appTitle: 'Analyse de sentiments CIAO',
  appSubtitle: 'Collection Islam Afrique de l\'Ouest – Visualisation et exploration',
  enterFullscreen: 'Passer en plein écran',
  exitFullscreen: 'Quitter le mode plein écran',

  // Navigation
  nav: {
    charts: 'Graphiques',
    trends: 'Tendances',
    distribution: 'Distribution',
    volume: 'Volume',
    heatmap: 'Carte de chaleur',
    table: 'Tableau',
    comparison: 'Comparaison',
    extremes: 'Analyses extrêmes'
  },

  // Filters
  filters: {
    title: 'Facettes',
    country: 'Pays',
    journal: 'Journal',
    polarity: 'Polarité',
    subjectivity: 'Subjectivité',
    centrality: 'Centralité',
    clearAll: 'Tout effacer',
    clearAllFilters: 'Effacer tous les filtres',
    searchJournals: 'Rechercher des journaux...',
    showingJournals: 'Affichage de',
    of: 'sur',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    selectedCountries: 'Pays sélectionnés',
    selectedJournals: 'Journaux sélectionnés',
    selectedPolarities: 'Polarités sélectionnées',
    selectedSubjectivities: 'Subjectivités sélectionnées',
    selectedCentralities: 'Centralités sélectionnées',
    sentimentCriteria: 'Critères d\'analyse des sentiments',
    subjectivityScore: 'Score de subjectivité',
    ratherObjective: 'Plutôt objectif',
    mixedSubjectivity: 'Subjectivité mixte',
    ratherVerySubjective: 'Plutôt/très subjectif',
    averageCentrality: 'Centralité moyenne',
    level: 'Niveau',
    veryObjectiveScore: 'Très objectif',
    ratherObjectiveScore: 'Plutôt objectif',
    mixedScore: 'Mixte',
    ratherSubjectiveScore: 'Plutôt subjectif',
    verySubjectiveScore: 'Très subjectif',
    numberOfArticles: 'Nombre d\'articles',
    polarityRange: 'Plage de polarité',
    centralityLevel: 'Niveau de centralité',
    reset: 'Réinitialiser'
  },

  // Sentiment labels
  sentiment: {
    veryPositive: 'Très positif',
    positive: 'Positif',
    neutral: 'Neutre',
    negative: 'Négatif',
    veryNegative: 'Très négatif',
    notApplicable: 'Non applicable'
  },

  // Subjectivity labels
  subjectivity: {
    factual: 'Très objectif',
    ratherFactual: 'Plutôt objectif',
    mixed: 'Mixte',
    ratherSubjective: 'Plutôt subjectif',
    subjective: 'Très subjectif',
    notApplicable: 'Non applicable'
  },

  // Centrality labels
  centrality: {
    veryCentral: 'Très central',
    central: 'Central',
    secondary: 'Secondaire',
    marginal: 'Marginal',
    notAddressed: 'Non abordé'
  },

  // Chart titles and labels
  charts: {
    polarityDistribution: 'Distribution de la polarité',
    subjectivityDistribution: 'Distribution de la subjectivité',
    sentimentTrends: 'Tendances des sentiments',
    correlationDistribution: 'Distribution croisée',
    volumeByCountry: 'Volume d\'articles par pays',
    centralityHeatmap: 'Heatmap de centralité',
    articlesAnalyzed: 'articles analysés',
    globalDistribution: 'Distribution globale',
    byJournal: 'par journal',
    byYear: 'par année',
    stackedAreas: 'Aires empilées',
    lines: 'Lignes',
    bars: 'Barres',
    pie: 'Camembert',
    polaritySubjectivityDistribution: 'Distribution Polarité × Subjectivité'
  },

  // Table
  table: {
    title: 'Articles',
    country: 'Pays',
    journal: 'Journal',
    date: 'Date',
    polarity: 'Polarité',
    subjectivity: 'Subjectivité',
    centrality: 'Centralité',
    actions: 'Actions',
    viewDetails: 'Voir détails',
    sortBy: 'Trier par',
    itemsPerPage: 'Éléments par page',
    showingItems: 'Affichage de',
    noArticles: 'Aucun article disponible',
    noFilteredArticles: 'Aucun article ne correspond aux filtres sélectionnés',
    articleTitle: 'Titre'
  },

  // Article details
  article: {
    details: 'Détails de l\'article',
    metadata: 'Métadonnées',
    analysis: 'Analyse de sentiment',
    polarityJustification: 'Justification de la polarité',
    subjectivityJustification: 'Justification de la subjectivité',
    centralityJustification: 'Justification de la centralité',
    close: 'Fermer',
    titleNotAvailable: 'Titre non disponible',
    publicationDate: 'Date de publication',
    linkToFullArticle: 'Lien vers l\'article complet',
    consultOriginalArticle: 'Consulter l\'article original →',
    noAnalysisData: 'Les données d\'analyse des sentiments ne sont pas disponibles pour cet article.',
    noArticleSelected: 'Aucun article sélectionné',
    selectArticlePrompt: 'Sélectionnez un article dans le tableau pour voir ses détails d\'analyse des sentiments.',
    justification: 'Justification'
  },

  // Analysis info
  analysis: {
    title: 'Méthodologie d\'analyse',
    methodologyIntro: 'Ce tableau de bord explore le potentiel de l\'IA comme partenaire de recherche pour l\'analyse de grands corpus. La prolifération de l\'archivage numérique a produit de vastes collections qui dépassent souvent les capacités de traitement humain. Grâce à la « lecture distante » (Moretti 2000), les techniques computationnelles peuvent parcourir des milliers d\'articles et révéler des motifs que les méthodes traditionnelles manqueraient.',
    methodologyCorpus: 'Cette expérience analyse comment l\'islam et les musulmans sont représentés dans la presse ouest-africaine. Au lieu de coder manuellement des milliers d\'articles—ce qui introduirait des incohérences—l\'ensemble du corpus de',
    methodologyCorpusArticles: 'articles issus de la',
    methodologyCorpusDeveloper: ', une base de données numérique collaborative et en libre accès développée par',
    methodologyCorpusEnd: ', a été analysé à l\'aide de trois LLMs : GPT-5 mini d\'OpenAI, Gemini 3 Flash de Google et Ministral 3 14B de Mistral. Chaque article a été évalué selon trois dimensions complémentaires :',
    methodology: 'Cette visualisation présente une analyse automatisée des sentiments concernant la représentation de l\'islam et des musulmans dans la presse d\'Afrique de l\'Ouest francophone. Les articles analysés sont issus de la',
    methodologyAiModel: 'Méthodologie et modèle d\'IA',
    modelUsed: 'Modèle utilisé',
    modelDescription: 'L\'analyse a été réalisée avec',
    modelDetails: ', un grand modèle de langage développé par Google. Ce modèle a été choisi pour son excellent rapport qualité-prix, offrant des performances satisfaisantes pour l\'analyse de texte en français à un coût accessible.',
    modelSummary: 'Résumé du modèle',
    modelUsageGuide: "Guide d'utilisation",
    modelDocsLink: 'Documentation du modèle',
    modelSpecs: 'Spécifications du modèle',
    technicalConfiguration: 'Configuration technique',
    temperatureConfig: 'Température : 0.2 (pour une sortie déterministe)',
    outputFormat: 'Format de sortie : JSON structuré avec validation Pydantic',
    cacheSystem: 'Système de cache pour éviter les analyses redondantes',
    errorHandling: 'Gestion automatique des erreurs avec tentatives multiples',
    analysisPrompt: 'Prompt d\'analyse',
    promptDescription: 'Le modèle reçoit un prompt spécialisé qui :',
    promptFeature1: 'Définit le rôle d\'expert en analyse de sentiments pour l\'Afrique de l\'Ouest francophone',
    promptFeature2: 'Spécifie les critères d\'évaluation pour chaque dimension (polarité, subjectivité, centralité)',
    promptFeature3: 'Fournit des barèmes détaillés avec des exemples concrets',
    promptFeature4: 'Demande une justification pour chaque classification',
    promptFeature5: 'Impose un format de sortie JSON structuré pour garantir la cohérence',
    viewFullPrompt: 'Voir le prompt complet',
    limitationsTitle: 'Limites et précautions',
    limitationsDescription: 'Cette analyse automatisée constitue un outil d\'aide à la recherche. Les résultats peuvent nécessiter une validation humaine pour les cas complexes ou ambigus. Les justifications fournies par l\'IA permettent d\'évaluer la pertinence de chaque classification.',
    notApplicableNote: 'L\'article ne traite pas de l\'islam ou des musulmans',
    polaritySection: 'Polarité du sentiment',
    subjectivitySection: 'Subjectivité',
    centralitySection: 'Centralité de l\'islam/musulmans',
    polarityDescription: 'Évalue le sentiment général exprimé DANS L\'ARTICLE ENVERS l\'islam et/ou les musulmans, ou concernant leur représentation.',
    subjectivityDescription: 'Évalue le degré d\'objectivité/subjectivité de l\'article DANS SA MANIÈRE DE REPRÉSENTER l\'islam et/ou les musulmans sur une échelle de 1 (très objectif) à 5 (très subjectif).',
    centralityDescription: 'Évalue l\'importance accordée aux thèmes liés à l\'islam et aux musulmans dans l\'article.',
    veryPositiveDesc: 'Le portrait de l\'islam/des musulmans est extrêmement favorable, enthousiaste, élogieux',
    positiveDesc: 'Le portrait de l\'islam/des musulmans est favorable, optimiste',
    neutralDesc: 'Pas de sentiment clair envers l\'islam/des musulmans ou équilibre entre aspects positifs et négatifs dans leur représentation ; ton factuel sans charge émotionnelle marquée à leur égard',
    negativeDesc: 'Le portrait de l\'islam/des musulmans est défavorable, critique, pessimiste',
    veryNegativeDesc: 'Le portrait de l\'islam/des musulmans est extrêmement défavorable, alarmiste, très critique',
    factualDesc: 'Rapporte des faits vérifiables sur l\'islam/les musulmans sans exprimer d\'opinions ou de sentiments personnels à leur sujet, style purement informatif sur ce thème',
    ratherFactualDesc: 'Principalement factuel concernant l\'islam/les musulmans, mais peut contenir des traces subtiles d\'opinions ou des choix de mots suggérant une perspective limitée sur ce thème',
    mixedDesc: 'Contient un mélange équilibré de faits et d\'opinions/sentiments personnels concernant l\'islam/les musulmans, ou présente plusieurs points de vue sur ce thème',
    ratherSubjectiveDesc: 'Exprime clairement des opinions, des sentiments ou des jugements sur l\'islam/les musulmans, même s\'il s\'appuie sur certains faits pour les étayer',
    subjectiveDesc: 'Fortement biaisé dans sa représentation de l\'islam/des musulmans, exprime des opinions et des émotions intenses à leur sujet, avec peu ou pas de présentation objective des faits, style éditorial ou billet d\'humeur sur ce thème',
    veryCentralDesc: 'L\'islam/musulmans constituent le sujet principal de l\'article',
    centralDesc: 'Thème important mais partagé avec d\'autres sujets',
    secondaryDesc: 'Mentionné de manière significative mais secondaire',
    marginalDesc: 'Évoqué brièvement ou de manière anecdotique',
    notAddressedDesc: 'Aucune mention de l\'islam ou des musulmans'
  },

  // Loading and messages
  messages: {
    loading: 'Chargement...',
    loadingData: 'Chargement des données du corpus IWAC...',
    noData: 'Aucune donnée disponible',
    error: 'Une erreur s\'est produite',
    shareUrl: 'Partager cette vue',
    urlCopied: 'URL copiée dans le presse-papiers'
  },

  // Export
  export: {
    exportCSV: 'Exporter CSV',
    downloadCSV: 'Télécharger les données au format CSV',
    exporting: 'Export en cours',
    noDataToExport: 'Aucune donnée à exporter',
    exportError: 'Erreur lors de l\'export des données',
    polarityJustification: 'Justification polarité',
    subjectivityJustification: 'Justification subjectivité',
    centralityJustification: 'Justification centralité',
    articleId: 'ID article'
  },

  // Common
  common: {
    yes: 'Oui',
    no: 'Non',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    search: 'Rechercher',
    filter: 'Filtrer',
    clear: 'Effacer',
    all: 'Tout',
    none: 'Aucun',
    total: 'Total',
    articles: 'articles',
    article: 'article',
    viewMore: 'Voir plus',
    viewLess: 'Retour à la liste',
    previous: 'Précédent',
    next: 'Suivant',
    sortBy: 'Trier par',
    of: 'sur',
    tableView: 'Tableau',
    cardView: 'Cartes'
  },

  // Datasets
  datasets: {
    selectModel: 'Sélectionner le modèle',
    availableModels: 'Modèles disponibles',
    comparisonMode: 'Mode comparaison',
    compareModels: 'Comparer les modèles'
  },

  // Comparison
  comparison: {
    filterByDiscrepancy: 'Filtrer par divergence',
    differenceRange: 'Plage de différence',
    quickFilters: 'Filtres rapides',
    pointDifference: 'point de différence',
    pointsDifference: 'points de différence',
    compareDimensions: 'Comparer les dimensions',
    polarity: 'Polarité',
    subjectivity: 'Subjectivité',
    centrality: 'Centralité',
    totalDiscrepancy: 'Divergence totale',
    totalDiscrepancies: 'Divergences totales',
    articlesWithDifferences: 'Articles avec différences',
    averageDiscrepancy: 'Divergence moyenne',
    pointsPerArticle: 'Points par article',
    totalArticles: 'Total des articles',
    articlesAnalyzed: 'Articles analysés',
    highConflicts: 'Conflits élevés',
    significantDifferences: 'Différences significatives',
    significantDifferencesExplanation: 'Articles où une dimension (polarité, subjectivité ou centralité) diffère de 3+ points entre les analyses ChatGPT et Gemini. Cela indique un désaccord substantiel entre les modèles d\'IA.',
    totalDiscrepanciesExplanation: 'Nombre d\'articles où ChatGPT et Gemini fournissent des analyses différentes (toute différence > 0 points)',
    averageDiscrepancyExplanation: 'Moyenne des points de différence totale par article sur les trois dimensions (polarité + subjectivité + centralité)',
    breakdownByDimension: 'Répartition par dimension',
    enableComparisonMode: 'Activer le mode comparaison',
    enableComparisonDescription: 'Cliquez sur le bouton de comparaison dans le sélecteur de dataset pour comparer les analyses ChatGPT et Gemini.',
    noDiscrepancies: 'Aucune divergence trouvée',
    adjustFilters: 'Essayez d\'ajuster vos filtres pour voir les articles avec des différences entre les modèles.',
    excludeNonApplicable: 'Exclure les articles "Non applicable"',
    excludeNonApplicableDescription: 'Masquer les articles où un modèle a marqué la centralité comme "Non applicable", ce qui crée des divergences artificiellement élevées.',
    dimensionsExplanation: 'Sélectionnez les dimensions à analyser pour les désaccords entre modèles :',
    polarityExplanation: 'Différences de sentiment positif/négatif',
    subjectivityExplanation: 'Différences objectivité vs. opinion (échelle 1-5)',
    centralityExplanation: 'Importance de l\'Islam/Musulmans dans l\'article',
    dimensionsNote: 'Astuce : Sélectionnez une seule dimension pour concentrer votre analyse sur des types spécifiques de désaccords. Les scores de divergence seront recalculés selon votre sélection.',
    // Model pair picker
    selectModelPair: 'Sélectionner les modèles à comparer',
    chatgptVsGemini: 'ChatGPT vs Gemini',
    chatgptVsMistral: 'ChatGPT vs Mistral',
    geminiVsMistral: 'Gemini vs Mistral',
    modelALabel: 'Modèle A',
    modelBLabel: 'Modèle B'
  },

  // Arbiter
  arbiter: {
    title: 'Verdict de l\'arbitre',
    subtitle: 'Évaluation aveugle par un troisième modèle d\'IA (identités des modèles masquées)',
    modelName: 'Gemini 3 Pro',
    verdict: 'Verdict',
    overallVerdict: 'Verdict général',
    confidenceLevel: 'Niveau de confiance',
    confidenceHigh: 'Élevé',
    confidenceMedium: 'Moyen',
    confidenceLow: 'Faible',
    preferredModel: 'Modèle préféré',
    prefersChatGPT: 'ChatGPT est plus précis',
    prefersGemini: 'Gemini est plus précis',
    prefersBoth: 'Les deux sont également précis',
    prefersNeither: 'Aucun n\'est précis',
    arbiterScore: 'Score de l\'arbitre',
    arbiterJustification: 'Justification de l\'arbitre',
    verdictExplanation: 'Pourquoi cette préférence',
    noArbiterData: 'Pas de données d\'arbitre',
    noArbiterDataDescription: 'L\'évaluation de l\'arbitre n\'est pas disponible pour cet article. Exécutez le script d\'évaluation de l\'arbitre pour générer les verdicts.',
    polarityVerdict: 'Verdict de polarité',
    subjectivityVerdict: 'Verdict de subjectivité',
    centralityVerdict: 'Verdict de centralité',
    showArbiterVerdict: 'Afficher le verdict de l\'arbitre',
    hideArbiterVerdict: 'Masquer le verdict de l\'arbitre',
    loadingArbiter: 'Chargement des données de l\'arbitre...',
    arbiterNotAvailable: 'Évaluation de l\'arbitre non disponible',
    runArbiterScript: 'Exécutez arbiter-evaluation.py pour générer les évaluations',
    // Summary statistics
    summaryTitle: 'Résumé de l\'arbitre',
    articlesEvaluated: 'articles évalués',
    chatgptPreferred: 'ChatGPT préféré',
    geminiPreferred: 'Gemini préféré',
    bothEqual: 'Égalité',
    neitherAccurate: 'Aucun précis',
    preferred: 'préféré',
    blindEvaluationNote: 'Évaluation aveugle : les modèles étaient anonymisés pendant l\'évaluation'
  },

  // Extreme Analysis
  extremeAnalysis: {
    title: 'Analyse des extrêmes lexicaux',
    subtitle: 'Exploration des mots-clés associés aux sentiments extrêmes',
    analysisControls: 'Contrôles d\'analyse',
    keywordFrequency: 'Fréquence des mots-clés',
    keywordsByFacet: 'Mots-clés par facette',
    topKeywords: 'Mots-clés les plus fréquents',
    associatedArticles: 'Articles associés',
    articleCount: 'Nombre d\'articles',
    selectCategory: 'Sélectionner une catégorie',
    selectKeywordType: 'Type de mots-clés',
    numberOfKeywords: 'Nombre de mots-clés',
    subjectKeywords: 'Mots-clés sujet',
    spatialKeywords: 'Mots-clés spatiaux',
    byCountry: 'Par pays',
    byNewspaper: 'Par journal',
    showMore: 'Voir plus',
    showLess: 'Voir moins',
    noData: 'Aucune donnée disponible pour cette sélection',
    categories: {
      subjectivityHigh: 'Subjectivité élevée (4-5)',
      subjectivityLow: 'Subjectivité faible (1-2)',
      polarityNegative: 'Polarité très négative',
      polarityPositive: 'Polarité très positive',
      centralityHigh: 'Très central',
      centralityLow: 'Pas central'
    },
    descriptions: {
      subjectivityHigh: 'Articles avec opinions marquées et émotions fortes',
      subjectivityLow: 'Articles factuels et informatifs',
      polarityNegative: 'Articles avec sentiment très négatif',
      polarityPositive: 'Articles avec sentiment très positif',
      centralityHigh: 'Islam/musulmans au cœur du sujet',
      centralityLow: 'Mention périphérique de l\'islam/musulmans'
    }
  }
}; 