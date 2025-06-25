import type { Translations } from './types.js';

export const fr: Translations = {
  // App header and branding
  appTitle: 'Analyse de sentiments',
  appSubtitle: 'Visualisation et exploration des données d\'articles',
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
    factual: 'Factuel',
    ratherFactual: 'Plutôt factuel',
    mixed: 'Mixte',
    ratherSubjective: 'Plutôt subjectif',
    subjective: 'Subjectif',
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
    methodology: 'Cette visualisation présente une analyse automatisée des sentiments concernant la représentation de l\'islam et des musulmans dans la presse d\'Afrique de l\'Ouest francophone. Les articles analysés sont issus de la',
    methodologyAiModel: 'Méthodologie et modèle d\'IA',
    modelUsed: 'Modèle utilisé',
    modelDescription: 'L\'analyse a été réalisée avec',
    modelDetails: ', un grand modèle de langage développé par Google. Ce modèle a été choisi pour son excellent rapport qualité-prix, offrant des performances satisfaisantes pour l\'analyse de texte en français à un coût accessible.',
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
    polarityDescription: 'Évalue l\'orientation émotionnelle générale de l\'article envers son sujet principal.',
    subjectivityDescription: 'Mesure le degré d\'objectivité journalistique sur une échelle de 1 (très factuel) à 5 (très subjectif).',
    centralityDescription: 'Évalue l\'importance accordée aux thèmes liés à l\'islam et aux musulmans dans l\'article.',
    veryPositiveDesc: 'Portrait extrêmement favorable, enthousiaste, élogieux',
    positiveDesc: 'Présentation favorable, constructive, bienveillante',
    neutralDesc: 'Traitement équilibré, factuel, sans parti pris apparent',
    negativeDesc: 'Présentation défavorable, critique, problématisante',
    veryNegativeDesc: 'Portrait très négatif, stigmatisant, hostile',
    factualDesc: 'Information pure, données brutes, faits vérifiables',
    ratherFactualDesc: 'Principalement factuel avec quelques éléments d\'interprétation',
    mixedDesc: 'Équilibre entre faits et opinions, analyse modérée',
    ratherSubjectiveDesc: 'Forte présence d\'opinions et d\'interprétations personnelles',
    subjectiveDesc: 'Dominé par les opinions, jugements et parti pris',
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
    dimensionsNote: 'Astuce : Sélectionnez une seule dimension pour concentrer votre analyse sur des types spécifiques de désaccords. Les scores de divergence seront recalculés selon votre sélection.'
  },

  // Extreme Analysis
  extremeAnalysis: {
    title: 'Analyse des extrêmes lexicaux',
    subtitle: 'Exploration des mots-clés associés aux sentiments extrêmes',
    keywordFrequency: 'Fréquence des mots-clés',
    keywordsByFacet: 'Mots-clés par facette',
    topKeywords: 'Mots-clés les plus fréquents',
    associatedArticles: 'Articles associés',
    articleCount: 'Nombre d\'articles',
    selectCategory: 'Sélectionner une catégorie',
    selectKeywordType: 'Type de mots-clés',
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