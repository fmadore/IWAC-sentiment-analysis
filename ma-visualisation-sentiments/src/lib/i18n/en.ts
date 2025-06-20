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
    table: 'Table'
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
    numberOfArticles: 'Number of articles'
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
    factual: 'Factual',
    ratherFactual: 'Rather factual',
    mixed: 'Mixed',
    ratherSubjective: 'Rather subjective',
    subjective: 'Subjective',
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
    methodology: 'This analysis uses natural language processing techniques to evaluate three key dimensions of press articles.',
    polaritySection: 'Sentiment polarity',
    subjectivitySection: 'Subjectivity',
    centralitySection: 'Islam/Muslims centrality',
    polarityDescription: 'Evaluates the general emotional orientation of the article towards its main subject.',
    subjectivityDescription: 'Measures the degree of journalistic objectivity on a scale from 1 (very factual) to 5 (very subjective).',
    centralityDescription: 'Evaluates the importance given to themes related to Islam and Muslims in the article.',
    veryPositiveDesc: 'Extremely favorable, enthusiastic, praising portrait',
    positiveDesc: 'Favorable, constructive, benevolent presentation',
    neutralDesc: 'Balanced, factual treatment without apparent bias',
    negativeDesc: 'Unfavorable, critical, problematizing presentation',
    veryNegativeDesc: 'Very negative, stigmatizing, hostile portrait',
    factualDesc: 'Pure information, raw data, verifiable facts',
    ratherFactualDesc: 'Mainly factual with some interpretation elements',
    mixedDesc: 'Balance between facts and opinions, moderate analysis',
    ratherSubjectiveDesc: 'Strong presence of opinions and personal interpretations',
    subjectiveDesc: 'Dominated by opinions, judgments and bias',
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
    viewLess: 'View less',
    previous: 'Previous',
    next: 'Next',
    sortBy: 'Sort by'
  }
}; 