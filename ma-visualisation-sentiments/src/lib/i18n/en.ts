/**
 * English catalog — the source of truth for the `Translations` type
 * (types.ts derives it via `typeof en`). Do not annotate this object with
 * `Translations`; that would be circular. fr.ts is annotated instead, which
 * is what enforces EN/FR key parity at compile time.
 */
export const en = {
	// App header and branding
	appTitle: 'IWAC Sentiment Analysis',
	appSubtitle: 'Islam West Africa Collection – Data visualization and exploration',
	enterFullscreen: 'Enter fullscreen',
	exitFullscreen: 'Exit fullscreen',
	/* Label beside the language segment at the foot of the mobile drawer. */
	language: 'Language',

	// Navigation
	nav: {
		/* Section heading over the view list in the mobile drawer. */
		views: 'Views',
		charts: 'Charts',
		trends: 'Trends',
		distribution: 'Distribution',
		volume: 'Volume',
		heatmap: 'Heatmap',
		table: 'Table',
		comparison: 'Comparison',
		seasonality: 'Seasonality',
		ranking: 'Newspapers',
		map: 'Map',
		agreement: 'Agreement',
		extremes: 'Extreme Analysis',
		arbiter: 'Arbiter'
	},

	// Filters
	filters: {
		title: 'Facets',
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

	// Newspaper ranking
	ranking: {
		title: 'Newspapers',
		subtitle:
			'Newspapers ranked by mean sentiment, with 95% confidence intervals. Titles with fewer rated articles carry wider intervals — a high mean from a small sample is not a strong finding.',
		chartTitle: 'Newspapers ranked',
		chartSubtitle: 'Mean with 95% CI · titles with at least {min} rated articles',
		netPolarity: 'Net polarity',
		meanSubjectivity: 'Mean subjectivity',
		meanCentrality: 'Mean centrality',
		confidenceInterval: '95% CI',
		neutralLine: 'neutral',
		minArticles: 'Min. articles',
		excludedNote:
			'{count} newspapers omitted: fewer than {min} rated articles. Their means would be too uncertain to rank.',
		noneAboveThreshold: 'No newspaper has at least {min} rated articles under the current filters.'
	},

	// Place map
	map: {
		title: 'Map',
		subtitle:
			'Where the corpus looks. One bubble per place the articles tag, sized by how many mention it and coloured by the dimension you pick.',
		articlesMentioning: 'articles mentioning this place',
		meanOf: 'Mean {dimension}',
		scoredArticles: 'Scored articles',
		legendSizeTitle: 'Articles mentioning',
		legendColorTitle: 'Mean {dimension}',
		legendUnscored: 'Not scored',
		caveat:
			'A bubble counts articles that MENTION a place, not articles about it. Articles tag about four places each, so the totals here exceed the number of articles. Colour is the article-level rating on a 1–5 scale, averaged over articles the model actually scored on that dimension. For polarity, "Not applicable" means no stance was expressed and is excluded from the mean while still counting toward the bubble; for centrality, "Not addressed" is a genuine bottom of the scale and is included. Places with no coordinates in the IWAC authority file are absent.',
		noPlacesTitle: 'No mapped places',
		noPlacesLede: 'No article in the current selection tags a place with known coordinates.',
		loadErrorTitle: 'Map data unavailable'
	},

	// Hijri-calendar seasonality
	seasonality: {
		title: 'Seasonality',
		subtitle:
			'Coverage across the Islamic lunar calendar. Because the Hijri year drifts against the Gregorian one, this pattern is invisible in any year- or month-based view.',
		chartTitle: 'Coverage by Hijri month',
		chartSubtitle: 'Article volume and mean centrality across the lunar year',
		cycleLayout: 'Cycle',
		coverageIndex: 'Coverage index',
		calendarNote:
			'Dates converted with the tabular (arithmetic) Islamic calendar, civil epoch. This differs from locally announced observance dates by a day or two — fine for month-level aggregates, not for dating an individual observance.',
		undatedNote: '{count} articles excluded: no full publication date.',
		months: {
			muharram: 'Muharram',
			safar: 'Safar',
			rabiI: 'Rabi I',
			rabiII: 'Rabi II',
			jumadaI: 'Jumada I',
			jumadaII: 'Jumada II',
			rajab: 'Rajab',
			shaban: "Sha'ban",
			ramadan: 'Ramadan',
			shawwal: 'Shawwal',
			dhuAlQadah: "Dhu al-Qa'dah",
			dhuAlHijjah: 'Dhu al-Hijjah'
		}
	},

	// Agreement / calibration
	agreement: {
		title: 'Agreement',
		subtitle:
			'How the models relate to one another: where they converge, where they diverge, and whether a disagreement is a systematic offset or genuine conflict.',
		dimensionSelector: 'Analysis dimension',
		exactAgreement: 'Exact agreement',
		exactAgreementHelp:
			'Share of articles where both models chose the identical category. Uncorrected for the agreement expected by chance alone.',
		adjacentAgreement: 'Within one step',
		adjacentDetail: 'Identical or one category apart',
		adjacentAgreementHelp:
			'Share of articles where the two labels are identical or exactly one position apart on the ordinal scale.',
		articlesCompared: 'articles compared',
		kappa: "Cohen's κ",
		kappaHelp:
			'Agreement corrected for chance. 0 means no better than chance; 1 means perfect. Treats every disagreement as equally severe, so an ordinal scale shifted by one category scores poorly.',
		weightedKappa: 'Weighted κ',
		weightedKappaHelp:
			'Quadratic-weighted kappa. Being one category off costs far less than being four off, which suits ordinal scales. A weighted score much higher than the unweighted one means the models mostly rank alike but calibrate differently.',
		fleissKappa: "Fleiss' κ",
		fleissHelp:
			"Fleiss' kappa across all three models at once, over articles every model analysed.",
		threeWayTitle: 'All three models',
		threeWayLede:
			'Agreement across all three models of the selected analysis simultaneously, per dimension. Only articles all three analysed are counted.',
		matrixTitle: 'Agreement matrix',
		rowsAre: 'Rows:',
		columnsAre: 'Columns:',
		ofRow: 'Of this row',
		calibrationTitle: 'Model calibration',
		calibrationSubtitle: 'Each model\u2019s own distribution across the scale',
		systematicOffsetNote:
			'Weighted agreement is far higher than unweighted agreement here. That is the signature of a systematic offset rather than genuine conflict: {modelA} and {modelB} rank articles similarly but place the boundaries between categories in different places, so most of their disagreement is a single step on the scale.',
		strength: {
			poor: 'Poor',
			slight: 'Slight',
			fair: 'Fair',
			moderate: 'Moderate',
			substantial: 'Substantial',
			almostPerfect: 'Almost perfect'
		}
	},

	// Per-chart data disclosure
	chartData: {
		showData: 'Data',
		month: 'Month',
		articles: 'Articles',
		coverageIndex: 'Coverage index',
		meanCentrality: 'Mean centrality',
		newspaper: 'Newspaper',
		mean: 'Mean',
		ciLow: 'CI low',
		ciHigh: 'CI high',
		modelALabel: 'Model A',
		modelBLabel: 'Model B',
		count: 'Count',
		rowPercent: '% of row',
		seasonalityCaption: 'Article volume and mean centrality by Hijri month',
		rankingCaption: 'Newspapers ranked by mean, with confidence intervals',
		matrixCaption: 'Cross-tabulation of the two models\u2019 labels'
	},

	// Chart titles and labels
	charts: {
		polarityDistribution: 'Polarity distribution',
		subjectivityDistribution: 'Subjectivity distribution',
		sentimentTrends: 'Sentiment trends',
		subjectivityTrends: 'Subjectivity trends',
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
		countMode: 'Count',
		shareMode: 'Share',
		pie: 'Pie chart',
		polaritySubjectivityDistribution: 'Polarity × Subjectivity Distribution',
		subtitle: 'Visualize sentiment distribution across polarity and subjectivity dimensions.'
	},

	// Trends view
	trends: {
		subtitle: 'Track sentiment evolution over time across publications.'
	},

	// Volume view
	volume: {
		subtitle: 'Analyze publication volume and temporal patterns in the corpus.'
	},

	// Heatmap view
	heatmap: {
		subtitle:
			'Explore centrality patterns across countries and themes with interactive visualization.'
	},

	// Correlation/Distribution view
	correlation: {
		subtitle: 'Analyze the relationship between polarity and subjectivity dimensions.',
		spearman: "Spearman's ρ",
		strengthLabel: 'Strength',
		rhoNote:
			'Rank correlation between polarity and subjectivity. Both scales are ordinal, so ranks are used rather than the coded values. Articles the model marked Not applicable are excluded.',
		strength: {
			negligible: 'Negligible',
			weak: 'Weak',
			moderate: 'Moderate',
			strong: 'Strong'
		}
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
		articleTitle: 'Title',
		subtitle: 'Browse and search all articles with detailed sentiment data.'
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
		methodologyIntro:
			'This dashboard explores the potential of AI as a research partner for analyzing large corpora. The proliferation of digital archiving has produced vast collections that often exceed human processing capacity. Using "distant reading" (Moretti 2000), computational techniques can survey thousands of articles and reveal patterns that traditional methods would miss.',
		methodologyCorpus:
			'This experiment analyzes how Islam and Muslims are represented in West African newspapers. Instead of manually coding thousands of articles—which would introduce inconsistency—the entire corpus of',
		methodologyCorpusArticles: 'articles from the',
		methodologyCorpusDeveloper: ', a collaborative and open-access digital database developed by',
		methodologyCorpusEnd:
			", was analyzed using three LLMs: OpenAI's GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash. Each article was evaluated according to three complementary dimensions:",
		methodology:
			'This visualization presents an automated sentiment analysis concerning the representation of Islam and Muslims in the Francophone West African press. The analyzed articles come from the',
		methodologyAiModel: 'Methodology and AI model',
		modelUsed: 'Model used',
		modelDescription: 'The analysis was performed with',
		modelDetails:
			', an OpenAI GPT-5 series model ("GPT-5 mini", Aug 2025). It offers a 400,000-token context window and enhanced reasoning capabilities, providing strong quality at an efficient cost for large French-language corpora.',
		modelSummary: 'Model overview',
		modelUsageGuide: 'Usage guide',
		modelDocsLink: 'Model documentation',
		modelSpecs: 'Model specifications',
		technicalConfiguration: 'Technical configuration',
		temperatureConfig: 'Temperature: 0.2 (for deterministic output)',
		outputFormat: 'Output format: Structured JSON with Pydantic validation',
		cacheSystem: 'Cache system to avoid redundant analyses',
		errorHandling: 'Automatic error handling with multiple attempts',
		analysisPrompt: 'Analysis prompt',
		promptDescription: 'The model receives a specialized prompt that:',
		promptFeature1: 'Defines the role of sentiment analysis expert for Francophone West Africa',
		promptFeature2:
			'Specifies evaluation criteria for each dimension (polarity, subjectivity, centrality)',
		promptFeature3: 'Provides detailed scales with concrete examples',
		promptFeature4: 'Requests justification for each classification',
		promptFeature5: 'Imposes a structured JSON output format to ensure consistency',
		viewFullPrompt: 'View full prompt',
		limitationsTitle: 'Limitations and precautions',
		limitationsDescription:
			'This automated analysis constitutes a research assistance tool. Results may require human validation for complex or ambiguous cases. The justifications provided by the AI allow evaluation of the relevance of each classification.',
		notApplicableNote: 'The article does not deal with Islam or Muslims',
		polaritySection: 'Sentiment polarity',
		subjectivitySection: 'Subjectivity',
		centralitySection: 'Islam/Muslims centrality',
		polarityDescription:
			'Evaluates the general emotional orientation of the article towards its main subject.',
		subjectivityDescription:
			'Measures the degree of objectivity/subjectivity of the article IN ITS WAY OF REPRESENTING Islam and/or Muslims on a scale from 1 (very objective) to 5 (very subjective).',
		centralityDescription:
			'Evaluates the importance given to themes related to Islam and Muslims in the article.',
		veryPositiveDesc: 'Extremely favorable, enthusiastic, praising portrait of Islam/Muslims',
		positiveDesc: 'Favorable, optimistic portrait of Islam/Muslims',
		neutralDesc:
			'No clear sentiment towards Islam/Muslims or balance between positive and negative aspects in their representation; factual tone without marked emotional charge towards them',
		negativeDesc: 'Unfavorable, critical, pessimistic portrait of Islam/Muslims',
		veryNegativeDesc: 'Extremely unfavorable, alarmist, very critical portrait of Islam/Muslims',
		factualDesc:
			'Reports verifiable facts about Islam/Muslims without expressing personal opinions or feelings about them, purely informative style on this theme',
		ratherFactualDesc:
			'Mainly factual concerning Islam/Muslims, but may contain subtle traces of opinions or word choices suggesting a limited perspective on this theme',
		mixedDesc:
			'Contains a balanced mix of facts and personal opinions/feelings concerning Islam/Muslims, or presents multiple viewpoints on this theme',
		ratherSubjectiveDesc:
			'Clearly expresses opinions, feelings, or judgments about Islam/Muslims, even if based on some facts to support them',
		subjectiveDesc:
			'Heavily biased in its representation of Islam/Muslims, expresses intense opinions and emotions about them, with little or no objective presentation of facts, editorial or opinion piece style on this theme',
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
		dataLoadError: 'The corpus data could not be loaded or did not match the expected v1 schema.',
		retry: 'Retry',
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

	// Analysis generations (current v2 panel vs archived v1 panel)
	generations: {
		archivedLabel: 'Archived analysis',
		archivedTitle: 'You are viewing the archived 2026 analysis (v1).',
		archivedDescription:
			'GPT-5 mini, Gemini 3 Flash preview and Ministral 14B, scored under the first prompt. Kept online so published figures and citations stay reproducible.',
		backToCurrent: 'Back to the current analysis',
		archiveLinkLabel: 'View the archived v1 analysis',
		archiveLinkDescription:
			'The first campaign (GPT-5 mini, Gemini 3 Flash preview, Ministral 14B) remains available, including its pairwise arbiter.'
	},

	// Comparison
	comparison: {
		byDecade: 'Decade',
		disagreementBreakdown: 'Where the models disagree',
		disagreementBreakdownNote:
			'Mean discrepancy per article, bucketed by decade or country. Buckets with fewer than 20 compared articles are omitted — their means would swing on a handful of cases.',
		subtitle:
			'Compare sentiment analyses between different AI models and identify significant discrepancies.',
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
		significantDifferencesExplanation:
			'Articles where any dimension (polarity, subjectivity, or centrality) differs by 3+ points between ChatGPT and Gemini analyses. This indicates substantial disagreement between the AI models.',
		totalDiscrepanciesExplanation:
			'Number of articles where ChatGPT and Gemini provide different analyses (any difference > 0 points)',
		averageDiscrepancyExplanation:
			'Average total difference points per article across all three dimensions (polarity + subjectivity + centrality)',
		breakdownByDimension: 'Breakdown by Dimension',
		enableComparisonMode: 'Enable Comparison Mode',
		enableComparisonDescription:
			'Click the comparison button in the dataset picker to compare ChatGPT and Gemini analyses.',
		noDiscrepancies: 'No Discrepancies Found',
		adjustFilters: 'Try adjusting your filters to see articles with differences between models.',
		excludeNonApplicable: 'Exclude "Non Applicable" Articles',
		excludeNonApplicableDescription:
			'Hide articles where one model marked centrality as "Non applicable", which creates artificially high discrepancies.',
		dimensionsExplanation: 'Select which dimensions to analyze for disagreements between models:',
		polarityExplanation: 'Positive/Negative sentiment differences',
		subjectivityExplanation: 'Objectivity vs. opinion differences (1-5 scale)',
		centralityExplanation: 'How central Islam/Muslims are to the article',
		dimensionsNote:
			'Tip: Select only one dimension to focus your analysis on specific types of disagreements. Discrepancy scores will be recalculated based on your selection.',
		// Model pair picker. Pair labels are built from the model names in the
		// contract registry, so only the joining word is translated.
		selectModelPair: 'Select models to compare',
		versus: 'vs',
		modelALabel: 'Model A',
		modelBLabel: 'Model B'
	},

	// Arbiter
	arbiter: {
		samplingFrame: 'Sampling frame',
		coverageEvaluated: 'evaluated',
		coverageCorpus: 'in corpus',
		samplingFrameNote:
			'The arbiter did not review the whole corpus. It reviewed articles selected because the two models disagreed most sharply about them, so every percentage below is conditional on a disagreement already existing — not a measure of which model is better across the corpus.',
		title: 'Arbiter Verdict',
		subtitle: 'Blind evaluation by a third AI model (model identities hidden)',
		modelName: 'Gemini 3 Pro',
		verdict: 'Verdict',
		overallVerdict: 'Overall Verdict',
		confidenceLevel: 'Confidence Level',
		confidenceHigh: 'High',
		confidenceMedium: 'Medium',
		confidenceLow: 'Low',
		evaluationsNoun: 'evaluations',
		verdictsNoun: 'verdicts',
		preferredModel: 'Preferred Model',
		prefers: 'Prefers',
		prefersChatGPT: 'ChatGPT is more accurate',
		prefersGemini: 'Gemini is more accurate',
		prefersBoth: 'Both are equally accurate',
		prefersNeither: 'Neither is accurate',
		arbiterScore: 'Arbiter Score',
		arbiterJustification: 'Arbiter Justification',
		verdictExplanation: 'Why this preference',
		noArbiterData: 'No Arbiter Data',
		noArbiterDataDescription:
			'Arbiter evaluation is not available for this article. Run the arbiter evaluation script to generate verdicts.',
		polarityVerdict: 'Polarity Verdict',
		subjectivityVerdict: 'Subjectivity Verdict',
		centralityVerdict: 'Centrality Verdict',
		showArbiterVerdict: 'Show Arbiter Verdict',
		hideArbiterVerdict: 'Hide Arbiter Verdict',
		loadingArbiter: 'Loading arbiter data...',
		arbiterNotAvailable: 'Arbiter evaluation not available',
		runArbiterScript: 'Run arbiter-evaluation.py to generate evaluations',
		// Summary statistics
		summaryTitle: 'Arbiter Summary',
		articlesEvaluated: 'articles evaluated',
		chatgptPreferred: 'ChatGPT Preferred',
		geminiPreferred: 'Gemini Preferred',
		bothEqual: 'Both Equal',
		neitherAccurate: 'Neither Accurate',
		preferred: 'preferred',
		blindEvaluationNote: 'Blind evaluation: models were anonymized during evaluation',
		// Arbiter View page
		viewTitle: 'Arbiter Analysis',
		viewSubtitle: 'Explore model disagreements and third-party AI verdicts',
		overallStats: 'Overall Statistics',
		verdictDistribution: 'Verdict Distribution',
		verdictsByDimension: 'Verdicts by Dimension',
		confidenceDistribution: 'Confidence Distribution',
		totalVerdicts: 'Total Verdicts',
		modelPreference: 'Model Preference',
		agreementRate: 'Agreement Rate',
		dimension: 'Dimension',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		allDimensions: 'All Dimensions',
		modelAWins: 'Model A Wins',
		modelBWins: 'Model B Wins',
		ties: 'Ties',
		selectModelPair: 'Select Model Pair',
		noDataForPair: 'No arbiter data available for this model pair',
		runScript: 'Run the arbiter evaluation script to generate data',
		filterByDimension: 'Filter by Dimension',
		filterByConfidence: 'Filter by Confidence',
		// Methodology section
		methodologyTitle: 'Arbiter Methodology',
		methodologySubtitle: 'How the third-party AI judge evaluates model disagreements',
		blindEvaluation: 'Blind Evaluation',
		blindEvaluationDesc:
			'Model identities are hidden from the arbiter. It only sees "Model A" and "Model B".',
		highReasoning: 'High Reasoning Mode',
		highReasoningDesc: 'Gemini 3 Pro uses extended thinking for deeper analysis.',
		independentVerdict: 'Independent Verdict',
		independentVerdictDesc: 'The arbiter provides its own assessment before comparing models.',
		howItWorks: 'How It Works',
		selectionProcess: 'Article Selection',
		selectionProcessDesc:
			'Articles with significant disagreements (≥3 points difference on any dimension) between the two models are selected for arbitration.',
		blindAssignment: 'Blind Assignment',
		blindAssignmentDesc:
			'For each model pair, one model is randomly assigned as "Model A" and the other as "Model B". This assignment is consistent across all articles in the pair to ensure unbiased evaluation.',
		evaluationProcess: 'Evaluation Process',
		step1: 'The arbiter reads the full article text',
		step2: 'It provides its own independent scores for polarity, subjectivity, and centrality',
		step3: "It compares both models' analyses against its own assessment",
		step4: 'It determines which model is more accurate with detailed justifications',
		arbiterModel: 'Arbiter Model',
		arbiterRole: 'Third-Party Judge',
		geminiArbiterDesc:
			'Gemini 3 Pro is used as the arbiter with high reasoning level enabled. This allows for extended thinking and more nuanced analysis when comparing model outputs.',
		evaluationScales: 'Evaluation Scales',
		viewPrompt: 'View Prompt',
		promptExplanation:
			'The arbiter uses a carefully crafted system instruction and user prompt template to ensure consistent and thorough evaluation.',
		viewFullPrompt: 'View Full Prompt',
		arbiterPrompt: 'Arbiter Prompt',
		systemInstruction: 'System Instruction',
		userPromptTemplate: 'User Prompt Template',
		// Scale descriptions
		polarityVeryPositive: 'Extremely favorable, enthusiastic portrait',
		polarityPositive: 'Favorable, optimistic portrait',
		polarityNeutral: 'No clear sentiment or balance; factual tone',
		polarityNegative: 'Unfavorable, critical portrait',
		polarityVeryNegative: 'Extremely unfavorable, alarmist portrait',
		subjectivity1: 'Very Objective – purely informative',
		subjectivity2: 'Rather Objective – mainly factual',
		subjectivity3: 'Mixed – balanced facts and opinions',
		subjectivity4: 'Rather Subjective – clear opinions',
		subjectivity5: 'Very Subjective – heavily biased',
		centralityVeryCentral: 'Main subject of the article',
		centralityCentral: 'Important but shared with other subjects',
		centralitySecondary: 'Mentioned significantly but secondary',
		centralityMarginal: 'Briefly or anecdotally mentioned',
		centralityNotAddressed: 'No mention of Islam or Muslims',
		// Head-to-head comparison
		headToHead: 'Head-to-Head Comparison',
		excludingTies: '(excluding ties and neither)',
		wins: 'wins',
		// Evaluated articles table
		evaluatedArticles: 'Evaluated Articles',
		evaluatedArticlesSubtitle: 'Articles analyzed by the arbiter for disagreement resolution',
		viewArticleDetails: 'View article details',
		articleWithArbiter: 'Article with Arbiter Verdict',
		noEvaluatedArticles: 'No evaluated articles available',
		justification: 'Justification'
	},

	// Three-way arbiter (generation 2). A separate block from `arbiter` because
	// almost every string differs: three analyses instead of two, "multiple"
	// and "none" instead of "both"/"neither", spread instead of pairwise gap.
	arbiterV2: {
		viewTitle: 'Three-Way Arbiter',
		viewSubtitle:
			'One blind verdict per article, comparing all three generation-2 analyses at once',
		modelName: 'Claude Opus 5',
		arbiterRole: 'Third-Party Judge',
		samplingFrameNote:
			'The arbiter did not review the whole corpus. It reviewed articles selected because the three models disagreed most sharply about them, so every percentage below is conditional on a disagreement already existing — not a measure of which model is better across the corpus.',
		articlesEvaluated: 'articles evaluated',
		eligibleArticles: 'eligible',
		dimensionVerdicts: 'dimension verdicts',
		preferred: 'preferred',
		multiple: 'Several equivalent',
		none: 'None accurate',
		overallVerdicts: 'Overall verdicts',
		overallVerdictsNote: 'One verdict per article, across all three dimensions',
		byDimension: 'Verdicts by dimension',
		confidenceDistribution: 'Confidence distribution',
		blindLabel: 'Shown as',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		evaluatedArticles: 'Evaluated Articles',
		evaluatedArticlesSubtitle:
			'Every article the arbiter reviewed, widest disagreement first. Open a row for its reasoning.',
		spread: 'Spread',
		arbiterScore: 'Arbiter score',
		verdict: 'Verdict',
		confidence: 'Confidence',
		showReasoning: 'Show reasoning',
		hideReasoning: 'Hide reasoning',
		noData: 'No three-way arbiter data yet',
		noDataDescription:
			'The three-way arbiter run is paid and is triggered by hand. Run data-preprocess/arbiter-evaluation-v2.py --dry-run to see what it would cost, then again with --yes to publish verdicts here.',
		loading: 'Loading arbiter data…',
		// Methodology
		methodologyTitle: 'Three-Way Arbiter Methodology',
		methodologySubtitle: 'How one judge compares all three generation-2 analyses at once',
		blindEvaluation: 'Blind Evaluation',
		blindEvaluationDesc:
			'The three analyses are anonymised as A, B and C by one random permutation, fixed for the whole run.',
		selectionProcess: 'Article Selection',
		selectionProcessDesc:
			'An article qualifies when the three models are at least 3 points apart on any dimension — the highest score minus the lowest, not a pairwise gap. Articles where any model reports that the task does not apply are excluded rather than counted as a maximal disagreement.',
		fullText: 'Unmasked Article Text',
		fullTextDesc:
			'The arbiter reads the article from the private mirror, where the text is complete. The v1 arbiter read the public projection, which masks the text of a large share of rows, so some v1 verdicts were formed without the article.',
		independentVerdict: 'Independent Verdict',
		independentVerdictDesc: 'The arbiter scores the article itself before comparing the three.',
		reasoningEffort: 'Reasoning Effort',
		reasoningEffortDesc:
			'Claude Opus 5 thinks adaptively; the run sets an effort level rather than a token budget, which is also the cost lever.',
		howItWorks: 'How It Works',
		step1: 'The arbiter reads the full article text',
		step2: 'It scores polarity, subjectivity and centrality on its own',
		step3: 'It compares the three anonymised analyses against its own assessment',
		step4:
			'It names the most accurate analysis per dimension, or says several tie or none is right',
		arbiterModel: 'Arbiter Model',
		arbiterModelDesc:
			'Claude Opus 5 judges all three analyses in a single call, so its verdicts are internally consistent in a way three separate pairwise runs cannot be.',
		viewPrompt: 'View Prompt',
		promptExplanation:
			'The exact French system instruction and user prompt sent to the arbiter, verbatim.',
		viewFullPrompt: 'View Full Prompt',
		arbiterPrompt: 'Three-Way Arbiter Prompt',
		systemInstruction: 'System Instruction',
		userPromptTemplate: 'User Prompt Template'
	},

	// Extreme Analysis
	extremeAnalysis: {
		title: 'Lexical Extremes Analysis',
		subtitle: 'Explore keywords associated with extreme sentiments',
		analysisControls: 'Analysis Controls',
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
	},

	// SEO metadata (SEOHead.svelte) — per-view titles/descriptions/keywords
	meta: {
		siteTitle: 'IWAC Sentiment Analysis',
		comparisonTitle: 'AI Model Comparison',
		comparisonDescription:
			'Compare sentiment analysis results between the GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash models on the Islam West Africa Collection. Analyze differences in AI interpretation of media coverage.',
		comparisonKeywords:
			'AI comparison, GPT-5.6 Luna vs Mistral Small 4 vs DeepSeek, model comparison, sentiment analysis, IWAC, AI evaluation',
		viewDescriptionPrefix: 'Explore ',
		viewDescriptionSuffix:
			' from sentiment analysis of the Islam West Africa Collection. Interactive visualization of media coverage analysis using advanced AI models.',
		baseKeywords: 'sentiment analysis, IWAC, Islam West Africa, data visualization',
		ogImageAlt:
			'IWAC Sentiment Analysis — polarity distributions from GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash across 12,305 francophone West African press articles',
		views: {
			charts: {
				title: 'Charts & Distributions',
				description: 'sentiment distribution charts and polarity analysis',
				keywords: 'charts, polarity, sentiment distribution, bar charts, pie charts'
			},
			trends: {
				title: 'Temporal Trends',
				description: 'temporal evolution of sentiment trends over time',
				keywords: 'trends, temporal analysis, time series, evolution'
			},
			correlation: {
				title: 'Sentiment Distribution',
				description: 'cross-dimensional sentiment distribution analysis',
				keywords: 'correlation, cross-analysis, distribution, relationships'
			},
			volume: {
				title: 'Article Volume Analysis',
				description: 'article publication volume and geographic distribution',
				keywords: 'volume, geographic distribution, publication trends'
			},
			heatmap: {
				title: 'Centrality Heatmap',
				description: 'Islam centrality heatmap by country and year',
				keywords: 'heatmap, centrality, geographic analysis, visualization'
			},
			table: {
				title: 'Article Explorer',
				description: 'detailed article exploration with filtering capabilities',
				keywords: 'table, article explorer, filtering, search'
			},
			comparison: {
				title: 'Model Comparison',
				description: 'AI model comparison and discrepancy analysis',
				keywords: 'comparison, AI models, discrepancy, evaluation'
			},
			extremes: {
				title: 'Extreme Sentiment Analysis',
				description: 'the most extreme sentiment categories and their recurring keywords',
				keywords: 'extremes, keywords, outliers, sentiment categories'
			},
			arbiter: {
				title: 'Arbiter Evaluation',
				description: 'blind third-model arbitration of AI sentiment disagreements',
				keywords: 'arbiter, blind evaluation, model disagreement, verdicts'
			},
			default: {
				title: 'Data Visualization',
				description: 'interactive data visualization',
				keywords: 'visualization, analysis, research'
			}
		}
	}
};
