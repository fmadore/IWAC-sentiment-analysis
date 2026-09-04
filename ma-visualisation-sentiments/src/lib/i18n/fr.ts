import type { Translations } from './types.js';

/**
 * Catalogue français. Le type vient de en.ts, ce qui garantit la parité des
 * clés à la compilation.
 *
 * Conventions : français de France, majuscule initiale seule pour les titres et
 * les intitulés, guillemets français « » pour les citations, apostrophes
 * typographiques, tirets demi-cadratins pour les intervalles (1–5), tirets
 * cadratins avec parcimonie.
 */
export const fr: Translations = {
	// App header and branding
	appTitle: 'Analyse de sentiments CIAO',
	appSubtitle: "Collection Islam Afrique de l'Ouest – visualisation et exploration des données",
	enterFullscreen: 'Passer en plein écran',
	exitFullscreen: 'Quitter le mode plein écran',
	/* Intitulé du sélecteur de langue au bas du tiroir mobile. */
	language: 'Langue',

	// Navigation
	nav: {
		/* Intitulé de section au-dessus de la liste des vues dans le tiroir mobile. */
		views: 'Vues',
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
		extremes: 'Extrêmes',
		arbiter: 'Arbitre'
	},

	/* Le filet sous le titre de chaque vue : « Modèle · X · Échantillon · N
	   articles ». Assemblé dans ViewContent à partir de ces mots et de
	   `common.of` et `common.articles`. « Évalués » n'apparaît que si le modèle
	   a laissé une partie de l'échantillon sans note. */
	viewMeta: {
		model: 'Modèle',
		sample: 'Échantillon',
		rated: 'Évalués'
	},

	// Filters
	filters: {
		title: 'Filtres',
		country: 'Pays',
		journal: 'Journal',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		clearAll: 'Tout effacer',
		clearAllFilters: 'Effacer tous les filtres',
		searchJournals: 'Rechercher un journal…',
		showingJournals: 'Affichage de',
		of: 'sur',
		selectedCountries: 'Pays sélectionnés',
		selectedJournals: 'Journaux sélectionnés',
		selectedPolarities: 'Polarités sélectionnées',
		selectedCentralities: 'Niveaux de centralité sélectionnés',
		subjectivityScore: 'Score de subjectivité',
		ratherObjective: 'Plutôt objectif',
		mixedSubjectivity: 'Mixte',
		ratherVerySubjective: 'Plutôt ou très subjectif',
		averageCentrality: 'Centralité moyenne',
		level: 'Niveau',
		veryObjectiveScore: 'Très objectif',
		ratherObjectiveScore: 'Plutôt objectif',
		mixedScore: 'Mixte',
		ratherSubjectiveScore: 'Plutôt subjectif',
		verySubjectiveScore: 'Très subjectif',
		numberOfArticles: "Nombre d'articles",
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
			'Les journaux classés selon leur note moyenne sur la dimension choisie. L’intervalle de confiance à 95 % indique de combien cette moyenne pourrait bouger sur un autre échantillon : les titres comptant peu d’articles évalués présentent des intervalles larges, si bien qu’une moyenne élevée sur un petit échantillon ne constitue pas un résultat solide.',
		chartTitle: 'Classement des journaux',
		chartSubtitle: 'Moyenne et IC à 95 % · titres comptant au moins {min} articles évalués',
		netPolarity: 'Polarité nette',
		meanSubjectivity: 'Subjectivité moyenne',
		meanCentrality: 'Centralité moyenne',
		confidenceInterval: 'IC à 95 %',
		neutralLine: 'neutre',
		excludedNote:
			'{count} journaux écartés : moins de {min} articles évalués. Leurs moyennes seraient trop incertaines pour être classées.',
		noneAboveThreshold:
			'Aucun journal ne compte au moins {min} articles évalués avec les filtres actuels.'
	},

	// Carte des lieux
	map: {
		title: 'Carte',
		subtitle:
			'Les lieux que les articles nomment. Une bulle par lieu, dimensionnée selon le nombre d’articles qui le mentionnent et colorée selon la dimension choisie.',
		articlesMentioning: 'articles mentionnant ce lieu',
		meanOf: '{dimension} moyenne',
		scoredArticles: 'Articles évalués',
		legendSizeTitle: 'Articles mentionnant',
		legendColorTitle: '{dimension} moyenne',
		legendUnscored: 'Non évalué',
		caveat:
			'Une bulle compte les articles qui mentionnent un lieu, et non ceux qui portent sur lui. Chaque article nomme environ quatre lieux, si bien que ces totaux dépassent le nombre d’articles. La couleur correspond à la note attribuée à l’article entier sur une échelle de 1 à 5, moyennée sur les articles que le modèle a effectivement évalués pour cette dimension. Pour la polarité, « Non applicable » signifie qu’aucune position n’est exprimée : la valeur sort de la moyenne mais compte toujours dans la taille de la bulle. Pour la centralité, « Non abordé » constitue un véritable bas d’échelle et reste inclus. Les lieux dépourvus de coordonnées dans le référentiel IWAC n’apparaissent pas.',
		noPlacesTitle: 'Aucun lieu cartographié',
		noPlacesLede:
			'Aucun article de la sélection actuelle ne nomme un lieu dont les coordonnées sont connues.',
		loadErrorTitle: 'Données cartographiques indisponibles'
	},

	// Saisonnalité du calendrier hégirien
	seasonality: {
		title: 'Saisonnalité',
		subtitle:
			'La couverture au fil du calendrier lunaire islamique. L’année hégirienne compte environ onze jours de moins que l’année grégorienne : une fête religieuse traverse donc lentement les douze mois grégoriens, et ce motif reste invisible dans toute vue organisée par année ou par mois.',
		chartTitle: 'Couverture par mois hégirien',
		chartSubtitle: 'Volume d’articles et centralité moyenne au fil de l’année lunaire',
		cycleLayout: 'Cycle',
		coverageIndex: 'Indice de couverture',
		calendarNote:
			'Dates converties selon le calendrier islamique tabulaire (arithmétique), époque civile. Il peut différer d’un ou deux jours des dates annoncées localement, ce qui suffit pour des totaux mensuels mais non pour dater une observance précise.',
		undatedNote: '{count} articles écartés : date de publication incomplète.',
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
			dhuAlQadah: 'Dhou al-Qi’da',
			dhuAlHijjah: 'Dhou al-Hijja'
		}
	},

	// Accord / calibration
	agreement: {
		title: 'Accord',
		subtitle:
			'Comment les modèles se situent les uns par rapport aux autres : où ils convergent, où ils divergent, et si un désaccord relève d’un décalage systématique ou d’un conflit réel.',
		dimensionSelector: 'Dimension d’analyse',
		exactAgreement: 'Accord exact',
		exactAgreementHelp:
			'Proportion d’articles pour lesquels les deux modèles ont choisi la même catégorie. Cette valeur ne corrige pas l’accord que deux modèles atteindraient par simple hasard.',
		adjacentAgreement: 'À un cran près',
		adjacentDetail: 'Identique ou à une catégorie d’écart',
		adjacentAgreementHelp:
			'Proportion d’articles dont les deux étiquettes sont identiques ou séparées d’exactement une position sur l’échelle.',
		articlesCompared: 'articles comparés',
		kappa: 'κ de Cohen',
		kappaHelp:
			'Accord corrigé du hasard. 0 signifie pas mieux que le hasard, 1 signifie parfait. Tous les désaccords y pèsent autant, si bien que deux modèles qui classent les articles de la même façon mais restent à une catégorie d’écart obtiennent malgré tout un score faible.',
		weightedKappa: 'κ pondéré',
		weightedKappaHelp:
			'Kappa à pondération quadratique. Se tromper d’une catégorie coûte bien moins que de s’en écarter de quatre, ce qui convient aux échelles dont les catégories se suivent dans un ordre. Un score pondéré nettement supérieur au score non pondéré indique que les modèles classent de façon semblable mais se calibrent différemment.',
		fleissKappa: 'κ de Fleiss',
		fleissHelp:
			'Kappa de Fleiss sur tous les modèles du panel à la fois, pour les articles que tous ont évalués.',
		panelTitle: 'L’ensemble du panel',
		panelLede:
			'L’accord entre tous les modèles de l’analyse retenue à la fois, dimension par dimension. Seuls comptent les articles que tous ont évalués : un modèle à la couverture plus étroite réduit donc la base de tous les autres.',
		matrixTitle: 'Matrice d’accord',
		rowsAre: 'Lignes :',
		columnsAre: 'Colonnes :',
		ofRow: 'De cette ligne',
		calibrationTitle: 'Calibration des modèles',
		calibrationSubtitle: 'À quelle fréquence chaque modèle emploie chaque échelon',
		systematicOffsetNote:
			'L’accord pondéré dépasse ici nettement l’accord non pondéré. C’est la signature d’un décalage systématique plutôt que d’un conflit réel : {modelA} et {modelB} classent les articles de manière semblable mais tracent les frontières entre catégories à des endroits différents, de sorte que l’essentiel de leur désaccord tient à un seul cran d’écart.',
		strength: {
			poor: 'Médiocre',
			slight: 'Faible',
			fair: 'Passable',
			moderate: 'Modéré',
			substantial: 'Important',
			almostPerfect: 'Presque parfait'
		},

		// Section consensus sur l'ensemble du panel
		scopeLabel: 'Portée de la comparaison',
		scopePair: 'Deux modèles',
		scopePanel: 'Tous les modèles',
		consensusTitle: 'Où les modèles divergent',
		consensusLede:
			'Une vue par paire peut montrer que deux modèles diffèrent, mais non que l’un d’eux se démarque de tous les autres. Tout ce qui suit décompose chaque article sur l’ensemble du panel à la fois : un modèle qui applique l’échelle autrement que ses pairs y apparaît alors comme un motif constant.',
		unanimous: 'Unanimité',
		unanimousHelp:
			'Proportion d’articles pour lesquels tous les modèles ont choisi la même catégorie.',
		majoritySplit: 'Un contre les autres',
		majoritySplitHelp:
			'Proportion d’articles pour lesquels tous les modèles sauf un ont choisi la même catégorie, le dernier se démarquant. Les graphiques ci-dessous indiquent lequel.',
		allDiffer: 'Divisés autrement',
		allDifferHelp:
			'Proportion d’articles qui ne sont ni unanimes ni « un contre les autres » : le panel se répartit en plusieurs camps, sans dissident isolé à désigner. Sur un panel élargi, cette issue absorbe les divisions serrées qu’un panel de trois modèles ne pouvait pas produire.',
		meanSpread: 'Écart moyen',
		meanSpreadHelp:
			'Moyenne de (maximum − minimum) entre les modèles, comptée en crans sur l’échelle. Zéro correspond à l’unanimité, le maximum à toute la largeur de l’échelle.',
		declinedToggle: 'Notations refusées',
		declinedInclude: 'Incluses',
		declinedExclude: 'Exclues',
		declinedNote:
			'{count} articles sont écartés parce qu’au moins un modèle a répondu « Non applicable ». Un refus de noter se situe sous le bas de l’échelle : le compter comme une notation fait passer un modèle qui s’abstient pour un modèle en désaccord. L’effet se concentre sur les titres dont les articles ne portent que marginalement sur l’islam.',
		declinedIncludedNote:
			'Les notations refusées sont comptées au bas de l’échelle. Les titres qui en comptent beaucoup apparaîtront comme très discutés, mais le désaccord porte alors sur le fait même que l’article concerne l’islam, plutôt que sur le caractère favorable de sa couverture.',

		disagreementTitle: 'Journaux classés par désaccord entre modèles',
		disagreementSubtitle:
			'Écart moyen sur le panel avec IC à 95 % · titres comptant au moins {min} articles évalués',
		disagreementAxis: 'Crans d’échelle entre le modèle le plus haut et le plus bas',
		disagreementNote:
			'Le miroir de la vue Journaux : mêmes titres, même seuil, mais l’axe mesure l’écart entre les modèles plutôt que ce qu’ils disent. Un titre peut être banal quant au sentiment et atypique quant au désaccord.',
		spread: 'Écart moyen',
		unanimityRate: 'Unanimité',
		declinedShare: 'Notations refusées',
		medianYear: 'Année médiane',
		disagreementExcluded:
			'{count} journaux écartés : moins de {min} articles évalués. Les petits titres paraissent plus discutés, si bien que les classer ici induirait en erreur.',
		disagreementEmpty: 'Aucun journal n’atteint {min} articles évalués avec les filtres actuels.',

		dissentTitle: 'Qui se démarque',
		dissentSubtitle:
			'Chaque article rangé selon l’unanimité, un modèle contre les autres ou une division plus large',
		dissentStacked: 'Par journal',
		dissentTernary: 'Triangle',
		dissentTernaryNote:
			'Un point par journal, placé selon le modèle qui s’y démarque le plus souvent. Un point à un sommet signifie que ce modèle assume tout le désaccord, un point au centre que les trois se le partagent également. La taille indique le nombre d’articles. Les titres où aucun modèle ne s’est jamais démarqué seul n’ont pas de position et ne sont pas tracés. Un triangle n’ayant que trois sommets, cette vue n’est proposée que pour l’archive à trois modèles ; le panel à cinq modèles se lit sur les barres empilées.',
		dissentsAlone: 'se démarque seul',
		dissentShare: 'Part des partages',

		directionTitle: 'Dans quel sens penche chaque modèle',
		directionSubtitle:
			'Lorsqu’un modèle se démarque, note-t-il au-dessus du reste du panel ou en dessous ? Les barres au-dessus de l’axe notent plus haut, celles en dessous plus bas.',
		directionAbove: 'Note plus haut',
		directionBelow: 'Note plus bas',
		directionNote:
			'C’est l’énoncé le plus net que ces données produisent sur la façon dont ces modèles diffèrent. Un modèle dont les barres se rangent presque entièrement d’un côté applique l’échelle autrement que ses pairs, de manière constante et dans un seul sens.',

		flowTitle: 'Circulation des étiquettes dans le panel',
		flowNote:
			'La matrice d’accord étendue à l’ensemble du panel. Un décalage systématique apparaît comme une masse de rubans glissant d’un cran, et les trajets qu’une matrice par paire dissimule — les articles où le premier et le dernier modèle s’accordent en passant par un modèle intermédiaire divergent — deviennent visibles.',
		flowArticles: 'articles',

		scatterTitle: 'Le désaccord porte-t-il sur les couvertures extrêmes ou ambiguës ?',
		scatterSubtitle:
			'Une bulle par journal · taille selon le nombre d’articles, couleur selon le pays',
		scatterX: 'Moyenne du consensus (les modèles moyennés)',
		scatterY: 'Écart moyen sur le panel',
		scatterNote:
			'Corrélation entre les deux axes : r = {r}. Une valeur proche de zéro signifierait que le désaccord ne dépend pas du caractère favorable de la couverture d’un titre. Une valeur forte, dans un sens ou dans l’autre, signifie que les modèles se disputent surtout un bout de l’échelle, et le classement ci-dessus doit alors se lire en conséquence. La valeur diffère selon la génération d’analyse et selon la dimension.'
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
		seasonalityCaption: 'Volume d’articles et centralité moyenne par mois hégirien',
		rankingCaption: 'Journaux classés par moyenne, avec intervalles de confiance',
		matrixCaption: 'Tableau croisé des étiquettes des deux modèles',
		spread: 'Écart moyen',
		unanimity: 'Unanimité',
		declined: 'Refusées',
		medianYear: 'Année médiane',
		disagreementCaption:
			'Journaux classés par écart moyen sur le panel, avec intervalles de confiance, unanimité et part de notations refusées'
	},

	// Chart titles and labels
	charts: {
		polarityDistribution: 'Distribution de la polarité',
		subjectivityDistribution: 'Distribution de la subjectivité',
		sentimentTrends: 'Tendances des sentiments',
		subjectivityTrends: 'Tendances de la subjectivité',
		volumeByCountry: "Volume d'articles par pays",
		centralityHeatmap: 'Carte de chaleur de la centralité',
		articlesAnalyzed: 'articles analysés',
		globalDistribution: 'Distribution d’ensemble',
		byJournal: 'par journal',
		byYear: 'par année',
		stackedAreas: 'Aires empilées',
		lines: 'Lignes',
		bars: 'Barres',
		countMode: 'Effectif',
		shareMode: 'Part',
		pie: 'Camembert',
		polaritySubjectivityDistribution: 'Distribution polarité × subjectivité',
		subtitle: 'Comment le corpus se répartit sur les échelles de polarité et de subjectivité.'
	},

	// Trends view
	trends: {
		subtitle: 'Comment les notes évoluent au fil des années, pour le corpus et pour chaque journal.'
	},

	// Volume view
	volume: {
		subtitle: 'Combien d’articles le corpus contient, année par année et pays par pays.'
	},

	// Heatmap view
	heatmap: {
		subtitle:
			'La centralité de l’islam et des musulmans dans la couverture, pays par pays et année par année. Plus une case est sombre, plus le thème occupe le centre des articles publiés cette année-là.'
	},

	// Correlation/Distribution view
	correlation: {
		subtitle: 'Comment les notes de polarité et de subjectivité se répondent.',
		spearman: 'ρ de Spearman',
		strengthLabel: 'Force',
		rhoNote:
			'Corrélation de rang entre polarité et subjectivité. Les deux échelles ordonnent des catégories sans les mesurer, si bien que le calcul porte sur les rangs plutôt que sur les valeurs codées. Les articles marqués « Non applicable » sont écartés.',
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
		viewDetails: 'Voir les détails',
		sortBy: 'Trier par',
		itemsPerPage: 'Éléments par page',
		showingItems: 'Affichage de',
		noFilteredArticles: 'Aucun article ne correspond aux filtres sélectionnés',
		articleTitle: 'Titre',
		subtitle:
			'Parcourez chaque article, avec ses trois notes et la raison que le modèle a donnée pour chacune.'
	},

	// Article details
	article: {
		metadata: 'Métadonnées',
		analysis: 'Analyse de sentiment',
		polarityJustification: 'Raison de la note de polarité',
		subjectivityJustification: 'Raison de la note de subjectivité',
		centralityJustification: 'Raison de la note de centralité',
		close: 'Fermer',
		titleNotAvailable: 'Titre non disponible',
		publicationDate: 'Date de publication',
		linkToFullArticle: "Lien vers l'article complet",
		consultOriginalArticle: "Consulter l'article original →",
		noAnalysisData: 'Aucune note n’est disponible pour cet article.',
		noArticleSelected: 'Aucun article sélectionné',
		selectArticlePrompt: 'Sélectionnez un article dans le tableau pour voir ses notes.',
		justification: 'Raison donnée'
	},

	// Analysis info. Voir en.ts : ce bloc ne contient que l'habillage de la
	// carte ; tout ce qu'une génération peut contredire vit dans analysisV1 /
	// analysisV2.
	analysis: {
		title: "Méthodologie d'analyse",
		methodologyIntro:
			'Ce tableau de bord demande ce que les grands modèles de langage savent faire, et ne savent pas faire, lorsqu’on les charge de lire un corpus de recherche. La numérisation a produit des collections bien plus vastes qu’un chercheur ne peut en parcourir article par article. Franco Moretti a nommé « lecture distante » (',
		methodologyIntroCitation: 'Moretti 2000',
		methodologyIntroEnd:
			') la démarche inverse : analyser des milliers de textes à la fois pour dégager des motifs qu’une lecture pièce à pièce a peu de chances de faire apparaître.',
		methodologyCorpus:
			'Il s’agit ici de la façon dont la presse ouest-africaine dépeint l’islam et les musulmans. Coder des milliers d’articles à la main prend du temps et se maintient mal dans la cohérence : l’ensemble du corpus de',
		methodologyCorpusArticles: 'articles issus de la',
		methodologyCorpusDeveloper:
			', une base de données numérique collaborative et en libre accès construite par',
		methodologyCorpusEnd: ', est donc passé par les grands modèles de langage suivants :',
		methodologyCorpusDimensions: 'Chaque modèle a évalué chaque article sur trois dimensions :',
		methodologyAiModel: 'Méthode et modèles',
		modelUsed: 'Modèles',
		technicalConfiguration: 'Configuration de la campagne',
		analysisPrompt: "Prompt d'analyse",
		promptDescription: 'Le modèle reçoit un jeu d’instructions écrites qui :',
		viewFullPrompt: 'Voir le prompt complet',
		limitationsTitle: 'Limites',
		limitationsDescription:
			'Ces notes constituent une aide à la recherche, non un résultat achevé. Les articles ambigus ou complexes appellent toujours un lecteur humain, et les modèles se contredisent assez souvent pour qu’aucune note isolée ne puisse être tenue pour acquise. Chaque note s’accompagne de la raison que le modèle en a donnée, ce qui permet d’en juger la solidité.',
		polaritySection: 'Polarité du sentiment',
		subjectivitySection: 'Subjectivité',
		centralitySection: "Centralité de l'islam et des musulmans"
	},

	analysisV1: {
		config: [
			'Analyse du corpus : janvier-février 2026',
			'Effort de raisonnement : non défini — les modèles ont tourné sans, et le paramètre thinking_level est postérieur à cette campagne',
			"Température : 0,2 pour Gemini 3 Flash preview et Ministral 14B ; GPT-5 mini a tourné à la valeur par défaut de l'API",
			'Ministral 14B seul plafonnait sa sortie à 512 tokens : ses raisons les plus longues ont pu être tronquées',
			'Format de sortie : JSON structuré validé par un schéma Pydantic',
			'Un cache, pour ne pas refaire une analyse déjà produite',
			'Reprise automatique en cas d’échec d’un appel'
		],
		promptFeatures: [
			"Attribue au modèle le rôle d'expert en analyse de sentiments pour l'Afrique de l'Ouest francophone",
			'Précise ce qu’il faut observer sur chaque dimension (polarité, subjectivité, centralité)',
			'Demande au modèle de commencer par une checklist de 3 à 7 étapes conceptuelles',
			'Demande une raison en français pour chaque note',
			'Impose une sortie JSON structurée, pour que chaque réponse ait la même forme'
		],
		polarityDescription:
			"Le sentiment général que l'article exprime envers l'islam et les musulmans, ou envers la façon dont ils sont représentés.",
		polarityVeryPositive: 'Un portrait extrêmement favorable, enthousiaste, élogieux',
		polarityPositive: 'Un portrait favorable, optimiste',
		polarityNeutral:
			"Aucun sentiment net envers l'islam ou les musulmans, ou équilibre entre aspects favorables et défavorables ; ton factuel, sans charge émotionnelle marquée",
		polarityNegative: 'Un portrait défavorable, critique, pessimiste',
		polarityVeryNegative: 'Un portrait extrêmement défavorable, alarmiste, très critique',
		polarityNotApplicable: "L'article ne traite pas de l'islam ou des musulmans",
		subjectivityDescription:
			"Le degré d'objectivité ou de subjectivité de l'article dans sa manière de représenter l'islam et les musulmans, sur une échelle de 1 (très objectif) à 5 (très subjectif).",
		subjectivity1:
			"Rapporte des faits vérifiables sur l'islam et les musulmans sans exprimer d'opinion ni de sentiment personnel à leur sujet ; style purement informatif sur ce thème",
		subjectivity2:
			'Principalement factuel, mais peut porter des traces subtiles d’opinion, ou des choix de mots qui trahissent une perspective particulière sur ce thème',
		subjectivity3:
			'Un mélange équilibré de faits et d’opinions personnelles, ou plusieurs points de vue rapportés sur ce thème',
		subjectivity4:
			"Exprime clairement des opinions, des sentiments ou des jugements sur l'islam et les musulmans, même lorsque des faits viennent les étayer",
		subjectivity5:
			"Fortement biaisé dans sa représentation de l'islam et des musulmans, avec des opinions et des émotions intenses et peu ou pas de matière factuelle ; éditorial ou billet d'humeur sur ce thème",
		centralityDescription:
			"Le poids que l'article accorde aux thèmes liés à l'islam et aux musulmans.",
		centralityVeryCentral: "L'islam ou les musulmans constituent le sujet principal de l'article",
		centralityCentral: "Un thème important, mais partagé avec d'autres sujets",
		centralitySecondary: 'Mentionné de manière significative, mais sans être le sujet principal',
		centralityMarginal: 'Évoqué brièvement ou en passant',
		centralityNotAddressed: "Aucune mention de l'islam ou des musulmans"
	},

	// Reprend la formulation exacte du prompt de génération 2 :
	// iwac-ai-pipelines/AI_sentiment_analysis/sentiment_prompt.md
	analysisV2: {
		config: [
			'Analyse du corpus : 3–5 août 2026 pour GPT-5.6 Luna, Mistral Small 4 et DeepSeek v4 Flash ; 14–15 août pour Gemma 4 31B ; 17–24 août pour Qwen3.8 27B',
			"Effort de raisonnement : moyen pour GPT-5.6 Luna et Qwen3.8 27B, les deux seuls dont le réglage a pu être vérifié ; élevé pour Mistral Small 4 et DeepSeek v4 Flash, dont les API n'offrent aucun niveau intermédiaire ; nominalement moyen pour Gemma 4 31B, dont la route OpenRouter rend le moyen et l'élevé indiscernables",
			'Où chaque modèle a tourné : chez son concepteur, sauf Gemma 4 31B et DeepSeek v4 Flash, servis via OpenRouter, et Qwen3.8 27B, auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth',
			'Température : non définie par le pipeline — chaque modèle tourne à la valeur par défaut de son hôte',
			'Format de sortie : JSON structuré validé par un schéma Pydantic',
			'Un cache reprenable, un enregistrement par article et par modèle ; seuls les appels réussis y sont conservés',
			'Gestion des erreurs : jusqu’à trois tentatives par appel, avec une attente croissante entre elles et un délai maximal par modèle',
			'Couverture : 12 298 des 12 349 articles portent les annotations de tous les modèles. Les 51 articles qui ne sont ni en français ni en anglais sont écartés à dessein, le prompt étant en français',
			'Qwen3.8 27B s’arrête 200 articles plus tôt : il les a refusés au fil d’un passage complet et de trois séries de reprises. Ce manque est définitif, et il n’est pas aléatoire — il frappe surtout les articles où l’islam est périphérique, si bien que tout chiffre calculé sur les seuls articles évalués par tous penche vers une matière où l’islam est central',
			'Empreinte du prompt d14ace9ac192, enregistrée avec chaque résultat mis en cache'
		],
		promptFeatures: [
			"Attribue au modèle le rôle d'analyste expert des représentations de l'islam et des musulmans dans la presse ouest-africaine francophone",
			'Définit chaque échelon des échelles et précise que les échelons intermédiaires sont des réponses à part entière, non des solutions de repli',
			'Ajoute des règles de démarcation pour les cas ambigus récurrents : une figure musulmane dans un sujet séculier, la coopération avec les pays arabes, les groupes armés, les propos rapportés',
			'Exige une raison en français, en une ou deux phrases, citant un élément concret du texte',
			"Demande la subjectivité sous forme d'étiquette plutôt que de nombre, et impose une sortie JSON structurée",
			'Ne comporte aucun exemple travaillé : un test A/B d’août 2026 a montré qu’ils tiraient les réponses des modèles vers ce que les exemples eux-mêmes employaient'
		],
		polarityDescription:
			"Le sentiment que l'article lui-même exprime envers l'islam ou les musulmans, jugé à sa mise en cadre, à son lexique et à son traitement des sources plutôt qu'aux opinions des personnes qu'il cite.",
		polarityVeryPositive: 'Un portrait extrêmement favorable, élogieux, enthousiaste',
		polarityPositive: 'Un portrait favorable, bienveillant, optimiste',
		polarityNeutral:
			'Aucun sentiment marqué, ou équilibre entre aspects favorables et défavorables ; ton factuel',
		polarityNegative: 'Un portrait défavorable, critique, pessimiste',
		polarityVeryNegative: 'Un portrait extrêmement défavorable, alarmiste, hostile',
		polarityNotApplicable: "L'article ne traite pas de l'islam ou des musulmans",
		polarityNotes: [
			"Le compte rendu neutre est le cas ordinaire de la presse d'information : un article qui rapporte des faits sans les commenter est neutre, même quand ces faits sont favorables ou défavorables en eux-mêmes.",
			'Propos rapportés : un article qui rapporte des déclarations hostiles avec attribution, distance et contrepoint reste neutre. Il devient négatif lorsqu’il reprend ce cadrage à son compte.',
			"Des faits négatifs ne font pas une polarité négative : le compte rendu factuel d'un attentat reste neutre, sauf si l'article étend la responsabilité aux musulmans en général."
		],
		subjectivityDescription:
			"Jusqu'où l'article s'engage sur le thème de l'islam et des musulmans, indépendamment du caractère favorable de son traitement. Cette génération demandait l'étiquette ; le rang de 1 à 5 est conservé pour les statistiques, qui exigent une échelle ordonnée.",
		subjectivity1:
			'Des faits vérifiables, aucune opinion ni marque d’appréciation sur ce thème ; style informatif',
		subjectivity2:
			'Essentiellement factuel, avec des traces subtiles d’appréciation sur ce thème dans le choix des mots ou dans l’angle',
		subjectivity3:
			'Un mélange équilibré de faits et d’opinions, ou plusieurs points de vue rapportés sur ce thème',
		subjectivity4:
			'Des opinions, sentiments ou jugements explicites sur ce thème, même lorsque des faits viennent les étayer',
		subjectivity5:
			"Parti pris marqué, émotions ou jugements intenses, peu de matière factuelle ; éditorial, tribune ou billet d'humeur",
		subjectivityNotes: [
			"Les opinions citées et attribuées à un tiers ne rendent pas l'article subjectif, car les rapporter relève du travail d'information. Ce qui le rend subjectif, c'est qu'il les prenne à son compte.",
			'Un article violemment hostile mais rédigé sur un ton factuel reste peu subjectif.'
		],
		centralityDescription: "Le poids que l'article accorde à l'islam et aux musulmans.",
		centralityVeryCentral: "L'islam ou les musulmans constituent le sujet principal",
		centralityCentral: "Un thème important, partagé avec d'autres sujets",
		centralitySecondary: 'Mentionné de manière significative, mais subordonné à un autre sujet',
		centralityMarginal: 'Évoqué brièvement, de façon anecdotique ou incidente',
		centralityNotAddressed: "Aucune mention de l'islam ou des musulmans",
		centralityNotes: [
			"L'appartenance religieuse d'une personne ne rend pas un article religieux : un ministre musulman qui présente un budget relève de « Non abordé », sauf si l'article exploite sa confession.",
			'Les institutions et les pratiques comptent — mosquée, imam, medersa, association islamique, ramadan, hadj, tabaski, prêche — même lorsque le mot « islam » n’apparaît jamais.',
			'La coopération avec les pays arabes ou les organisations islamiques (Libye, Arabie saoudite, Koweït, Iran, OCI, ISESCO, Banque islamique de développement) est au moins marginale, même quand le sujet apparent est un prêt ou un hôpital.',
			"Un groupe armé qui se réclame de l'islam relève de « Central », voire de « Très central » quand l'article porte sur le groupe lui-même. Une centralité élevée ne présume rien de la polarité."
		]
	},

	// Loading and messages
	messages: {
		loading: 'Chargement…',
		loadingData: 'Chargement du corpus IWAC…',
		noData: 'Aucune donnée disponible',
		error: "Une erreur s'est produite",
		dataLoadError:
			'Les données du corpus n’ont pas pu être chargées ou ne correspondent pas au format attendu.',
		retry: 'Réessayer'
	},

	// Export
	export: {
		exportCSV: 'Exporter en CSV',
		downloadCSV: 'Télécharger les données au format CSV',
		exporting: 'Export en cours',
		noDataToExport: 'Aucune donnée à exporter',
		exportError: "Erreur lors de l'export des données",
		polarityJustification: 'Raison de la note de polarité',
		subjectivityJustification: 'Raison de la note de subjectivité',
		centralityJustification: 'Raison de la note de centralité',
		articleId: 'ID article'
	},

	// Common
	common: {
		yes: 'Oui',
		no: 'Non',
		close: 'Fermer',
		save: 'Enregistrer',
		delete: 'Supprimer',
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

	// Générations d'analyse (panel v2 actuel vs panel v1 archivé)
	generations: {
		archivedLabel: 'Analyse archivée',
		archivedTitle: "Vous consultez l'analyse archivée de 2026 (v1).",
		archivedDescription:
			'GPT-5 mini, Gemini 3 Flash preview et Ministral 14B, évalués avec le premier prompt. Conservée en ligne pour que les résultats publiés et les citations restent reproductibles.',
		backToCurrent: "Revenir à l'analyse actuelle",
		archiveLinkLabel: "Consulter l'analyse archivée v1",
		archiveLinkDescription:
			'La première campagne (GPT-5 mini, Gemini 3 Flash preview, Ministral 14B) reste disponible, y compris son arbitre par paires.'
	},

	// Comparison
	comparison: {
		byDecade: 'Décennie',
		disagreementBreakdown: 'Où les modèles divergent',
		disagreementBreakdownNote:
			'Écart moyen par article, regroupé par décennie ou par pays. Les groupes comptant moins de 20 articles comparés sont écartés, car leurs moyennes varieraient au gré de quelques cas.',
		subtitle:
			'Placez deux modèles côte à côte et lisez les articles qu’ils notent différemment. La note dit ce qu’un modèle a vu ; l’écart entre deux modèles dit à quel point cette lecture dépend du modèle.',
		filterByDiscrepancy: 'Filtrer par écart',
		differenceRange: 'Plage d’écart',
		quickFilters: 'Filtres rapides',
		pointDifference: 'point d’écart',
		pointsDifference: 'points d’écart',
		compareDimensions: 'Comparer les dimensions',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		totalDiscrepancy: 'Écart total',
		totalDiscrepancies: 'Articles qui diffèrent',
		articlesWithDifferences: 'Sur au moins une dimension',
		averageDiscrepancy: 'Écart moyen',
		pointsPerArticle: 'Crans d’échelle par article',
		totalArticles: 'Total des articles',
		articlesAnalyzed: 'Articles comparés',
		highConflicts: 'Désaccords marqués',
		significantDifferences: 'Au moins trois crans d’écart',
		significantDifferencesExplanation:
			'Articles où les deux modèles s’écartent d’au moins 3 crans sur la polarité, la subjectivité ou la centralité. Sur des échelles aussi courtes, un tel écart signale deux lectures sans grand rapport.',
		totalDiscrepanciesExplanation:
			'Nombre d’articles que les deux modèles ont notés différemment sur au moins une dimension, quel que soit l’écart.',
		averageDiscrepancyExplanation:
			'L’écart moyen entre les deux modèles par article, cumulé sur les trois dimensions (polarité + subjectivité + centralité) et compté en crans d’échelle.',
		breakdownByDimension: 'Répartition par dimension',
		enableComparisonMode: 'Activer le mode comparaison',
		enableComparisonDescription:
			'Utilisez le sélecteur de modèles dans l’en-tête pour choisir les deux modèles à placer côte à côte.',
		noDiscrepancies: 'Aucun écart trouvé',
		adjustFilters:
			'Élargissez les filtres pour voir les articles que les deux modèles notent différemment.',
		excludeNonApplicable: 'Exclure les articles « Non applicable »',
		excludeNonApplicableDescription:
			'Masquer les articles dont un modèle a noté la centralité « Non applicable ». Ils produisent de très grands écarts, qui en disent plus sur la forme de l’échelle que sur les modèles.',
		dimensionsExplanation: 'Choisissez les dimensions qui comptent dans le score d’écart :',
		polarityExplanation: 'Écarts sur le caractère favorable de la couverture',
		subjectivityExplanation: 'Écarts sur l’échelle d’objectivité de 1 à 5',
		centralityExplanation: 'Écarts sur la place de l’islam et des musulmans dans l’article',
		dimensionsNote:
			'Astuce : choisissez une seule dimension pour isoler un type de désaccord. Les scores d’écart sont recalculés à partir de votre sélection.',
		// Model pair picker. Pair labels are built from the model names in the
		// contract registry, so only the joining word is translated.
		selectModelPair: 'Sélectionner les modèles à comparer',
		versus: 'vs',
		modelALabel: 'Modèle A',
		modelBLabel: 'Modèle B'
	},

	// Arbiter
	arbiter: {
		samplingFrame: 'Ce que l’arbitre a examiné',
		coverageEvaluated: 'examinés',
		coverageCorpus: 'dans le corpus',
		samplingFrameNote:
			'L’arbitre n’a pas examiné tout le corpus. Il a examiné des articles retenus parce que les deux modèles y divergeaient le plus fortement : chaque pourcentage ci-dessous ne vaut donc que là où un désaccord existe déjà. Aucun ne mesure quel modèle est meilleur sur l’ensemble du corpus.',
		title: "Verdict de l'arbitre",
		subtitle: 'Examen à l’aveugle par un troisième modèle, à qui l’on ne dit pas qui a écrit quoi',
		modelName: 'Gemini 3 Pro',
		verdict: 'Verdict',
		overallVerdict: 'Verdict général',
		confidenceLevel: 'Confiance',
		confidenceHigh: 'Élevée',
		confidenceMedium: 'Moyenne',
		confidenceLow: 'Faible',
		evaluationsNoun: 'examens',
		verdictsNoun: 'verdicts',
		prefers: 'Préfère',
		prefersBoth: 'Les deux sont aussi proches',
		prefersNeither: 'Aucun n’est proche',
		arbiterScore: 'Note propre de l’arbitre',
		arbiterJustification: "Raisonnement de l'arbitre",
		verdictExplanation: 'Pourquoi ce verdict',
		noArbiterData: 'Non examiné par l’arbitre',
		noArbiterDataDescription:
			'L’arbitre n’a pas examiné cet article. Il n’a lu que les articles sur lesquels les deux modèles divergeaient le plus fortement.',
		polarityVerdict: 'Verdict de polarité',
		subjectivityVerdict: 'Verdict de subjectivité',
		centralityVerdict: 'Verdict de centralité',
		loadingArbiter: "Chargement des données de l'arbitre…",
		runArbiterScript: 'Aucun verdict n’a été publié pour cet article.',
		// Summary statistics
		summaryTitle: "Résumé de l'arbitre",
		articlesEvaluated: 'articles examinés',
		bothEqual: 'Aussi proches',
		neitherAccurate: 'Aucun proche',
		preferred: 'préféré',
		blindEvaluationNote:
			'Examen à l’aveugle : on n’a pas dit à l’arbitre quel modèle avait produit quelle analyse',
		// Arbiter View page
		viewTitle: 'Arbitre',
		viewSubtitle:
			'Un troisième modèle lit les articles sur lesquels les deux annotateurs divergeaient le plus, et dit lequel s’en est approché',
		verdictDistribution: 'Distribution des verdicts',
		verdictsByDimension: 'Verdicts par dimension',
		confidenceDistribution: 'Distribution de la confiance',
		totalVerdicts: 'Total des verdicts',
		dimension: 'Dimension',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		allDimensions: 'Toutes les dimensions',
		selectModelPair: 'Sélectionner les modèles',
		noDataForPair: "Pas de données d'arbitrage disponibles pour cette paire de modèles",
		runScript: 'Aucun verdict n’a été publié pour cette paire.',
		filterByDimension: 'Filtrer par dimension',
		// Methodology section
		methodologyTitle: 'Comment fonctionne l’arbitre',
		methodologySubtitle:
			'Un troisième modèle tranche les cas sur lesquels les deux annotateurs divergeaient',
		blindEvaluation: 'Examen à l’aveugle',
		blindEvaluationDesc:
			'On ne dit pas à l’arbitre quel modèle a produit quelle analyse. Il ne voit que « Modèle A » et « Modèle B ».',
		highReasoning: 'Effort de raisonnement élevé',
		highReasoningDesc:
			'Gemini 3 Pro a tourné avec la réflexion étendue, de sorte qu’il travaille l’article avant de répondre.',
		independentVerdict: 'Verdict indépendant',
		independentVerdictDesc:
			"L'arbitre note lui-même l'article avant de regarder les deux analyses.",
		howItWorks: 'Fonctionnement',
		selectionProcess: 'Comment les articles ont été retenus',
		selectionProcessDesc:
			'Un article part à l’arbitrage lorsque les deux modèles s’écartent d’au moins 3 points sur l’une des trois dimensions.',
		blindAssignment: 'Attribution à l’aveugle',
		blindAssignmentDesc:
			'Pour chaque paire, un modèle reçoit au hasard le nom « Modèle A » et l’autre « Modèle B ». L’attribution vaut pour tous les articles de la paire, si bien que l’ordre ne peut favoriser ni l’un ni l’autre.',
		evaluationProcess: 'Ce que fait l’arbitre',
		step1: "Il lit le texte intégral de l'article",
		step2: 'Il note lui-même la polarité, la subjectivité et la centralité',
		step3: 'Il compare les deux analyses à sa propre note',
		step4: 'Il dit quel modèle s’en est le plus approché, et donne ses raisons',
		arbiterModel: 'Modèle arbitre',
		arbiterRole: 'Juge tiers',
		geminiArbiterDesc:
			'Gemini 3 Pro tient le rôle d’arbitre, avec son niveau de raisonnement réglé sur élevé pour qu’il travaille l’article avant de comparer les deux analyses.',
		evaluationScales: 'Échelles de notation',
		viewPrompt: 'Voir le prompt',
		promptExplanation:
			'L’instruction système et le prompt utilisateur envoyés à l’arbitre. Ils sont les mêmes pour chaque article.',
		viewFullPrompt: 'Voir le prompt complet',
		arbiterPrompt: "Prompt de l'arbitre",
		systemInstruction: 'Instruction système',
		userPromptTemplate: 'Modèle de prompt utilisateur',
		// Scale descriptions
		polarityVeryPositive: 'Portrait extrêmement favorable, enthousiaste',
		polarityPositive: 'Portrait favorable, optimiste',
		polarityNeutral: 'Aucun sentiment net, ou équilibre ; ton factuel',
		polarityNegative: 'Portrait défavorable, critique',
		polarityVeryNegative: 'Portrait extrêmement défavorable, alarmiste',
		subjectivity1: 'Très objectif – purement informatif',
		subjectivity2: 'Plutôt objectif – principalement factuel',
		subjectivity3: 'Mixte – faits et opinions à parts égales',
		subjectivity4: 'Plutôt subjectif – opinions nettes',
		subjectivity5: 'Très subjectif – fortement biaisé',
		centralityVeryCentral: "Le sujet principal de l'article",
		centralityCentral: "Important, mais partagé avec d'autres sujets",
		centralitySecondary: 'Mentionné de manière significative, sans être le sujet principal',
		centralityMarginal: 'Évoqué brièvement ou en passant',
		centralityNotAddressed: "Aucune mention de l'islam ou des musulmans",
		// Head-to-head comparison
		headToHead: 'Face à face',
		excludingTies: '(hors égalités et « aucun proche »)',
		wins: 'en sa faveur',
		// Evaluated articles table
		evaluatedArticles: 'Articles examinés',
		evaluatedArticlesSubtitle: 'Les articles que l’arbitre a lus, et ce qu’il a décidé pour chacun',
		viewArticleDetails: "Voir les détails de l'article",
		articleWithArbiter: "Article avec verdict de l'arbitre",
		noEvaluatedArticles: 'Aucun article examiné à afficher',
		justification: 'Raison donnée'
	},

	// Arbitre du panel (génération 2)
	arbiterV2: {
		viewTitle: 'Arbitre du panel',
		viewSubtitle:
			'Un verdict à l’aveugle par article, comparant toutes les analyses de la génération 2 en une seule fois',
		modelName: 'Claude Opus 5',
		arbiterRole: 'Juge tiers',
		samplingFrameNote:
			'L’arbitre n’a pas examiné tout le corpus. Il a examiné les articles sur lesquels le panel se contredit quant au caractère favorable ou hostile de la couverture : chaque pourcentage ci-dessous ne vaut donc que là où un tel désaccord existe déjà. Aucun ne mesure quel modèle est meilleur sur l’ensemble du corpus.',
		articlesEvaluated: 'articles examinés',
		dimensionVerdicts: 'verdicts par dimension',
		preferred: 'préféré',
		multiple: 'Plusieurs aussi proches',
		none: 'Aucune proche',
		overallVerdicts: 'Verdicts globaux',
		overallVerdictsNote: 'Un verdict par article, sur les trois dimensions à la fois',
		dimensionTieNote:
			'Le chiffre principal est le verdict global — un par article, toutes dimensions pesées ensemble. C’est lui qu’il faut lire, plutôt que le décompte par dimension affiché à côté : sur un panel de cinq, quand trois ou quatre analyses rejoignent la note propre de l’arbitre, « plusieurs se valent » est la réponse juste, si bien que les décomptes par dimension restent bas pour tous les modèles et ne permettent pas de les départager.',
		byDimension: 'Verdicts par dimension',
		confidenceDistribution: 'Répartition de la confiance',
		blindLabel: 'Présentée comme',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		evaluatedArticles: 'Articles examinés',
		evaluatedArticlesSubtitle:
			'Tous les articles que l’arbitre a lus, désaccord le plus large en premier. Ouvrez une ligne pour lire son raisonnement.',
		spread: 'Écart',
		arbiterScore: 'Note propre de l’arbitre',
		verdict: 'Verdict',
		confidence: 'Confiance',
		showReasoning: 'Afficher le raisonnement',
		hideReasoning: 'Masquer le raisonnement',
		noData: 'Pas encore de verdicts de l’arbitre du panel',
		noDataDescription:
			'Cette campagne est payante et se lance à la main : elle n’a pas encore été faite. D’ici là, cette vue n’a rien à montrer.',
		loading: "Chargement des données de l'arbitre…",
		// Méthodologie
		methodologyTitle: 'Comment fonctionne l’arbitre du panel',
		methodologySubtitle:
			'Un seul juge compare toutes les analyses de la génération 2 en une seule fois',
		blindEvaluation: 'Examen à l’aveugle',
		blindEvaluationDesc:
			'Les analyses sont anonymisées de A à E par un seul tirage aléatoire, fixé pour toute la campagne.',
		selectionProcess: 'Comment les articles ont été retenus',
		selectionProcessDesc:
			'Un article est retenu lorsqu’au moins un modèle lit la couverture comme positive et un autre comme négative : un désaccord sur le sens de la couverture, non sur son intensité. Ce critère va délibérément plus loin que le seuil du tableau de bord pour signaler une discordance : le renversement le plus fréquent de tous, un modèle répondant Positif là où un autre répond Négatif, ne représente que deux rangs d’écart, et aucun seuil assez élevé pour avoir du sens ne peut le retenir. Les articles où un modèle indique que la tâche ne s’applique pas — ou, pour Qwen3.8 27B, n’a jamais rendu de réponse — sont écartés plutôt que comptés comme un désaccord maximal.',
		whyPolarity: 'Pourquoi la polarité, et pas la centralité',
		whyPolarityDesc:
			'Le panel s’accorde bien davantage sur la centralité que sur la polarité : les cinq modèles donnent la même note de centralité sur 63,7 % des articles, contre 33,0 % pour la polarité. Payer un juge pour trancher la centralité reviendrait surtout à acheter des verdicts sur des questions que le panel règle déjà seul et de façon constante. C’est aussi la dimension où Mistral Small 4 s’écarte le plus des quatre autres : une sélection menée sur la centralité se remplit d’articles où un seul modèle tient tête au reste du panel. Choisir sur la polarité retient à la fois la dimension sur laquelle porte la question de recherche et celle que le panel trouve la plus difficile.',
		randomOrder: 'L’ordre est retiré au sort à chaque article',
		randomOrderDesc:
			'Les analyses sont anonymisées de A à E par un tirage unique, fixé pour toute la campagne, si bien qu’une lettre désigne toujours le même modèle. L’ordre dans lequel les blocs sont présentés est ensuite retiré au sort pour chaque article. Sans ce second tirage, un modèle occuperait la première position sur tous les articles, et la tendance d’un juge à privilégier ce qu’il lit en premier serait impossible à distinguer d’une véritable préférence pour ce modèle.',
		noiseCaveat: 'Une part du désaccord est du bruit',
		noiseCaveatDesc:
			'Ce sont des annotations uniques, et les modèles ne se reproduisent pas complètement eux-mêmes : relancé sur le même article, un modèle rend la même polarité 70 à 80 % du temps. Une part de tout désaccord relève donc d’un tirage différent plutôt que d’une lecture différente, et aucun arbitre ne peut distinguer les deux. C’est la raison pour laquelle la sélection porte sur les renversements de sens, qu’un nouveau tirage produira rarement, plutôt que sur les écarts d’un seul rang.',
		fullText: 'Le texte intégral de l’article',
		fullTextDesc:
			'L’arbitre lit l’article depuis le miroir privé de la collection, où le texte est complet. L’arbitre v1 lisait la version publique, qui masque le texte d’une part importante des articles : certains verdicts v1 ont donc été rendus sans l’article sous les yeux du juge.',
		independentVerdict: 'Verdict indépendant',
		independentVerdictDesc: "L'arbitre note lui-même l'article avant de comparer les analyses.",
		reasoningEffort: 'Effort de raisonnement',
		reasoningEffortDesc:
			'Claude Opus 5 raisonne de façon adaptative : la campagne fixe donc un niveau d’effort plutôt qu’un budget de jetons. Ce réglage détermine aussi le coût.',
		howItWorks: 'Fonctionnement',
		step1: "Il lit le texte intégral de l'article",
		step2: 'Il note lui-même la polarité, la subjectivité et la centralité',
		step3: 'Il compare les analyses anonymisées à sa propre note',
		step4:
			"Il désigne l'analyse la plus juste par dimension, ou indique que plusieurs se valent ou qu'aucune n'est juste",
		arbiterModel: 'Modèle arbitre',
		arbiterModelDesc:
			'Claude Opus 5 juge toutes les analyses d’un article en un seul appel : ses verdicts se tiennent donc entre eux, ce que dix campagnes deux à deux ne pourraient pas garantir.',
		viewPrompt: 'Voir le prompt',
		promptExplanation:
			"L'instruction système et le prompt utilisateur exacts envoyés à l'arbitre, mot pour mot.",
		viewFullPrompt: 'Voir le prompt complet',
		arbiterPrompt: "Prompt de l'arbitre du panel",
		systemInstruction: 'Instruction système',
		userPromptTemplate: 'Modèle de prompt utilisateur'
	},

	// Extreme Analysis
	extremeAnalysis: {
		title: 'Les mots des extrêmes',
		subtitle:
			'Quels sujets et quels lieux reviennent dans les articles situés à chaque bout des trois échelles.',
		analysisControls: 'Réglages',
		topKeywords: 'Mots-clés les plus fréquents',
		articleCount: "Nombre d'articles",
		selectCategory: 'Catégorie',
		selectKeywordType: 'Type de mots-clés',
		numberOfKeywords: 'Nombre de mots-clés',
		subjectKeywords: 'Sujets',
		spatialKeywords: 'Lieux',
		noData: 'Aucune donnée disponible pour cette sélection',
		categories: {
			subjectivityHigh: 'Subjectivité élevée (4–5)',
			subjectivityLow: 'Subjectivité faible (1–2)',
			polarityNegative: 'Polarité très négative',
			polarityPositive: 'Polarité très positive',
			centralityHigh: 'Très central',
			centralityLow: 'Pas central'
		},
		descriptions: {
			subjectivityHigh: 'Articles qui prennent nettement position',
			subjectivityLow: 'Articles factuels et informatifs',
			polarityNegative: 'Articles notés très négatifs',
			polarityPositive: 'Articles notés très positifs',
			centralityHigh: 'L’islam et les musulmans au cœur de l’article',
			centralityLow: 'L’islam et les musulmans évoqués seulement en passant'
		}
	},

	// Métadonnées SEO (SEOHead.svelte) — titres/descriptions/mots-clés par vue
	meta: {
		siteTitle: 'Analyse de sentiments IWAC',
		comparisonTitle: 'Comparaison de modèles IA',
		comparisonDescription:
			"Comparez la façon dont GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B et Qwen3.8 27B ont noté les mêmes articles de la Collection Islam Afrique de l'Ouest, et voyez où leurs lectures de la couverture de presse se séparent.",
		comparisonKeywords:
			'comparaison IA, GPT-5.6 Luna vs Mistral Small 4 vs DeepSeek vs Gemma vs Qwen, comparaison de modèles, analyse de sentiments, IWAC, évaluation IA',
		viewDescriptionPrefix: 'Explorez ',
		viewDescriptionSuffix:
			" dans les annotations de sentiment produites par IA sur la Collection Islam Afrique de l'Ouest, un corpus de presse ouest-africaine francophone consacré à l'islam et aux musulmans.",
		baseKeywords: "analyse de sentiments, IWAC, Islam Afrique de l'Ouest, visualisation de données",
		ogImageAlt:
			'Analyse de sentiments IWAC — distributions de polarité de GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B et Qwen3.8 27B sur 12 298 articles de presse ouest-africaine francophone',
		views: {
			charts: {
				title: 'Graphiques et distributions',
				description: "les graphiques de distribution des sentiments et l'analyse de polarité",
				keywords:
					'graphiques, polarité, distribution des sentiments, graphiques en barres, camemberts'
			},
			trends: {
				title: 'Tendances dans le temps',
				description: "l'évolution des notes de sentiment année après année",
				keywords: 'tendances, analyse temporelle, séries chronologiques, évolution'
			},
			correlation: {
				title: 'Distribution des sentiments',
				description: 'la relation entre les échelles de polarité et de subjectivité',
				keywords: 'corrélation, analyse croisée, distribution, relations'
			},
			volume: {
				title: "Volume d'articles",
				description: "le volume de publication d'articles et la distribution géographique",
				keywords: 'volume, distribution géographique, tendances de publication'
			},
			heatmap: {
				title: 'Carte de chaleur de la centralité',
				description: "la centralité de l'islam et des musulmans par pays et par année",
				keywords: 'carte de chaleur, centralité, analyse géographique, visualisation'
			},
			table: {
				title: "Explorateur d'articles",
				description: 'tous les articles notés, avec recherche et filtres',
				keywords: "tableau, explorateur d'articles, filtrage, recherche"
			},
			seasonality: {
				title: 'Saisonnalité',
				description: 'la couverture au fil des mois du calendrier lunaire islamique',
				keywords: 'saisonnalité, calendrier hégirien, ramadan, année lunaire, fête religieuse'
			},
			ranking: {
				title: 'Classement des journaux',
				description: 'les journaux classés selon leur note moyenne, avec intervalles de confiance',
				keywords:
					'journaux, classement, intervalles de confiance, titres de presse, sentiment moyen'
			},
			map: {
				title: 'Lieux mentionnés',
				description: 'les lieux que les articles nomment, cartographiés et notés',
				keywords: "carte, lieux, géographie, Afrique de l'Ouest, distribution spatiale"
			},
			agreement: {
				title: 'Accord entre modèles',
				description:
					'à quel point les modèles IA s’accordent, et comment ils diffèrent lorsqu’ils divergent',
				keywords: 'accord, kappa de Cohen, kappa de Fleiss, fiabilité inter-juges, calibration'
			},
			comparison: {
				title: 'Comparaison de modèles',
				description: 'les articles que deux modèles IA ont notés différemment, et de combien',
				keywords: 'comparaison, modèles IA, divergences, évaluation'
			},
			extremes: {
				title: 'Sentiments extrêmes',
				description: 'les catégories de sentiments les plus extrêmes et leurs mots-clés récurrents',
				keywords: 'extrêmes, mots-clés, valeurs aberrantes, catégories de sentiments'
			},
			arbiter: {
				title: "Verdicts de l'arbitre",
				description:
					"l'arbitrage à l'aveugle des désaccords entre modèles IA par un troisième modèle",
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
