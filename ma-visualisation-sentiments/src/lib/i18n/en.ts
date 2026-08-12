/**
 * English catalog — the source of truth for the `Translations` type
 * (types.ts derives it via `typeof en`). Do not annotate this object with
 * `Translations`; that would be circular. fr.ts is annotated instead, which
 * is what enforces EN/FR key parity at compile time.
 *
 * House style for this catalogue: British English, sentence case for headings
 * and labels, typographic apostrophes and quotation marks, en dashes for
 * ranges (1–5), em dashes used sparingly.
 */
export const en = {
	// App header and branding
	appTitle: 'IWAC Sentiment Analysis',
	appSubtitle: 'Islam West Africa Collection – data visualisation and exploration',
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
		extremes: 'Extremes',
		arbiter: 'Arbiter'
	},

	/* The eyebrow rule under each view title: "Model · X · Sample · N articles".
	   Assembled in ViewContent from these two words plus `common.of` and
	   `common.articles`. */
	viewMeta: {
		model: 'Model',
		sample: 'Sample'
	},

	// Filters
	filters: {
		title: 'Filters',
		country: 'Country',
		journal: 'Newspaper',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		clearAll: 'Clear all',
		clearAllFilters: 'Clear all filters',
		searchJournals: 'Search newspapers…',
		showingJournals: 'Showing',
		of: 'of',
		selectedCountries: 'Selected countries',
		selectedJournals: 'Selected newspapers',
		selectedPolarities: 'Selected polarities',
		selectedCentralities: 'Selected centrality levels',
		subjectivityScore: 'Subjectivity score',
		ratherObjective: 'Rather objective',
		mixedSubjectivity: 'Mixed',
		ratherVerySubjective: 'Rather or very subjective',
		averageCentrality: 'Average centrality',
		level: 'Level',
		veryObjectiveScore: 'Very objective',
		ratherObjectiveScore: 'Rather objective',
		mixedScore: 'Mixed',
		ratherSubjectiveScore: 'Rather subjective',
		verySubjectiveScore: 'Very subjective',
		numberOfArticles: 'Number of articles',
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
			'Newspapers ranked by their average rating on the dimension you choose. The 95% confidence interval shows how far that average might move if the sample were drawn again, so titles with few rated articles carry wide intervals and a high average from a small sample is a weak result.',
		chartTitle: 'Newspapers ranked',
		chartSubtitle: 'Mean with 95% CI · titles with at least {min} rated articles',
		netPolarity: 'Net polarity',
		meanSubjectivity: 'Mean subjectivity',
		meanCentrality: 'Mean centrality',
		confidenceInterval: '95% CI',
		neutralLine: 'neutral',
		excludedNote:
			'{count} newspapers left out: fewer than {min} rated articles. Their averages would be too uncertain to rank.',
		noneAboveThreshold: 'No newspaper has at least {min} rated articles under the current filters.'
	},

	// Place map
	map: {
		title: 'Map',
		subtitle:
			'The places the articles name. One bubble per place, sized by the number of articles that mention it and coloured by the dimension you choose.',
		articlesMentioning: 'articles mentioning this place',
		meanOf: 'Mean {dimension}',
		scoredArticles: 'Rated articles',
		legendSizeTitle: 'Articles mentioning',
		legendColorTitle: 'Mean {dimension}',
		legendUnscored: 'Not rated',
		caveat:
			'A bubble counts articles that mention a place, not articles about it. Each article names about four places, so these totals add up to more than the number of articles. Colour is the rating the model gave the whole article on a 1–5 scale, averaged over the articles it actually rated on that dimension. For polarity, “Not applicable” means the article takes no position: it is left out of the average but still counts towards the size of the bubble. For centrality, “Not addressed” is a real bottom of the scale and is included. Places with no coordinates in the IWAC place list do not appear.',
		noPlacesTitle: 'No mapped places',
		noPlacesLede: 'No article in the current selection names a place with known coordinates.',
		loadErrorTitle: 'Map data unavailable'
	},

	// Hijri-calendar seasonality
	seasonality: {
		title: 'Seasonality',
		subtitle:
			'Coverage across the Islamic lunar calendar. The Hijri year is about eleven days shorter than the Gregorian one, so a religious observance moves slowly through all twelve Gregorian months and this pattern cannot be seen in any view organised by year or month.',
		chartTitle: 'Coverage by Hijri month',
		chartSubtitle: 'Article volume and mean centrality across the lunar year',
		cycleLayout: 'Cycle',
		coverageIndex: 'Coverage index',
		calendarNote:
			'Dates converted with the tabular (arithmetic) Islamic calendar, civil epoch. This can differ by a day or two from the dates announced locally, which is accurate enough for monthly totals but not for dating a particular observance.',
		undatedNote: '{count} articles left out: no full publication date.',
		months: {
			muharram: 'Muharram',
			safar: 'Safar',
			rabiI: 'Rabi I',
			rabiII: 'Rabi II',
			jumadaI: 'Jumada I',
			jumadaII: 'Jumada II',
			rajab: 'Rajab',
			shaban: 'Sha’ban',
			ramadan: 'Ramadan',
			shawwal: 'Shawwal',
			dhuAlQadah: 'Dhu al-Qa’dah',
			dhuAlHijjah: 'Dhu al-Hijjah'
		}
	},

	// Agreement / calibration
	agreement: {
		title: 'Agreement',
		subtitle:
			'How the models relate to one another: where they converge, where they diverge, and whether a disagreement is a systematic offset or a genuine conflict.',
		dimensionSelector: 'Analysis dimension',
		exactAgreement: 'Exact agreement',
		exactAgreementHelp:
			'Share of articles where both models chose the identical category. Not corrected for the agreement two models would reach by chance alone.',
		adjacentAgreement: 'Within one step',
		adjacentDetail: 'Identical or one category apart',
		adjacentAgreementHelp:
			'Share of articles where the two labels are identical or exactly one position apart on the scale.',
		articlesCompared: 'articles compared',
		kappa: 'Cohen’s κ',
		kappaHelp:
			'Agreement corrected for chance. 0 means no better than chance; 1 means perfect. It treats every disagreement as equally severe, so two models that rank articles the same way but sit one category apart still score poorly.',
		weightedKappa: 'Weighted κ',
		weightedKappaHelp:
			'Quadratic-weighted kappa. Being one category off costs far less than being four off, which suits scales whose categories run in order. A weighted score much higher than the unweighted one means the models mostly rank alike but calibrate differently.',
		fleissKappa: 'Fleiss’ κ',
		fleissHelp: 'Fleiss’ kappa across all three models at once, over articles every model rated.',
		threeWayTitle: 'All three models',
		threeWayLede:
			'Agreement across all three models of the selected analysis at once, dimension by dimension. Only articles that all three rated are counted.',
		matrixTitle: 'Agreement matrix',
		rowsAre: 'Rows:',
		columnsAre: 'Columns:',
		ofRow: 'Of this row',
		calibrationTitle: 'Model calibration',
		calibrationSubtitle: 'How often each model uses each point on the scale',
		systematicOffsetNote:
			'Weighted agreement is far higher than unweighted agreement here. That is the signature of a systematic offset rather than a genuine conflict: {modelA} and {modelB} rank articles similarly but draw the boundaries between categories in different places, so most of their disagreement amounts to a single step on the scale.',
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
			'A pairwise view can show that two models differ; it cannot show that one of them stands apart from the other two. Everything below breaks each article down across all three at once, so a model that applies the scale differently from its peers shows up as a consistent pattern.',
		unanimous: 'Unanimous',
		unanimousHelp: 'Share of articles where all three models chose the identical category.',
		majoritySplit: 'Two against one',
		majoritySplitHelp:
			'Share of articles where two models agreed and one stood apart. The charts below name which one.',
		allDiffer: 'All three differ',
		allDifferHelp:
			'Share of articles where no two models chose the same category, so there is no majority to dissent from.',
		meanSpread: 'Mean spread',
		meanSpreadHelp:
			'Mean of (highest − lowest) across the three models, counted in steps on the scale. Zero is unanimity; the maximum is the full width of the scale.',
		declinedToggle: 'Declined ratings',
		declinedInclude: 'Included',
		declinedExclude: 'Excluded',
		declinedNote:
			'{count} articles are left out because at least one model answered “Non applicable”. A refusal to rate sits below the bottom of the scale, so counting it as a rating makes a model that declined look like a model that disagreed. The effect is strongest on the titles whose articles are only marginally about Islam.',
		declinedIncludedNote:
			'Declined ratings are counted at the bottom of the scale. Titles with many of them will rank as highly disagreed, but the disagreement there is about whether the article concerns Islam at all, rather than about how favourable it is.',

		disagreementTitle: 'Newspapers ranked by model disagreement',
		disagreementSubtitle:
			'Mean three-way spread with 95% CI · titles with at least {min} rated articles',
		disagreementAxis: 'Steps on the scale between the highest and lowest model',
		disagreementNote:
			'The mirror of the Newspapers view: same titles, same threshold, but the axis measures how far apart the models are rather than what they say. A title can be unremarkable in sentiment and an outlier in disagreement.',
		spread: 'Mean spread',
		unanimityRate: 'Unanimity',
		declinedShare: 'Declined ratings',
		medianYear: 'Median year',
		disagreementExcluded:
			'{count} newspapers left out: fewer than {min} rated articles. Small titles read as more disagreed, so ranking them here would mislead.',
		disagreementEmpty: 'No newspaper has at least {min} rated articles under the current filters.',

		dissentTitle: 'Who breaks ranks',
		dissentSubtitle: 'Every article sorted into one of five outcomes',
		dissentStacked: 'By newspaper',
		dissentTernary: 'Triangle',
		dissentTernaryNote:
			'One point per newspaper, placed according to which model most often stands alone there. A point at a corner means that model does all the dissenting; a point at the centre means the three share it evenly. Size is the article count. Titles with no two-against-one splits have no position and are not drawn.',
		dissentsAlone: 'dissents alone',
		dissentShare: 'Share of splits',

		directionTitle: 'Which way each model leans',
		directionSubtitle:
			'When a model stands alone, does it grade above the other two or below? Bars above the axis are higher, below are lower.',
		directionAbove: 'Grades higher',
		directionBelow: 'Grades lower',
		directionNote:
			'This is the clearest single statement the data makes about how these models differ. A model whose bars sit almost entirely on one side is applying the scale differently from the other two, consistently and in one direction.',

		flowTitle: 'Label flow across the three models',
		flowNote:
			'The agreement matrix extended to three models. A systematic offset appears as a mass of ribbons sliding down one band, and the routes a pairwise matrix hides — articles where the first and last model agree by way of a disagreeing middle one — become visible.',
		flowArticles: 'articles',

		scatterTitle: 'Is disagreement about extreme coverage or ambiguous coverage?',
		scatterSubtitle: 'One bubble per newspaper · sized by article count, coloured by country',
		scatterX: 'Consensus mean (the three models averaged)',
		scatterY: 'Mean three-way spread',
		scatterNote:
			'Correlation between the two axes: r = {r}. A value near zero would mean disagreement is independent of how favourable a title’s coverage is; a strong value in either direction means the models argue hardest about one end of the scale, and the ranking above should be read with that in mind. The value differs between the two analysis generations and between the three dimensions.'
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
		matrixCaption: 'Cross-tabulation of the two models’ labels',
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
		volumeByCountry: 'Article volume by country',
		centralityHeatmap: 'Centrality heatmap',
		articlesAnalyzed: 'articles analysed',
		globalDistribution: 'Overall distribution',
		byJournal: 'by newspaper',
		byYear: 'by year',
		stackedAreas: 'Stacked areas',
		lines: 'Lines',
		bars: 'Bars',
		countMode: 'Count',
		shareMode: 'Share',
		pie: 'Pie chart',
		polaritySubjectivityDistribution: 'Polarity × subjectivity distribution',
		subtitle: 'How the corpus spreads across the polarity and subjectivity scales.'
	},

	// Trends view
	trends: {
		subtitle: 'How the ratings change over the years, for the corpus and for each newspaper.'
	},

	// Volume view
	volume: {
		subtitle: 'How many articles the corpus holds, year by year and country by country.'
	},

	// Heatmap view
	heatmap: {
		subtitle:
			'How central Islam and Muslims are to the coverage, country by country and year by year. Darker cells mean the theme sits closer to the centre of the articles published that year.'
	},

	// Correlation/Distribution view
	correlation: {
		subtitle: 'How the polarity and subjectivity ratings relate to each other.',
		spearman: 'Spearman’s ρ',
		strengthLabel: 'Strength',
		rhoNote:
			'Rank correlation between polarity and subjectivity. Both scales run in order rather than in measured units, so the calculation uses ranks rather than the coded values. Articles the model marked Not applicable are left out.',
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
		viewDetails: 'View details',
		sortBy: 'Sort by',
		itemsPerPage: 'Items per page',
		showingItems: 'Showing',
		noFilteredArticles: 'No articles match the selected filters',
		articleTitle: 'Title',
		subtitle: 'Browse every article, with its three ratings and the reason the model gave for each.'
	},

	// Article details
	article: {
		metadata: 'Metadata',
		analysis: 'Sentiment analysis',
		polarityJustification: 'Reason for the polarity rating',
		subjectivityJustification: 'Reason for the subjectivity rating',
		centralityJustification: 'Reason for the centrality rating',
		close: 'Close',
		titleNotAvailable: 'Title not available',
		publicationDate: 'Publication date',
		linkToFullArticle: 'Link to full article',
		consultOriginalArticle: 'View original article →',
		noAnalysisData: 'No sentiment ratings are available for this article.',
		noArticleSelected: 'No article selected',
		selectArticlePrompt: 'Select an article from the table to see its ratings.',
		justification: 'Reason given'
	},

	// Analysis info. The card chrome only — everything a generation can
	// contradict (scales, run configuration, prompt) lives in analysisV1 /
	// analysisV2 below.
	analysis: {
		title: 'Analysis methodology',
		methodologyIntro:
			'This dashboard asks what large language models can and cannot do when they are set to read a research corpus. Digitisation has produced collections far larger than any researcher can work through article by article. Franco Moretti called the alternative “distant reading” (',
		/* Link text between the two halves of the intro; the citation is a link. */
		methodologyIntroCitation: 'Moretti 2000',
		methodologyIntroEnd:
			'): analysing thousands of texts at once to find patterns that reading them one by one would be unlikely to surface.',
		methodologyCorpus:
			'The subject here is how the West African press portrays Islam and Muslims. Coding thousands of articles by hand is slow and hard to keep consistent, so the whole corpus of',
		methodologyCorpusArticles: 'articles from the',
		methodologyCorpusDeveloper: ', a collaborative, open-access digital database built by',
		/* The three model names that follow are rendered as links from the
		   contract registry, so the generation on screen names its own panel. */
		methodologyCorpusEnd: ', was put through three large language models:',
		methodologyCorpusDimensions: 'Each model rated every article on three dimensions:',
		methodologyAiModel: 'Method and models',
		modelUsed: 'Models',
		technicalConfiguration: 'Run configuration',
		analysisPrompt: 'Analysis prompt',
		promptDescription: 'The model receives one set of written instructions, which:',
		viewFullPrompt: 'View full prompt',
		limitationsTitle: 'Limitations',
		limitationsDescription:
			'These ratings are a research aid rather than a finished result. Ambiguous or complex articles still need a human reader, and the models disagree with one another often enough that no single rating should be treated as settled. Every rating comes with the model’s own reason for it, so you can judge whether it holds.',
		polaritySection: 'Sentiment polarity',
		subjectivitySection: 'Subjectivity',
		centralitySection: 'Centrality of Islam and Muslims'
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
			'Reasoning effort: not set — the models ran without one, and the thinking_level parameter postdates this campaign',
			'Temperature: 0.2 for Gemini 3 Flash preview and Ministral 14B; GPT-5 mini ran at the API default',
			'Ministral 14B alone capped its output at 512 tokens, so its longest reasons could be cut off',
			'Output format: structured JSON validated against a Pydantic schema',
			'A cache, to avoid repeating an analysis already made',
			'Automatic retries when a call failed'
		],
		promptFeatures: [
			'Casts the model as an expert in sentiment analysis for Francophone West Africa',
			'Sets out what to look for on each dimension (polarity, subjectivity, centrality)',
			'Asks the model to open with a checklist of 3 to 7 conceptual steps',
			'Asks for a reason in French for each rating',
			'Requires structured JSON output, so that every answer has the same shape'
		],
		polarityDescription:
			'The overall sentiment the article expresses towards Islam and Muslims, or towards the way they are represented.',
		polarityVeryPositive: 'An extremely favourable, enthusiastic, admiring portrayal',
		polarityPositive: 'A favourable, optimistic portrayal',
		polarityNeutral:
			'No clear sentiment towards Islam or Muslims, or a balance between favourable and unfavourable aspects; a factual tone with no marked emotional charge',
		polarityNegative: 'An unfavourable, critical, pessimistic portrayal',
		polarityVeryNegative: 'An extremely unfavourable, alarmist, very critical portrayal',
		polarityNotApplicable: 'The article does not deal with Islam or Muslims',
		subjectivityDescription:
			'How objective or subjective the article is in the way it represents Islam and Muslims, on a scale from 1 (very objective) to 5 (very subjective).',
		subjectivity1:
			'Reports verifiable facts about Islam and Muslims without expressing personal opinions or feelings about them; a purely informative style on this theme',
		subjectivity2:
			'Mainly factual, but may carry subtle traces of opinion, or word choices that suggest a particular perspective on this theme',
		subjectivity3:
			'A balanced mix of facts and personal opinions, or several viewpoints reported on this theme',
		subjectivity4:
			'Clearly expresses opinions, feelings or judgements about Islam and Muslims, even where facts are offered in support',
		subjectivity5:
			'Heavily biased in the way it represents Islam and Muslims, with intense opinions and emotions and little or no factual material; an editorial or opinion piece on this theme',
		centralityDescription:
			'How much weight the article gives to themes related to Islam and Muslims.',
		centralityVeryCentral: 'Islam or Muslims are the main subject of the article',
		centralityCentral: 'An important theme, but shared with other subjects',
		centralitySecondary: 'Mentioned significantly, but not as the main subject',
		centralityMarginal: 'Mentioned briefly or in passing',
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
			'A resumable cache holding one record per article and model; only successful calls are kept',
			'Error handling: up to three attempts per call, with a growing wait between them and a time limit per model',
			'Prompt fingerprint d14ace9ac192, recorded with every cached result'
		],
		promptFeatures: [
			'Casts the model as an expert on representations of Islam and Muslims in the Francophone West African press',
			'Defines every step of each scale, and states that the middle steps are answers in their own right rather than fallbacks',
			'Adds boundary rules for the ambiguous cases that recur: a Muslim figure in a secular story, cooperation with Arab states, armed groups, and reported speech',
			'Asks for a reason in French, one or two sentences long, citing something concrete from the text',
			'Asks for subjectivity as a label rather than a number, and requires structured JSON output',
			'Carries no worked examples: an A/B comparison in August 2026 showed that they pulled the models’ answers towards whatever the examples themselves used'
		],
		polarityDescription:
			'The sentiment the article itself expresses towards Islam or Muslims, judged from its framing, its vocabulary and its handling of sources rather than from the opinions of the people it quotes.',
		polarityVeryPositive: 'An extremely favourable, laudatory, enthusiastic portrayal',
		polarityPositive: 'A favourable, well-disposed, optimistic portrayal',
		polarityNeutral:
			'No marked sentiment, or a balance between favourable and unfavourable aspects; a factual tone',
		polarityNegative: 'An unfavourable, critical, pessimistic portrayal',
		polarityVeryNegative: 'An extremely unfavourable, alarmist, hostile portrayal',
		polarityNotApplicable: 'The article does not deal with Islam or Muslims',
		polarityNotes: [
			'Neutral reporting is the ordinary case in news journalism: an article that reports facts without commenting on them is neutral, even when those facts are favourable or unfavourable in themselves.',
			'Reported speech: an article that reports hostile statements with attribution, distance and counterpoint is neutral. It becomes negative when it takes up that framing as its own.',
			'Negative facts do not make negative polarity: factual reporting of an attack is neutral unless the article extends responsibility to Muslims in general.'
		],
		subjectivityDescription:
			'How far the article commits itself on the subject of Islam and Muslims, regardless of whether its treatment is favourable. This generation asked the models for a label; the 1–5 rank is kept for the statistics, which need an ordered scale.',
		subjectivity1:
			'Verifiable facts, with no opinion or mark of appraisal on this theme; an informative style',
		subjectivity2:
			'Essentially factual, with subtle traces of appraisal on this theme in word choice or angle',
		subjectivity3:
			'A balanced mix of facts and opinions, or several viewpoints reported on this theme',
		subjectivity4:
			'Explicit opinions, feelings or judgements on this theme, even where facts are offered in support',
		subjectivity5:
			'Marked bias, intense emotions or judgements, little factual material; an editorial, op-ed or opinion piece',
		subjectivityNotes: [
			'Opinions quoted and attributed to someone else do not make the article subjective, since reporting them is journalistic work. What does is the article taking them on as its own.',
			'An article that is violently hostile but written in a factual tone still counts as low in subjectivity.'
		],
		centralityDescription: 'How much weight the article gives to Islam and Muslims.',
		centralityVeryCentral: 'Islam or Muslims are the main subject',
		centralityCentral: 'An important theme, shared with other subjects',
		centralitySecondary: 'Mentioned significantly, but subordinate to another subject',
		centralityMarginal: 'Mentioned briefly, in passing or by the way',
		centralityNotAddressed: 'No mention of Islam or Muslims',
		centralityNotes: [
			'A person’s religious affiliation does not make an article religious: a Muslim minister presenting a budget is “Not addressed” unless the article makes something of their faith.',
			'Institutions and practices count — mosque, imam, medersa, Islamic association, Ramadan, hajj, Tabaski, preaching — even when the word “Islam” never appears.',
			'Cooperation with Arab states or Islamic organisations (Libya, Saudi Arabia, Kuwait, Iran, the OIC, ISESCO, the Islamic Development Bank) is at least marginal, even when the surface topic is a loan or a hospital.',
			'An armed group claiming to act in the name of Islam is central, or very central when the article is about the group itself. High centrality says nothing about polarity.'
		]
	},

	// Loading and messages
	messages: {
		loading: 'Loading…',
		loadingData: 'Loading the IWAC corpus…',
		noData: 'No data available',
		error: 'An error occurred',
		dataLoadError: 'The corpus data could not be loaded, or it did not match the expected format.',
		retry: 'Retry'
	},

	// Export
	export: {
		exportCSV: 'Export CSV',
		downloadCSV: 'Download data as CSV',
		exporting: 'Exporting',
		noDataToExport: 'No data to export',
		exportError: 'Error exporting data',
		polarityJustification: 'Reason for the polarity rating',
		subjectivityJustification: 'Reason for the subjectivity rating',
		centralityJustification: 'Reason for the centrality rating',
		articleId: 'Article ID'
	},

	// Common
	common: {
		yes: 'Yes',
		no: 'No',
		close: 'Close',
		save: 'Save',
		delete: 'Delete',
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
		viewLess: 'Back to list',
		previous: 'Previous',
		next: 'Next',
		sortBy: 'Sort by',
		of: 'of',
		tableView: 'Table',
		cardView: 'Cards'
	},

	// Datasets
	datasets: {
		selectModel: 'Select model',
		availableModels: 'Available models',
		comparisonMode: 'Comparison mode',
		compareModels: 'Compare models'
	},

	// Analysis generations (current v2 panel vs archived v1 panel)
	generations: {
		archivedLabel: 'Archived analysis',
		archivedTitle: 'You are viewing the archived 2026 analysis (v1).',
		archivedDescription:
			'GPT-5 mini, Gemini 3 Flash preview and Ministral 14B, rated under the first prompt. Kept online so that published figures and citations stay reproducible.',
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
			'Mean difference per article, grouped by decade or by country. Groups with fewer than 20 compared articles are left out, because their averages would swing on a handful of cases.',
		subtitle:
			'Set two models side by side and read the articles they rate differently. The rating tells you what a model saw; the gap between two models tells you how much that reading depends on the model.',
		filterByDiscrepancy: 'Filter by difference',
		differenceRange: 'Difference range',
		quickFilters: 'Quick filters',
		pointDifference: 'point difference',
		pointsDifference: 'points difference',
		compareDimensions: 'Compare dimensions',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		totalDiscrepancy: 'Total difference',
		totalDiscrepancies: 'Articles that differ',
		articlesWithDifferences: 'On at least one dimension',
		averageDiscrepancy: 'Average difference',
		pointsPerArticle: 'Scale steps per article',
		totalArticles: 'Total articles',
		articlesAnalyzed: 'Articles compared',
		highConflicts: 'Sharp disagreements',
		significantDifferences: 'Three or more steps apart',
		significantDifferencesExplanation:
			'Articles where the two models are at least 3 steps apart on polarity, subjectivity or centrality. On scales this short, a gap that wide means the two readings have little in common.',
		totalDiscrepanciesExplanation:
			'Number of articles the two models rated differently on at least one dimension, by any margin.',
		averageDiscrepancyExplanation:
			'The average gap between the two models per article, added up across the three dimensions (polarity + subjectivity + centrality) and counted in steps on the scale.',
		breakdownByDimension: 'Breakdown by dimension',
		enableComparisonMode: 'Enable comparison mode',
		enableComparisonDescription:
			'Use the model picker in the header to choose the two models you want to set side by side.',
		noDiscrepancies: 'No differences found',
		adjustFilters: 'Try widening the filters to see articles the two models rate differently.',
		excludeNonApplicable: 'Exclude “Not applicable” articles',
		excludeNonApplicableDescription:
			'Hide articles where one model rated centrality “Not applicable”. These produce very large gaps that say more about the shape of the scale than about the models.',
		dimensionsExplanation: 'Choose which dimensions count towards the difference score:',
		polarityExplanation: 'Differences in how favourable the coverage is',
		subjectivityExplanation: 'Differences on the 1–5 objectivity scale',
		centralityExplanation: 'Differences in how central Islam and Muslims are to the article',
		dimensionsNote:
			'Tip: choose a single dimension to isolate one kind of disagreement. The difference scores are recalculated from your selection.',
		// Model pair picker. Pair labels are built from the model names in the
		// contract registry, so only the joining word is translated.
		selectModelPair: 'Select models to compare',
		versus: 'vs',
		modelALabel: 'Model A',
		modelBLabel: 'Model B'
	},

	// Arbiter
	arbiter: {
		samplingFrame: 'What the arbiter reviewed',
		coverageEvaluated: 'reviewed',
		coverageCorpus: 'in corpus',
		samplingFrameNote:
			'The arbiter did not review the whole corpus. It reviewed articles chosen because the two models disagreed most sharply about them, so every percentage below holds only where a disagreement already exists. None of them measures which model is better across the corpus as a whole.',
		title: 'Arbiter verdict',
		subtitle: 'Blind review by a third AI model, which is not told who wrote what',
		modelName: 'Gemini 3 Pro',
		verdict: 'Verdict',
		overallVerdict: 'Overall verdict',
		confidenceLevel: 'Confidence',
		confidenceHigh: 'High',
		confidenceMedium: 'Medium',
		confidenceLow: 'Low',
		evaluationsNoun: 'reviews',
		verdictsNoun: 'verdicts',
		prefers: 'Prefers',
		prefersBoth: 'Both are equally close',
		prefersNeither: 'Neither is close',
		arbiterScore: 'Arbiter’s own rating',
		arbiterJustification: 'Arbiter’s reasoning',
		verdictExplanation: 'Why this verdict',
		noArbiterData: 'Not reviewed by the arbiter',
		noArbiterDataDescription:
			'The arbiter did not review this article. It only read the articles the two models disagreed about most sharply.',
		polarityVerdict: 'Polarity verdict',
		subjectivityVerdict: 'Subjectivity verdict',
		centralityVerdict: 'Centrality verdict',
		loadingArbiter: 'Loading arbiter data…',
		runArbiterScript: 'No verdicts have been published for this article.',
		// Summary statistics
		summaryTitle: 'Arbiter summary',
		articlesEvaluated: 'articles reviewed',
		bothEqual: 'Equally close',
		neitherAccurate: 'Neither close',
		preferred: 'preferred',
		blindEvaluationNote:
			'Blind review: the arbiter was not told which model produced which analysis',
		// Arbiter View page
		viewTitle: 'Arbiter',
		viewSubtitle:
			'A third model reads the articles the two annotators disagreed about most, and says which came closer',
		verdictDistribution: 'Verdict distribution',
		verdictsByDimension: 'Verdicts by dimension',
		confidenceDistribution: 'Confidence distribution',
		totalVerdicts: 'Total verdicts',
		dimension: 'Dimension',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		allDimensions: 'All dimensions',
		selectModelPair: 'Select model pair',
		noDataForPair: 'No arbiter data available for this model pair',
		runScript: 'No verdicts have been published for this pair.',
		filterByDimension: 'Filter by dimension',
		// Methodology section
		methodologyTitle: 'How the arbiter works',
		methodologySubtitle: 'A third model judges the cases where the two annotators disagreed',
		blindEvaluation: 'Blind review',
		blindEvaluationDesc:
			'The arbiter is not told which model produced which analysis. It sees only “Model A” and “Model B”.',
		highReasoning: 'High reasoning effort',
		highReasoningDesc:
			'Gemini 3 Pro was run with extended thinking, so it works through the article before answering.',
		independentVerdict: 'Independent verdict',
		independentVerdictDesc:
			'The arbiter rates the article itself before it looks at the two analyses.',
		howItWorks: 'How it works',
		selectionProcess: 'How articles were chosen',
		selectionProcessDesc:
			'An article goes to the arbiter when the two models are at least 3 points apart on any one of the three dimensions.',
		blindAssignment: 'Blind assignment',
		blindAssignmentDesc:
			'For each model pair, one model is assigned at random as “Model A” and the other as “Model B”. The assignment holds for every article in the pair, so nothing about the order can favour one of them.',
		evaluationProcess: 'What the arbiter does',
		step1: 'It reads the full text of the article',
		step2: 'It rates polarity, subjectivity and centrality on its own',
		step3: 'It compares both analyses against its own rating',
		step4: 'It says which model came closer, and gives its reasons',
		arbiterModel: 'Arbiter model',
		arbiterRole: 'Third-party judge',
		geminiArbiterDesc:
			'Gemini 3 Pro acts as the arbiter, with its reasoning level set to high so that it works through the article before comparing the two analyses.',
		evaluationScales: 'Rating scales',
		viewPrompt: 'View the prompt',
		promptExplanation:
			'The system instruction and user prompt sent to the arbiter. They are the same for every article.',
		viewFullPrompt: 'View the full prompt',
		arbiterPrompt: 'Arbiter prompt',
		systemInstruction: 'System instruction',
		userPromptTemplate: 'User prompt template',
		// Scale descriptions
		polarityVeryPositive: 'Extremely favourable, enthusiastic portrayal',
		polarityPositive: 'Favourable, optimistic portrayal',
		polarityNeutral: 'No clear sentiment, or a balance; factual tone',
		polarityNegative: 'Unfavourable, critical portrayal',
		polarityVeryNegative: 'Extremely unfavourable, alarmist portrayal',
		subjectivity1: 'Very objective – purely informative',
		subjectivity2: 'Rather objective – mainly factual',
		subjectivity3: 'Mixed – facts and opinions in balance',
		subjectivity4: 'Rather subjective – clear opinions',
		subjectivity5: 'Very subjective – heavily biased',
		centralityVeryCentral: 'The main subject of the article',
		centralityCentral: 'Important, but shared with other subjects',
		centralitySecondary: 'Mentioned significantly, but not the main subject',
		centralityMarginal: 'Mentioned briefly or in passing',
		centralityNotAddressed: 'No mention of Islam or Muslims',
		// Head-to-head comparison
		headToHead: 'Head to head',
		excludingTies: '(ties and “neither” excluded)',
		wins: 'in its favour',
		// Evaluated articles table
		evaluatedArticles: 'Articles reviewed',
		evaluatedArticlesSubtitle: 'The articles the arbiter read, and what it decided about each',
		viewArticleDetails: 'View article details',
		articleWithArbiter: 'Article with arbiter verdict',
		noEvaluatedArticles: 'No reviewed articles to show',
		justification: 'Reason given'
	},

	// Three-way arbiter (generation 2). A separate block from `arbiter` because
	// almost every string differs: three analyses instead of two, "multiple"
	// and "none" instead of "both"/"neither", spread instead of pairwise gap.
	arbiterV2: {
		viewTitle: 'Three-way arbiter',
		viewSubtitle:
			'One blind verdict per article, comparing all three generation-2 analyses at once',
		modelName: 'Claude Opus 5',
		arbiterRole: 'Third-party judge',
		samplingFrameNote:
			'The arbiter did not review the whole corpus. It reviewed articles chosen because the three models disagreed most sharply about them, so every percentage below holds only where a disagreement already exists. None of them measures which model is better across the corpus as a whole.',
		articlesEvaluated: 'articles reviewed',
		dimensionVerdicts: 'dimension verdicts',
		preferred: 'preferred',
		multiple: 'Several equally close',
		none: 'None close',
		overallVerdicts: 'Overall verdicts',
		overallVerdictsNote: 'One verdict per article, across all three dimensions',
		byDimension: 'Verdicts by dimension',
		confidenceDistribution: 'Confidence distribution',
		blindLabel: 'Shown as',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		evaluatedArticles: 'Articles reviewed',
		evaluatedArticlesSubtitle:
			'Every article the arbiter read, widest disagreement first. Open a row for its reasoning.',
		spread: 'Spread',
		arbiterScore: 'Arbiter’s own rating',
		verdict: 'Verdict',
		confidence: 'Confidence',
		showReasoning: 'Show reasoning',
		hideReasoning: 'Hide reasoning',
		noData: 'No three-way arbiter verdicts yet',
		noDataDescription:
			'This run costs money and is launched by hand, so it has not been made yet. Until it is, this view has nothing to show.',
		loading: 'Loading arbiter data…',
		// Methodology
		methodologyTitle: 'How the three-way arbiter works',
		methodologySubtitle: 'One judge compares all three generation-2 analyses at once',
		blindEvaluation: 'Blind review',
		blindEvaluationDesc:
			'The three analyses are anonymised as A, B and C by a single random shuffle, fixed for the whole run.',
		selectionProcess: 'How articles were chosen',
		selectionProcessDesc:
			'An article qualifies when the three models are at least 3 points apart on any dimension: the highest rating minus the lowest, not a gap between one pair. Articles where any model reports that the task does not apply are left out rather than counted as a maximal disagreement.',
		fullText: 'The full article text',
		fullTextDesc:
			'The arbiter reads the article from the private mirror of the collection, where the text is complete. The v1 arbiter read the public version, which masks the text of a large share of articles, so some v1 verdicts were reached without the article in front of the judge.',
		independentVerdict: 'Independent verdict',
		independentVerdictDesc: 'The arbiter rates the article itself before comparing the three.',
		reasoningEffort: 'Reasoning effort',
		reasoningEffortDesc:
			'Claude Opus 5 thinks adaptively, so the run sets an effort level rather than a token budget. That setting is also what the run costs.',
		howItWorks: 'How it works',
		step1: 'It reads the full text of the article',
		step2: 'It rates polarity, subjectivity and centrality on its own',
		step3: 'It compares the three anonymised analyses against its own rating',
		step4:
			'It names the most accurate analysis per dimension, or says that several tie or that none is right',
		arbiterModel: 'Arbiter model',
		arbiterModelDesc:
			'Claude Opus 5 judges all three analyses in a single call, so its verdicts hold together in a way that three separate pairwise runs could not.',
		viewPrompt: 'View the prompt',
		promptExplanation:
			'The French system instruction and user prompt sent to the arbiter, word for word.',
		viewFullPrompt: 'View the full prompt',
		arbiterPrompt: 'Three-way arbiter prompt',
		systemInstruction: 'System instruction',
		userPromptTemplate: 'User prompt template'
	},

	// Extreme Analysis
	extremeAnalysis: {
		title: 'Words at the extremes',
		subtitle:
			'Which subjects and places recur in the articles that sit at each end of the three scales.',
		analysisControls: 'Controls',
		topKeywords: 'Most frequent keywords',
		articleCount: 'Number of articles',
		selectCategory: 'Category',
		selectKeywordType: 'Keyword type',
		numberOfKeywords: 'Number of keywords',
		subjectKeywords: 'Subjects',
		spatialKeywords: 'Places',
		noData: 'No data available for this selection',
		categories: {
			subjectivityHigh: 'High subjectivity (4–5)',
			subjectivityLow: 'Low subjectivity (1–2)',
			polarityNegative: 'Very negative polarity',
			polarityPositive: 'Very positive polarity',
			centralityHigh: 'Very central',
			centralityLow: 'Not central'
		},
		descriptions: {
			subjectivityHigh: 'Articles that take a clear position',
			subjectivityLow: 'Factual, informative articles',
			polarityNegative: 'Articles rated very negative',
			polarityPositive: 'Articles rated very positive',
			centralityHigh: 'Islam and Muslims at the heart of the article',
			centralityLow: 'Islam and Muslims mentioned only in passing'
		}
	},

	// SEO metadata (SEOHead.svelte) — per-view titles/descriptions/keywords
	meta: {
		siteTitle: 'IWAC Sentiment Analysis',
		comparisonTitle: 'AI model comparison',
		comparisonDescription:
			'Compare how GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash rated the same articles from the Islam West Africa Collection, and see where their readings of the press coverage part company.',
		comparisonKeywords:
			'AI comparison, GPT-5.6 Luna vs Mistral Small 4 vs DeepSeek, model comparison, sentiment analysis, IWAC, AI evaluation',
		viewDescriptionPrefix: 'Explore ',
		viewDescriptionSuffix:
			' in the AI sentiment annotations of the Islam West Africa Collection, a corpus of francophone West African press coverage of Islam and Muslims.',
		baseKeywords: 'sentiment analysis, IWAC, Islam West Africa, data visualisation',
		ogImageAlt:
			'IWAC Sentiment Analysis — polarity distributions from GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash across 12,305 francophone West African press articles',
		views: {
			charts: {
				title: 'Charts and distributions',
				description: 'sentiment distribution charts and polarity analysis',
				keywords: 'charts, polarity, sentiment distribution, bar charts, pie charts'
			},
			trends: {
				title: 'Trends over time',
				description: 'the year-by-year evolution of the sentiment ratings',
				keywords: 'trends, temporal analysis, time series, evolution'
			},
			correlation: {
				title: 'Sentiment distribution',
				description: 'the relationship between the polarity and subjectivity scales',
				keywords: 'correlation, cross-analysis, distribution, relationships'
			},
			volume: {
				title: 'Article volume',
				description: 'article publication volume and geographic distribution',
				keywords: 'volume, geographic distribution, publication trends'
			},
			heatmap: {
				title: 'Centrality heatmap',
				description: 'the centrality of Islam and Muslims by country and year',
				keywords: 'heatmap, centrality, geographic analysis, visualisation'
			},
			table: {
				title: 'Article explorer',
				description: 'every rated article, searchable and filterable',
				keywords: 'table, article explorer, filtering, search'
			},
			seasonality: {
				title: 'Seasonality',
				description: 'coverage across the months of the Islamic lunar calendar',
				keywords: 'seasonality, Hijri calendar, Ramadan, lunar year, religious observance'
			},
			ranking: {
				title: 'Newspapers ranked',
				description: 'newspapers ranked by their average rating, with confidence intervals',
				keywords: 'newspapers, ranking, confidence intervals, press titles, mean sentiment'
			},
			map: {
				title: 'Places mentioned',
				description: 'the places the articles name, mapped and rated',
				keywords: 'map, places, geography, West Africa, spatial distribution'
			},
			agreement: {
				title: 'Model agreement',
				description: 'how far the three AI models agree, and how they differ when they do not',
				keywords: "agreement, Cohen's kappa, Fleiss' kappa, inter-rater reliability, calibration"
			},
			comparison: {
				title: 'Model comparison',
				description: 'the articles two AI models rated differently, and by how much',
				keywords: 'comparison, AI models, discrepancy, evaluation'
			},
			extremes: {
				title: 'Sentiment extremes',
				description: 'the most extreme sentiment categories and their recurring keywords',
				keywords: 'extremes, keywords, outliers, sentiment categories'
			},
			arbiter: {
				title: 'Arbiter verdicts',
				description: 'blind third-model arbitration of disagreements between AI models',
				keywords: 'arbiter, blind evaluation, model disagreement, verdicts'
			},
			default: {
				title: 'Data visualisation',
				description: 'interactive data visualisation',
				keywords: 'visualisation, analysis, research'
			}
		}
	}
};
