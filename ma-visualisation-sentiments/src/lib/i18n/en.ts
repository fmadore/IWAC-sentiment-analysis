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
	historyResearch: {
		rangeBandNote:
			'The pale band spans the lowest to highest model share where every model meets the minimum. It describes model differences, not a confidence interval; exact bounds are available in the data table.',

		title: 'Historical trends across models',
		intro:
			'Compare the panel on the same collected articles. These shares describe model annotations of this collection, not public opinion or all newspaper output.',
		corpusFilters:
			'Country and newspaper filters apply here. Sentiment filters in the filter panel apply only to the single-model charts; selecting on one model’s labels would bias this comparison.',
		negative: 'Negative polarity share',
		central: 'Central or very central share',
		subjective: 'Rather or very subjective share',
		measure: 'Measure',
		period: 'Period',
		year: 'Year',
		decade: 'Decade',
		facet: 'Panels',
		all: 'Whole selection',
		country: 'By country',
		journal: 'By newspaper',
		cohort: 'Article cohort',
		common: 'Same applicable articles for every model',
		available: 'Available applicable ratings per model',
		availableNote:
			'Available-case denominators differ between models. Changes from the common cohort can reflect selection as well as annotation differences.',
		commonNote:
			'Each period uses articles with an applicable rating from every model on the selected dimension. Missing and non-applicable ratings are excluded. In the current panel, Qwen’s non-random missing ratings favour articles where Islam is more central.',
		support:
			'{common} dated common-cohort articles out of {total} collected; {undated} without a usable year.',
		minimum: 'Minimum articles per point',
		minimumNote:
			'Gaps indicate no applicable ratings or fewer articles than the chosen minimum. A zero share is a measured value.',
		range: 'Model range',
		unknown: 'Country not recorded',
		model: 'Model',
		collected: 'Collected articles',
		rated: 'Applicable articles',
		target: 'Articles in category',
		share: 'Share',
		minimumShare: 'Lowest model share',
		maximumShare: 'Highest model share',
		previous: 'Previous panels',
		next: 'Next panels',
		page: 'Page {page} of {pages}',
		timelineTitle: 'Newspaper coverage over time',
		timelineIntro:
			'Counts of collected articles by newspaper and publication period. Empty cells mean no articles in this selection; they do not establish that a newspaper published nothing.',
		timelineFilters:
			'This timeline uses country and newspaper filters only, independent of sentiment annotations.',
		timelineSupport: '{total} dated articles; {undated} without a usable year.',
		timelineHint: 'Select a newspaper below to apply its filter across the dashboard.',
		order: 'Newspaper order',
		countOrder: 'Most collected articles',
		nameOrder: 'Name',
		filterNewspaper: 'Filter to this newspaper',
		timelinePage: 'Newspapers {start}–{end} of {total}',
		timelineLegend: 'Collected articles per cell',
		panelSeries: 'Panel series',
		panelNone: 'Models only',
		panelMajority: 'Panel majority in category',
		panelAny: 'Any model in category',
		panelMajorityName: 'Panel majority',
		panelAnyName: 'Any model',
		panelNote:
			'Panel series count each article once: “panel majority” when more than half the panel places it in the category, “any model” when at least one does. Both use only articles every model rated on this dimension, whichever cohort is selected.',
		intervalLow: 'Wilson 95% lower bound',
		intervalHigh: 'Wilson 95% upper bound',
		lowSample: 'Fewer than {min} articles',
		lowSampleNote:
			'Hollow, faded points rest on fewer than {min} articles, where one article moves a share by more than three percentage points. The Wilson 95% intervals in the tooltip and the data table show how far each share could plausibly lie.'
	},

	reliability: {
		ordinalAlpha: 'Ordinal α',
		nominalAlpha: 'Nominal α',
		alphaDetail: 'Krippendorff’s ordinal α · {count} articles',
		alphaHelp:
			'Krippendorff’s alpha over every article that at least two models rated: a missing rating leaves the article in with fewer raters rather than removing it. The ordinal form gives partial credit to nearby ratings, scaled by how often each point of the scale is used. 1 is perfect agreement; 0 is what chance alone would produce.',
		alphaPolarityNote:
			'Polarity: ordinal alpha uses the five rated levels and leaves out “Not applicable”, as weighted κ does; nominal alpha and Fleiss’ κ keep it as a category.',
		completeCaseTitle: 'Fleiss’ κ, complete cases',
		fleissDetail: 'Complete cases · {count} articles',
		materialMissing: 'Without {model}: Fleiss’ κ {value} over {count} articles.',
		archiveAlphaNote:
			'Archive: Fleiss’ κ remains the published panel statistic. Krippendorff’s α is shown as an additional figure and changes none of the archived numbers.',
		looTitle: 'Leaving one model out',
		looNote:
			'A panel coefficient is a property of which models were chosen; the uncertainty from sampling articles is small by comparison.',
		looModel: 'Model left out',
		looAll: 'None (whole panel)',
		looArticles: 'Articles',
		applicabilityTitle: 'Is the article about Islam at all?',
		applicabilityLede:
			'Each model’s verdict reduced to addressed or not addressed: a “Not applicable” polarity or a “Not addressed” centrality counts as not addressed, any other pair of ratings as addressed. A missing rating is neither and is left out. The flags and the arbiter set aside articles with a not-addressed verdict by a documented rule; this measures what that rule sets aside.',
		applicabilityAlpha: 'Panel α',
		applicabilityAlphaDetail: 'Nominal α · {count} articles with two or more verdicts',
		applicabilityMixed: 'Split verdicts',
		applicabilityMixedDetail: '{count} of {total} articles: some models say addressed, others not',
		applicabilityAllAddressed: 'Addressed for every model',
		applicabilityAllNotAddressed: 'Not addressed for every model',
		applicabilityShareDetail: 'Share of {total} articles with two or more verdicts',
		applicabilityDisagreements: 'Opposite verdicts',
		applicabilityAddressed: 'Addressed',
		applicabilityNotAddressed: 'Not addressed',
		applicabilityMissing: 'No rating',
		applicabilityModels: 'Verdicts by model',
		chanceWithinOne: 'Chance: {value} · {count} articles compared',
		chanceWithinOneHelp:
			'Share of articles where the two labels are identical or one position apart. Chance is the share two independent models with these same label distributions would reach. When most ratings sit in three neighbouring categories it is already high, so this measure barely separates one pair from another.',
		flagsTitle: 'What gets an article flagged',
		flagsLede:
			'Articles the dashboard flags because the panel’s ratings span {threshold} or more steps on at least one dimension, broken down by the dimension that reached it. The rule itself is unchanged.',
		flagsFlagged: 'Flagged articles',
		flagsDetail: '{count} of {total} comparable articles',
		flagsBy: 'Flagged, by dimension',
		flagsSubjectivityOnly: 'By subjectivity alone',
		flagsSubjectivityNote:
			'Subjectivity is the least consistently scaled of the three dimensions, so a flag raised by subjectivity alone says more about how the models use that scale than about a disagreement over substance.',
		conflictBreakdownTitle: 'What makes a disagreement sharp',
		totalDifferenceCaveat:
			'The total adds steps from three scales that are not commensurate, so it ranks articles; it does not measure how far apart two readings are.',
		correlationInterval: '95% interval',
		correlationIntervalNote:
			'The interval uses the Fisher z transformation with the Fieller–Hartley–Pearson variance for rank correlations. At this sample size any visible correlation has a p-value of practically zero, so the interval and n are the informative figures.',
		patternRank: 'Pattern {rank}',
		methodCategorical: 'Unweighted, every category'
	},

	agreementResearch: {
		cohortNote:
			'The current panel’s complete cases lean towards articles where Islam is more central because Qwen’s missing ratings are not random.',

		overviewTitle: 'Agreement across model pairs',
		overviewNote:
			'Each cell compares the same two models on the selected dimension. The count is the number of articles usable for that metric. Select a cell to inspect its label matrix. Pairwise samples may differ; agreement is not accuracy.',
		metric: 'Agreement measure',
		method: 'Method',
		legacyMethod: 'Legacy ordinal method v1',
		ordinalMethod: 'Applicable ordinal method v2',
		weightedLegacyNote:
			'Method: ordinal-v1 (archive). Weighted polarity and within-one-step agreement retain “Not applicable” as the lowest category to reproduce the published calculations.',
		weightedApplicableNote:
			'Method: applicable-ordinal-v2. Weighted polarity and within-one-step agreement exclude pairs where either label is “Not applicable”. The full matrix and unweighted agreement retain that category; their counts can differ.',
		weightedAllNote:
			'Quadratic ordinal agreement; the count includes pairs with both ratings present on this dimension.',
		closeAgreementNote:
			'Weighted agreement gives more credit to small differences. A higher weighted value alone does not establish a directional offset or show that most differences are one step.',
		openPair: 'Inspect {modelA} and {modelB}',
		models: 'Models',
		patternsTitle: 'Full label patterns',
		patternsNote:
			'Each row preserves the labels assigned to the same articles by every model, in column order. Split sizes describe equal-label groups: 3–2, for example, means three models used one label and two used another. Missing ratings are excluded; the “Not applicable” setting above applies.',
		patternKind: 'Pattern group',
		allPatterns: 'All patterns',
		unanimousPatterns: 'Unanimous',
		lonePatterns: 'One against the rest',
		splitPatterns: 'Other divisions',
		patternLimit: 'Patterns shown',
		pattern: 'Pattern',
		splitSize: 'Split sizes',
		share: 'Share of usable articles',
		articles: 'Articles',
		selectPattern: 'Show articles for pattern {pattern}',
		patternsSummary:
			'Showing {shown} of {total} patterns from {articles} usable articles. Shares use all usable articles, before the pattern-group filter.',
		patternArticles: 'Articles with the selected pattern',
		noPattern: 'Select a pattern to inspect its articles.',
		missingPattern:
			'The selected pattern is absent under the current dimension, generation or filters.',
		articleTitle: 'Article',
		articleYear: 'Year',
		articleJournal: 'Newspaper',
		openArticle: 'Open annotation for {title}',
		loadMore: 'Show more articles',
		articleCount: 'Showing {shown} of {total} matching articles.',
		undefined: 'Not defined',
		pair: 'Model pair',
		weightedN: '{count} articles · {method}',
		patternSelection: 'Selected pattern'
	},

	links: {
		copy: 'Copy link to this analysis',
		copied: 'Analysis link copied.',
		copyFailed: 'Could not copy the link. Copy the address from your browser.',
		missing: 'The item in this link is not available in the selected analysis.',
		close: 'Return to the analysis'
	},
	audit: {
		place: 'Place',
		flowFrom: 'From model and label',
		flowTo: 'To model and label',
		expandViewer: 'Toggle expanded view',
		newTab: 'Open in new tab',
		search: 'Search…',
		globalAll: 'Overall distribution',
		byJournal: 'By newspaper',
		other: 'Other newspapers',
		topJournals:
			'One bar per newspaper, each scaled to 100% of its own rated articles (n beside its name), so profiles compare whatever a newspaper’s size. The ten largest are shown; the rest are pooled as Other. The table gives every newspaper’s raw counts.',
		count: 'Articles',
		share: 'Share (%)',
		year: 'Year',
		category: 'Category',
		journal: 'Newspaper',
		included: 'Included',
		excluded: 'Excluded (missing rating)',
		reload: 'Reload this view',
		viewLoadError: 'This view could not be loaded. Reload to try again.',
		mainNav: 'Main navigation',
		openNav: 'Open navigation',
		closeNav: 'Close navigation',
		collapseNav: 'Collapse sidebar',
		expandNav: 'Expand sidebar',
		closeModal: 'Close modal',
		clearSearch: 'Clear search',
		changeLanguage: 'Change language',
		comparisonDetails: 'View comparison details for {title}',
		articleDetails: 'View article details for {title}',
		excludeNA: 'Exclude non-applicable articles',
		differentHelp:
			'Articles that {a} and {b} rated differently on at least one dimension, by any margin.',
		significantHelp: 'Articles where {a} and {b} are at least three steps apart on a dimension.',
		scope: 'Grouping',
		openMenu: 'Open menu',
		selectPlaceholder: 'Select…',
		back: 'Back',
		backToDashboard: 'Back to the dashboard',
		rangeMinimum: 'Minimum value',
		rangeMaximum: 'Maximum value',
		differenceMinimum: 'Smallest difference',
		differenceMaximum: 'Largest difference',
		zoomIn: 'Zoom in',
		zoomOut: 'Zoom out',
		zoomReset: 'Reset zoom'
	},
	// App header and branding
	appTitle: 'IWAC Sentiment Analysis',
	skipToContent: 'Skip to content',
	appSubtitle: 'Islam West Africa Collection – data visualisation and exploration',
	enterFullscreen: 'Enter fullscreen',
	exitFullscreen: 'Exit fullscreen',
	/* Label beside the language segment at the foot of the mobile drawer. */
	language: 'Language',

	// Navigation
	/* View names: sidebar entries and, for most views, the view's H1. */
	nav: {
		charts: 'Distributions',
		trends: 'Trends',
		distribution: 'Polarity × subjectivity',
		volume: 'Volume',
		heatmap: 'Centrality by country',
		table: 'Articles',
		comparison: 'Comparison',
		seasonality: 'Seasonality',
		ranking: 'Newspapers',
		map: 'Map',
		agreement: 'Agreement',
		extremes: 'Extremes',
		arbiter: 'Arbiter'
	},

	/* The eyebrow rule under each view title: "Model · X · Sample · N articles".
	   Assembled in ViewContent from these words plus `common.of` and
	   `common.articles`. `rated` is appended only when the model left part of
	   the sample unrated, so most models never show it. */
	viewMeta: {
		model: 'Model',
		sample: 'Sample',
		rated: 'Rated',
		/* Shown under the eyebrow rule when the selected model left more than 1%
		   of the corpus unrated. */
		unratedCaveat:
			'This model left {count} articles unrated ({share} of the corpus). They are not a random subset, so its figures describe the articles it rated rather than the whole corpus.',
		unratedCaveatLink: 'See the methodology'
	},

	/* The three sidebar sections; also the eyebrow above each view title. */
	navGroups: {
		corpus: 'Corpus',
		model: 'One model’s reading',
		panel: 'Between models'
	},

	/* The standing introduction above each view. */
	intro: {
		label: 'About this dashboard',
		title: 'Several machine readings of one press corpus',
		body: 'A panel of {models} language models rated the {articles} press articles of this corpus on three dimensions: polarity, subjectivity, and how central Islam and Muslims are to each article.',
		bodyNoCount:
			'A panel of {models} language models rated the press articles of this corpus on three dimensions: polarity, subjectivity, and how central Islam and Muslims are to each article.',
		caveat:
			'No model is the ground truth, and no human-coded reference sample exists yet. Agreement between the models therefore measures their consistency, not their accuracy.',
		agreementLink: 'Where the models agree and disagree',
		dismiss: 'Hide this introduction'
	},

	/* The site footer: citation and provenance. */
	footer: {
		cite: 'How to cite',
		softwareTag: 'software',
		citeNote:
			'For a publication, cite the versioned deposit together with the analysis link and your access date.',
		version: 'Version',
		data: 'Data',
		currentAnalysis: 'current analysis (v2)',
		archivedAnalysis: 'archived analysis (v1)',
		generated: 'generated {date}',
		sourceRevision: 'source revision {revision}',
		release: 'release {release}',
		provenanceLoading: 'Loading data provenance…',
		provenanceUnavailable: 'Data provenance could not be loaded.',
		licence: 'Licence',
		licenceText: 'Software under the MIT licence; source dataset under CC BY-NC-SA 4.0.',
		repository: 'Source code (GitHub)',
		dataset: 'Dataset (Hugging Face)',
		acknowledgements: 'Acknowledgements',
		acknowledgementText:
			'Calculations were performed using the festus-cluster of the Bayreuth Centre for High Performance Computing (https://www.bzhpc.uni-bayreuth.de), funded by the Deutsche Forschungsgemeinschaft (DFG, German Research Foundation) - 523317330.'
	},

	/* The model-pair picker on the comparison, agreement and archived arbiter views. */
	pairPicker: {
		first: 'First model',
		second: 'Second model'
	},

	/* The whole panel's ratings in an article's detail. */
	panelRatings: {
		title: 'The whole panel',
		note: 'Every model of this analysis rated the same article. The selected model is highlighted; none of them is a reference reading.',
		selected: 'Selected',
		modelReading: 'Reading by {model}'
	},

	/* Methodology card copy that used to be inlined per language. */
	analysisInfo: {
		collectionName: 'Islam West Africa Collection',
		collectionAcronym: 'IWAC',
		listAnd: ' and ',
		panelReadSame:
			'Every model in the panel read the same articles, so their answers can be set side by side:',
		panelSwitch:
			'Choose the models with the selectors in this view. The Agreement view sets the whole panel side by side.',
		ratingsFrom: 'The ratings on screen come from ',
		independentReading:
			'Every model reads the same articles independently, with no sight of the others’ answers',
		differencesAfterwards:
			'Differences between the models are computed afterwards, dimension by dimension',
		samePrompt:
			'Every model receives the same prompt, so the comparison measures the models rather than their instructions:',
		identicalPrompt:
			'The prompt is identical for every model, so nothing in the instructions favours one of them',
		readingComparison: 'Reading the comparison',
		comparisonCaveats: [
			'Differences between models can come from their training data, their architecture and the way they were tuned, and need not mean that one is more accurate',
			'No model is a ground truth. Where two of them disagree, the article is worth reading yourself',
			'These comparisons are most useful for spotting patterns across the corpus, and least useful as a verdict on any single article'
		],
		promptTitle: 'The full analysis prompt',
		translationNoteLabel: 'Note:',
		translationNote:
			'this is a translation of the prompt. The models were instructed in French, because the corpus is in French.',
		docs: 'Docs →',
		promptFingerprint: 'Prompt fingerprint {fingerprint}, recorded with every cached result.'
	},

	// Filters
	filters: {
		title: 'Filters',
		country: 'Country',
		journal: 'Newspaper',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		notAnnotatedNote:
			'“Not applicable” is a verdict: the model read the article and found no stance. “Not annotated” means there is no rating at all — the articles a model declined to score, or never saw.',
		clearAll: 'Clear all',
		clearAllFilters: 'Clear all filters',
		searchJournals: 'Search newspapers…',
		showingJournals: 'Showing',
		of: 'of',
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
		notApplicable: 'Not applicable',
		notAnnotated: 'Not annotated'
	},

	// Subjectivity labels
	subjectivity: {
		factual: 'Very objective',
		ratherFactual: 'Rather objective',
		mixed: 'Mixed',
		ratherSubjective: 'Rather subjective',
		subjective: 'Very subjective'
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
			'Newspapers ranked by their average rating on the dimension you choose. The 95% confidence intervals describe within-sample uncertainty in those model ratings. They do not account for archival selection, missing articles or annotation error; this collection is not a random sample of all newspaper output.',
		chartTitle: 'Newspapers ranked',
		chartSubtitle: 'Mean with 95% CI · newspapers with at least {min} rated articles',
		netPolarity: 'Net polarity',
		meanSubjectivity: 'Mean subjectivity',
		meanCentrality: 'Mean centrality',
		confidenceInterval: '95% CI',
		neutralLine: 'neutral',
		excludedNote:
			'{count} newspapers left out: fewer than {min} rated articles. Their averages would be too uncertain to rank.',
		noneAboveThreshold: 'No newspaper has at least {min} rated articles under the current filters.',
		positiveShare: 'Share positive',
		negativeShare: 'Share negative',
		netShare: 'Net share (positive − negative)',
		proportionSubtitle:
			'Share with 95% CI (Wilson; net: normal approximation) · newspapers with at least {min} rated articles',
		measureGroup: 'Measure',
		readingNote:
			'Newspapers whose intervals overlap cannot be put in order: their order within the overlap is not interpretable. The ranking is also one model’s: the other models of this generation order the same newspapers differently. The mean measures treat the ordinal codes (−2 to +2, or 1 to 5) as evenly spaced measurements, which they are not; the share measures avoid that assumption.'
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
		legendReliabilityTitle: 'Reliability of the colour',
		legendReliable: 'Mean of {min} or more rated articles',
		legendLowN: 'Fewer than {min}: faded',
		keyboardNote:
			'Hover a bubble to name it, click it for details. The bubbles cannot be reached by keyboard: the data table below lists every place with the same figures.',
		caveat:
			'A bubble counts articles that mention a place, not articles about it. Each article names about four places, so these totals add up to more than the number of articles. Colour is the rating the model gave the whole article on a 1–5 scale, averaged over the articles it actually rated on that dimension. For polarity, “Not applicable” means the article takes no position: it is left out of the average but still counts towards the size of the bubble. For centrality, “Not addressed” is a real bottom of the scale and is included. Places with no coordinates in the IWAC place list do not appear.',
		noPlacesTitle: 'No mapped places',
		noPlacesLede: 'No article in the current selection names a place with known coordinates.',
		ordinalNote:
			'These are means of ordinal ranks, not measured units. Faded bubbles rest on fewer than {min} rated articles, too few for their mean to say much; the popup and the data table give n for every place.'
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
			'Stored Umm al-Qura dates provide the IWAC chronology. A tabular civil conversion is used only when stored Hijri fields are unavailable. Neither calendar establishes the date of a locally observed religious event.',
		undatedNote: '{count} articles left out: no full publication date.',
		ordinalNote:
			'Mean centrality is a mean of ordinal ranks (1–5), not a measured unit; n is the number of rated articles in each month. Hollow points rest on fewer than {min} rated articles.',
		ratedArticles: 'Rated articles (n)',
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
			'How the models relate to one another: where they converge, where they diverge, and whether a disagreement is a systematic offset or a genuine difference of reading.',
		dimensionSelector: 'Analysis dimension',
		exactAgreement: 'Exact agreement',
		exactAgreementHelp:
			'Share of articles where both models chose the identical category. Not corrected for the agreement two models would reach by chance alone.',
		adjacentAgreement: 'Within one step',
		articlesCompared: 'articles compared',
		kappa: 'Cohen’s κ',
		kappaHelp:
			'Agreement corrected for chance. 0 means no better than chance; 1 means perfect. It treats every disagreement as equally severe, so two models that rank articles the same way but sit one category apart still score poorly.',
		weightedKappa: 'Weighted κ',
		fleissHelp:
			'Fleiss’ kappa over the articles every model rated. An article any model left unrated is dropped for all of them.',
		panelTitle: 'The whole panel',
		panelLede:
			'Agreement across every model of the selected analysis at once. Krippendorff’s alpha keeps every article that at least two models rated; Fleiss’ kappa keeps only the articles every model rated, so a model with thinner coverage narrows its base for all of them.',
		matrixTitle: 'Agreement matrix',
		rowsAre: 'Rows:',
		columnsAre: 'Columns:',
		ofRow: 'Of this row',
		calibrationTitle: 'Model calibration',
		calibrationSubtitle: 'How often each model uses each point on the scale',

		// Panel-wide consensus section
		scopeLabel: 'Comparison scope',
		scopePair: 'Two models',
		scopePanel: 'All models',
		consensusTitle: 'Where the models disagree',
		consensusLede:
			'A pairwise view can show that two models differ; it cannot show that one of them stands apart from all the others. Everything below breaks each article down across the whole panel at once, so a model that applies the scale differently from its peers shows up as a consistent pattern.',
		unanimous: 'Unanimous',
		unanimousHelp: 'Share of articles where every model chose the identical category.',
		majoritySplit: 'One against the rest',
		majoritySplitHelp:
			'Share of articles where every model but one chose the same category and one stood apart. The charts below name which one.',
		allDiffer: 'Divided several ways',
		allDifferHelp:
			'Share of articles that are neither unanimous nor one model against the rest: the panel falls into several camps, so there is no lone dissenter to name. On a larger panel this outcome absorbs the near-splits a three-model panel could not produce.',
		meanSpread: 'Mean spread',
		meanSpreadHelp:
			'Mean of (highest − lowest) across the models, counted in steps on the scale. Zero is unanimity; the maximum is the full width of the scale.',
		declinedToggle: '“Not applicable” answers',
		declinedInclude: 'Included',
		declinedExclude: 'Excluded',
		declinedNote:
			'{count} articles are left out because at least one model answered “Not applicable”. That verdict sits below the bottom of the scale, so counting it as a rating makes a model that found no stance look like a model that disagreed. The effect is strongest on the newspapers whose articles are only marginally about Islam.',
		declinedIncludedNote:
			'“Not applicable” answers are counted at the bottom of the scale. Newspapers with many of them will rank as highly disagreed, but the disagreement there is about whether the article concerns Islam at all, rather than about how favourable it is.',

		disagreementTitle: 'Newspapers ranked by model disagreement',
		disagreementSubtitle:
			'Mean spread across the panel with 95% CI · newspapers with at least {min} rated articles',
		disagreementAxis: 'Steps on the scale between the highest and lowest model',
		disagreementNote:
			'The mirror of the Newspapers view: same newspapers, same threshold, but the axis measures how far apart the models are rather than what they say. A newspaper can be unremarkable in sentiment and an outlier in disagreement.',
		spread: 'Mean spread',
		unanimityRate: 'Unanimity',
		declinedShare: '“Not applicable” share',
		medianYear: 'Median year',
		disagreementExcluded:
			'{count} newspapers left out: fewer than {min} rated articles. Small newspapers read as more disagreed, so ranking them here would mislead.',
		disagreementEmpty: 'No newspaper has at least {min} rated articles under the current filters.',

		dissentTitle: 'Who breaks ranks',
		dissentSubtitle:
			'Every article sorted into unanimity, one model against the rest, or a wider division',
		dissentStacked: 'By newspaper',
		dissentTernary: 'Triangle',
		dissentTernaryNote:
			'One point per newspaper, placed according to which model most often stands alone there. A point at a corner means that model does all the dissenting; a point at the centre means the three share it evenly. Size is the article count. Newspapers where no model ever stood alone have no position and are not drawn. A triangle has exactly three corners, so this view is offered only for the three-model archive; the current panel is read from the stacked bars instead.',
		dissentsAlone: 'dissents alone',

		directionTitle: 'Which way each model leans',
		directionSubtitle:
			'When a model stands alone, does it grade above the rest of the panel or below? Bars above the axis are higher, below are lower.',
		directionAbove: 'Grades higher',
		directionBelow: 'Grades lower',
		directionNote:
			'This is the clearest single statement the data makes about how these models differ. A model whose bars sit almost entirely on one side is applying the scale differently from its peers, consistently and in one direction.',

		flowTitle: 'Label flow across the panel',
		flowNote:
			'Ribbons show counts between adjacent model columns. The merged links do not preserve complete article paths; use Full label patterns below to inspect every model’s labels on the same articles.',
		flowArticles: 'articles',

		scatterTitle: 'Is disagreement about extreme coverage or ambiguous coverage?',
		scatterSubtitle: 'One bubble per newspaper · sized by article count, coloured by country',
		scatterX: 'Consensus mean (the models averaged)',
		scatterY: 'Mean spread across the panel',
		scatterNote:
			'Correlation between the two axes: r = {r}. A value near zero would mean disagreement is independent of how favourable a newspaper’s coverage is; a strong value in either direction means the models argue hardest about one end of the scale, and the ranking above should be read with that in mind. The value differs between the two analysis generations and between the three dimensions.'
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
		declined: '“Not applicable”',
		medianYear: 'Median year',
		disagreementCaption:
			'Newspapers ranked by mean spread across the panel, with confidence intervals, unanimity and “Not applicable” share'
	},

	// Chart titles and labels
	charts: {
		polarityDistribution: 'Polarity distribution',
		subjectivityDistribution: 'Subjectivity distribution',
		centralityDistribution: 'Centrality distribution',
		sentimentTrends: 'Sentiment trends',
		subjectivityTrends: 'Subjectivity trends',
		volumeByCountry: 'Article volume by country',
		centralityHeatmap: 'Centrality heatmap',
		articlesAnalyzed: 'articles analysed',
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
		lowSampleBand: 'n < {min}',
		lowSampleNote:
			'In share mode, shaded years rest on fewer than {min} rated articles: one article moves their bands by more than three percentage points. The tooltip gives each year’s n.',
		subtitle: 'How the ratings change over the years, for the corpus and for each newspaper.'
	},

	// Volume view
	volume: {
		subtitle: 'How many articles the corpus holds, year by year and country by country.'
	},

	// Heatmap view
	heatmap: {
		minimumCount: 'Minimum annotated articles per cell',
		scaleNote:
			'Mean centrality uses the shared 1–5 scale. Missing and Not applicable ratings are excluded; n is the number of rated articles in each cell. These are means of ordinal ranks, not measured units.',
		hiddenCells: '{count} cells are hidden below the minimum sample size.',

		subtitle:
			'How central Islam and Muslims are to the coverage, country by country and year by year. Brighter cells mean the theme sits closer to the centre of the articles published that year.'
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
		date: 'Date',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		itemsPerPage: 'Items per page',
		showingItems: 'Showing',
		noFilteredArticles: 'No articles match the selected filters',
		noFilteredArticlesHint: 'Change or clear the filters to list articles again.',
		emptyHint: 'There is nothing to list for the current selection.',
		articleTitle: 'Title',
		subtitle:
			'Browse every article, with its three ratings and the reason the model gave for each.',
		searchTitles: 'Search titles',
		searchResults: '{count} articles with “{query}” in the title',
		searchNoResults: 'No title contains “{query}”',
		searchNoResultsHint: 'Accents and capitals are ignored. Try a shorter or different word.',
		searchScopeNote: 'The CSV export contains the articles listed here, search included.',
		pageStatus: 'Page {page} of {pages}',
		pagination: 'Pagination',
		previousPage: 'Previous page',
		nextPage: 'Next page',
		layout: 'Layout',
		sortDirectionAsc: 'Ascending order. Switch to descending',
		sortDirectionDesc: 'Descending order. Switch to ascending',
		untitled: 'Untitled article',
		unknownJournal: 'Newspaper not recorded'
	},

	// Article details
	article: {
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
		/* The model names that follow are rendered as links from the contract
		   registry, so the generation on screen names its own panel — three
		   models in the archive, six in the current one. Do not restate the
		   count here; it would be right for one generation and wrong for the
		   other. */
		methodologyCorpusEnd: ', was put through the following large language models:',
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
			'Corpus runs: 3–5 August 2026 for GPT-5.6 Luna, Mistral Small 4 and DeepSeek v4 Flash; 14–15 August for Gemma 4 31B; 17–24 August for Qwen3.8 27B; 23 October for Claude Haiku 5.5',
			'Reasoning effort: medium for GPT-5.6 Luna, Qwen3.8 27B and Claude Haiku 5.5, the three whose setting could be verified as a genuine middle step; high for Mistral Small 4 and DeepSeek v4 Flash, whose APIs offer no middle setting; nominally medium for Gemma 4 31B, whose OpenRouter route makes medium and high indistinguishable',
			'Where each model ran: at its maker’s own API — OpenAI’s, Mistral’s or Anthropic’s — except Gemma 4 31B and DeepSeek v4 Flash, which were served through OpenRouter, and Qwen3.8 27B, self-hosted with vLLM on the University of Bayreuth’s Festus cluster',
			'Claude Haiku 5.5 joined the panel on 22 October 2026 without a pilot, by the curator’s decision, so no pilot figure exists for its agreement with the other models or for its consistency with itself',
			'Temperature: not set by the pipeline — each model runs at its host’s default',
			'Output format: structured JSON validated against a Pydantic schema',
			'A resumable cache holding one record per article and model; only successful calls are kept',
			'Error handling: up to three attempts per call, with a growing wait between them and a time limit per model',
			'Coverage: 12,298 of the 12,348 articles carry annotations from GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash and Gemma 4 31B. The 50 that are not in French or English are skipped by design, because the prompt is French',
			'Claude Haiku 5.5 stops 47 articles short of that: its October pass found no text for 47 French articles the others had read in August, and skipped them. Unlike the gap below, this one has a mechanical cause',
			'Qwen3.8 27B stops 200 articles short of that, having declined them across a full pass and three further rounds of retries. That gap is permanent, and it is not missing at random: it falls disproportionately on articles where Islam is peripheral, so any figure computed only on articles every model rated leans towards material where Islam is central'
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
		close: 'Close',
		all: 'All',
		total: 'Total',
		articles: 'articles',
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
		archivedConfound:
			'The prompt was rewritten between the two analyses, so a difference between them confounds the change of models with the change of prompt.',
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
		pointDifference: 'step apart',
		pointsDifference: 'steps apart',
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
		averageDiscrepancyExplanation:
			'The average gap between the two models per article, added up across the three dimensions (polarity + subjectivity + centrality) and counted in steps on the scale.',
		breakdownByDimension: 'Breakdown by dimension',
		enableComparisonMode: 'Enable comparison mode',
		enableComparisonDescription:
			'Choose the two models to set side by side with the “First model” and “Second model” selectors at the top of this view.',
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
		versus: 'vs'
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
			'An article goes to the arbiter when the two models are at least 3 steps apart on any one of the three dimensions.',
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
		leadNote: '{model} leads the overall preferences by {points} percentage points',
		// Evaluated articles table
		evaluatedArticles: 'Articles reviewed',
		evaluatedArticlesSubtitle: 'The articles the arbiter read, and what it decided about each',
		viewArticleDetails: 'View article details',
		articleWithArbiter: 'Article with arbiter verdict',
		noEvaluatedArticles: 'No reviewed articles to show',
		justification: 'Reason given'
	},

	// Panel arbiter (generation 2). A separate block from `arbiter` because
	// almost every string differs: the whole panel instead of two models,
	// "multiple" and "none" instead of "both"/"neither", spread instead of
	// pairwise gap.
	arbiterV2: {
		viewTitle: 'Panel arbiter',
		viewSubtitle: 'One blind verdict per article, comparing every generation-2 analysis at once',
		modelName: 'Claude Opus 5',
		arbiterRole: 'Third-party judge',
		samplingFrameNote:
			'The arbiter did not review the whole corpus. It reviewed the articles where the panel contradicts itself about whether the coverage is favourable or hostile, so every percentage below holds only where such a disagreement already exists. None of them measures which model is better across the corpus as a whole.',
		articlesEvaluated: 'articles reviewed',
		multiple: 'Several equally close',
		none: 'None close',
		overallVerdictsNote: 'One verdict per article, across all three dimensions at once',
		dimensionTieNote:
			'Why the headline is a match rate and not a count of wins: the arbiter names a single closest analysis only when one stands out. When several equal its own rating it says so, and the overall winner then turns on small differences between analyses that agree with it equally often. Comparing each model’s rating with the arbiter’s own rating uses every reviewed article and every dimension.',
		matchRatesTitle: 'How often each model gives the arbiter’s own rating',
		matchRatesNote:
			'Share of the reviewed articles where the model’s rating is the same label as the arbiter’s, with a Wilson 95% interval and the number of articles compared (n). “Within one step” counts ratings at most one step apart, over articles where both ratings sit on the scale. Like every figure here, these hold only for the reviewed articles, not the corpus.',
		matchModel: 'Model',
		exactMatch: 'Same rating',
		withinOne: 'Within one step',
		interval: '95% CI',
		recusedRow: 'not judged: recused',
		recusedRowNote:
			'{models} was never shown to the arbiter. Its rating is set beside the verdicts afterwards, as a comparison, not as a judged analysis.',
		winnerTallyTitle: 'Overall winner tally',
		winnerTallyNote:
			'Secondary. Which single analysis the arbiter named best overall, with “several equally close” and “none close” for the rest. Models that give the arbiter’s own polarity about equally often are named winner very different numbers of times, so this tally follows the judge’s tie-breaks — mostly closeness on subjectivity — rather than ranking the models.',
		loneDissenterNote:
			'{model} is the only model on its side of the neutral line in {count} of the {total} reviewed articles ({negative} of them as the only negative reading); no other model is alone in more than {next}. The frame is therefore largely one model’s dissents, and the rates above partly measure how often a dissent was upheld.',
		frameShareNote:
			'The reviewed articles are {share} of the corpus ({evaluated} of {corpus}). The arbiter rated {subjective} of them ({subjectiveShare}) as rather or very subjective: the frame is mostly opinion writing.',
		secondJudgeTitle: 'A second judge',
		secondJudgeNote:
			'{judge} ({developer}) also judged {shared} of these articles, reading its own panel without its developer’s model. The two judges are compared on their own ratings only. Their preferred analyses are not compared: each judge saw a different panel under its own letters.',
		judgeDimension: 'Dimension',
		judgeShared: 'Articles',
		judgeKappa: 'Cohen’s κ',
		byDimension: 'Verdicts by dimension',
		confidenceDistribution: 'Confidence distribution',
		blindLabel: 'Shown as',
		polarity: 'Polarity',
		subjectivity: 'Subjectivity',
		centrality: 'Centrality',
		evaluatedArticles: 'Articles reviewed',
		evaluatedArticlesSubtitle:
			'Every article the arbiter read, widest disagreement first. Open a row to see the article, the ratings the arbiter was shown, the recused model’s rating and the arbiter’s reasoning.',
		viewArticleDetails: 'View the article and the verdict',
		articleWithVerdict: 'Article with panel verdict',
		noEvaluatedArticles: 'No reviewed articles to show',
		panelLegend: 'Which analysis was which',
		panelLegendNote:
			'The arbiter names the analyses by these letters in its reasoning. The letters were assigned once for the whole run; the order the analyses were shown in was shuffled for each article.',
		matchesArbiter: 'Same rating as the arbiter',
		preferredAnalysis: 'Preferred by the arbiter',
		notRated: 'Not rated',
		panelLoading: 'Loading the rest of the panel…',
		recused: 'Recused',
		recusedTitle:
			'Never shown to the arbiter, which comes from the same developer. Its rating is set beside the verdict afterwards.',
		recusedLegendNote:
			'{models} also belongs to the panel but was never shown to the arbiter, which comes from the same developer. It has no letter; its rating is set beside the verdict afterwards, so it can be checked against a judgement it could not have swayed.',
		showModelsReasoning: 'Show the models’ reasoning',
		hideModelsReasoning: 'Hide the models’ reasoning',
		modelsReasoningLoading: 'Loading the models’ reasoning…',
		comparisonNote:
			'The panel arbiter weighed every analysis it was shown at once, not only the two compared here.',
		whyReviewed: 'Why this article was reviewed',
		whyReviewedNote:
			'How far apart the ratings shown to the arbiter sit on each scale, in steps. A reversal of direction on polarity — one model reading the coverage as favourable, another as hostile — is what put the article in front of the arbiter.',
		valenceFlipTag: 'Positive against negative',
		samplingFrameNoteSpread:
			'The arbiter did not review the whole corpus. It reviewed the articles where the panel’s ratings were furthest apart on at least one dimension, so every percentage below holds only where such a disagreement already exists. None of them measures which model is better across the corpus as a whole.',
		samplingFrameNoteUnion:
			'The arbiter did not review the whole corpus. It reviewed the articles where the panel’s ratings were furthest apart on at least one dimension, or where the panel contradicts itself about whether the coverage is favourable or hostile, so every percentage below holds only where such a disagreement already exists. None of them measures which model is better across the corpus as a whole.',
		spread: 'Spread',
		arbiterScore: 'Arbiter’s own rating',
		verdict: 'Verdict',
		confidence: 'Confidence',
		noData: 'No panel arbiter verdicts yet',
		noDataDescription:
			'This version of the dashboard does not include the panel arbiter’s verdicts. They come from a paid run launched by hand, so this view stays empty until one has been published.',
		loading: 'Loading arbiter data…',
		// Methodology
		methodologyTitle: 'How the panel arbiter works',
		methodologySubtitle: 'One judge compares every generation-2 analysis at once',
		blindEvaluation: 'Blind review',
		blindEvaluationDesc:
			'The analyses are anonymised as {firstLabel} to {lastLabel} by a single random shuffle, fixed for the whole run.',
		selectionProcess: 'How articles were chosen',
		selectionProcessDesc:
			'An article qualifies when at least one model reads the coverage as positive and another reads it as negative — a disagreement about the direction of the coverage, not its degree. This deliberately reaches further than the dashboard’s own threshold for flagging a disagreement: the commonest reversal of all, one model answering Positif where another answers Négatif, sits only two ranks apart, and no threshold high enough to be meaningful can select it. Articles where any model reports that the task does not apply — or, for Qwen3.8 27B, never returned an answer at all — are left out rather than counted as a maximal disagreement.',
		whyPolarity: 'Why polarity, and not centrality',
		whyPolarityDesc:
			'The panel agrees far more about centrality than about polarity: all {models} models the arbiter reads give the same centrality rating on {centrality} of the articles they all rated, against {polarity} for polarity, leaving aside “Not applicable” answers. Paying a judge to settle centrality would mostly buy verdicts on questions the panel already answers consistently on its own. It is also the dimension where Mistral Small 4 diverges most from the others, so a centrality-led selection fills up with one model standing alone against the rest. Choosing on polarity keeps both the dimension the research question turns on and the one the panel finds hardest.',
		randomOrder: 'The order is shuffled per article',
		randomOrderDesc:
			'The analyses are anonymised as {firstLabel} to {lastLabel} by a single shuffle fixed for the whole run, so a label always means the same model. The order the blocks are laid out in is then shuffled again for each article. Without that second shuffle one model would hold the first position on every article, and a judge’s tendency to favour what it reads first would be impossible to tell apart from a genuine preference for that model. Over the 231 verdicts naming a single model, the winning analysis sat first in only 30. Against an even split that is χ² = 8.9 on 4 degrees of freedom (p = 0.06); allowing for which model happened to sit where, χ² = 3.8 (permutation p = 0.33). Neither is significant, but the check has little power.',
		frameCaveat: 'What the sample mostly contains',
		frameCaveatDesc:
			'Selecting on reversals of direction does not make the sample balanced across models. In {count} of the {total} articles, {dissenter} stands alone on one side of the neutral line while the others stand on the other — in {negative} of them it is the one reading the coverage as negative. A strict split of one against the rest, where the other {rest} carry exactly the same label, is rarer: {strict} articles. The arbiter’s own polarity rating coincides with {dissenter}’s in {match} articles, against {othersLow} to {othersHigh} for each of the others. Much of what the verdicts document is therefore one model’s calibration on polarity, and the head-to-head shares should be read with that in mind.',
		noiseCaveat: 'Some of the disagreement is noise',
		noiseCaveatDesc:
			'These are single annotations, and the models do not fully reproduce themselves: in informal re-runs on the same articles during the pilot, a model returned the same polarity 70–80% of the time. Part of any disagreement is therefore a different draw rather than a different reading, and no arbiter can tell the two apart. That is the reason for selecting on reversals of direction, which a re-draw is unlikely to produce, instead of one-step differences.',
		recusal: 'Recusal',
		recusalDesc:
			'{recused} joined the panel after the arbiter had run, and it comes from Anthropic, as the arbiter does. Anonymous labels hide a model’s name but not its style, and AI judges measurably favour their own output and that of related models, so {recused} is never shown to the arbiter: the selection, the prompt and the letters cover the others. Its ratings are compared with the verdicts afterwards. On the {total} articles reviewed, its polarity coincides with the arbiter’s in {match}, against {othersLow} to {othersHigh} for the models other than {dissenter} — no sign of a reading the two Anthropic models share. What recusal cannot do is weigh {recused}’s own dissents: the {flips} reversals of direction that exist only because of it are outside the frame, and settling them would take a judge from another developer.',
		caveatFiguresPending:
			'The figures for this caveat are computed from the published verdicts and the panel’s ratings; they appear once the ratings have loaded.',
		fullText: 'The full article text',
		fullTextDesc:
			'The arbiter reads the article from the private mirror of the collection, where the text is complete. The v1 arbiter read the public version, which masks the text of a large share of articles, so some v1 verdicts were reached without the article in front of the judge.',
		independentVerdict: 'Independent verdict',
		independentVerdictDesc:
			'The arbiter is instructed to rate the article itself before comparing the analyses. It sees the analyses in the same request, so its own rating is not formed independently of them.',
		reasoningEffort: 'Reasoning effort',
		reasoningEffortDesc:
			'Claude Opus 5 thinks adaptively, so the run sets an effort level rather than a token budget. That setting is also what the run costs.',
		howItWorks: 'How it works',
		step1: 'It reads the full text of the article',
		step2: 'It is instructed to rate polarity, subjectivity and centrality on its own first',
		step3:
			'It compares the anonymised analyses, which it sees in the same request, with that rating',
		step4:
			'It names the most accurate analysis per dimension, or says that several tie or that none is right',
		arbiterModel: 'Arbiter model',
		arbiterModelDesc:
			'Claude Opus 5 judges every analysis of an article in a single call, so its verdicts hold together in a way that {pairs} separate pairwise runs could not.',
		viewPrompt: 'View the prompt',
		promptExplanation:
			'The French system instruction and user prompt sent to the arbiter, word for word.',
		promptVersionCaveat:
			'The published verdicts were judged under prompt v2.2.0, which gave the arbiter a shorter scale reference than the codebook the annotating models followed, and one rule that differed: it counted a mention by proper name alone as Marginal, where the codebook says a religion guessable only from a name does not count.',
		viewFullPrompt: 'View the full prompt',
		arbiterPrompt: 'Panel arbiter prompt',
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
		distinctiveKeywords: 'Most distinctive keywords',
		categorySize: '{category}: {count} articles, {share} of {total}',
		shareOfCorpus: 'Share of articles',
		oppositeCount: 'Articles in “{category}”',
		distinctiveScore: 'Distinctiveness (z)',
		ranking: 'Ranking',
		rankingCount: 'Frequency',
		rankingDistinctive: 'Distinctive',
		countNote:
			'Raw counts: how many articles in this category carry each keyword. The commonest subjects of the whole corpus rank first in every category, so compare categories with the Distinctive ranking.',
		distinctiveNote:
			'Ranked by a log-odds ratio with an informative Dirichlet prior (Monroe, Colaresi & Quinn 2008), contrasting this category with its opposite pole, “{opposite}”. A high score means the keyword is over-represented here relative to the other pole; only keywords carried by at least five articles in this category are ranked. Shares are of the whole corpus, or under country/newspaper filters of the matching articles that fall in at least one category.',
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
			'Compare how GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B, Qwen3.8 27B and Claude Haiku 5.5 rated the same articles from the Islam West Africa Collection, and see where their readings of the press coverage part company.',
		comparisonKeywords:
			'AI comparison, GPT-5.6 Luna vs Mistral Small 4 vs DeepSeek vs Gemma vs Qwen vs Claude Haiku, model comparison, sentiment analysis, IWAC, AI evaluation',
		viewDescriptionPrefix: 'Explore ',
		viewDescriptionSuffix:
			' in the AI sentiment annotations of the Islam West Africa Collection, a corpus of francophone West African press coverage of Islam and Muslims.',
		baseKeywords: 'sentiment analysis, IWAC, Islam West Africa, data visualisation',
		ogImageAlt:
			'IWAC Sentiment Analysis — polarity distributions from GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B, Qwen3.8 27B and Claude Haiku 5.5 across 12,348 francophone West African press articles',
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
				description: 'how far the AI models agree, and how they differ when they do not',
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
