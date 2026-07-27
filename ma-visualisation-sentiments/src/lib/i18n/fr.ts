import type { Translations } from './types.js';

export const fr: Translations = {
	// App header and branding
	appTitle: 'Analyse de sentiments CIAO',
	appSubtitle: "Collection Islam Afrique de l'Ouest – Visualisation et exploration",
	enterFullscreen: 'Passer en plein écran',
	exitFullscreen: 'Quitter le mode plein écran',

	// Navigation
	nav: {
		charts: 'Graphiques',
		trends: 'Tendances',
		distribution: 'Distribution',
		volume: 'Volume',
		heatmap: 'Carte de chaleur',
		table: 'Tableau',
		comparison: 'Comparaison',
		seasonality: 'Saisonnalité',
		ranking: 'Journaux',
		map: 'Carte',
		agreement: 'Accord',
		extremes: 'Analyses extrêmes',
		arbiter: 'Arbitre'
	},

	// Filters
	filters: {
		title: 'Facettes',
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
		selectedCentralities: 'Centralités sélectionnées',
		sentimentCriteria: "Critères d'analyse des sentiments",
		subjectivityScore: 'Score de subjectivité',
		ratherObjective: 'Plutôt objectif',
		mixedSubjectivity: 'Subjectivité mixte',
		ratherVerySubjective: 'Plutôt/très subjectif',
		averageCentrality: 'Centralité moyenne',
		level: 'Niveau',
		veryObjectiveScore: 'Très objectif',
		ratherObjectiveScore: 'Plutôt objectif',
		mixedScore: 'Mixte',
		ratherSubjectiveScore: 'Plutôt subjectif',
		verySubjectiveScore: 'Très subjectif',
		numberOfArticles: "Nombre d'articles",
		polarityRange: 'Plage de polarité',
		centralityLevel: 'Niveau de centralité',
		reset: 'Réinitialiser'
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
		factual: 'Très objectif',
		ratherFactual: 'Plutôt objectif',
		mixed: 'Mixte',
		ratherSubjective: 'Plutôt subjectif',
		subjective: 'Très subjectif',
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

	// Classement des journaux
	ranking: {
		title: 'Journaux',
		subtitle:
			'Les journaux classés par sentiment moyen, avec intervalles de confiance à 95 %. Les titres comptant moins d\u2019articles évalués présentent des intervalles plus larges : une moyenne élevée sur un petit échantillon n\u2019est pas un résultat solide.',
		chartTitle: 'Classement des journaux',
		chartSubtitle: 'Moyenne et IC à 95 % · titres comptant au moins {min} articles évalués',
		netPolarity: 'Polarité nette',
		meanSubjectivity: 'Subjectivité moyenne',
		meanCentrality: 'Centralité moyenne',
		confidenceInterval: 'IC à 95 %',
		neutralLine: 'neutre',
		minArticles: 'Articles min.',
		excludedNote:
			'{count} journaux écartés : moins de {min} articles évalués. Leurs moyennes seraient trop incertaines pour être classées.',
		noneAboveThreshold:
			'Aucun journal ne compte au moins {min} articles évalués avec les filtres actuels.'
	},

	// Carte des lieux
	map: {
		title: 'Carte',
		subtitle:
			'Où le corpus porte son regard. Une bulle par lieu indexé dans les articles, dimensionnée selon le nombre d’articles qui le mentionnent et colorée par leur polarité moyenne.',
		articlesMentioning: 'articles mentionnant ce lieu',
		meanPolarity: 'Polarité moyenne',
		scoredArticles: 'Articles notés',
		caveat:
			'Une bulle compte les articles qui MENTIONNENT un lieu, et non les articles qui portent sur lui. Chaque article indexe environ quatre lieux, si bien que les totaux dépassent le nombre d’articles. La polarité moyenne est le sentiment au niveau de l’article sur une échelle de 1 à 5, moyennée sur les articles notés ; « Non applicable » est exclu de la moyenne mais reste comptabilisé. Les lieux sans coordonnées dans le fichier d’autorité IWAC sont absents.',
		noPlacesTitle: 'Aucun lieu cartographié',
		noPlacesLede:
			'Aucun article de la sélection actuelle n’indexe un lieu dont les coordonnées sont connues.',
		loadErrorTitle: 'Données cartographiques indisponibles'
	},

	// Saisonnalité du calendrier hégirien
	seasonality: {
		title: 'Saisonnalité',
		subtitle:
			'La couverture au fil du calendrier lunaire islamique. Comme l\u2019année hégirienne se décale par rapport au calendrier grégorien, ce motif reste invisible dans toute vue par année ou par mois.',
		chartTitle: 'Couverture par mois hégirien',
		chartSubtitle: 'Volume d\u2019articles et centralité moyenne au fil de l\u2019année lunaire',
		cycleLayout: 'Cycle',
		coverageIndex: 'Indice de couverture',
		calendarNote:
			'Dates converties selon le calendrier islamique tabulaire (arithmétique), époque civile. Il diffère d\u2019un ou deux jours des dates d\u2019observance annoncées localement : suffisant pour des agrégats mensuels, mais pas pour dater une observance précise.',
		undatedNote: '{count} articles exclus : date de publication incomplète.',
		months: {
			muharram: 'Mouharram',
			safar: 'Safar',
			rabiI: 'Rabi I',
			rabiII: 'Rabi II',
			jumadaI: 'Joumada I',
			jumadaII: 'Joumada II',
			rajab: 'Rajab',
			shaban: 'Chaabane',
			ramadan: 'Ramadan',
			shawwal: 'Chawwal',
			dhuAlQadah: 'Dhou al-Qi\u2019da',
			dhuAlHijjah: 'Dhou al-Hijja'
		}
	},

	// Accord / calibration
	agreement: {
		title: 'Accord',
		subtitle:
			'Comment les modèles se rapportent les uns aux autres : où ils convergent, où ils divergent, et si un désaccord relève d\u2019un décalage systématique ou d\u2019un conflit réel.',
		dimensionSelector: 'Dimension d\u2019analyse',
		exactAgreement: 'Accord exact',
		exactAgreementHelp:
			'Proportion d\u2019articles pour lesquels les deux modèles ont choisi la même catégorie. Non corrigée de l\u2019accord attendu par hasard.',
		adjacentAgreement: 'À un cran près',
		adjacentDetail: 'Identique ou à une catégorie d\u2019écart',
		adjacentAgreementHelp:
			'Proportion d\u2019articles dont les deux étiquettes sont identiques ou séparées d\u2019exactement une position sur l\u2019échelle ordinale.',
		articlesCompared: 'articles comparés',
		kappa: 'κ de Cohen',
		kappaHelp:
			'Accord corrigé du hasard. 0 signifie pas mieux que le hasard ; 1 signifie parfait. Tous les désaccords comptent également, si bien qu\u2019une échelle ordinale décalée d\u2019une catégorie obtient un score faible.',
		weightedKappa: 'κ pondéré',
		weightedKappaHelp:
			'Kappa à pondération quadratique. Se tromper d\u2019une catégorie coûte bien moins que de s\u2019en écarter de quatre, ce qui convient aux échelles ordinales. Un score pondéré nettement supérieur au score non pondéré indique que les modèles classent de façon semblable mais se calibrent différemment.',
		fleissKappa: 'κ de Fleiss',
		fleissHelp:
			'Kappa de Fleiss sur les trois modèles simultanément, pour les articles analysés par tous.',
		threeWayTitle: 'Les trois modèles',
		threeWayLede:
			'Accord entre ChatGPT, Gemini et Mistral simultanément, par dimension. Seuls les articles analysés par les trois sont comptabilisés.',
		matrixTitle: 'Matrice d\u2019accord',
		rowsAre: 'Lignes :',
		columnsAre: 'Colonnes :',
		ofRow: 'De cette ligne',
		calibrationTitle: 'Calibration des modèles',
		calibrationSubtitle: 'La distribution propre à chaque modèle sur l\u2019échelle',
		systematicOffsetNote:
			'L\u2019accord pondéré est ici nettement supérieur à l\u2019accord non pondéré. C\u2019est la signature d\u2019un décalage systématique plutôt que d\u2019un conflit réel : {modelA} et {modelB} classent les articles de manière semblable mais placent les frontières entre catégories à des endroits différents, de sorte que l\u2019essentiel de leur désaccord tient à un seul cran d\u2019écart.',
		strength: {
			poor: 'Nul',
			slight: 'Faible',
			fair: 'Passable',
			moderate: 'Modéré',
			substantial: 'Important',
			almostPerfect: 'Presque parfait'
		}
	},

	// Données sous-jacentes des graphiques
	chartData: {
		showData: 'Données',
		month: 'Mois',
		articles: 'Articles',
		coverageIndex: 'Indice de couverture',
		meanCentrality: 'Centralité moyenne',
		newspaper: 'Journal',
		mean: 'Moyenne',
		ciLow: 'IC bas',
		ciHigh: 'IC haut',
		modelALabel: 'Modèle A',
		modelBLabel: 'Modèle B',
		count: 'Effectif',
		rowPercent: '% de la ligne',
		seasonalityCaption: 'Volume d\u2019articles et centralité moyenne par mois hégirien',
		rankingCaption: 'Journaux classés par moyenne, avec intervalles de confiance',
		matrixCaption: 'Tableau croisé des étiquettes des deux modèles'
	},

	// Chart titles and labels
	charts: {
		polarityDistribution: 'Distribution de la polarité',
		subjectivityDistribution: 'Distribution de la subjectivité',
		sentimentTrends: 'Tendances des sentiments',
		subjectivityTrends: 'Tendances de la subjectivité',
		correlationDistribution: 'Distribution croisée',
		volumeByCountry: "Volume d'articles par pays",
		centralityHeatmap: 'Heatmap de centralité',
		articlesAnalyzed: 'articles analysés',
		globalDistribution: 'Distribution globale',
		byJournal: 'par journal',
		byYear: 'par année',
		stackedAreas: 'Aires empilées',
		lines: 'Lignes',
		bars: 'Barres',
		countMode: 'Effectif',
		shareMode: 'Part',
		pie: 'Camembert',
		polaritySubjectivityDistribution: 'Distribution Polarité × Subjectivité',
		subtitle:
			'Visualisez la distribution des sentiments selon les dimensions de polarité et de subjectivité.'
	},

	// Trends view
	trends: {
		subtitle: "Suivez l'évolution des sentiments au fil du temps à travers les publications."
	},

	// Volume view
	volume: {
		subtitle: 'Analysez le volume de publications et les tendances temporelles dans le corpus.'
	},

	// Heatmap view
	heatmap: {
		subtitle:
			'Explorez les patterns de centralité par pays et thèmes avec une visualisation interactive.'
	},

	// Correlation/Distribution view
	correlation: {
		subtitle: 'Analysez la relation entre les dimensions de polarité et de subjectivité.',
		spearman: 'ρ de Spearman',
		strengthLabel: 'Force',
		rhoNote:
			'Corrélation de rang entre polarité et subjectivité. Les deux échelles étant ordinales, on utilise les rangs plutôt que les valeurs codées. Les articles marqués « Non applicable » sont exclus.',
		strength: {
			negligible: 'Négligeable',
			weak: 'Faible',
			moderate: 'Modérée',
			strong: 'Forte'
		}
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
		noFilteredArticles: 'Aucun article ne correspond aux filtres sélectionnés',
		articleTitle: 'Titre',
		subtitle:
			'Parcourez et recherchez tous les articles avec leurs données de sentiment détaillées.'
	},

	// Article details
	article: {
		details: "Détails de l'article",
		metadata: 'Métadonnées',
		analysis: 'Analyse de sentiment',
		polarityJustification: 'Justification de la polarité',
		subjectivityJustification: 'Justification de la subjectivité',
		centralityJustification: 'Justification de la centralité',
		close: 'Fermer',
		titleNotAvailable: 'Titre non disponible',
		publicationDate: 'Date de publication',
		linkToFullArticle: "Lien vers l'article complet",
		consultOriginalArticle: "Consulter l'article original →",
		noAnalysisData:
			"Les données d'analyse des sentiments ne sont pas disponibles pour cet article.",
		noArticleSelected: 'Aucun article sélectionné',
		selectArticlePrompt:
			"Sélectionnez un article dans le tableau pour voir ses détails d'analyse des sentiments.",
		justification: 'Justification'
	},

	// Analysis info
	analysis: {
		title: "Méthodologie d'analyse",
		methodologyIntro:
			"Ce tableau de bord explore le potentiel de l'IA comme partenaire de recherche pour l'analyse de grands corpus. La prolifération de l'archivage numérique a produit de vastes collections qui dépassent souvent les capacités de traitement humain. Grâce à la « lecture distante » (Moretti 2000), les techniques computationnelles peuvent parcourir des milliers d'articles et révéler des motifs que les méthodes traditionnelles manqueraient.",
		methodologyCorpus:
			"Cette expérience analyse comment l'islam et les musulmans sont représentés dans la presse ouest-africaine. Au lieu de coder manuellement des milliers d'articles—ce qui introduirait des incohérences—l'ensemble du corpus de",
		methodologyCorpusArticles: 'articles issus de la',
		methodologyCorpusDeveloper:
			', une base de données numérique collaborative et en libre accès développée par',
		methodologyCorpusEnd:
			", a été analysé à l'aide de trois LLMs : GPT-5 mini d'OpenAI, Gemini 3 Flash de Google et Ministral 3 14B de Mistral. Chaque article a été évalué selon trois dimensions complémentaires :",
		methodology:
			"Cette visualisation présente une analyse automatisée des sentiments concernant la représentation de l'islam et des musulmans dans la presse d'Afrique de l'Ouest francophone. Les articles analysés sont issus de la",
		methodologyAiModel: "Méthodologie et modèle d'IA",
		modelUsed: 'Modèle utilisé',
		modelDescription: "L'analyse a été réalisée avec",
		modelDetails:
			", un modèle de la série GPT-5 d'OpenAI (« GPT-5 mini », août 2025). Il offre une fenêtre de contexte de 400 000 tokens et des capacités de raisonnement améliorées, alliant qualité et coût maîtrisé pour de grands corpus en français.",
		modelSummary: 'Résumé du modèle',
		modelUsageGuide: "Guide d'utilisation",
		modelDocsLink: 'Documentation du modèle',
		modelSpecs: 'Spécifications du modèle',
		technicalConfiguration: 'Configuration technique',
		temperatureConfig: 'Température : 0.2 (pour une sortie déterministe)',
		outputFormat: 'Format de sortie : JSON structuré avec validation Pydantic',
		cacheSystem: 'Système de cache pour éviter les analyses redondantes',
		errorHandling: 'Gestion automatique des erreurs avec tentatives multiples',
		analysisPrompt: "Prompt d'analyse",
		promptDescription: 'Le modèle reçoit un prompt spécialisé qui :',
		promptFeature1:
			"Définit le rôle d'expert en analyse de sentiments pour l'Afrique de l'Ouest francophone",
		promptFeature2:
			"Spécifie les critères d'évaluation pour chaque dimension (polarité, subjectivité, centralité)",
		promptFeature3: 'Fournit des barèmes détaillés avec des exemples concrets',
		promptFeature4: 'Demande une justification pour chaque classification',
		promptFeature5: 'Impose un format de sortie JSON structuré pour garantir la cohérence',
		viewFullPrompt: 'Voir le prompt complet',
		limitationsTitle: 'Limites et précautions',
		limitationsDescription:
			"Cette analyse automatisée constitue un outil d'aide à la recherche. Les résultats peuvent nécessiter une validation humaine pour les cas complexes ou ambigus. Les justifications fournies par l'IA permettent d'évaluer la pertinence de chaque classification.",
		notApplicableNote: "L'article ne traite pas de l'islam ou des musulmans",
		polaritySection: 'Polarité du sentiment',
		subjectivitySection: 'Subjectivité',
		centralitySection: "Centralité de l'islam/musulmans",
		polarityDescription:
			"Évalue le sentiment général exprimé DANS L'ARTICLE ENVERS l'islam et/ou les musulmans, ou concernant leur représentation.",
		subjectivityDescription:
			"Évalue le degré d'objectivité/subjectivité de l'article DANS SA MANIÈRE DE REPRÉSENTER l'islam et/ou les musulmans sur une échelle de 1 (très objectif) à 5 (très subjectif).",
		centralityDescription:
			"Évalue l'importance accordée aux thèmes liés à l'islam et aux musulmans dans l'article.",
		veryPositiveDesc:
			"Le portrait de l'islam/des musulmans est extrêmement favorable, enthousiaste, élogieux",
		positiveDesc: "Le portrait de l'islam/des musulmans est favorable, optimiste",
		neutralDesc:
			"Pas de sentiment clair envers l'islam/des musulmans ou équilibre entre aspects positifs et négatifs dans leur représentation ; ton factuel sans charge émotionnelle marquée à leur égard",
		negativeDesc: "Le portrait de l'islam/des musulmans est défavorable, critique, pessimiste",
		veryNegativeDesc:
			"Le portrait de l'islam/des musulmans est extrêmement défavorable, alarmiste, très critique",
		factualDesc:
			"Rapporte des faits vérifiables sur l'islam/les musulmans sans exprimer d'opinions ou de sentiments personnels à leur sujet, style purement informatif sur ce thème",
		ratherFactualDesc:
			"Principalement factuel concernant l'islam/les musulmans, mais peut contenir des traces subtiles d'opinions ou des choix de mots suggérant une perspective limitée sur ce thème",
		mixedDesc:
			"Contient un mélange équilibré de faits et d'opinions/sentiments personnels concernant l'islam/les musulmans, ou présente plusieurs points de vue sur ce thème",
		ratherSubjectiveDesc:
			"Exprime clairement des opinions, des sentiments ou des jugements sur l'islam/les musulmans, même s'il s'appuie sur certains faits pour les étayer",
		subjectiveDesc:
			"Fortement biaisé dans sa représentation de l'islam/des musulmans, exprime des opinions et des émotions intenses à leur sujet, avec peu ou pas de présentation objective des faits, style éditorial ou billet d'humeur sur ce thème",
		veryCentralDesc: "L'islam/musulmans constituent le sujet principal de l'article",
		centralDesc: "Thème important mais partagé avec d'autres sujets",
		secondaryDesc: 'Mentionné de manière significative mais secondaire',
		marginalDesc: 'Évoqué brièvement ou de manière anecdotique',
		notAddressedDesc: "Aucune mention de l'islam ou des musulmans"
	},

	// Loading and messages
	messages: {
		loading: 'Chargement...',
		loadingData: 'Chargement des données du corpus IWAC...',
		noData: 'Aucune donnée disponible',
		error: "Une erreur s'est produite",
		shareUrl: 'Partager cette vue',
		urlCopied: 'URL copiée dans le presse-papiers'
	},

	// Export
	export: {
		exportCSV: 'Exporter CSV',
		downloadCSV: 'Télécharger les données au format CSV',
		exporting: 'Export en cours',
		noDataToExport: 'Aucune donnée à exporter',
		exportError: "Erreur lors de l'export des données",
		polarityJustification: 'Justification polarité',
		subjectivityJustification: 'Justification subjectivité',
		centralityJustification: 'Justification centralité',
		articleId: 'ID article'
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
		article: 'article',
		viewMore: 'Voir plus',
		viewLess: 'Retour à la liste',
		previous: 'Précédent',
		next: 'Suivant',
		sortBy: 'Trier par',
		of: 'sur',
		tableView: 'Tableau',
		cardView: 'Cartes'
	},

	// Datasets
	datasets: {
		selectModel: 'Sélectionner le modèle',
		availableModels: 'Modèles disponibles',
		comparisonMode: 'Mode comparaison',
		compareModels: 'Comparer les modèles'
	},

	// Comparison
	comparison: {
		byDecade: 'Décennie',
		disagreementBreakdown: 'Où les modèles divergent',
		disagreementBreakdownNote:
			'Écart moyen par article, réparti par décennie ou par pays. Les groupes comptant moins de 20 articles comparés sont omis : leurs moyennes varieraient au gré de quelques cas.',
		subtitle:
			"Comparez les analyses de sentiment entre différents modèles d'IA et identifiez les divergences significatives.",
		filterByDiscrepancy: 'Filtrer par divergence',
		differenceRange: 'Plage de différence',
		quickFilters: 'Filtres rapides',
		pointDifference: 'point de différence',
		pointsDifference: 'points de différence',
		compareDimensions: 'Comparer les dimensions',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		totalDiscrepancy: 'Divergence totale',
		totalDiscrepancies: 'Divergences totales',
		articlesWithDifferences: 'Articles avec différences',
		averageDiscrepancy: 'Divergence moyenne',
		pointsPerArticle: 'Points par article',
		totalArticles: 'Total des articles',
		articlesAnalyzed: 'Articles analysés',
		highConflicts: 'Conflits élevés',
		significantDifferences: 'Différences significatives',
		significantDifferencesExplanation:
			"Articles où une dimension (polarité, subjectivité ou centralité) diffère de 3+ points entre les analyses ChatGPT et Gemini. Cela indique un désaccord substantiel entre les modèles d'IA.",
		totalDiscrepanciesExplanation:
			"Nombre d'articles où ChatGPT et Gemini fournissent des analyses différentes (toute différence > 0 points)",
		averageDiscrepancyExplanation:
			'Moyenne des points de différence totale par article sur les trois dimensions (polarité + subjectivité + centralité)',
		breakdownByDimension: 'Répartition par dimension',
		enableComparisonMode: 'Activer le mode comparaison',
		enableComparisonDescription:
			'Cliquez sur le bouton de comparaison dans le sélecteur de dataset pour comparer les analyses ChatGPT et Gemini.',
		noDiscrepancies: 'Aucune divergence trouvée',
		adjustFilters:
			"Essayez d'ajuster vos filtres pour voir les articles avec des différences entre les modèles.",
		excludeNonApplicable: 'Exclure les articles "Non applicable"',
		excludeNonApplicableDescription:
			'Masquer les articles où un modèle a marqué la centralité comme "Non applicable", ce qui crée des divergences artificiellement élevées.',
		dimensionsExplanation:
			'Sélectionnez les dimensions à analyser pour les désaccords entre modèles :',
		polarityExplanation: 'Différences de sentiment positif/négatif',
		subjectivityExplanation: 'Différences objectivité vs. opinion (échelle 1-5)',
		centralityExplanation: "Importance de l'Islam/Musulmans dans l'article",
		dimensionsNote:
			'Astuce : Sélectionnez une seule dimension pour concentrer votre analyse sur des types spécifiques de désaccords. Les scores de divergence seront recalculés selon votre sélection.',
		// Model pair picker
		selectModelPair: 'Sélectionner les modèles à comparer',
		chatgptVsGemini: 'ChatGPT vs Gemini',
		chatgptVsMistral: 'ChatGPT vs Mistral',
		geminiVsMistral: 'Gemini vs Mistral',
		modelALabel: 'Modèle A',
		modelBLabel: 'Modèle B'
	},

	// Arbiter
	arbiter: {
		samplingFrame: 'Base de sondage',
		coverageEvaluated: 'évalués',
		coverageCorpus: 'dans le corpus',
		samplingFrameNote:
			'L\u2019arbitre n\u2019a pas examiné l\u2019ensemble du corpus, mais des articles retenus parce que les deux modèles y divergeaient le plus fortement. Tous les pourcentages ci-dessous sont donc conditionnels à l\u2019existence d\u2019un désaccord : ils ne mesurent pas quel modèle est meilleur sur l\u2019ensemble du corpus.',
		title: "Verdict de l'arbitre",
		subtitle: "Évaluation aveugle par un troisième modèle d'IA (identités des modèles masquées)",
		modelName: 'Gemini 3 Pro',
		verdict: 'Verdict',
		overallVerdict: 'Verdict général',
		confidenceLevel: 'Niveau de confiance',
		confidenceHigh: 'Élevé',
		confidenceMedium: 'Moyen',
		confidenceLow: 'Faible',
		evaluationsNoun: 'évaluations',
		verdictsNoun: 'verdicts',
		preferredModel: 'Modèle préféré',
		prefers: 'Préfère',
		prefersChatGPT: 'ChatGPT est plus précis',
		prefersGemini: 'Gemini est plus précis',
		prefersBoth: 'Les deux sont également précis',
		prefersNeither: "Aucun n'est précis",
		arbiterScore: "Score de l'arbitre",
		arbiterJustification: "Justification de l'arbitre",
		verdictExplanation: 'Pourquoi cette préférence',
		noArbiterData: "Pas de données d'arbitre",
		noArbiterDataDescription:
			"L'évaluation de l'arbitre n'est pas disponible pour cet article. Exécutez le script d'évaluation de l'arbitre pour générer les verdicts.",
		polarityVerdict: 'Verdict de polarité',
		subjectivityVerdict: 'Verdict de subjectivité',
		centralityVerdict: 'Verdict de centralité',
		showArbiterVerdict: "Afficher le verdict de l'arbitre",
		hideArbiterVerdict: "Masquer le verdict de l'arbitre",
		loadingArbiter: "Chargement des données de l'arbitre...",
		arbiterNotAvailable: "Évaluation de l'arbitre non disponible",
		runArbiterScript: 'Exécutez arbiter-evaluation.py pour générer les évaluations',
		// Summary statistics
		summaryTitle: "Résumé de l'arbitre",
		articlesEvaluated: 'articles évalués',
		chatgptPreferred: 'ChatGPT préféré',
		geminiPreferred: 'Gemini préféré',
		bothEqual: 'Égalité',
		neitherAccurate: 'Aucun précis',
		preferred: 'préféré',
		blindEvaluationNote: "Évaluation aveugle : les modèles étaient anonymisés pendant l'évaluation",
		// Arbiter View page
		viewTitle: "Analyse de l'arbitre",
		viewSubtitle: "Explorez les désaccords entre modèles et les verdicts d'un tiers IA",
		overallStats: 'Statistiques globales',
		verdictDistribution: 'Distribution des verdicts',
		verdictsByDimension: 'Verdicts par dimension',
		confidenceDistribution: 'Distribution de la confiance',
		totalVerdicts: 'Total des verdicts',
		modelPreference: 'Préférence de modèle',
		agreementRate: "Taux d'accord",
		dimension: 'Dimension',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		allDimensions: 'Toutes les dimensions',
		modelAWins: 'Victoires Modèle A',
		modelBWins: 'Victoires Modèle B',
		ties: 'Égalités',
		selectModelPair: 'Sélectionner les modèles',
		noDataForPair: "Pas de données d'arbitrage disponibles pour cette paire de modèles",
		runScript: "Exécutez le script d'évaluation de l'arbitre pour générer les données",
		filterByDimension: 'Filtrer par dimension',
		filterByConfidence: 'Filtrer par confiance',
		// Methodology section
		methodologyTitle: "Méthodologie de l'arbitre",
		methodologySubtitle: 'Comment le juge IA tiers évalue les désaccords entre modèles',
		blindEvaluation: 'Évaluation aveugle',
		blindEvaluationDesc:
			"Les identités des modèles sont masquées. L'arbitre ne voit que « Modèle A » et « Modèle B ».",
		highReasoning: 'Mode de raisonnement élevé',
		highReasoningDesc: 'Gemini 3 Pro utilise la réflexion étendue pour une analyse approfondie.',
		independentVerdict: 'Verdict indépendant',
		independentVerdictDesc: "L'arbitre fournit sa propre évaluation avant de comparer les modèles.",
		howItWorks: 'Fonctionnement',
		selectionProcess: 'Sélection des articles',
		selectionProcessDesc:
			"Les articles présentant des désaccords significatifs (≥3 points de différence sur une dimension) entre les deux modèles sont sélectionnés pour l'arbitrage.",
		blindAssignment: 'Attribution aveugle',
		blindAssignmentDesc:
			"Pour chaque paire de modèles, un modèle est assigné aléatoirement comme « Modèle A » et l'autre comme « Modèle B ». Cette attribution est cohérente pour tous les articles de la paire afin de garantir une évaluation impartiale.",
		evaluationProcess: "Processus d'évaluation",
		step1: "L'arbitre lit le texte complet de l'article",
		step2:
			'Il fournit ses propres scores indépendants pour la polarité, la subjectivité et la centralité',
		step3: 'Il compare les analyses des deux modèles à sa propre évaluation',
		step4: 'Il détermine quel modèle est le plus précis avec des justifications détaillées',
		arbiterModel: 'Modèle arbitre',
		arbiterRole: 'Juge tiers',
		geminiArbiterDesc:
			'Gemini 3 Pro est utilisé comme arbitre avec le niveau de raisonnement élevé activé. Cela permet une réflexion approfondie et une analyse plus nuancée lors de la comparaison des sorties des modèles.',
		evaluationScales: "Échelles d'évaluation",
		viewPrompt: 'Voir le prompt',
		promptExplanation:
			"L'arbitre utilise une instruction système soigneusement conçue et un modèle de prompt utilisateur pour garantir une évaluation cohérente et approfondie.",
		viewFullPrompt: 'Voir le prompt complet',
		arbiterPrompt: "Prompt de l'arbitre",
		systemInstruction: 'Instruction système',
		userPromptTemplate: 'Modèle de prompt utilisateur',
		// Scale descriptions
		polarityVeryPositive: 'Portrait extrêmement favorable, enthousiaste',
		polarityPositive: 'Portrait favorable, optimiste',
		polarityNeutral: 'Pas de sentiment clair ou équilibre ; ton factuel',
		polarityNegative: 'Portrait défavorable, critique',
		polarityVeryNegative: 'Portrait extrêmement défavorable, alarmiste',
		subjectivity1: 'Très objectif – purement informatif',
		subjectivity2: 'Plutôt objectif – principalement factuel',
		subjectivity3: 'Mixte – équilibre entre faits et opinions',
		subjectivity4: 'Plutôt subjectif – opinions claires',
		subjectivity5: 'Très subjectif – fortement biaisé',
		centralityVeryCentral: "Sujet principal de l'article",
		centralityCentral: "Important mais partagé avec d'autres sujets",
		centralitySecondary: 'Mentionné significativement mais secondaire',
		centralityMarginal: 'Mentionné brièvement ou anecdotiquement',
		centralityNotAddressed: "Aucune mention de l'islam ou des musulmans",
		// Head-to-head comparison
		headToHead: 'Comparaison directe',
		excludingTies: '(hors égalités et « aucun précis »)',
		wins: 'victoires',
		// Evaluated articles table
		evaluatedArticles: 'Articles évalués',
		evaluatedArticlesSubtitle: "Articles analysés par l'arbitre pour résoudre les désaccords",
		viewArticleDetails: "Voir les détails de l'article",
		articleWithArbiter: "Article avec verdict de l'arbitre",
		noEvaluatedArticles: 'Aucun article évalué disponible',
		justification: 'Justification'
	},

	// Extreme Analysis
	extremeAnalysis: {
		title: 'Analyse des extrêmes lexicaux',
		subtitle: 'Exploration des mots-clés associés aux sentiments extrêmes',
		analysisControls: "Contrôles d'analyse",
		keywordFrequency: 'Fréquence des mots-clés',
		keywordsByFacet: 'Mots-clés par facette',
		topKeywords: 'Mots-clés les plus fréquents',
		associatedArticles: 'Articles associés',
		articleCount: "Nombre d'articles",
		selectCategory: 'Sélectionner une catégorie',
		selectKeywordType: 'Type de mots-clés',
		numberOfKeywords: 'Nombre de mots-clés',
		subjectKeywords: 'Mots-clés sujet',
		spatialKeywords: 'Mots-clés spatiaux',
		byCountry: 'Par pays',
		byNewspaper: 'Par journal',
		showMore: 'Voir plus',
		showLess: 'Voir moins',
		noData: 'Aucune donnée disponible pour cette sélection',
		categories: {
			subjectivityHigh: 'Subjectivité élevée (4-5)',
			subjectivityLow: 'Subjectivité faible (1-2)',
			polarityNegative: 'Polarité très négative',
			polarityPositive: 'Polarité très positive',
			centralityHigh: 'Très central',
			centralityLow: 'Pas central'
		},
		descriptions: {
			subjectivityHigh: 'Articles avec opinions marquées et émotions fortes',
			subjectivityLow: 'Articles factuels et informatifs',
			polarityNegative: 'Articles avec sentiment très négatif',
			polarityPositive: 'Articles avec sentiment très positif',
			centralityHigh: 'Islam/musulmans au cœur du sujet',
			centralityLow: "Mention périphérique de l'islam/musulmans"
		}
	},

	// Métadonnées SEO (SEOHead.svelte) — titres/descriptions/mots-clés par vue
	meta: {
		siteTitle: 'Analyse de sentiments IWAC',
		comparisonTitle: 'Comparaison de modèles IA',
		comparisonDescription:
			"Comparez les résultats d'analyse de sentiments entre les modèles ChatGPT, Gemini et Mistral sur la Collection Islam Afrique de l'Ouest. Analysez les différences d'interprétation IA.",
		comparisonKeywords:
			'comparaison IA, ChatGPT vs Gemini vs Mistral, comparaison de modèles, analyse de sentiments, IWAC, évaluation IA',
		viewDescriptionPrefix: 'Explorez ',
		viewDescriptionSuffix:
			" de l'analyse de sentiments de la Collection Islam Afrique de l'Ouest. Visualisation interactive de l'analyse de couverture médiatique utilisant des modèles IA avancés.",
		baseKeywords: "analyse de sentiments, IWAC, Islam Afrique de l'Ouest, visualisation de données",
		views: {
			charts: {
				title: 'Graphiques et distributions',
				description: "les graphiques de distribution des sentiments et l'analyse de polarité",
				keywords:
					'graphiques, polarité, distribution des sentiments, graphiques en barres, camemberts'
			},
			trends: {
				title: 'Tendances temporelles',
				description: "l'évolution temporelle des tendances de sentiment",
				keywords: 'tendances, analyse temporelle, séries chronologiques, évolution'
			},
			correlation: {
				title: 'Distribution des sentiments',
				description: "l'analyse de distribution croisée des sentiments",
				keywords: 'corrélation, analyse croisée, distribution, relations'
			},
			volume: {
				title: "Analyse du volume d'articles",
				description: "le volume de publication d'articles et la distribution géographique",
				keywords: 'volume, distribution géographique, tendances de publication'
			},
			heatmap: {
				title: 'Carte de chaleur de centralité',
				description: "la carte de chaleur de centralité de l'islam par pays et année",
				keywords: 'carte de chaleur, centralité, analyse géographique, visualisation'
			},
			table: {
				title: "Explorateur d'articles",
				description: "l'exploration détaillée d'articles avec capacités de filtrage",
				keywords: "tableau, explorateur d'articles, filtrage, recherche"
			},
			comparison: {
				title: 'Comparaison de modèles',
				description: "la comparaison de modèles IA et l'analyse des divergences",
				keywords: 'comparaison, modèles IA, divergences, évaluation'
			},
			extremes: {
				title: 'Analyse des sentiments extrêmes',
				description: 'les catégories de sentiments les plus extrêmes et leurs mots-clés récurrents',
				keywords: 'extrêmes, mots-clés, valeurs aberrantes, catégories de sentiments'
			},
			arbiter: {
				title: "Évaluation de l'arbitre",
				description:
					"l'arbitrage en aveugle des désaccords entre modèles IA par un troisième modèle",
				keywords: 'arbitre, évaluation en aveugle, désaccord de modèles, verdicts'
			},
			default: {
				title: 'Visualisation de données',
				description: 'la visualisation interactive de données',
				keywords: 'visualisation, analyse, recherche'
			}
		}
	}
};
