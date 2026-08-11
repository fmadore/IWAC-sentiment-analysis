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
		},

		// Three-way consensus section
		scopeLabel: 'Comparison scope',
		scopePair: 'Two models',
		scopeTrio: 'All three',
		consensusTitle: 'Where the three models disagree',
		consensusLede:
			'A pairwise view can show that two models differ; it cannot show that one stands apart from the other two. Everything below decomposes each article across all three at once, so a model’s calibration shows up as a signature rather than as noise.',
		unanimous: 'Unanimous',
		unanimousHelp: 'Share of articles where all three models chose the identical category.',
		majoritySplit: 'Two against one',
		majoritySplitHelp:
			'Share of articles where two models agreed and one stood apart. The charts below name which one.',
		allDiffer: 'All three differ',
		allDifferHelp:
			'Share of articles where no two models chose the same category — no majority exists to dissent from.',
		meanSpread: 'Mean spread',
		meanSpreadHelp:
			'Mean of (highest − lowest) across the three models, in scale positions. Zero is unanimity; the maximum is the full width of the scale.',
		declinedToggle: 'Declined ratings',
		declinedInclude: 'Included',
		declinedExclude: 'Excluded',
		declinedNote:
			'{count} articles are excluded because at least one model answered “Non applicable”. A refusal to rate sits below the bottom of the scale, so counting it as a rating makes a model that declined look like a model that disagreed — and it does so most on the titles whose articles are only marginally about Islam.',
		declinedIncludedNote:
			'Declined ratings are counted at the bottom of the scale. Titles with many of them will rank as highly disagreed, but what the models disagree about there is whether the article concerns Islam at all — not how favourable it is.',

		disagreementTitle: 'Newspapers ranked by model disagreement',
		disagreementSubtitle:
			'Mean three-way spread with 95% CI · titles with at least {min} rated articles',
		disagreementAxis: 'Scale positions between the highest and lowest model',
		disagreementNote:
			'The mirror of the Newspapers view: same titles, same threshold, but the axis is how far apart the models are rather than what they say. A title can be unremarkable in sentiment and an outlier in disagreement.',
		spread: 'Mean spread',
		unanimityRate: 'Unanimity',
		declinedShare: 'Declined ratings',
		medianYear: 'Median year',
		disagreementExcluded:
			'{count} newspapers omitted: fewer than {min} rated articles. Small titles read as more disagreed, so ranking them here would be misleading.',
		disagreementEmpty: 'No newspaper has at least {min} rated articles under the current filters.',

		dissentTitle: 'Who breaks ranks',
		dissentSubtitle: 'Every article decomposed into five mutually exclusive outcomes',
		dissentStacked: 'By newspaper',
		dissentTernary: 'Triangle',
		dissentTernaryNote:
			'One point per newspaper, positioned by which model most often stands alone there; a point at a corner means that model does all the dissenting, a point at the centre means the three share it evenly. Size is the article count. Titles with no two-against-one splits have no position and are not drawn.',
		dissentsAlone: 'dissents alone',
		dissentShare: 'Share of splits',

		directionTitle: 'Which way each model leans',
		directionSubtitle:
			'When a model stands alone, does it grade above the other two or below? Bars above the axis are higher, below are lower.',
		directionAbove: 'Grades higher',
		directionBelow: 'Grades lower',
		directionNote:
			'This is the clearest single statement the data makes about how these models differ. A model whose bars sit almost entirely on one side is not disagreeing at random — it is applying the scale differently.',

		flowTitle: 'Label flow across the three models',
		flowSubtitle: 'Each ribbon is a set of articles, tracked from one model’s label to the next',
		flowNote:
			'The three-way generalisation of the agreement matrix. A systematic offset appears as a mass of ribbons sliding down one band, and the routes a pairwise matrix hides — articles where the first and last model agree through a disagreeing middle one — become visible.',
		flowArticles: 'articles',

		scatterTitle: 'Is disagreement about extreme coverage or ambiguous coverage?',
		scatterSubtitle: 'One bubble per newspaper · sized by article count, coloured by country',
		scatterX: 'Consensus mean (the three models averaged)',
		scatterY: 'Mean three-way spread',
		scatterNote:
			'Correlation between the two axes: r = {r}. Near zero would mean disagreement is independent of how favourable a title’s coverage is; a strong value in either direction means the models argue hardest about one end of the scale, and the ranking above should be read with that in mind. It is not the same number in both analysis generations, or across the three dimensions.'
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
		matrixCaption: 'Cross-tabulation of the two models\u2019 labels',
		spread: 'Mean spread',
		unanimity: 'Unanimity',
		declined: 'Declined',
		medianYear: 'Median year',
		disagreementCaption:
			'Newspapers ranked by mean three-way spread, with confidence intervals, unanimity and declined share'
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

	// Analysis info. The card chrome only — everything a generation can
	// contradict (scales, run configuration, prompt) lives in analysisV1 /
	// analysisV2 below.
	analysis: {
		title: 'Analysis methodology',
		methodologyIntro:
			'This dashboard explores the potential of AI as a research partner for analyzing large corpora. The proliferation of digital archiving has produced vast collections that often exceed human processing capacity. Using "distant reading" (',
		/* Link text between the two halves of the intro; the citation is a link. */
		methodologyIntroCitation: 'Moretti 2000',
		methodologyIntroEnd:
			'), computational techniques can survey thousands of articles and reveal patterns that traditional methods would miss.',
		methodologyCorpus:
			'This experiment analyzes how Islam and Muslims are represented in West African newspapers. Instead of manually coding thousands of articles—which would introduce inconsistency—the entire corpus of',
		methodologyCorpusArticles: 'articles from the',
		methodologyCorpusDeveloper: ', a collaborative and open-access digital database developed by',
		/* The three model names that follow are rendered as links from the
		   contract registry, so the generation on screen names its own panel. */
		methodologyCorpusEnd: ', was analyzed using three LLMs:',
		methodologyCorpusDimensions:
			'Each article was evaluated according to three complementary dimensions:',
		methodologyAiModel: 'Methodology and AI model',
		modelUsed: 'Model used',
		technicalConfiguration: 'Technical configuration',
		analysisPrompt: 'Analysis prompt',
		promptDescription: 'The model receives a specialized prompt that:',
		viewFullPrompt: 'View full prompt',
		limitationsTitle: 'Limitations and precautions',
		limitationsDescription:
			'This automated analysis constitutes a research assistance tool. Results may require human validation for complex or ambiguous cases. The justifications provided by the AI allow evaluation of the relevance of each classification.',
		polaritySection: 'Sentiment polarity',
		subjectivitySection: 'Subjectivity',
		centralitySection: 'Islam/Muslims centrality'
	},

	/**
	 * Archived generation (v1). Its prompt defined the scales differently and
	 * its run configuration differs on every line, so the archive keeps its own
	 * copy: describing January 2026 scores with the August wording would
	 * misattribute them.
	 */
	analysisV1: {
		config: [
			'Corpus run: January–February 2026',
			'No reasoning or thinking parameter — the models ran without one, and thinking_level postdates this campaign',
			'Temperature: 0.2 for Gemini 3 Flash preview and Ministral 14B; GPT-5 mini ran at the API default',
			'Ministral 14B alone capped output at 512 tokens, so its longest justifications could be truncated',
			'Output format: structured JSON validated against a Pydantic schema',
			'Cache system to avoid redundant analyses',
			'Automatic error handling with multiple attempts'
		],
		promptFeatures: [
			'Defines the role of sentiment analysis expert for Francophone West Africa',
			'Specifies evaluation criteria for each dimension (polarity, subjectivity, centrality)',
			'Asks the model to open with a checklist of 3 to 7 conceptual steps',
			'Requests a justification in French for each classification',
			'Imposes a structured JSON output format to ensure consistency'
		],
		polarityDescription:
			'Evaluates the general sentiment expressed in the article towards Islam and/or Muslims, or concerning their representation.',
		polarityVeryPositive: 'Extremely favorable, enthusiastic, praising portrait of Islam/Muslims',
		polarityPositive: 'Favorable, optimistic portrait of Islam/Muslims',
		polarityNeutral:
			'No clear sentiment towards Islam/Muslims or balance between positive and negative aspects in their representation; factual tone without marked emotional charge towards them',
		polarityNegative: 'Unfavorable, critical, pessimistic portrait of Islam/Muslims',
		polarityVeryNegative:
			'Extremely unfavorable, alarmist, very critical portrait of Islam/Muslims',
		polarityNotApplicable: 'The article does not deal with Islam or Muslims',
		subjectivityDescription:
			'Measures the degree of objectivity/subjectivity of the article in its way of representing Islam and/or Muslims, on a scale from 1 (very objective) to 5 (very subjective).',
		subjectivity1:
			'Reports verifiable facts about Islam/Muslims without expressing personal opinions or feelings about them, purely informative style on this theme',
		subjectivity2:
			'Mainly factual concerning Islam/Muslims, but may contain subtle traces of opinions or word choices suggesting a limited perspective on this theme',
		subjectivity3:
			'Contains a balanced mix of facts and personal opinions/feelings concerning Islam/Muslims, or presents multiple viewpoints on this theme',
		subjectivity4:
			'Clearly expresses opinions, feelings, or judgments about Islam/Muslims, even if based on some facts to support them',
		subjectivity5:
			'Heavily biased in its representation of Islam/Muslims, expresses intense opinions and emotions about them, with little or no objective presentation of facts, editorial or opinion piece style on this theme',
		centralityDescription:
			'Evaluates the importance given to themes related to Islam and Muslims in the article.',
		centralityVeryCentral: 'Islam/Muslims constitute the main subject of the article',
		centralityCentral: 'Important theme but shared with other subjects',
		centralitySecondary: 'Mentioned significantly but secondarily',
		centralityMarginal: 'Briefly or anecdotally mentioned',
		centralityNotAddressed: 'No mention of Islam or Muslims'
	},

	/**
	 * Current generation (v2). The scale wording is the prompt's own, and the
	 * notes are its prose boundary rules — the part that most changes how an
	 * article is coded, and the part a reader cannot infer from the labels.
	 * Upstream: iwac-ai-pipelines/AI_sentiment_analysis/sentiment_prompt.md
	 */
	analysisV2: {
		config: [
			'Corpus run: 3–5 August 2026',
			'Reasoning effort: medium for GPT-5.6 Luna; high for Mistral Small 4 and DeepSeek v4 Flash, whose APIs offer no middle setting',
			'Temperature: not set by the pipeline — each model runs at its vendor default',
			'Output format: structured JSON validated against a Pydantic schema',
			'Resumable cache holding one record per (article, model); only successful calls are cached',
			'Error handling: three attempts per call with backoff, under a per-model timeout',
			'Prompt fingerprint d14ace9ac192, recorded with every cached result'
		],
		promptFeatures: [
			'Defines the role of an expert analyst of representations of Islam and Muslims in the Francophone West African press',
			'Defines each scale step and states that the intermediate steps are answers in their own right, not fallbacks',
			'Adds boundary rules for the recurring ambiguous cases: a Muslim actor in a secular story, cooperation with Arab states, armed groups, and reported speech',
			'Requires a justification in French, one or two sentences, citing something concrete from the text',
			'Asks for subjectivity as a label rather than a number, and imposes a structured JSON output',
			'Carries no worked examples: an August 2026 A/B comparison showed they pulled the label distribution towards the examples themselves'
		],
		polarityDescription:
			'The sentiment the article expresses towards Islam or Muslims — its own framing, vocabulary and handling of sources, not the opinions of the people it quotes.',
		polarityVeryPositive: 'An extremely favorable, laudatory, enthusiastic portrayal',
		polarityPositive: 'A favorable, well-disposed, optimistic portrayal',
		polarityNeutral:
			'No marked sentiment, or a balance between favorable and unfavorable aspects; factual tone',
		polarityNegative: 'An unfavorable, critical, pessimistic portrayal',
		polarityVeryNegative: 'An extremely unfavorable, alarmist, hostile portrayal',
		polarityNotApplicable: 'The article does not deal with Islam or Muslims',
		polarityNotes: [
			'Neutral reporting is the ordinary case in news journalism: an article that reports facts without commenting on them is neutral, even when those facts are favorable or unfavorable in themselves.',
			'Reported speech: an article that reports hostile statements with attribution, distance and counterpoint is neutral; it becomes negative if it takes up that framing as its own.',
			'Negative facts are not negative polarity: the factual reporting of an attack is neutral unless the article extends responsibility to Muslims in general.'
		],
		subjectivityDescription:
			"The degree of the article's own commitment on the theme of Islam and Muslims, regardless of whether the treatment is favorable. This generation asked for the label; the 1–5 rank is kept for the ordinal statistics.",
		subjectivity1:
			'Verifiable facts, no opinion or mark of appraisal on this theme; informative style',
		subjectivity2:
			'Essentially factual, with subtle traces of appraisal (word choice, angle) on this theme',
		subjectivity3:
			'A balanced mix of facts and opinions, or a plurality of viewpoints reported on this theme',
		subjectivity4:
			'Explicit opinions, feelings or judgments on this theme, even when supported by facts',
		subjectivity5:
			'Marked bias, intense emotions or judgments, little factual material; editorial, op-ed or opinion piece',
		subjectivityNotes: [
			'Opinions quoted and attributed to a third party do not make the article subjective — reporting them is journalistic work. What does is the article taking them on as its own.',
			'An article that is violently hostile but written in a factual tone remains low in subjectivity.'
		],
		centralityDescription:
			'The importance the article gives to themes related to Islam and Muslims.',
		centralityVeryCentral: 'Islam or Muslims are the main subject',
		centralityCentral: 'An important theme, shared with other subjects',
		centralitySecondary: 'Mentioned significantly, but subordinate to another subject',
		centralityMarginal: 'Mentioned briefly, anecdotally or incidentally',
		centralityNotAddressed: 'No mention of Islam or Muslims',
		centralityNotes: [
			'A person\'s religious affiliation does not make an article religious: a Muslim minister presenting a budget is "not addressed" unless the article makes something of their faith.',
			'Institutions and practices count — mosque, imam, medersa, Islamic association, Ramadan, hajj, Tabaski, preaching — even when the word "Islam" is absent.',
			'Cooperation with Arab states or Islamic organizations (Libya, Saudi Arabia, Kuwait, Iran, the OIC, ISESCO, the Islamic Development Bank) is at least marginal, even when the surface topic is a loan or a hospital.',
			'An armed group claiming to act in the name of Islam is central, or very central when the article is about the group itself. High centrality presumes nothing about polarity.'
		]
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
