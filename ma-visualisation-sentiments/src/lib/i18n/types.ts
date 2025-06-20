export interface SentimentLabels {
  veryPositive: string;
  positive: string;
  neutral: string;
  negative: string;
  veryNegative: string;
  notApplicable: string;
}

export interface SubjectivityLabels {
  factual: string;
  ratherFactual: string;
  mixed: string;
  ratherSubjective: string;
  subjective: string;
  notApplicable: string;
}

export interface CentralityLabels {
  veryCentral: string;
  central: string;
  secondary: string;
  marginal: string;
  notAddressed: string;
}

export interface Translations {
  // App header and branding
  appTitle: string;
  appSubtitle: string;
  enterFullscreen: string;
  exitFullscreen: string;

  // Navigation
  nav: {
    charts: string;
    trends: string;
    distribution: string;
    volume: string;
    heatmap: string;
    table: string;
  };

  // Filters
  filters: {
    country: string;
    journal: string;
    polarity: string;
    subjectivity: string;
    centrality: string;
    clearAll: string;
    clearAllFilters: string;
    searchJournals: string;
    showingJournals: string;
    of: string;
    selectAll: string;
    deselectAll: string;
    selectedCountries: string;
    selectedJournals: string;
    selectedPolarities: string;
    selectedSubjectivities: string;
    selectedCentralities: string;
  };

  // Sentiment labels
  sentiment: SentimentLabels;

  // Subjectivity labels  
  subjectivity: SubjectivityLabels;

  // Centrality labels
  centrality: CentralityLabels;

  // Chart titles and labels
  charts: {
    polarityDistribution: string;
    subjectivityDistribution: string;
    sentimentTrends: string;
    correlationDistribution: string;
    volumeByCountry: string;
    centralityHeatmap: string;
    articlesAnalyzed: string;
    globalDistribution: string;
    byJournal: string;
    byYear: string;
    stackedAreas: string;
    lines: string;
    bars: string;
    pie: string;
  };

  // Table
  table: {
    title: string;
    country: string;
    journal: string;
    date: string;
    polarity: string;
    subjectivity: string;
    centrality: string;
    actions: string;
    viewDetails: string;
    sortBy: string;
    itemsPerPage: string;
    showingItems: string;
    noArticles: string;
    noFilteredArticles: string;
  };

  // Article details
  article: {
    details: string;
    metadata: string;
    analysis: string;
    polarityJustification: string;
    subjectivityJustification: string;
    centralityJustification: string;
    close: string;
  };

  // Analysis info
  analysis: {
    title: string;
    methodology: string;
    polaritySection: string;
    subjectivitySection: string;
    centralitySection: string;
    polarityDescription: string;
    subjectivityDescription: string;
    centralityDescription: string;
    veryPositiveDesc: string;
    positiveDesc: string;
    neutralDesc: string;
    negativeDesc: string;
    veryNegativeDesc: string;
    factualDesc: string;
    ratherFactualDesc: string;
    mixedDesc: string;
    ratherSubjectiveDesc: string;
    subjectiveDesc: string;
    veryCentralDesc: string;
    centralDesc: string;
    secondaryDesc: string;
    marginalDesc: string;
    notAddressedDesc: string;
  };

  // Loading and messages
  messages: {
    loading: string;
    loadingData: string;
    noData: string;
    error: string;
    shareUrl: string;
    urlCopied: string;
  };

  // Common
  common: {
    yes: string;
    no: string;
    close: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    search: string;
    filter: string;
    clear: string;
    all: string;
    none: string;
    total: string;
    articles: string;
    article: string;
  };
} 