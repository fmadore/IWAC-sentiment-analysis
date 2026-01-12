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
    arbiter: string;
  };

  // Filters
  filters: {
    title: string;
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
    subjectivityTrends: string;
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
    subtitle: string;
  };

  // Trends view
  trends: {
    subtitle: string;
  };

  // Volume view
  volume: {
    subtitle: string;
  };

  // Heatmap view
  heatmap: {
    subtitle: string;
  };

  // Correlation/Distribution view
  correlation: {
    subtitle: string;
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
    subtitle: string;
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
    methodologyIntro: string;
    methodologyCorpus: string;
    methodologyCorpusArticles: string;
    methodologyCorpusDeveloper: string;
    methodologyCorpusEnd: string;
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
    subtitle: string;
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
    significantDifferencesExplanation: string;
    totalDiscrepanciesExplanation: string;
    averageDiscrepancyExplanation: string;
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
    // Model pair selection
    selectModelPair: string;
    chatgptVsGemini: string;
    chatgptVsMistral: string;
    geminiVsMistral: string;
    modelALabel: string;
    modelBLabel: string;
  };

  // Arbiter
  arbiter: {
    title: string;
    subtitle: string;
    modelName: string;
    verdict: string;
    overallVerdict: string;
    confidenceLevel: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    preferredModel: string;
    prefers: string;
    prefersChatGPT: string;
    prefersGemini: string;
    prefersBoth: string;
    prefersNeither: string;
    arbiterScore: string;
    arbiterJustification: string;
    verdictExplanation: string;
    noArbiterData: string;
    noArbiterDataDescription: string;
    polarityVerdict: string;
    subjectivityVerdict: string;
    centralityVerdict: string;
    showArbiterVerdict: string;
    hideArbiterVerdict: string;
    loadingArbiter: string;
    arbiterNotAvailable: string;
    runArbiterScript: string;
    // Summary statistics
    summaryTitle: string;
    articlesEvaluated: string;
    chatgptPreferred: string;
    geminiPreferred: string;
    bothEqual: string;
    neitherAccurate: string;
    preferred: string;
    blindEvaluationNote: string;
    // Arbiter View page
    viewTitle: string;
    viewSubtitle: string;
    overallStats: string;
    verdictDistribution: string;
    verdictsByDimension: string;
    confidenceDistribution: string;
    totalVerdicts: string;
    modelPreference: string;
    agreementRate: string;
    dimension: string;
    polarity: string;
    subjectivity: string;
    centrality: string;
    allDimensions: string;
    modelAWins: string;
    modelBWins: string;
    ties: string;
    selectModelPair: string;
    noDataForPair: string;
    runScript: string;
    filterByDimension: string;
    filterByConfidence: string;
    // Methodology section
    methodologyTitle: string;
    methodologySubtitle: string;
    blindEvaluation: string;
    blindEvaluationDesc: string;
    highReasoning: string;
    highReasoningDesc: string;
    independentVerdict: string;
    independentVerdictDesc: string;
    howItWorks: string;
    selectionProcess: string;
    selectionProcessDesc: string;
    blindAssignment: string;
    blindAssignmentDesc: string;
    evaluationProcess: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    arbiterModel: string;
    arbiterRole: string;
    geminiArbiterDesc: string;
    evaluationScales: string;
    viewPrompt: string;
    promptExplanation: string;
    viewFullPrompt: string;
    arbiterPrompt: string;
    systemInstruction: string;
    userPromptTemplate: string;
    // Scale descriptions
    polarityVeryPositive: string;
    polarityPositive: string;
    polarityNeutral: string;
    polarityNegative: string;
    polarityVeryNegative: string;
    subjectivity1: string;
    subjectivity2: string;
    subjectivity3: string;
    subjectivity4: string;
    subjectivity5: string;
    centralityVeryCentral: string;
    centralityCentral: string;
    centralitySecondary: string;
    centralityMarginal: string;
    centralityNotAddressed: string;
    // Head-to-head comparison
    headToHead: string;
    excludingTies: string;
    wins: string;
    // Evaluated articles table
    evaluatedArticles: string;
    evaluatedArticlesSubtitle: string;
    viewArticleDetails: string;
    articleWithArbiter: string;
    noEvaluatedArticles: string;
    justification: string;
  };

  // Extreme Analysis
  extremeAnalysis: {
    title: string;
    subtitle: string;
    analysisControls: string;
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