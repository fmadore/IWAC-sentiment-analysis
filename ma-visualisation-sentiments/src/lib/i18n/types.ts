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
    comparison: string;
    extremes: string;
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
    sentimentCriteria: string;
    subjectivityScore: string;
    ratherObjective: string;
    mixedSubjectivity: string;
    ratherVerySubjective: string;
    averageCentrality: string;
    level: string;
    veryObjectiveScore: string;
    ratherObjectiveScore: string;
    mixedScore: string;
    ratherSubjectiveScore: string;
    verySubjectiveScore: string;
    numberOfArticles: string;
    polarityRange: string;
    centralityLevel: string;
    reset: string;
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
    polaritySubjectivityDistribution: string;
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
    articleTitle: string;
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
    titleNotAvailable: string;
    publicationDate: string;
    linkToFullArticle: string;
    consultOriginalArticle: string;
    noAnalysisData: string;
    noArticleSelected: string;
    selectArticlePrompt: string;
    justification: string;
  };

  // Analysis info
  analysis: {
    title: string;
    methodology: string;
    methodologyAiModel: string;
    modelUsed: string;
    modelDescription: string;
    modelDetails: string;
  modelSummary: string;
  modelUsageGuide: string;
  modelDocsLink: string;
  modelSpecs: string;
    technicalConfiguration: string;
    temperatureConfig: string;
    outputFormat: string;
    cacheSystem: string;
    errorHandling: string;
    analysisPrompt: string;
    promptDescription: string;
    promptFeature1: string;
    promptFeature2: string;
    promptFeature3: string;
    promptFeature4: string;
    promptFeature5: string;
    viewFullPrompt: string;
    limitationsTitle: string;
    limitationsDescription: string;
    notApplicableNote: string;
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

  // Export
  export: {
    exportCSV: string;
    downloadCSV: string;
    exporting: string;
    noDataToExport: string;
    exportError: string;
    polarityJustification: string;
    subjectivityJustification: string;
    centralityJustification: string;
    articleId: string;
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
    viewMore: string;
    viewLess: string;
    previous: string;
    next: string;
    sortBy: string;
    of: string;
    tableView: string;
    cardView: string;
  };

  // Datasets
  datasets: {
    selectModel: string;
    availableModels: string;
    comparisonMode: string;
    compareModels: string;
  };
  
  // Comparison
  comparison: {
    filterByDiscrepancy: string;
    differenceRange: string;
    quickFilters: string;
    pointDifference: string;
    pointsDifference: string;
    compareDimensions: string;
    polarity: string;
    subjectivity: string;
    centrality: string;
    totalDiscrepancy: string;
    totalDiscrepancies: string;
    articlesWithDifferences: string;
    averageDiscrepancy: string;
    pointsPerArticle: string;
    totalArticles: string;
    articlesAnalyzed: string;
    highConflicts: string;
    significantDifferences: string;
    breakdownByDimension: string;
    enableComparisonMode: string;
    enableComparisonDescription: string;
    noDiscrepancies: string;
    adjustFilters: string;
    excludeNonApplicable: string;
    excludeNonApplicableDescription: string;
    dimensionsExplanation: string;
    polarityExplanation: string;
    subjectivityExplanation: string;
    centralityExplanation: string;
    dimensionsNote: string;
  };

  // Extreme Analysis
  extremeAnalysis: {
    title: string;
    subtitle: string;
    keywordFrequency: string;
    keywordsByFacet: string;
    topKeywords: string;
    associatedArticles: string;
    articleCount: string;
    selectCategory: string;
    selectKeywordType: string;
    numberOfKeywords: string;
    subjectKeywords: string;
    spatialKeywords: string;
    byCountry: string;
    byNewspaper: string;
    showMore: string;
    showLess: string;
    noData: string;
    categories: {
      subjectivityHigh: string;
      subjectivityLow: string;
      polarityNegative: string;
      polarityPositive: string;
      centralityHigh: string;
      centralityLow: string;
    };
    descriptions: {
      subjectivityHigh: string;
      subjectivityLow: string;
      polarityNegative: string;
      polarityPositive: string;
      centralityHigh: string;
      centralityLow: string;
    };
  };
} 