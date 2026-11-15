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
	historyResearch: {
		rangeBandNote:
			'La bande pâle s’étend de la part la plus faible à la plus élevée parmi les modèles lorsque tous atteignent le seuil minimal. Elle décrit leurs différences, sans être un intervalle de confiance ; les bornes exactes figurent dans le tableau de données.',

		title: 'Évolution historique selon les modèles',
		intro:
			'Comparez le panel sur les mêmes articles collectés. Ces proportions décrivent les annotations de cette collection, pas l’opinion publique ni l’ensemble de la production journalistique.',
		corpusFilters:
			'Les filtres de pays et de journaux s’appliquent ici. Les filtres de sentiments du panneau de filtres concernent uniquement les graphiques à un seul modèle ; sélectionner les articles selon un modèle biaiserait cette comparaison.',
		negative: 'Part de polarité négative',
		central: 'Part centrale ou très centrale',
		subjective: 'Part plutôt ou très subjective',
		measure: 'Mesure',
		period: 'Période',
		year: 'Année',
		decade: 'Décennie',
		facet: 'Panneaux',
		all: 'Toute la sélection',
		country: 'Par pays',
		journal: 'Par journal',
		cohort: 'Cohorte d’articles',
		common: 'Mêmes articles applicables pour tous les modèles',
		available: 'Annotations applicables disponibles par modèle',
		availableNote:
			'Les dénominateurs disponibles diffèrent entre modèles. Les écarts avec la cohorte commune peuvent refléter la sélection autant que les différences d’annotation.',
		commonNote:
			'Chaque période retient les articles ayant une note applicable de chaque modèle sur la dimension choisie. Les notes absentes ou non applicables sont exclues. Dans le panel actuel, les absences non aléatoires de Qwen favorisent les articles où l’islam est plus central.',
		support:
			'{common} articles datés dans la cohorte commune sur {total} collectés ; {undated} sans année exploitable.',
		minimum: 'Nombre minimal d’articles par point',
		minimumNote:
			'Les interruptions signalent l’absence d’annotations applicables ou un effectif inférieur au minimum choisi. Une proportion nulle est une valeur mesurée.',
		range: 'Étendue entre modèles',
		unknown: 'Pays non renseigné',
		model: 'Modèle',
		collected: 'Articles collectés',
		rated: 'Articles applicables',
		target: 'Articles dans la catégorie',
		share: 'Proportion',
		minimumShare: 'Proportion minimale des modèles',
		maximumShare: 'Proportion maximale des modèles',
		previous: 'Panneaux précédents',
		next: 'Panneaux suivants',
		page: 'Page {page} sur {pages}',
		timelineTitle: 'Couverture des journaux dans le temps',
		timelineIntro:
			'Nombre d’articles collectés par journal et période de publication. Une case vide signifie qu’aucun article ne figure dans cette sélection ; elle ne prouve pas que le journal n’a rien publié.',
		timelineFilters:
			'Cette chronologie utilise uniquement les filtres de pays et de journaux, indépendamment des annotations de sentiments.',
		timelineSupport: '{total} articles datés ; {undated} sans année exploitable.',
		timelineHint:
			'Sélectionnez un journal ci-dessous pour appliquer son filtre dans le tableau de bord.',
		order: 'Ordre des journaux',
		countOrder: 'Nombre d’articles collectés',
		nameOrder: 'Nom',
		filterNewspaper: 'Filtrer sur ce journal',
		timelinePage: 'Journaux {start}–{end} sur {total}',
		timelineLegend: 'Articles collectés par case',
		panelSeries: 'Séries du panel',
		panelNone: 'Modèles seulement',
		panelMajority: 'Majorité du panel dans la catégorie',
		panelAny: 'Au moins un modèle dans la catégorie',
		panelMajorityName: 'Majorité du panel',
		panelAnyName: 'Au moins un modèle',
		panelNote:
			'Les séries du panel comptent chaque article une seule fois : « majorité du panel » lorsque plus de la moitié du panel le range dans la catégorie, « au moins un modèle » dès qu’un modèle le fait. Toutes deux ne retiennent que les articles notés par tous les modèles sur cette dimension, quelle que soit la cohorte choisie.',
		intervalLow: 'Borne inférieure de Wilson à 95 %',
		intervalHigh: 'Borne supérieure de Wilson à 95 %',
		lowSample: 'Moins de {min} articles',
		lowSampleNote:
			'Les points creux et estompés reposent sur moins de {min} articles : un seul article y déplace une part de plus de trois points de pourcentage. Les intervalles de Wilson à 95 % de l’infobulle et du tableau de données indiquent jusqu’où chaque part peut vraisemblablement se situer.'
	},

	reliability: {
		ordinalAlpha: 'α ordinal',
		nominalAlpha: 'α nominal',
		alphaDetail: 'α ordinal de Krippendorff · {count} articles',
		alphaHelp:
			'L’alpha de Krippendorff porte sur tout article noté par au moins deux modèles : une note absente laisse l’article dans le calcul avec moins d’évaluateurs au lieu de l’en retirer. La forme ordinale accorde un crédit partiel aux notes voisines, pondéré par la fréquence d’usage de chaque point de l’échelle. 1 correspond à un accord parfait ; 0 à ce que produirait le seul hasard.',
		alphaPolarityNote:
			'Polarité : l’alpha ordinal utilise les cinq niveaux notés et laisse de côté « Non applicable », comme le κ pondéré ; l’alpha nominal et le κ de Fleiss le conservent comme catégorie.',
		completeCaseTitle: 'κ de Fleiss, cas complets',
		fleissDetail: 'Cas complets · {count} articles',
		materialMissing: 'Sans {model} : κ de Fleiss {value} sur {count} articles.',
		archiveAlphaNote:
			'Archive : le κ de Fleiss reste la statistique publiée pour le panel. L’α de Krippendorff s’affiche en complément et ne modifie aucun des chiffres archivés.',
		looTitle: 'En retirant un modèle',
		looNote:
			'Un coefficient de panel dépend des modèles retenus ; l’incertitude due à l’échantillon d’articles est faible en comparaison.',
		looModel: 'Modèle retiré',
		looAll: 'Aucun (panel entier)',
		looArticles: 'Articles',
		applicabilityTitle: 'L’article porte-t-il sur l’islam ?',
		applicabilityLede:
			'Le verdict de chaque modèle réduit à « traité » ou « non traité » : une polarité « Non applicable » ou une centralité « Non abordé » vaut non traité, toute autre paire de notes vaut traité. Une note absente n’est ni l’un ni l’autre et reste hors du calcul. Les signalements de divergence et l’arbitre écartent les articles portant un verdict « non traité » selon une règle documentée ; cette mesure décrit ce que la règle met de côté.',
		applicabilityAlpha: 'α du panel',
		applicabilityAlphaDetail: 'α nominal · {count} articles avec au moins deux verdicts',
		applicabilityMixed: 'Verdicts partagés',
		applicabilityMixedDetail:
			'{count} articles sur {total} : certains modèles disent traité, d’autres non',
		applicabilityAllAddressed: 'Traité pour tous les modèles',
		applicabilityAllNotAddressed: 'Non traité pour tous les modèles',
		applicabilityShareDetail: 'Part des {total} articles avec au moins deux verdicts',
		applicabilityDisagreements: 'Verdicts opposés',
		applicabilityAddressed: 'Traité',
		applicabilityNotAddressed: 'Non traité',
		applicabilityMissing: 'Sans note',
		applicabilityModels: 'Verdicts par modèle',
		chanceWithinOne: 'Hasard : {value} · {count} articles comparés',
		chanceWithinOneHelp:
			'Part des articles où les deux étiquettes sont identiques ou distantes d’une position. Le hasard correspond à la part qu’atteindraient deux modèles indépendants ayant ces mêmes distributions d’étiquettes. Quand la plupart des notes se concentrent dans trois catégories voisines, il est déjà élevé : cette mesure distingue donc à peine une paire d’une autre.',
		flagsTitle: 'Ce qui fait signaler un article',
		flagsLede:
			'Les articles que le tableau de bord signale parce que les notes du panel s’étendent sur {threshold} crans ou plus dans au moins une dimension, ventilés selon la dimension qui atteint ce seuil. La règle elle-même est inchangée.',
		flagsFlagged: 'Articles signalés',
		flagsDetail: '{count} sur {total} articles comparables',
		flagsBy: 'Signalements par dimension',
		flagsSubjectivityOnly: 'Par la seule subjectivité',
		flagsSubjectivityNote:
			'La subjectivité est la dimension dont l’échelle est appliquée de la façon la moins cohérente : un signalement dû à la seule subjectivité renseigne davantage sur l’usage de cette échelle par les modèles que sur un désaccord de fond.',
		conflictBreakdownTitle: 'Ce qui rend un désaccord marqué',
		totalDifferenceCaveat:
			'Le total additionne des crans de trois échelles qui ne sont pas commensurables : il sert à classer les articles, non à mesurer l’écart entre deux lectures.',
		correlationInterval: 'Intervalle à 95 %',
		correlationIntervalNote:
			'L’intervalle repose sur la transformation z de Fisher, avec la variance de Fieller, Hartley et Pearson pour les corrélations de rang. Avec un échantillon de cette taille, toute corrélation visible a une valeur p pratiquement nulle : l’intervalle et n sont les chiffres informatifs.',
		patternRank: 'Configuration {rank}',
		methodCategorical: 'Non pondéré, toutes catégories'
	},

	agreementResearch: {
		cohortNote:
			'Les cas complets du panel actuel favorisent les articles où l’islam est plus central, car les notes absentes de Qwen ne le sont pas aléatoirement.',

		overviewTitle: 'Accord entre les paires de modèles',
		overviewNote:
			'Chaque case compare deux modèles sur la dimension choisie. L’effectif indique les articles utilisables pour cette mesure. Sélectionnez une case pour examiner la matrice des catégories. Les échantillons peuvent différer selon la paire ; l’accord ne mesure pas l’exactitude.',
		metric: 'Mesure d’accord',
		method: 'Méthode',
		legacyMethod: 'Méthode ordinale historique v1',
		ordinalMethod: 'Méthode ordinale applicable v2',
		weightedLegacyNote:
			'Méthode : ordinal-v1 (archives). La polarité pondérée et l’accord à un échelon près conservent « Non applicable » au bas de l’échelle pour reproduire les calculs publiés.',
		weightedApplicableNote:
			'Méthode : applicable-ordinal-v2. L’accord pondéré en polarité et l’accord à un échelon près excluent les paires où une note est « Non applicable ». La matrice complète et l’accord non pondéré conservent cette catégorie ; leurs effectifs peuvent différer.',
		weightedAllNote:
			'Accord ordinal à pondération quadratique ; l’effectif comprend les paires disposant de deux réponses sur cette dimension.',
		closeAgreementNote:
			'L’accord pondéré accorde davantage de crédit aux petits écarts. Une valeur pondérée supérieure ne suffit pas à établir un décalage directionnel ni à montrer que la plupart des écarts sont d’un cran.',
		openPair: 'Examiner {modelA} et {modelB}',
		models: 'Modèles',
		patternsTitle: 'Combinaisons complètes de catégories',
		patternsNote:
			'Chaque ligne conserve les catégories attribuées aux mêmes articles par tous les modèles, dans l’ordre des colonnes. Les tailles de groupes correspondent aux réponses identiques : 3–2 signifie que trois modèles ont choisi une catégorie et deux une autre. Les réponses manquantes sont exclues ; le réglage « Non applicable » ci-dessus s’applique.',
		patternKind: 'Type de combinaison',
		allPatterns: 'Toutes les combinaisons',
		unanimousPatterns: 'Unanimité',
		lonePatterns: 'Un contre les autres',
		splitPatterns: 'Autres divisions',
		patternLimit: 'Combinaisons affichées',
		pattern: 'Combinaison',
		splitSize: 'Tailles des groupes',
		share: 'Part des articles utilisables',
		articles: 'Articles',
		selectPattern: 'Afficher les articles de la combinaison {pattern}',
		patternsSummary:
			'{shown} combinaisons affichées sur {total}, pour {articles} articles utilisables. Les parts portent sur tous les articles utilisables, avant le filtre par type de combinaison.',
		patternArticles: 'Articles de la combinaison sélectionnée',
		noPattern: 'Sélectionnez une combinaison pour examiner ses articles.',
		missingPattern:
			'La combinaison sélectionnée est absente avec la dimension, la génération ou les filtres actuels.',
		articleTitle: 'Article',
		articleYear: 'Année',
		articleJournal: 'Journal',
		openArticle: 'Ouvrir l’annotation de {title}',
		loadMore: 'Afficher davantage d’articles',
		articleCount: '{shown} articles affichés sur {total} correspondances.',
		undefined: 'Non défini',
		pair: 'Paire de modèles',
		weightedN: '{count} articles · {method}',
		patternSelection: 'Combinaison sélectionnée'
	},

	links: {
		copy: 'Copier le lien vers cette analyse',
		copied: 'Lien vers l’analyse copié.',
		copyFailed: 'Impossible de copier le lien. Copiez l’adresse dans votre navigateur.',
		missing: 'L’élément de ce lien n’est pas disponible dans l’analyse sélectionnée.',
		close: 'Revenir à l’analyse'
	},
	audit: {
		place: 'Lieu',
		flowFrom: 'Modèle et catégorie de départ',
		flowTo: 'Modèle et catégorie d’arrivée',
		expandViewer: 'Agrandir ou réduire la vue',
		newTab: 'Ouvrir dans un nouvel onglet',
		search: 'Rechercher…',
		globalAll: 'Vue d’ensemble',
		byJournal: 'Par journal',
		other: 'Autres journaux',
		topJournals:
			'Une barre par journal, ramenée à 100 % de ses propres articles notés (n à côté du titre) : les profils se comparent quelle que soit la taille du journal. Les dix plus représentés sont affichés, les autres sont regroupés. Le tableau donne les effectifs bruts de chaque journal.',
		count: 'Articles',
		share: 'Part (%)',
		year: 'Année',
		category: 'Catégorie',
		journal: 'Journal',
		included: 'Inclus',
		excluded: 'Exclus (note manquante)',
		reload: 'Recharger cette vue',
		viewLoadError: 'Cette vue n’a pas pu être chargée. Rechargez-la pour réessayer.',
		mainNav: 'Navigation principale',
		openNav: 'Ouvrir la navigation',
		closeNav: 'Fermer la navigation',
		collapseNav: 'Réduire la navigation',
		expandNav: 'Développer la navigation',
		closeModal: 'Fermer la fenêtre',
		clearSearch: 'Effacer la recherche',
		changeLanguage: 'Changer de langue',
		comparisonDetails: 'Voir la comparaison pour {title}',
		articleDetails: 'Voir les détails pour {title}',
		excludeNA: 'Exclure les articles non applicables',
		differentHelp:
			'Articles que {a} et {b} ont notés différemment sur au moins une dimension, quel que soit l’écart.',
		significantHelp:
			'Articles pour lesquels {a} et {b} diffèrent d’au moins trois crans sur une dimension.',
		scope: 'Regroupement',
		openMenu: 'Ouvrir le menu',
		selectPlaceholder: 'Choisir…',
		back: 'Retour',
		backToDashboard: 'Retour au tableau de bord',
		rangeMinimum: 'Valeur minimale',
		rangeMaximum: 'Valeur maximale',
		differenceMinimum: 'Écart minimal',
		differenceMaximum: 'Écart maximal',
		zoomIn: 'Zoom avant',
		zoomOut: 'Zoom arrière',
		zoomReset: 'Réinitialiser le zoom'
	},
	// App header and branding
	appTitle: 'Analyse de sentiments CIAO',
	skipToContent: 'Aller au contenu',
	appSubtitle: "Collection Islam Afrique de l'Ouest – visualisation et exploration des données",
	enterFullscreen: 'Passer en plein écran',
	exitFullscreen: 'Quitter le mode plein écran',
	/* Intitulé du sélecteur de langue au bas du tiroir mobile. */
	language: 'Langue',

	// Navigation
	/* Noms des vues : entrées de la barre latérale et, pour la plupart, le H1 de la vue. */
	nav: {
		charts: 'Distributions',
		trends: 'Tendances',
		distribution: 'Polarité × subjectivité',
		volume: 'Volume',
		heatmap: 'Centralité par pays',
		table: 'Articles',
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
		rated: 'Évalués',
		/* Affiché sous le filet lorsque le modèle choisi a laissé plus de 1 % du
		   corpus sans note. */
		unratedCaveat:
			'Ce modèle a laissé {count} articles sans note ({share} du corpus). Ils ne forment pas un sous-ensemble aléatoire : ses chiffres décrivent les articles qu’il a notés plutôt que le corpus entier.',
		unratedCaveatLink: 'Voir la méthodologie'
	},

	/* Les trois sections de la barre latérale ; aussi le surtitre de chaque vue. */
	navGroups: {
		corpus: 'Corpus',
		model: 'Lecture d’un modèle',
		panel: 'Entre modèles'
	},

	/* L'introduction permanente au-dessus de chaque vue. */
	intro: {
		label: 'À propos de ce tableau de bord',
		title: 'Plusieurs lectures automatiques d’un même corpus de presse',
		body: 'Un panel de {models} modèles de langage a noté les {articles} articles de presse de ce corpus selon trois dimensions : la polarité, la subjectivité et la place qu’occupent l’islam et les musulmans dans chaque article.',
		bodyNoCount:
			'Un panel de {models} modèles de langage a noté les articles de presse de ce corpus selon trois dimensions : la polarité, la subjectivité et la place qu’occupent l’islam et les musulmans dans chaque article.',
		caveat:
			'Aucun modèle ne fait office de vérité de référence, et il n’existe pas encore d’échantillon codé à la main. L’accord entre modèles mesure donc leur cohérence, non leur exactitude.',
		agreementLink: 'Où les modèles s’accordent et divergent',
		dismiss: 'Masquer cette introduction'
	},

	/* Le pied de page : citation et provenance. */
	footer: {
		cite: 'Comment citer',
		softwareTag: 'logiciel',
		citeNote:
			'Dans une publication, citez le dépôt versionné avec le lien vers l’analyse et votre date de consultation.',
		version: 'Version',
		data: 'Données',
		currentAnalysis: 'analyse actuelle (v2)',
		archivedAnalysis: 'analyse archivée (v1)',
		generated: 'générées le {date}',
		sourceRevision: 'révision source {revision}',
		release: 'publication {release}',
		provenanceLoading: 'Chargement de la provenance des données…',
		provenanceUnavailable: 'La provenance des données n’a pas pu être chargée.',
		licence: 'Licence',
		licenceText: 'Logiciel sous licence MIT ; jeu de données source sous CC BY-NC-SA 4.0.',
		repository: 'Code source (GitHub)',
		dataset: 'Jeu de données (Hugging Face)',
		acknowledgements: 'Remerciements',
		// Wording mandated by the computing centre, which publishes it in English only.
		acknowledgementText:
			'Les calculs ont été effectués sur le cluster festus du Bayreuth Centre for High Performance Computing (https://www.bzhpc.uni-bayreuth.de), financé par la Deutsche Forschungsgemeinschaft (DFG, Fondation allemande pour la recherche) - 523317330.'
	},

	/* Le sélecteur de paire de modèles (comparaison, accord, arbitre archivé). */
	pairPicker: {
		first: 'Premier modèle',
		second: 'Second modèle'
	},

	/* Les notes de tout le panel dans le détail d'un article. */
	panelRatings: {
		title: 'Tout le panel',
		note: 'Chaque modèle de cette analyse a noté le même article. Le modèle sélectionné est mis en évidence ; aucun ne constitue une lecture de référence.',
		selected: 'Sélectionné',
		modelReading: 'Lecture de {model}'
	},

	/* Textes de la carte méthodologique autrefois écrits en dur par langue. */
	analysisInfo: {
		collectionName: 'Collection Islam Afrique de l’Ouest',
		collectionAcronym: 'CIAO',
		listAnd: ' et ',
		panelReadSame:
			'Chaque modèle du panel a lu les mêmes articles, ce qui permet de placer leurs réponses côte à côte :',
		panelSwitch:
			'Choisissez les modèles avec les sélecteurs de cette vue. La vue Accord place tout le panel côte à côte.',
		ratingsFrom: 'Les notes affichées viennent de ',
		independentReading:
			'Chaque modèle lit les mêmes articles de son côté, sans connaître les réponses des autres',
		differencesAfterwards:
			'Les écarts entre modèles sont calculés ensuite, dimension par dimension',
		samePrompt:
			'Chaque modèle reçoit le même prompt, de sorte que la comparaison mesure les modèles et non leurs instructions :',
		identicalPrompt:
			'Le prompt est identique pour tous les modèles, si bien que rien dans les instructions n’en favorise un',
		readingComparison: 'Lire la comparaison',
		comparisonCaveats: [
			'Les écarts entre modèles peuvent tenir à leurs données d’entraînement, à leur architecture et à la façon dont ils ont été réglés, sans qu’aucun soit pour autant plus juste',
			'Aucun modèle ne fait référence. Là où deux d’entre eux divergent, l’article mérite d’être lu',
			'Ces comparaisons servent surtout à repérer des motifs à l’échelle du corpus, et fort peu à trancher sur un article isolé'
		],
		promptTitle: 'Le prompt d’analyse complet',
		translationNoteLabel: '',
		// Vide : le prompt original est en français, il n'y a rien à signaler.
		translationNote: '',
		docs: 'Documentation →',
		promptFingerprint:
			'Empreinte du prompt {fingerprint}, enregistrée avec chaque résultat mis en cache.'
	},

	// Filters
	filters: {
		title: 'Filtres',
		country: 'Pays',
		journal: 'Journal',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		notAnnotatedNote:
			'« Non applicable » est un verdict : le modèle a lu l’article et n’y a trouvé aucune prise de position. « Non annoté » signifie qu’il n’y a aucune note — les articles qu’un modèle a refusé de noter, ou n’a jamais vus.',
		clearAll: 'Tout effacer',
		clearAllFilters: 'Effacer tous les filtres',
		searchJournals: 'Rechercher un journal…',
		showingJournals: 'Affichage de',
		of: 'sur',
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
		notApplicable: 'Non applicable',
		notAnnotated: 'Non annoté'
	},

	// Subjectivity labels
	subjectivity: {
		factual: 'Très objectif',
		ratherFactual: 'Plutôt objectif',
		mixed: 'Mixte',
		ratherSubjective: 'Plutôt subjectif',
		subjective: 'Très subjectif'
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
			'Journaux classés selon leur note moyenne sur la dimension choisie. Les intervalles de confiance à 95 % décrivent l’incertitude au sein de cet échantillon de notes. Ils ne prennent pas en compte la sélection archivistique, les articles manquants ni les erreurs d’annotation ; cette collection n’est pas un échantillon aléatoire de toute la production journalistique.',
		chartTitle: 'Classement des journaux',
		chartSubtitle: 'Moyenne et IC à 95 % · journaux comptant au moins {min} articles évalués',
		netPolarity: 'Polarité nette',
		meanSubjectivity: 'Subjectivité moyenne',
		meanCentrality: 'Centralité moyenne',
		confidenceInterval: 'IC à 95 %',
		neutralLine: 'neutre',
		excludedNote:
			'{count} journaux écartés : moins de {min} articles évalués. Leurs moyennes seraient trop incertaines pour être classées.',
		noneAboveThreshold:
			'Aucun journal ne compte au moins {min} articles évalués avec les filtres actuels.',
		positiveShare: 'Part positive',
		negativeShare: 'Part négative',
		netShare: 'Part nette (positive − négative)',
		proportionSubtitle:
			'Part et IC à 95 % (Wilson ; part nette : approximation normale) · journaux comptant au moins {min} articles évalués',
		measureGroup: 'Mesure',
		readingNote:
			'Les journaux dont les intervalles se chevauchent ne peuvent pas être ordonnés : leur ordre à l’intérieur du chevauchement n’est pas interprétable. Le classement est aussi celui d’un seul modèle : les autres modèles de cette génération ordonnent les mêmes titres autrement. Les mesures moyennes traitent les codes ordinaux (−2 à +2, ou 1 à 5) comme des mesures également espacées, ce qu’ils ne sont pas ; les mesures en parts évitent cette hypothèse.'
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
		legendReliabilityTitle: 'Fiabilité de la couleur',
		legendReliable: 'Moyenne d’au moins {min} articles notés',
		legendLowN: 'Moins de {min} : estompée',
		keyboardNote:
			'Survolez une bulle pour la nommer, cliquez pour le détail. Les bulles ne sont pas accessibles au clavier : le tableau de données ci-dessous recense chaque lieu avec les mêmes chiffres.',
		caveat:
			'Une bulle compte les articles qui mentionnent un lieu, et non ceux qui portent sur lui. Chaque article nomme environ quatre lieux, si bien que ces totaux dépassent le nombre d’articles. La couleur correspond à la note attribuée à l’article entier sur une échelle de 1 à 5, moyennée sur les articles que le modèle a effectivement évalués pour cette dimension. Pour la polarité, « Non applicable » signifie qu’aucune position n’est exprimée : la valeur sort de la moyenne mais compte toujours dans la taille de la bulle. Pour la centralité, « Non abordé » constitue un véritable bas d’échelle et reste inclus. Les lieux dépourvus de coordonnées dans le référentiel IWAC n’apparaissent pas.',
		noPlacesTitle: 'Aucun lieu cartographié',
		noPlacesLede:
			'Aucun article de la sélection actuelle ne nomme un lieu dont les coordonnées sont connues.',
		ordinalNote:
			'Ce sont des moyennes de rangs ordinaux, non des unités mesurées. Les bulles estompées reposent sur moins de {min} articles évalués, trop peu pour que leur moyenne dise grand-chose ; la fenêtre du lieu et le tableau de données donnent n pour chaque lieu.'
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
			'Les dates enregistrées selon le calendrier Umm al-Qura constituent la chronologie de l’IWAC. La conversion tabulaire civile intervient uniquement en l’absence de champs hégiriens enregistrés. Aucun de ces calendriers n’établit la date d’une observance religieuse locale.',
		undatedNote: '{count} articles écartés : date de publication incomplète.',
		ordinalNote:
			'La centralité moyenne est une moyenne de rangs ordinaux (1 à 5), non une unité mesurée ; n est le nombre d’articles évalués dans chaque mois. Les points creux reposent sur moins de {min} articles évalués.',
		ratedArticles: 'Articles évalués (n)',
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
			'Comment les modèles se situent les uns par rapport aux autres : où ils convergent, où ils divergent, et si un désaccord relève d’un décalage systématique ou d’une véritable différence de lecture.',
		dimensionSelector: 'Dimension d’analyse',
		exactAgreement: 'Accord exact',
		exactAgreementHelp:
			'Proportion d’articles pour lesquels les deux modèles ont choisi la même catégorie. Cette valeur ne corrige pas l’accord que deux modèles atteindraient par simple hasard.',
		adjacentAgreement: 'À un cran près',
		articlesCompared: 'articles comparés',
		kappa: 'κ de Cohen',
		kappaHelp:
			'Accord corrigé du hasard. 0 signifie pas mieux que le hasard, 1 signifie parfait. Tous les désaccords y pèsent autant, si bien que deux modèles qui classent les articles de la même façon mais restent à une catégorie d’écart obtiennent malgré tout un score faible.',
		weightedKappa: 'κ pondéré',
		fleissHelp:
			'Le kappa de Fleiss sur les articles notés par tous les modèles. Un article laissé sans note par un seul modèle est écarté pour tous.',
		panelTitle: 'L’ensemble du panel',
		panelLede:
			'L’accord entre tous les modèles de l’analyse retenue à la fois. L’alpha de Krippendorff conserve tout article noté par au moins deux modèles ; le kappa de Fleiss ne garde que les articles notés par tous les modèles, si bien qu’un modèle à la couverture plus mince réduit la base de tous les autres.',
		matrixTitle: 'Matrice d’accord',
		rowsAre: 'Lignes :',
		columnsAre: 'Colonnes :',
		ofRow: 'De cette ligne',
		calibrationTitle: 'Calibration des modèles',
		calibrationSubtitle: 'À quelle fréquence chaque modèle emploie chaque échelon',

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
		declinedToggle: 'Réponses « Non applicable »',
		declinedInclude: 'Incluses',
		declinedExclude: 'Exclues',
		declinedNote:
			'{count} articles sont écartés parce qu’au moins un modèle a répondu « Non applicable ». Ce verdict se situe sous le bas de l’échelle : le compter comme une notation fait passer un modèle qui n’a trouvé aucune prise de position pour un modèle en désaccord. L’effet se concentre sur les journaux dont les articles ne portent que marginalement sur l’islam.',
		declinedIncludedNote:
			'Les réponses « Non applicable » sont comptées au bas de l’échelle. Les journaux qui en comptent beaucoup apparaîtront comme très discutés, mais le désaccord porte alors sur le fait même que l’article concerne l’islam, plutôt que sur le caractère favorable de sa couverture.',

		disagreementTitle: 'Journaux classés par désaccord entre modèles',
		disagreementSubtitle:
			'Écart moyen sur le panel avec IC à 95 % · journaux comptant au moins {min} articles évalués',
		disagreementAxis: 'Crans d’échelle entre le modèle le plus haut et le plus bas',
		disagreementNote:
			'Le miroir de la vue Journaux : mêmes journaux, même seuil, mais l’axe mesure l’écart entre les modèles plutôt que ce qu’ils disent. Un journal peut être banal quant au sentiment et atypique quant au désaccord.',
		spread: 'Écart moyen',
		unanimityRate: 'Unanimité',
		declinedShare: 'Part « Non applicable »',
		medianYear: 'Année médiane',
		disagreementExcluded:
			'{count} journaux écartés : moins de {min} articles évalués. Les petits journaux paraissent plus discutés, si bien que les classer ici induirait en erreur.',
		disagreementEmpty: 'Aucun journal n’atteint {min} articles évalués avec les filtres actuels.',

		dissentTitle: 'Qui se démarque',
		dissentSubtitle:
			'Chaque article rangé selon l’unanimité, un modèle contre les autres ou une division plus large',
		dissentStacked: 'Par journal',
		dissentTernary: 'Triangle',
		dissentTernaryNote:
			'Un point par journal, placé selon le modèle qui s’y démarque le plus souvent. Un point à un sommet signifie que ce modèle assume tout le désaccord, un point au centre que les trois se le partagent également. La taille indique le nombre d’articles. Les journaux où aucun modèle ne s’est jamais démarqué seul n’ont pas de position et ne sont pas tracés. Un triangle n’ayant que trois sommets, cette vue n’est proposée que pour l’archive à trois modèles ; le panel actuel se lit sur les barres empilées.',
		dissentsAlone: 'se démarque seul',

		directionTitle: 'Dans quel sens penche chaque modèle',
		directionSubtitle:
			'Lorsqu’un modèle se démarque, note-t-il au-dessus du reste du panel ou en dessous ? Les barres au-dessus de l’axe notent plus haut, celles en dessous plus bas.',
		directionAbove: 'Note plus haut',
		directionBelow: 'Note plus bas',
		directionNote:
			'C’est l’énoncé le plus net que ces données produisent sur la façon dont ces modèles diffèrent. Un modèle dont les barres se rangent presque entièrement d’un côté applique l’échelle autrement que ses pairs, de manière constante et dans un seul sens.',

		flowTitle: 'Circulation des étiquettes dans le panel',
		flowNote:
			'Les rubans représentent les effectifs entre colonnes de modèles adjacentes. Les liens fusionnés ne conservent pas le parcours complet des articles ; consultez les combinaisons complètes ci-dessous pour examiner les notes de tous les modèles sur les mêmes articles.',
		flowArticles: 'articles',

		scatterTitle: 'Le désaccord porte-t-il sur les couvertures extrêmes ou ambiguës ?',
		scatterSubtitle:
			'Une bulle par journal · taille selon le nombre d’articles, couleur selon le pays',
		scatterX: 'Moyenne du consensus (les modèles moyennés)',
		scatterY: 'Écart moyen sur le panel',
		scatterNote:
			'Corrélation entre les deux axes : r = {r}. Une valeur proche de zéro signifierait que le désaccord ne dépend pas du caractère favorable de la couverture d’un journal. Une valeur forte, dans un sens ou dans l’autre, signifie que les modèles se disputent surtout un bout de l’échelle, et le classement ci-dessus doit alors se lire en conséquence. La valeur diffère selon la génération d’analyse et selon la dimension.'
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
		declined: '« Non applicable »',
		medianYear: 'Année médiane',
		disagreementCaption:
			'Journaux classés par écart moyen sur le panel, avec intervalles de confiance, unanimité et part de « Non applicable »'
	},

	// Chart titles and labels
	charts: {
		polarityDistribution: 'Distribution de la polarité',
		subjectivityDistribution: 'Distribution de la subjectivité',
		centralityDistribution: 'Distribution de la centralité',
		sentimentTrends: 'Tendances des sentiments',
		subjectivityTrends: 'Tendances de la subjectivité',
		volumeByCountry: "Volume d'articles par pays",
		centralityHeatmap: 'Carte de chaleur de la centralité',
		articlesAnalyzed: 'articles analysés',
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
		lowSampleBand: 'n < {min}',
		lowSampleNote:
			'En mode part, les années ombrées reposent sur moins de {min} articles évalués : un seul article y déplace les bandes de plus de trois points de pourcentage. L’infobulle donne le n de chaque année.',
		subtitle: 'Comment les notes évoluent au fil des années, pour le corpus et pour chaque journal.'
	},

	// Volume view
	volume: {
		subtitle: 'Combien d’articles le corpus contient, année par année et pays par pays.'
	},

	// Heatmap view
	heatmap: {
		minimumCount: 'Minimum d’articles annotés par cellule',
		scaleNote:
			'La centralité moyenne suit l’échelle commune de 1 à 5. Les annotations manquantes et les réponses « Non applicable » sont exclues ; n indique le nombre d’articles annotés par cellule. Il s’agit de moyennes de rangs ordinaux, pas d’unités mesurées.',
		hiddenCells: '{count} cellules sont masquées car leur effectif est inférieur au seuil.',

		subtitle:
			'La place de l’islam et des musulmans dans les articles, pays par pays et année par année. Les cellules plus claires indiquent que le thème occupe une place plus centrale.'
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
		date: 'Date',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		itemsPerPage: 'Éléments par page',
		showingItems: 'Affichage de',
		noFilteredArticles: 'Aucun article ne correspond aux filtres sélectionnés',
		noFilteredArticlesHint:
			'Modifiez ou effacez les filtres pour afficher de nouveau des articles.',
		emptyHint: 'Il n’y a rien à afficher pour la sélection actuelle.',
		articleTitle: 'Titre',
		subtitle:
			'Parcourez chaque article, avec ses trois notes et la raison que le modèle a donnée pour chacune.',
		searchTitles: 'Rechercher dans les titres',
		searchResults: '{count} articles dont le titre contient « {query} »',
		searchNoResults: 'Aucun titre ne contient « {query} »',
		searchNoResultsHint:
			'Les accents et les majuscules sont ignorés. Essayez un mot plus court ou différent.',
		searchScopeNote: 'L’export CSV contient les articles listés ici, recherche comprise.',
		pageStatus: 'Page {page} sur {pages}',
		pagination: 'Pagination',
		previousPage: 'Page précédente',
		nextPage: 'Page suivante',
		layout: 'Affichage',
		sortDirectionAsc: 'Ordre croissant. Passer à l’ordre décroissant',
		sortDirectionDesc: 'Ordre décroissant. Passer à l’ordre croissant',
		untitled: 'Article sans titre',
		unknownJournal: 'Journal non renseigné'
	},

	// Article details
	article: {
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
			'Analyse du corpus : 3–5 août 2026 pour GPT-5.6 Luna, Mistral Small 4 et DeepSeek v4 Flash ; 14–15 août pour Gemma 4 31B ; 17–24 août pour Qwen3.8 27B ; 23 octobre pour Claude Haiku 5.5',
			"Effort de raisonnement : moyen pour GPT-5.6 Luna, Qwen3.8 27B et Claude Haiku 5.5, les trois dont le réglage a pu être vérifié comme un véritable échelon intermédiaire ; élevé pour Mistral Small 4 et DeepSeek v4 Flash, dont les API n'offrent aucun niveau intermédiaire ; nominalement moyen pour Gemma 4 31B, dont la route OpenRouter rend le moyen et l'élevé indiscernables",
			'Où chaque modèle a tourné : chez son concepteur — OpenAI, Mistral ou Anthropic —, sauf Gemma 4 31B et DeepSeek v4 Flash, servis via OpenRouter, et Qwen3.8 27B, auto-hébergé avec vLLM sur le cluster Festus de l’université de Bayreuth',
			'Claude Haiku 5.5 a rejoint le panel le 22 octobre 2026 sans pilote, sur décision du responsable de la collection : aucun chiffre de pilote n’existe donc pour son accord avec les autres modèles ni pour sa constance avec lui-même',
			'Température : non définie par le pipeline — chaque modèle tourne à la valeur par défaut de son hôte',
			'Format de sortie : JSON structuré validé par un schéma Pydantic',
			'Un cache reprenable, un enregistrement par article et par modèle ; seuls les appels réussis y sont conservés',
			'Gestion des erreurs : jusqu’à trois tentatives par appel, avec une attente croissante entre elles et un délai maximal par modèle',
			'Couverture : 12 298 des 12 348 articles portent les annotations de GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash et Gemma 4 31B. Les 50 articles qui ne sont ni en français ni en anglais sont écartés à dessein, le prompt étant en français',
			'Claude Haiku 5.5 s’arrête 47 articles plus tôt : son passage d’octobre n’a trouvé aucun texte pour 47 articles en français que les autres avaient lus en août, et les a sautés. Contrairement au manque ci-dessous, celui-ci a une cause mécanique',
			'Qwen3.8 27B s’arrête 200 articles plus tôt : il les a refusés au fil d’un passage complet et de trois séries de reprises. Ce manque est définitif, et il n’est pas aléatoire — il frappe surtout les articles où l’islam est périphérique, si bien que tout chiffre calculé sur les seuls articles évalués par tous penche vers une matière où l’islam est central'
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
		close: 'Fermer',
		all: 'Tout',
		total: 'Total',
		articles: 'articles',
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
		archivedConfound:
			'Le prompt a été réécrit entre les deux analyses : un écart entre elles mêle donc le changement de modèles au changement de prompt.',
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
		pointDifference: 'cran d’écart',
		pointsDifference: 'crans d’écart',
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
		averageDiscrepancyExplanation:
			'L’écart moyen entre les deux modèles par article, cumulé sur les trois dimensions (polarité + subjectivité + centralité) et compté en crans d’échelle.',
		breakdownByDimension: 'Répartition par dimension',
		enableComparisonMode: 'Activer le mode comparaison',
		enableComparisonDescription:
			'Choisissez les deux modèles à placer côte à côte avec les sélecteurs « Premier modèle » et « Second modèle » en haut de cette vue.',
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
		versus: 'vs'
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
			'Un article part à l’arbitrage lorsque les deux modèles s’écartent d’au moins 3 crans sur l’une des trois dimensions.',
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
		leadNote: '{model} mène les préférences globales de {points} points de pourcentage',
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
		multiple: 'Plusieurs aussi proches',
		none: 'Aucune proche',
		overallVerdictsNote: 'Un verdict par article, sur les trois dimensions à la fois',
		dimensionTieNote:
			'Pourquoi le chiffre principal est un taux de concordance et non un nombre de victoires : l’arbitre ne désigne une seule analyse la plus proche que lorsqu’une se détache. Quand plusieurs rejoignent sa propre note, il le dit, et le gagnant global se joue alors sur de petits écarts entre des analyses qui concordent avec lui aussi souvent. Confronter la note de chaque modèle à celle de l’arbitre utilise chaque article examiné et chaque dimension.',
		matchRatesTitle: 'À quelle fréquence chaque modèle donne la note de l’arbitre',
		matchRatesNote:
			'Part des articles examinés où la note du modèle est la même étiquette que celle de l’arbitre, avec un intervalle de Wilson à 95 % et le nombre d’articles comparés (n). « À un cran près » compte les notes distantes d’au plus un cran, sur les articles où les deux notes figurent sur l’échelle. Comme tous les chiffres de cette vue, ils ne valent que pour les articles examinés, non pour le corpus.',
		matchModel: 'Modèle',
		exactMatch: 'Même note',
		withinOne: 'À un cran près',
		interval: 'IC à 95 %',
		recusedRow: 'non jugé : récusé',
		recusedRowNote:
			'{models} n’a jamais été soumis à l’arbitre. Sa note est placée à côté des verdicts après coup, comme point de comparaison, et non comme une analyse jugée.',
		winnerTallyTitle: 'Décompte des gagnants globaux',
		winnerTallyNote:
			'Secondaire. L’analyse que l’arbitre a désignée comme la meilleure dans l’ensemble, avec « plusieurs aussi proches » et « aucune proche » pour le reste. Des modèles qui donnent la polarité de l’arbitre à peu près aussi souvent sont désignés gagnants un nombre de fois très différent : ce décompte suit les départages du juge — surtout la proximité en subjectivité — plutôt qu’il ne classe les modèles.',
		loneDissenterNote:
			'{model} est le seul modèle de son côté de la ligne neutre dans {count} des {total} articles examinés (dont {negative} comme seule lecture négative) ; aucun autre modèle n’est isolé dans plus de {next}. Le cadre se compose donc largement des désaccords d’un seul modèle, et les taux ci-dessus mesurent en partie la fréquence à laquelle un désaccord a été confirmé.',
		frameShareNote:
			'Les articles examinés représentent {share} du corpus ({evaluated} sur {corpus}). L’arbitre en a jugé {subjective} ({subjectiveShare}) plutôt ou très subjectifs : le cadre se compose surtout de textes d’opinion.',
		secondJudgeTitle: 'Un second juge',
		secondJudgeNote:
			'{judge} ({developer}) a aussi jugé {shared} de ces articles, en lisant son propre panel, sans le modèle de son concepteur. Les deux juges ne sont comparés que sur leurs propres notes. Leurs analyses préférées ne le sont pas : chaque juge a vu un panel différent, sous ses propres lettres.',
		judgeDimension: 'Dimension',
		judgeShared: 'Articles',
		judgeKappa: 'κ de Cohen',
		byDimension: 'Verdicts par dimension',
		confidenceDistribution: 'Répartition de la confiance',
		blindLabel: 'Présentée comme',
		polarity: 'Polarité',
		subjectivity: 'Subjectivité',
		centrality: 'Centralité',
		evaluatedArticles: 'Articles examinés',
		evaluatedArticlesSubtitle:
			'Tous les articles que l’arbitre a lus, désaccord le plus large en premier. Ouvrez une ligne pour voir l’article, les notes soumises à l’arbitre, la note du modèle récusé et le raisonnement de l’arbitre.',
		viewArticleDetails: 'Voir l’article et le verdict',
		articleWithVerdict: 'Article avec le verdict du panel',
		noEvaluatedArticles: 'Aucun article examiné à afficher',
		panelLegend: 'Quelle analyse était laquelle',
		panelLegendNote:
			'Dans son raisonnement, l’arbitre désigne les analyses par ces lettres. Les lettres ont été attribuées une fois pour toute la campagne ; l’ordre de présentation des analyses a été retiré au sort pour chaque article.',
		matchesArbiter: 'Même note que l’arbitre',
		preferredAnalysis: 'Préférée par l’arbitre',
		notRated: 'Non notée',
		panelLoading: 'Chargement du reste du panel…',
		recused: 'Récusé',
		recusedTitle:
			'Jamais soumis à l’arbitre, qui vient du même concepteur. Sa note est placée à côté du verdict après coup.',
		recusedLegendNote:
			'{models} fait aussi partie du panel, mais n’a jamais été soumis à l’arbitre, qui vient du même concepteur. Il n’a pas de lettre ; sa note est placée à côté du verdict après coup, pour qu’on puisse la confronter à un jugement qu’elle n’a pas pu infléchir.',
		showModelsReasoning: 'Afficher le raisonnement des modèles',
		hideModelsReasoning: 'Masquer le raisonnement des modèles',
		modelsReasoningLoading: 'Chargement du raisonnement des modèles…',
		comparisonNote:
			'L’arbitre du panel a pesé à la fois toutes les analyses qui lui ont été soumises, et non seulement les deux comparées ici.',
		whyReviewed: 'Pourquoi cet article a été examiné',
		whyReviewedNote:
			'Écart entre les notes soumises à l’arbitre sur chaque échelle, en échelons. Un renversement de sens sur la polarité — un modèle lisant la couverture comme favorable, un autre comme hostile — est ce qui a placé l’article devant l’arbitre.',
		valenceFlipTag: 'Positif contre négatif',
		samplingFrameNoteSpread:
			'L’arbitre n’a pas examiné tout le corpus. Il a examiné les articles où les notes du panel étaient les plus éloignées sur au moins une dimension : chaque pourcentage ci-dessous ne vaut donc que là où un tel désaccord existe déjà. Aucun ne mesure quel modèle est meilleur sur l’ensemble du corpus.',
		samplingFrameNoteUnion:
			'L’arbitre n’a pas examiné tout le corpus. Il a examiné les articles où les notes du panel étaient les plus éloignées sur au moins une dimension, ou sur lesquels le panel se contredit quant au caractère favorable ou hostile de la couverture : chaque pourcentage ci-dessous ne vaut donc que là où un tel désaccord existe déjà. Aucun ne mesure quel modèle est meilleur sur l’ensemble du corpus.',
		spread: 'Écart',
		arbiterScore: 'Note propre de l’arbitre',
		verdict: 'Verdict',
		confidence: 'Confiance',
		noData: 'Pas encore de verdicts de l’arbitre du panel',
		noDataDescription:
			'Cette version du tableau de bord n’inclut pas les verdicts de l’arbitre du panel. Ils proviennent d’une campagne payante lancée à la main : cette vue reste vide tant qu’aucune n’a été publiée.',
		loading: "Chargement des données de l'arbitre…",
		// Méthodologie
		methodologyTitle: 'Comment fonctionne l’arbitre du panel',
		methodologySubtitle:
			'Un seul juge compare toutes les analyses de la génération 2 en une seule fois',
		blindEvaluation: 'Examen à l’aveugle',
		blindEvaluationDesc:
			'Les analyses sont anonymisées de {firstLabel} à {lastLabel} par un seul tirage aléatoire, fixé pour toute la campagne.',
		selectionProcess: 'Comment les articles ont été retenus',
		selectionProcessDesc:
			'Un article est retenu lorsqu’au moins un modèle lit la couverture comme positive et un autre comme négative : un désaccord sur le sens de la couverture, non sur son intensité. Ce critère va délibérément plus loin que le seuil du tableau de bord pour signaler une discordance : le renversement le plus fréquent de tous, un modèle répondant Positif là où un autre répond Négatif, ne représente que deux rangs d’écart, et aucun seuil assez élevé pour avoir du sens ne peut le retenir. Les articles où un modèle indique que la tâche ne s’applique pas — ou, pour Qwen3.8 27B, n’a jamais rendu de réponse — sont écartés plutôt que comptés comme un désaccord maximal.',
		whyPolarity: 'Pourquoi la polarité, et pas la centralité',
		whyPolarityDesc:
			'Le panel s’accorde bien davantage sur la centralité que sur la polarité : les {models} modèles que lit l’arbitre donnent la même note de centralité sur {centrality} des articles qu’ils ont tous notés, contre {polarity} pour la polarité, réponses « Non applicable » mises à part. Payer un juge pour trancher la centralité reviendrait surtout à acheter des verdicts sur des questions que le panel règle déjà seul et de façon constante. C’est aussi la dimension où Mistral Small 4 s’écarte le plus des autres : une sélection menée sur la centralité se remplit d’articles où un seul modèle tient tête au reste du panel. Choisir sur la polarité retient à la fois la dimension sur laquelle porte la question de recherche et celle que le panel trouve la plus difficile.',
		randomOrder: 'L’ordre est retiré au sort à chaque article',
		randomOrderDesc:
			'Les analyses sont anonymisées de {firstLabel} à {lastLabel} par un tirage unique, fixé pour toute la campagne, si bien qu’une lettre désigne toujours le même modèle. L’ordre dans lequel les blocs sont présentés est ensuite retiré au sort pour chaque article. Sans ce second tirage, un modèle occuperait la première position sur tous les articles, et la tendance d’un juge à privilégier ce qu’il lit en premier serait impossible à distinguer d’une véritable préférence pour ce modèle. Sur les 231 verdicts désignant un seul modèle, l’analyse retenue n’occupait la première place que 30 fois : χ² = 8,9 à 4 degrés de liberté face à une répartition égale (p = 0,06) ; compte tenu du placement de chaque modèle, χ² = 3,8 (p de permutation = 0,33). Aucun n’est significatif, mais le test a peu de puissance.',
		frameCaveat: 'Ce que contient surtout l’échantillon',
		frameCaveatDesc:
			'Retenir les renversements de sens ne rend pas l’échantillon équilibré entre les modèles. Dans {count} des {total} articles, {dissenter} se tient seul d’un côté de la ligne neutre tandis que les autres se tiennent de l’autre — dans {negative} d’entre eux, c’est lui qui lit la couverture comme négative. Un partage strict d’un seul contre tous, où les {rest} autres portent exactement la même étiquette, est plus rare : {strict} articles. La note de polarité propre de l’arbitre coïncide avec celle de {dissenter} dans {match} articles, contre {othersLow} à {othersHigh} pour chacun des autres. Une bonne part de ce que documentent les verdicts est donc le calibrage d’un seul modèle sur la polarité, et les parts en face-à-face se lisent en gardant cela à l’esprit.',
		noiseCaveat: 'Une part du désaccord est du bruit',
		noiseCaveatDesc:
			'Ce sont des annotations uniques, et les modèles ne se reproduisent pas complètement eux-mêmes : lors de relances informelles sur les mêmes articles pendant le pilote, un modèle rendait la même polarité 70 à 80 % du temps. Une part de tout désaccord relève donc d’un tirage différent plutôt que d’une lecture différente, et aucun arbitre ne peut distinguer les deux. C’est la raison pour laquelle la sélection porte sur les renversements de sens, qu’un nouveau tirage produira rarement, plutôt que sur les écarts d’un seul rang.',
		recusal: 'Récusation',
		recusalDesc:
			'{recused} a rejoint le panel après le passage de l’arbitre, et il vient d’Anthropic, tout comme l’arbitre. Des étiquettes anonymes cachent le nom d’un modèle, pas son style, et les juges IA favorisent de façon mesurable leurs propres productions et celles des modèles qui leur sont apparentés : {recused} n’est donc jamais soumis à l’arbitre, et la sélection, le prompt et les lettres portent sur les autres. Ses notes sont confrontées aux verdicts après coup. Sur les {total} articles examinés, sa polarité coïncide avec celle de l’arbitre dans {match} cas, contre {othersLow} à {othersHigh} pour les modèles autres que {dissenter} — aucun signe d’une lecture que partageraient les deux modèles d’Anthropic. Ce que la récusation ne permet pas, c’est de peser les désaccords propres à {recused} : les {flips} renversements de sens qui n’existent que par lui restent hors du cadre, et les trancher demanderait un juge d’un autre concepteur.',
		caveatFiguresPending:
			'Les chiffres de cette mise en garde sont calculés à partir des verdicts publiés et des notes du panel ; ils s’affichent une fois les notes chargées.',
		fullText: 'Le texte intégral de l’article',
		fullTextDesc:
			'L’arbitre lit l’article depuis le miroir privé de la collection, où le texte est complet. L’arbitre v1 lisait la version publique, qui masque le texte d’une part importante des articles : certains verdicts v1 ont donc été rendus sans l’article sous les yeux du juge.',
		independentVerdict: 'Verdict indépendant',
		independentVerdictDesc:
			'L’arbitre a pour consigne de noter lui-même l’article avant de comparer les analyses. Il voit les analyses dans la même requête : sa propre note ne se forme donc pas indépendamment d’elles.',
		reasoningEffort: 'Effort de raisonnement',
		reasoningEffortDesc:
			'Claude Opus 5 raisonne de façon adaptative : la campagne fixe donc un niveau d’effort plutôt qu’un budget de jetons. Ce réglage détermine aussi le coût.',
		howItWorks: 'Fonctionnement',
		step1: "Il lit le texte intégral de l'article",
		step2:
			'Il a pour consigne de noter d’abord lui-même la polarité, la subjectivité et la centralité',
		step3: 'Il compare à cette note les analyses anonymisées, qu’il voit dans la même requête',
		step4:
			"Il désigne l'analyse la plus juste par dimension, ou indique que plusieurs se valent ou qu'aucune n'est juste",
		arbiterModel: 'Modèle arbitre',
		arbiterModelDesc:
			'Claude Opus 5 juge toutes les analyses d’un article en un seul appel : ses verdicts se tiennent donc entre eux, ce que {pairs} campagnes deux à deux ne pourraient pas garantir.',
		viewPrompt: 'Voir le prompt',
		promptExplanation:
			"L'instruction système et le prompt utilisateur exacts envoyés à l'arbitre, mot pour mot.",
		promptVersionCaveat:
			'Les verdicts publiés ont été rendus avec le prompt v2.2.0, qui donnait à l’arbitre une référence des échelles plus courte que le guide d’annotation suivi par les modèles, et une règle différente : il classait en « Marginal » une simple mention par nom propre, alors que le guide précise qu’une religion seulement devinable à partir d’un nom ne compte pas.',
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
		distinctiveKeywords: 'Mots-clés les plus distinctifs',
		categorySize: '{category} : {count} articles, {share} de {total}',
		shareOfCorpus: 'Part des articles',
		oppositeCount: 'Articles « {category} »',
		distinctiveScore: 'Spécificité (z)',
		ranking: 'Classement',
		rankingCount: 'Fréquence',
		rankingDistinctive: 'Spécificité',
		countNote:
			'Effectifs bruts : nombre d’articles de cette catégorie portant chaque mot-clé. Les sujets les plus courants du corpus arrivent en tête dans toutes les catégories ; pour comparer les catégories, choisissez le classement par spécificité.',
		distinctiveNote:
			'Classement par rapport de cotes logarithmique avec a priori de Dirichlet informatif (Monroe, Colaresi et Quinn 2008), qui oppose cette catégorie au pôle opposé, « {opposite} ». Un score élevé signale un mot-clé surreprésenté ici par rapport à l’autre pôle ; seuls les mots-clés portés par au moins cinq articles de la catégorie sont classés. Les parts se rapportent à l’ensemble du corpus ou, sous filtre de pays ou de journal, aux articles correspondants qui relèvent d’au moins une catégorie.',
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
			"Comparez la façon dont GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B, Qwen3.8 27B et Claude Haiku 5.5 ont noté les mêmes articles de la Collection Islam Afrique de l'Ouest, et voyez où leurs lectures de la couverture de presse se séparent.",
		comparisonKeywords:
			'comparaison IA, GPT-5.6 Luna vs Mistral Small 4 vs DeepSeek vs Gemma vs Qwen vs Claude Haiku, comparaison de modèles, analyse de sentiments, IWAC, évaluation IA',
		viewDescriptionPrefix: 'Explorez ',
		viewDescriptionSuffix:
			" dans les annotations de sentiment produites par IA sur la Collection Islam Afrique de l'Ouest, un corpus de presse ouest-africaine francophone consacré à l'islam et aux musulmans.",
		baseKeywords: "analyse de sentiments, IWAC, Islam Afrique de l'Ouest, visualisation de données",
		ogImageAlt:
			'Analyse de sentiments IWAC — distributions de polarité de GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash, Gemma 4 31B, Qwen3.8 27B et Claude Haiku 5.5 sur 12 348 articles de presse ouest-africaine francophone',
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
