import type { Translations } from './types.js';

export const en: Translations = {
  // App header and branding
  appTitle: 'Sentiment Analysis',
  appSubtitle: 'Article data visualization and exploration',
  enterFullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',

  // Navigation
  nav: {
    charts: 'Charts',
    trends: 'Trends',
    distribution: 'Distribution',
    volume: 'Volume',
    heatmap: 'Heatmap',
    table: 'Table',
    comparison: 'Comparison',
    extremes: 'Extreme Analysis'
  },

  // Filters
  filters: {
    country: 'Country',
    journal: 'Newspaper',
    polarity: 'Polarity',
    subjectivity: 'Subjectivity',
    centrality: 'Centrality',
    clearAll: 'Clear all',
    clearAllFilters: 'Clear all filters',
    searchJournals: 'Search newspapers...',
    showingJournals: 'Showing',
    of: 'of',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    selectedCountries: 'Selected countries',
    selectedJournals: 'Selected newspapers',
    selectedPolarities: 'Selected polarities',
    selectedSubjectivities: 'Selected subjectivities',
    selectedCentralities: 'Selected centralities',
    sentimentCriteria: 'Sentiment analysis criteria',
    subjectivityScore: 'Subjectivity score',
    ratherObjective: 'Rather objective',
    mixedSubjectivity: 'Mixed subjectivity',
    ratherVerySubjective: 'Rather/very subjective',
    averageCentrality: 'Average centrality',
    level: 'Level',
    veryObjectiveScore: 'Very objective',
    ratherObjectiveScore: 'Rather objective',
    mixedScore: 'Mixed',
    ratherSubjectiveScore: 'Rather subjective',
    verySubjectiveScore: 'Very subjective',
    numberOfArticles: 'Number of articles',
    polarityRange: 'Polarity range',
    centralityLevel: 'Centrality level',
    reset: 'Reset'
  },

  // Sentiment labels
  sentiment: {
    veryPositive: 'Very positive',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    veryNegative: 'Very negative',
    notApplicable: 'Not applicable'
  },

  // Subjectivity labels
  subjectivity: {
    factual: 'Very objective',
    ratherFactual: 'Rather objective',
    mixed: 'Mixed',
    ratherSubjective: 'Rather subjective',
    subjective: 'Very subjective',
    notApplicable: 'Not applicable'
  },

  // Centrality labels
  centrality: {
    veryCentral: 'Very central',
    central: 'Central',
    secondary: 'Secondary',
    marginal: 'Marginal',
    notAddressed: 'Not addressed'
  },

  // Chart titles and labels
  charts: {
    polarityDistribution: 'Polarity distribution',
    subjectivityDistribution: 'Subjectivity distribution',
    sentimentTrends: 'Sentiment trends',
    correlationDistribution: 'Cross distribution',
    volumeByCountry: 'Article volume by country',
    centralityHeatmap: 'Centrality heatmap',
    articlesAnalyzed: 'articles analyzed',
    globalDistribution: 'Global distribution',
    byJournal: 'by newspaper',
    byYear: 'by year',
    stackedAreas: 'Stacked areas',
    lines: 'Lines',
    bars: 'Bars',
    pie: 'Pie chart',
    polaritySubjectivityDistribution: 'Polarity × Subjectivity Distribution'
  },

  // Table
  table: {
    title: 'Articles',
    country: 'Country',
    journal: 'Newspaper',
    date: 'Date',
    polarity: 'Polarity',
    subjectivity: 'Subjectivity',
    centrality: 'Centrality',
    actions: 'Actions',
    viewDetails: 'View details',
    sortBy: 'Sort by',
    itemsPerPage: 'Items per page',
    showingItems: 'Showing',
    noArticles: 'No articles available',
    noFilteredArticles: 'No articles match the selected filters',
    articleTitle: 'Title'
  },

  // Article details
  article: {
    details: 'Article details',
    metadata: 'Metadata',
    analysis: 'Sentiment analysis',
    polarityJustification: 'Polarity justification',
    subjectivityJustification: 'Subjectivity justification',
    centralityJustification: 'Centrality justification',
    close: 'Close',
    titleNotAvailable: 'Title not available',
    publicationDate: 'Publication date',
    linkToFullArticle: 'Link to full article',
    consultOriginalArticle: 'View original article →',
    noAnalysisData: 'Sentiment analysis data is not available for this article.',
    noArticleSelected: 'No article selected',
    selectArticlePrompt: 'Select an article from the table to view its sentiment analysis details.',
    justification: 'Justification'
  },

  // Analysis info
  analysis: {
    title: 'Analysis methodology',
    methodology: 'This visualization presents an automated sentiment analysis concerning the representation of Islam and Muslims in the Francophone West African press. The analyzed articles come from the',
    methodologyAiModel: 'Methodology and AI model',
    modelUsed: 'Model used',
    modelDescription: 'The analysis was performed with',
    modelDetails: ', a large language model developed by Google. This model was chosen for its excellent quality-price ratio, offering satisfactory performance for French text analysis at an accessible cost.',
    technicalConfiguration: 'Technical configuration',
    temperatureConfig: 'Temperature: 0.2 (for deterministic output)',
    outputFormat: 'Output format: Structured JSON with Pydantic validation',
    cacheSystem: 'Cache system to avoid redundant analyses',
    errorHandling: 'Automatic error handling with multiple attempts',
    analysisPrompt: 'Analysis prompt',
    promptDescription: 'The model receives a specialized prompt that:',
    promptFeature1: 'Defines the role of sentiment analysis expert for Francophone West Africa',
    promptFeature2: 'Specifies evaluation criteria for each dimension (polarity, subjectivity, centrality)',
    promptFeature3: 'Provides detailed scales with concrete examples',
    promptFeature4: 'Requests justification for each classification',
    promptFeature5: 'Imposes a structured JSON output format to ensure consistency',
    viewFullPrompt: 'View full prompt',
    limitationsTitle: 'Limitations and precautions',
    limitationsDescription: 'This automated analysis constitutes a research assistance tool. Results may require human validation for complex or ambiguous cases. The justifications provided by the AI allow evaluation of the relevance of each classification.',
    notApplicableNote: 'The article does not deal with Islam or Muslims',
    polaritySection: 'Sentiment polarity',
    subjectivitySection: 'Subjectivity',
    centralitySection: 'Islam/Muslims centrality',
    polarityDescription: 'Evaluates the general emotional orientation of the article towards its main subject.',
    subjectivityDescription: 'Measures the degree of objectivity/subjectivity of the article IN ITS WAY OF REPRESENTING Islam and/or Muslims on a scale from 1 (very objective) to 5 (very subjective).',
    centralityDescription: 'Evaluates the importance given to themes related to Islam and Muslims in the article.',
    veryPositiveDesc: 'Extremely favorable, enthusiastic, praising portrait of Islam/Muslims',
    positiveDesc: 'Favorable, optimistic portrait of Islam/Muslims',
    neutralDesc: 'No clear sentiment towards Islam/Muslims or balance between positive and negative aspects in their representation; factual tone without marked emotional charge towards them',
    negativeDesc: 'Unfavorable, critical, pessimistic portrait of Islam/Muslims',
    veryNegativeDesc: 'Extremely unfavorable, alarmist, very critical portrait of Islam/Muslims',
    factualDesc: 'Reports verifiable facts about Islam/Muslims without expressing personal opinions or feelings about them, purely informative style on this theme',
    ratherFactualDesc: 'Mainly factual concerning Islam/Muslims, but may contain subtle traces of opinions or word choices suggesting a limited perspective on this theme',
    mixedDesc: 'Contains a balanced mix of facts and personal opinions/feelings concerning Islam/Muslims, or presents multiple viewpoints on this theme',
    ratherSubjectiveDesc: 'Clearly expresses opinions, feelings, or judgments about Islam/Muslims, even if based on some facts to support them',
    subjectiveDesc: 'Heavily biased in its representation of Islam/Muslims, expresses intense opinions and emotions about them, with little or no objective presentation of facts, editorial or opinion piece style on this theme',
    veryCentralDesc: 'Islam/Muslims constitute the main subject of the article',
    centralDesc: 'Important theme but shared with other subjects',
    secondaryDesc: 'Mentioned significantly but secondarily',
    marginalDesc: 'Briefly or anecdotally mentioned',
    notAddressedDesc: 'No mention of Islam or Muslims'
  },

  // Loading and messages
  messages: {
    loading: 'Loading...',
    loadingData: 'Loading IWAC corpus data...',
    noData: 'No data available',
    error: 'An error occurred',
    shareUrl: 'Share this view',
    urlCopied: 'URL copied to clipboard'
  },

  // Export
  export: {
    exportCSV: 'Export CSV',
    downloadCSV: 'Download data as CSV',
    exporting: 'Exporting',
    noDataToExport: 'No data to export',
    exportError: 'Error exporting data',
    polarityJustification: 'Polarity justification',
    subjectivityJustification: 'Subjectivity justification',
    centralityJustification: 'Centrality justification',
    articleId: 'Article ID'
  },

  // Common
  common: {
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    all: 'All',
    none: 'None',
    total: 'Total',
    articles: 'articles',
    article: 'article',
    viewMore: 'View more',
    viewLess: 'Back to List',
    previous: 'Previous',
    next: 'Next',
    sortBy: 'Sort by',
    of: 'of',
    tableView: 'Table',
    cardView: 'Cards'
  },

  // Datasets
  datasets: {
    selectModel: 'Select Model',
    availableModels: 'Available Models',
    comparisonMode: 'Comparison Mode',
    compareModels: 'Compare Models'
  },
  
  // Comparison
  comparison: {
    filterByDiscrepancy: 'Filter by Discrepancy',
    differenceRange: 'Difference Range',
    quickFilters: 'Quick Filters',
    pointDifference: 'point difference',
    pointsDifference: 'points difference',
    compareDimensions: 'Compare Dimensions',
    polarity: 'Polarity',
    subjectivity: 'Subjectivity',
    centrality: 'Centrality',
    totalDiscrepancy: 'Total Discrepancy',
    totalDiscrepancies: 'Total Discrepancies',
    articlesWithDifferences: 'Articles with Differences',
    averageDiscrepancy: 'Average Discrepancy',
    pointsPerArticle: 'Points per Article',
    totalArticles: 'Total Articles',
    articlesAnalyzed: 'Articles analyzed',
    highConflicts: 'High Conflicts',
    significantDifferences: 'Significant differences',
    breakdownByDimension: 'Breakdown by Dimension',
    enableComparisonMode: 'Enable Comparison Mode',
    enableComparisonDescription: 'Click the comparison button in the dataset picker to compare ChatGPT and Gemini analyses.',
    noDiscrepancies: 'No Discrepancies Found',
    adjustFilters: 'Try adjusting your filters to see articles with differences between models.',
    excludeNonApplicable: 'Exclude "Non Applicable" Articles',
    excludeNonApplicableDescription: 'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.',
    dimensionsExplanation: 'Select which dimensions to analyze for disagreements between models:',
    polarityExplanation: 'Positive/Negative sentiment differences',
    subjectivityExplanation: 'Objectivity vs. opinion differences (1-5 scale)',
    centralityExplanation: 'How central Islam/Muslims are to the article',
    dimensionsNote: 'Tip: Select only one dimension to focus your analysis on specific types of disagreements. Discrepancy scores will be recalculated based on your selection.'
  },

  // Extreme Analysis
  extremeAnalysis: {
    title: 'Lexical Extremes Analysis',
    subtitle: 'Explore keywords associated with extreme sentiments',
    keywordFrequency: 'Keyword Frequency',
    keywordsByFacet: 'Keywords by Facet',
    topKeywords: 'Top Keywords',
    associatedArticles: 'Associated Articles',
    articleCount: 'Article Count',
    selectCategory: 'Select Category',
    selectKeywordType: 'Keyword Type',
    numberOfKeywords: 'Number of Keywords',
    subjectKeywords: 'Subject Keywords',
    spatialKeywords: 'Spatial Keywords',
    byCountry: 'By Country',
    byNewspaper: 'By Newspaper',
    showMore: 'Show More',
    showLess: 'Show Less',
    noData: 'No data available for this selection',
    categories: {
      subjectivityHigh: 'High Subjectivity (4-5)',
      subjectivityLow: 'Low Subjectivity (1-2)',
      polarityNegative: 'Very Negative Polarity',
      polarityPositive: 'Very Positive Polarity',
      centralityHigh: 'Very Central',
      centralityLow: 'Not Central'
    },
    descriptions: {
      subjectivityHigh: 'Articles with strong opinions and emotions',
      subjectivityLow: 'Factual and informative articles',
      polarityNegative: 'Articles with very negative sentiment',
      polarityPositive: 'Articles with very positive sentiment',
      centralityHigh: 'Islam/Muslims at the heart of the subject',
      centralityLow: 'Peripheral mention of Islam/Muslims'
    }
  }
}; 