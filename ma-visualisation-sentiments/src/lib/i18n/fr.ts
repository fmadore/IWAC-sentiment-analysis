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
    heatmap: 'Heatmap',
    table: 'Tableau'
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
    selectedCentralities: 'Centralités sélectionnées'
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
    pie: 'Camembert'
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
    noFilteredArticles: 'Aucun article ne correspond aux filtres sélectionnés'
  },

  // Article details
  article: {
    details: 'Détails de l\'article',
    metadata: 'Métadonnées',
    analysis: 'Analyse de sentiment',
    polarityJustification: 'Justification de la polarité',
    subjectivityJustification: 'Justification de la subjectivité',
    centralityJustification: 'Justification de la centralité',
    close: 'Fermer'
  },

  // Analysis info
  analysis: {
    title: 'Méthodologie d\'analyse',
    methodology: 'Cette analyse utilise des techniques de traitement du langage naturel pour évaluer trois dimensions clés des articles de presse.',
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
    article: 'article'
  }
}; 