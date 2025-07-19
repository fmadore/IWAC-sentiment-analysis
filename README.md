# Visualisation d'analyse de sentiments

Cette application SvelteKit est conçue pour visualiser les résultats d'analyses de sentiments effectuées sur des corpus d'articles de presse. Elle permet de charger et d'explorer le corpus [*Collection Islam Afrique de l'Ouest* (IWAC)](https://islam.zmo.de/s/afrique_ouest/page/accueil), de filtrer les articles selon divers critères (pays, journal, polarité, score de subjectivité, centralité) et d'afficher les répartitions de sentiments sous forme de graphiques interactifs.

## Objectif

L'objectif principal est de fournir une interface interactive pour explorer et comprendre les tendances de sentiments dans la couverture médiatique de l'islam et des musulmans dans la presse d'Afrique de l'Ouest francophone.

## Fonctionnalités

### Mode de comparaison ChatGPT vs Gemini
Analyse comparative des résultats entre les deux modèles :
- Comparaison côte à côte des analyses de sentiment
- Calcul automatique des divergences entre modèles
- Filtres avancés par niveau de désaccord
- Statistiques détaillées sur les convergences et conflits
- Export CSV incluant les données des deux modèles

### Interface multilingue
Support du français et de l'anglais avec traduction automatique des valeurs de sentiment et synchronisation URL.

### Filtrage et export
- Filtrage hiérarchique par pays, journal et critères de sentiment
- URLs partageables avec état des filtres
- Export CSV des données filtrées avec métadonnées complètes

### **Exemples d'URLs fonctionnels**
```
# Vue graphiques avec filtre par pays
https://fmadore.github.io/IWAC-sentiment-analysis/?view=charts&countries=Togo

# Vue tendances en anglais avec polarité positive
https://fmadore.github.io/IWAC-sentiment-analysis/?view=trends&lang=en&polarities=Positif

# Mode comparaison avec filtres de divergence
https://fmadore.github.io/IWAC-sentiment-analysis/?view=comparison&compare=true&diffMin=2&diffMax=5

# Heatmap avec centralité spécifique
https://fmadore.github.io/IWAC-sentiment-analysis/?view=heatmap&centralities=Central,Très%20central

# Tableau avec filtres multiples
https://fmadore.github.io/IWAC-sentiment-analysis/?view=table&countries=Mali&subjectivities=1,2

# Comparaison de modèles
https://fmadore.github.io/IWAC-sentiment-analysis/?view=comparison&compare=true&dataset=chatgpt
```

Consultez le [Guide du routage URL](./ma-visualisation-sentiments/URL_ROUTING_GUIDE.md) pour plus de détails.

## Optimisations de performance

L'application a été optimisée pour offrir des performances exceptionnelles malgré la taille importante des données (22MB de JSON) :

### **Chargement paresseux (Lazy Loading)**
- **Réduction de 50% du transfert initial** : Seul le dataset sélectionné est chargé au démarrage (11MB au lieu de 22MB)
- **Chargement à la demande** : Le second dataset n'est chargé que lors de l'activation du mode comparaison
- **Cache intelligent** : Les datasets restent en mémoire après chargement pour un basculement instantané
- **Fonctions optimisées** : `loadCurrentDataset()` et `loadComparisonDatasets()` remplacent le chargement systématique

### **Compression des données**
- **Compression Brotli** : Réduction de 91% de la taille des fichiers (22MB → 1.9MB)
- **Compression Gzip** : Alternative avec 85% de réduction (22MB → 3.3MB)
- **Configuration automatique** : Précompression activée dans SvelteKit avec `vite-plugin-compression`
- **Support serveur** : Les serveurs modernes servent automatiquement les versions compressées

### **Optimisation CLS (Cumulative Layout Shift)**
- **Chargement de polices optimisé** : Préconnexion et préchargement des Google Fonts avec `display=swap`
- **Polices de fallback** : Polices système pour éviter les reflows pendant le chargement
- **Réservation d'espace** : Hauteurs minimales définies pour les composants accordéon
- **Animations hardware-accelerated** : Utilisation de `transform` et `will-change` pour les performances

### **SEO et métadonnées dynamiques**
- **Composant SEO dédié** : `SEOHead.svelte` avec métadonnées adaptatives par vue
- **Contenu multilingue** : Descriptions et mots-clés traduits automatiquement
- **Balises Open Graph** : Optimisation pour le partage sur réseaux sociaux
- **Données structurées** : JSON-LD avec schéma WebApplication pour les moteurs de recherche
- **URLs canoniques** : URLs propres avec paramètres de vue et de langue

### **Résultats de performance**
- **96% d'amélioration globale** : Combinaison lazy loading + compression
- **Temps de chargement initial** : De 22MB à 1.9MB (avec Brotli)
- **Score CLS attendu** : < 0.1 (amélioration de 0.152 → < 0.1)
- **SEO Score** : Métadonnées complètes et descriptions pertinentes
- **Mobile-first** : Optimisations spécifiques pour les appareils mobiles

### **Configuration technique**
```javascript
// svelte.config.js - Précompression activée
precompress: true

// vite.config.ts - Plugin de compression
compression({
  algorithm: 'brotliCompress',
  compressionOptions: { level: 11 }
})
```

## Structure du projet

Le projet est structuré comme une application SvelteKit typique :

-   `src/`
    -   `lib/`: Contient la logique principale de l'application.
        -   `components/`: Composants Svelte réutilisables.
            -   `ui/`: Composants pour l'interface utilisateur.
                -   `AppHeader.svelte`: En-tête de l'application avec branding, sélecteur de langue et bouton plein écran.
                -   `LanguageSwitcher.svelte`: Composant de sélection de langue avec interface élégante.
                -   `CountryFilter.svelte`: Permet de filtrer les articles par pays (filtre hiérarchique principal).
                -   `JournalFilter.svelte`: Permet de filtrer les articles par source (nom du journal), avec recherche et pagination.
                -   `PolarityFilter.svelte`: Permet de filtrer les articles par polarité du sentiment.
                -   `SubjectivityFilter.svelte`: Permet de filtrer les articles par score de subjectivité (1-5).
                -   `CentralityFilter.svelte`: Permet de filtrer les articles par centralité de l'islam/musulmans.
                -   `ClearFiltersButton.svelte`: Bouton pour effacer tous les filtres actifs.
                -   `ComparisonCSVExportButton.svelte`: Export CSV spécialisé pour les données de comparaison.
                -   `DiscrepancyFilter.svelte`: Filtres avancés pour le mode comparaison (seuils, dimensions).
                -   `DatasetPicker.svelte`: Sélecteur de dataset avec support du mode comparaison.
                -   `DatasetBadge.svelte`: Badge indiquant le dataset actuel ou le mode comparaison.
                -   `SentimentCriteriaFilter.svelte`: Version alternative qui combine les filtres de polarité et subjectivité.
            -   `viz/`: Composants pour la visualisation des données.
                -   `SentimentChart.svelte`: Affiche la distribution de polarité par journal avec options barres/camembert.
                -   `SubjectivityChart.svelte`: Affiche la distribution de subjectivité par journal avec options barres/camembert.
                -   `SentimentTrendsChart.svelte`: Affiche l'évolution des sentiments au fil du temps avec zoom interactif.
                -   `CorrelationChart.svelte`: Graphique de distribution croisée entre polarité et subjectivité.
                -   `VolumeChart.svelte`: Volume d'articles par pays au fil du temps (aires empilées/lignes).
                -   `CentralityHeatmap.svelte`: Heatmap de la centralité moyenne par pays et année.
            -   `AnalysisInfo.svelte`: Fournit des informations explicatives sur la méthodologie d'analyse.
            -   `ArticleTable.svelte`: Affiche les articles dans un tableau interactif avec tri, pagination et sélection.
            -   `ArticleDetail.svelte`: Affiche les détails d'un article sélectionné.
            -   `ComparisonView.svelte`: Interface principale du mode comparaison avec statistiques et filtres.
            -   `ComparisonTable.svelte`: Tableau de comparaison avec visualisation des divergences entre modèles.
            -   `ComparisonDetail.svelte`: Vue détaillée d'une comparaison article par article.
            -   `ComparisonStats.svelte`: Statistiques et métriques du mode comparaison.
            -   `SEOHead.svelte`: Composant de métadonnées SEO dynamiques avec support multilingue.
        -   `i18n/`: Système d'internationalisation.
            -   `index.ts`: Configuration principale et stores de langue.
            -   `fr.ts`: Traductions françaises (langue par défaut).
            -   `en.ts`: Traductions anglaises complètes.
            -   `utils.ts`: Utilitaires de traduction pour les valeurs de sentiment.
            -   `types.ts`: Types TypeScript pour les traductions.
        -   `stores.ts`: Stores Svelte pour la gestion d'état global de l'application.
        -   `urlState.ts`: Gestion de l'état URL et synchronisation des filtres.
        -   `utils.ts`: Fonctions utilitaires pour le chargement et la transformation des données.
        -   `types/data.ts`: Définitions TypeScript pour les structures de données.
        -   `index.ts`: Réexportation des composants, stores et types pour une importation simplifiée.
    -   `routes/`: Définit les pages de l'application.
        -   `+page.svelte`: Le composant Svelte pour la page principale de la visualisation.
        -   `+page.ts`: Script de chargement de données pour la page principale.
        -   `+layout.svelte`: Définit la mise en page commune à toutes les pages.
        -   `+layout.ts`: Configuration pour le prérendu de l'application.
    -   `app.html`: Le template HTML principal de l'application.
    -   `app.d.ts`: Déclarations de types globaux pour l'application.
    -   `app.postcss`: Styles CSS globaux et configuration Tailwind.
-   `static/`: Contient les fichiers statiques.
    -   `data/`: **Fichiers de données JSON du corpus IWAC.**
        -   `iwac_articles_chatgpt.json`: Articles analysés par ChatGPT
        -   `iwac_articles_gemini.json`: Articles analysés par Gemini
-   `data-preprocess/`: Scripts de préparation des données.
    -   `data-fetch.py`: Script Python pour récupérer et transformer les données depuis le dataset Hugging Face.
-   `package.json`: Définit les dépendances du projet et les scripts npm.
-   `svelte.config.js`: Configuration SvelteKit.
-   `tsconfig.json`: Configuration TypeScript.
-   `vite.config.ts`: Configuration Vite.

## Données

### Format des données

L'application charge automatiquement le corpus IWAC depuis les fichiers JSON situés dans `static/data/` :
- `iwac_articles_chatgpt.json`: Articles analysés par ChatGPT
- `iwac_articles_gemini.json`: Articles analysés par Gemini

Chaque fichier contient une liste d'objets `Article`, où chaque article inclut des métadonnées (titre, journal, pays, date) et un objet `sentiment_analysis` contenant les résultats de l'analyse (polarité, subjectivité, centralité, etc.).

Le mode comparaison utilise les deux datasets simultanément pour identifier et analyser les divergences entre les analyses des deux modèles.

Consultez `src/lib/types/data.ts` pour la structure détaillée des objets `Article`, `SentimentAnalysis` et `ComparisonData`.

### Préparation des données

Le script `data-preprocess/data-fetch.py` permet de récupérer les données depuis le dataset Hugging Face ["fmadore/iwac-newspaper-articles"](https://huggingface.co/datasets/fmadore/iwac-newspaper-articles) et de les transformer au format attendu par l'application.

Le script `data-preprocess/extreme-analysis.py` génère une analyse lexicale approfondie des cas extrêmes (subjectivité, polarité, centralité) en identifiant les mots-clés les plus fréquents pour chaque catégorie et modèle. Cette analyse produit des fichiers JSON spécialisés pour la visualisation des patterns lexicaux.

## Visualisations disponibles

L'application propose une suite complète de visualisations interactives pour explorer les données d'analyse de sentiment :

### 1. **Charts** - Distributions de sentiment
- **Graphiques de polarité** : Distribution des sentiments (Très positif → Très négatif) par journal
- **Graphiques de subjectivité** : Distribution des scores de subjectivité (1-5) par journal
- **Modes de visualisation** : Basculer entre barres détaillées et camemberts globaux
- **Couleurs cohérentes** : Gradations logiques (vert foncé → rouge foncé) correspondant aux filtres

### 2. **Trends** - Évolution temporelle
- **Tendances des sentiments** : Évolution des polarités au fil des années
- **Navigation interactive** : Zoom et défilement pour explorer les périodes
- **Lignes lissées** : Visualisation claire des tendances à long terme

### 3. **Distribution** - Relations entre dimensions
- **Graphique en barres groupées** : Distribution croisée entre polarité et subjectivité
- **Catégories de polarité** : Très négatif, Négatif, Neutre, Positif, Très positif, Non applicable
- **Niveaux de subjectivité** : Très objectif, Plutôt objectif, Mixte, Plutôt subjectif, Très subjectif
- **Tooltips informatifs** : Nombre d'articles par catégorie et totaux

### 4. **Volume** - Activité médiatique
- **Volume par pays** : Nombre d'articles publiés par pays au fil du temps
- **Modes d'affichage** : Aires empilées (vue cumulative) ou lignes (vue individuelle)
- **Identification des pics** : Repérage des périodes d'activité médiatique intense

### 5. **Heatmap** - Centralité géographique et temporelle
- **Centralité par pays/année** : Intensité de la couverture de l'islam/musulmans
- **Échelle de couleurs** : Du bleu (faible centralité) au rouge (forte centralité)
- **Patterns spatio-temporels** : Identification des tendances géographiques et historiques

### 6. **Table** - Exploration détaillée
- **Tableau interactif** : Liste complète des articles avec tri et pagination
- **Vue mobile adaptée** : Cartes responsives pour petits écrans
- **Détails d'articles** : Modal avec métadonnées complètes et justifications d'analyse

### 7. **Comparison** - Analyse comparative des modèles
- **Tableau de comparaison** : Visualisation côte à côte des analyses ChatGPT vs Gemini
- **Calcul automatique des divergences** : Quantification des différences par dimension
- **Filtres de divergence** : Seuils personnalisables pour explorer les conflits
- **Statistiques détaillées** : Métriques sur les convergences et divergences
- **Codes couleur** : Identification visuelle rapide des niveaux de conflit
- **Vue détaillée** : Analyse approfondie article par article avec justifications
- **Export spécialisé** : CSV incluant les données des deux modèles et leurs différences

### 8. **Extremes** - Analyse lexicale des extrêmes
- **Analyse des mots-clés** : Identification des mots-clés les plus fréquents dans les cas extrêmes
- **Catégories d'extrêmes** : 
  - **Subjectivité très élevée** (4-5) : Articles exprimant des opinions marquées sur l'islam/musulmans
  - **Subjectivité très faible** (1-2) : Articles très objectifs et factuels
  - **Polarité très négative** : Articles avec portrait extrêmement défavorable
  - **Polarité très positive** : Articles avec portrait extrêmement favorable  
  - **Centralité très élevée** : Articles principalement consacrés à l'islam/musulmans
  - **Centralité marginale** : Articles mentionnant brièvement l'islam/musulmans
- **Types de mots-clés** :
  - **Subject** : Mots-clés thématiques (religion, politique, événements)
  - **Spatial** : Mots-clés géographiques (pays, villes, régions)
- **Visualisation interactive** : Graphiques horizontaux avec gradients colorés selon la catégorie
- **Analyse comparative** : Possibilité de comparer les patterns lexicaux entre ChatGPT et Gemini
- **Filtrage flexible** : Nombre de mots-clés ajustable (5-25) et sélection du type
- **Statistiques détaillées** : Nombre d'articles par catégorie et répartition géographique

## Gestion d'état (`stores.ts`)

L'application utilise les stores Svelte pour gérer l'état global :

-   `currentDatasetArticles`: La liste des articles du corpus IWAC chargé.
-   `selectedArticle`: L'article actuellement sélectionné pour affichage détaillé.
-   `isLoadingDataset`: Un booléen indiquant si le dataset est en cours de chargement.
-   `countryFilters`: Un tableau des pays sélectionnés pour le filtrage (filtre hiérarchique principal).
-   `journalFilters`: Un tableau des journaux sélectionnés pour le filtrage.
-   `polarityFilters`: Un tableau des polarités sélectionnées pour le filtrage.
-   `subjectivityFilters`: Un tableau des scores de subjectivité sélectionnés pour le filtrage.
-   `centralityFilters`: Un tableau des niveaux de centralité sélectionnés pour le filtrage.
-   `filteredArticles`: Un store dérivé qui contient les articles après application de tous les filtres actifs.
-   `availableJournals`: Un store dérivé qui liste les journaux disponibles selon les pays sélectionnés.

**Stores spécifiques au mode comparaison :**
-   `comparisonMode`: Booléen indiquant si le mode comparaison est actif.
-   `selectedComparison`: Comparaison actuellement sélectionnée pour affichage détaillé.
-   `discrepancyFilters`: Filtres pour les seuils de divergence et dimensions à comparer.
-   `comparisonData`: Store dérivé contenant les données de comparaison entre ChatGPT et Gemini.
-   `filteredComparisons`: Store dérivé avec les comparaisons après application des filtres.
-   `comparisonStatistics`: Store dérivé avec les statistiques et métriques de comparaison.

De plus, le store expose les fonctions :
-   `loadDatasetArticles`: Fonction pour charger un dataset depuis un fichier JSON.
-   `loadCurrentDataset`: Fonction optimisée pour charger uniquement le dataset sélectionné.
-   `loadComparisonDatasets`: Fonction pour charger les deux datasets en mode comparaison.

## Composants clés

### Composants d'interface utilisateur

-   **`AppHeader.svelte`**: En-tête moderne de l'application avec :
    - **Branding élégant** : Logo avec dégradé et animations subtiles
    - **Sélecteur de langue** : Menu déroulant avec globe et langues disponibles
    - **Mode plein écran** : Bouton pour basculer en mode plein écran avec icônes dynamiques
    - **Design responsive** : Adaptation automatique aux différentes tailles d'écran
    - **Effets visuels** : Glassmorphism, animations hover et transitions fluides

-   **`LanguageSwitcher.svelte`**: Composant de sélection de langue avec :
    - **Interface intuitive** : Icône globe avec menu déroulant élégant
    - **Langues supportées** : Français et Anglais avec noms natifs
    - **État visuel** : Indication de la langue active avec coche
    - **Animations fluides** : Transitions et effets hover sophistiqués
    - **Responsive** : Adaptation mobile avec tailles réduites

-   **`ClearFiltersButton.svelte`**: Bouton pour effacer tous les filtres avec :
    - **Visibilité conditionnelle** : Apparaît uniquement quand des filtres sont actifs
    - **Design distinctif** : Style rouge avec icône de filtre barré
    - **Feedback visuel** : Animations et effets hover
    - **Responsive** : Version icône seule sur mobile

-   **`CSVExportButton.svelte`**: Bouton d'export CSV avec :
    - **Export intelligent** : Télécharge les articles filtrés au format CSV
    - **Traduction automatique** : En-têtes et valeurs traduites selon la langue active
    - **Données complètes** : Inclut métadonnées, analyses et justifications
    - **État visuel** : Indicateur de progression et compteur d'articles
    - **Design cohérent** : Style vert avec animations et effets glassmorphism
    - **Responsive** : Version icône seule sur mobile

-   **`ComparisonCSVExportButton.svelte`**: Export CSV spécialisé pour les comparaisons avec :
    - **Données duales** : Inclut les analyses ChatGPT et Gemini côte à côte
    - **Calculs de divergence** : Différences quantifiées par dimension
    - **Filtrage intelligent** : Exporte uniquement les comparaisons filtrées
    - **Format structuré** : Colonnes organisées pour analyse comparative
    - **Style distinctif** : Design violet pour différenciation visuelle

-   **`DatasetPicker.svelte`**: Sélecteur de dataset et mode comparaison avec :
    - **Sélection de modèle** : Choix entre ChatGPT, Gemini ou mode comparaison
    - **Interface élégante** : Menu déroulant avec icônes et animations
    - **État visuel** : Indication claire du mode actuel
    - **Basculement automatique** : Activation/désactivation du mode comparaison
    - **Responsive** : Adaptation mobile optimisée

-   **`DiscrepancyFilter.svelte`**: Filtres avancés pour le mode comparaison avec :
    - **Seuils de divergence** : Curseurs pour définir les plages de différence
    - **Sélection de dimensions** : Choix des critères à comparer (polarité, subjectivité, centralité)
    - **Filtres rapides** : Boutons prédéfinis pour les cas d'usage courants
    - **Exclusion intelligente** : Option pour exclure les articles "Non applicable"
    - **Interface intuitive** : Tooltips explicatifs et feedback visuel

### Composants de filtrage

Tous les composants de filtrage supportent désormais la traduction automatique des valeurs :

-   **`CountryFilter.svelte`**: Permet de sélectionner un ou plusieurs pays. Ce filtre est hiérarchique et influence la liste des journaux disponibles. Les noms de pays sont traduits (ex: Bénin/Benin).
-   **`JournalFilter.svelte`**: Permet de filtrer les articles par journal, avec fonctionnalités de recherche, pagination et affichage du nombre de journaux disponibles.
-   **`PolarityFilter.svelte`**: Permet de filtrer les articles selon leur polarité avec traduction automatique des valeurs (Très positif/Very positive, etc.).
-   **`SubjectivityFilter.svelte`**: Permet de filtrer les articles selon leur score de subjectivité (échelle de 1 à 5) avec légende explicative traduite.
-   **`CentralityFilter.svelte`**: Permet de filtrer les articles selon la centralité du sujet islam/musulmans avec traduction des niveaux (Très central/Very central, etc.).

### Composants de visualisation

-   **`SentimentChart.svelte`**: Utilise ECharts pour afficher la distribution des polarités par journal. Propose deux modes de visualisation :
    - **Barres** : Graphique à barres empilées détaillé par journal
    - **Camembert** : Vue d'ensemble globale de la distribution des polarités
-   **`SubjectivityChart.svelte`**: Utilise ECharts pour afficher la distribution des scores de subjectivité par journal. Propose deux modes de visualisation :
    - **Barres** : Graphique à barres empilées détaillé par journal  
    - **Camembert** : Vue d'ensemble globale de la distribution de subjectivité
-   **`SentimentTrendsChart.svelte`**: Utilise ECharts pour afficher un graphique linéaire montrant l'évolution des sentiments au fil du temps (par année) avec zoom interactif et navigation.
-   **`CorrelationChart.svelte`**: Graphique en barres groupées montrant la distribution croisée entre polarité et subjectivité, avec labels descriptifs et tooltips informatifs.
-   **`VolumeChart.svelte`**: Visualise le volume d'articles par pays au fil du temps avec deux modes :
    - **Aires empilées** : Vue cumulative du volume par pays
    - **Lignes** : Évolution individuelle de chaque pays
-   **`CentralityHeatmap.svelte`**: Heatmap interactive montrant la centralité moyenne de l'islam/musulmans par pays et année, avec échelle de couleurs intuitive.

### Composants d'affichage et d'information

-   **`ArticleTable.svelte`**: Affiche un tableau des articles filtrés avec possibilité de tri, pagination avancée, et vue mobile adaptée sous forme de cartes.
-   **`ArticleDetail.svelte`**: Affiche les détails complets d'un article sélectionné, y compris ses métadonnées et les résultats d'analyse avec justifications.
-   **`AnalysisInfo.svelte`**: Fournit des informations explicatives détaillées sur la méthodologie d'analyse (polarité, subjectivité, centralité) sous forme d'accordéon. S'adapte automatiquement au mode comparaison pour expliquer les différences entre modèles.

### Composants de comparaison

-   **`ComparisonView.svelte`**: Interface principale du mode comparaison avec :
    - **Activation conditionnelle** : Guide l'utilisateur pour activer le mode comparaison
    - **Navigation fluide** : Basculement entre vue liste et vue détaillée
    - **Intégration des filtres** : Filtres de divergence et statistiques intégrés
    - **État centralisé** : Gestion cohérente de l'état de comparaison

-   **`ComparisonTable.svelte`**: Tableau de comparaison avancé avec :
    - **Visualisation côte à côte** : Colonnes ChatGPT et Gemini pour chaque dimension
    - **Codes couleur des divergences** : Identification visuelle des niveaux de conflit
    - **Tri intelligent** : Tri par divergence totale, date ou titre
    - **Vue adaptative** : Tableau desktop et cartes mobile
    - **Sélection interactive** : Clic pour voir les détails de comparaison

-   **`ComparisonDetail.svelte`**: Vue détaillée de comparaison avec :
    - **Analyse approfondie** : Justifications complètes des deux modèles
    - **Métadonnées d'article** : Informations contextuelles complètes
    - **Différences mises en évidence** : Visualisation claire des divergences
    - **Navigation intuitive** : Bouton de retour vers la liste

-   **`ComparisonStats.svelte`**: Statistiques de comparaison avec :
    - **Métriques globales** : Nombre total d'articles et de divergences
    - **Répartition par dimension** : Conflits par polarité, subjectivité, centralité
    - **Indicateurs visuels** : Graphiques et barres de progression
    - **Mise à jour dynamique** : Recalcul automatique selon les filtres

## Page principale (`+page.svelte` et `+page.ts`)

-   `+page.ts`: Fonction de chargement simplifiée qui ne charge plus de manifest externe.
-   `+page.svelte`:
    -   Charge automatiquement le corpus IWAC au démarrage de l'application.
    -   Initialise la langue depuis l'URL ou les préférences utilisateur.
    -   Propose sept vues différentes via un menu de navigation latéral (desktop) ou modal (mobile):
      - **Charts**: Graphiques de distribution de polarité et subjectivité (barres/camembert)
      - **Trends**: Évolution des sentiments au fil du temps
      - **Distribution**: Distribution croisée entre polarité et subjectivité
      - **Volume**: Volume d'articles par pays au fil du temps
      - **Heatmap**: Heatmap de centralité par pays et année
      - **Table**: Articles dans un tableau interactif
      - **Comparison**: Mode comparaison ChatGPT vs Gemini avec analyse des divergences
    -   Inclut un système de filtrage hiérarchique (Pays → Journaux → Critères de sentiment)
    -   Gère automatiquement l'activation/désactivation du mode comparaison selon la vue
    -   Synchronise tous les filtres, la langue et le mode comparaison avec l'URL en temps réel
    -   Gère l'affichage des détails d'articles dans un modal responsive
    -   Interface entièrement responsive avec navigation mobile optimisée
    -   Gère l'affichage des messages de chargement ou d'absence de données.

## Système d'internationalisation

L'application intègre un système complet de gestion multilingue :

### **Langues supportées**
- **Français** (fr) : Langue par défaut, adaptée au corpus francophone
- **Anglais** (en) : Interface complète traduite

### **Fonctionnalités**
- **Traduction complète** : Interface, labels, messages et descriptions
- **Valeurs de sentiment** : Traduction automatique des polarités, centralités et niveaux de subjectivité
- **Persistance** : Langue sauvegardée dans localStorage et URL
- **Détection automatique** : Langue du navigateur détectée au premier accès
- **Synchronisation URL** : La langue est incluse dans l'URL partageable

### **Architecture technique**
- **Stores réactifs** : `currentLanguage` et `t` pour les traductions
- **Types stricts** : Interface TypeScript pour toutes les traductions
- **Utilitaires** : Fonctions de traduction pour les valeurs de données
- **Composants adaptatifs** : Tous les composants s'adaptent automatiquement

Consultez le [Guide d'internationalisation](./ma-visualisation-sentiments/I18N_GUIDE.md) pour plus de détails sur l'implémentation.

## Mode de comparaison ChatGPT vs Gemini

### **Qu'est-ce que le mode comparaison ?**

Le mode comparaison est une fonctionnalité avancée qui permet d'analyser les différences entre les analyses de sentiment effectuées par ChatGPT et Gemini sur le même corpus d'articles. Cette approche comparative offre des insights précieux sur :

- **La cohérence inter-modèles** : Identifier où les modèles convergent ou divergent
- **Les biais potentiels** : Détecter les patterns de désaccord systématiques
- **La fiabilité des analyses** : Évaluer la robustesse des résultats
- **Les cas complexes** : Repérer les articles nécessitant une expertise humaine

### **Comment activer le mode comparaison ?**

1. **Via le sélecteur de dataset** : Cliquez sur le bouton de comparaison dans le DatasetPicker
2. **Via la navigation** : Sélectionnez la vue "Comparison" dans le menu latéral
3. **Via l'URL** : Ajoutez `?compare=true` à l'URL

### **Fonctionnalités du mode comparaison**

#### **Calcul automatique des divergences**
- **Polarité** : Différence entre les évaluations de sentiment (0-4 points)
- **Subjectivité** : Écart entre les scores d'objectivité (0-4 points)  
- **Centralité** : Différence dans l'évaluation de la centralité de l'islam (0-4 points)
- **Score total** : Somme des divergences sur toutes les dimensions

#### **Filtres avancés de divergence**
- **Seuils personnalisables** : Définir des plages de différence (ex: 2-5 points)
- **Filtres rapides** : Boutons prédéfinis (1 point, 2 points, 3+ points)
- **Sélection de dimensions** : Analyser une ou plusieurs dimensions spécifiques
- **Exclusion intelligente** : Masquer les articles "Non applicable" qui créent des divergences artificielles

#### **Visualisations spécialisées**
- **Tableau comparatif** : Vue côte à côte des analyses avec codes couleur
- **Statistiques détaillées** : Métriques sur les convergences et divergences
- **Vue détaillée** : Analyse approfondie article par article avec justifications
- **Export comparatif** : CSV incluant les données des deux modèles

#### **Codes couleur des divergences**
- **🟢 Vert (0 points)** : Accord parfait entre les modèles
- **🟡 Jaune (1 point)** : Divergence mineure
- **🟠 Orange (2 points)** : Divergence modérée
- **🔴 Rouge (3+ points)** : Divergence majeure nécessitant attention

### **Cas d'usage du mode comparaison**

#### **Pour les chercheurs**
- **Validation croisée** : Vérifier la robustesse des analyses automatiques
- **Identification des biais** : Détecter les patterns de désaccord systématiques
- **Sélection d'échantillons** : Identifier les articles nécessitant une annotation manuelle
- **Évaluation de qualité** : Mesurer la fiabilité des analyses LLM

#### **Pour l'analyse de contenu**
- **Articles controversés** : Repérer les contenus générant des interprétations divergentes
- **Nuances culturelles** : Identifier les cas où le contexte influence l'analyse
- **Complexité narrative** : Détecter les articles avec des sentiments mixtes ou ambigus
- **Évolution temporelle** : Analyser si les divergences varient selon les périodes

### **Métriques et statistiques**

Le mode comparaison fournit des métriques détaillées :
- **Taux de convergence** : Pourcentage d'articles avec accord parfait
- **Divergence moyenne** : Score moyen de désaccord
- **Répartition par dimension** : Conflits spécifiques à chaque critère
- **Articles à haute divergence** : Identification des cas problématiques

### **Limitations et considérations**

- **Aucun modèle comme référence** : Ni ChatGPT ni Gemini ne doit être considéré comme vérité absolue
- **Divergences != erreurs** : Les désaccords peuvent refléter des perspectives légitimes différentes
- **Contexte nécessaire** : L'interprétation des divergences nécessite une expertise du domaine
- **Complémentarité** : Les résultats sont plus utiles pour identifier des tendances que pour des jugements définitifs



## Développement

Prérequis : Node.js et npm installés.

1.  **Cloner le projet (si ce n'est pas déjà fait) et naviguer dans le dossier :**
    ```bash
    # cd ma-visualisation-sentiments
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```
    L'application sera généralement accessible à l'adresse `http://localhost:5173`.

4.  **Pour construire l'application pour la production :**
    ```bash
    npm run build
    ```
    Ceci générera les fichiers optimisés dans le dossier `build` (si vous utilisez `adapter-static`, sinon le dossier dépendra de l'adaptateur configuré).

5.  **Pour prévisualiser la version de production (après `npm run build`) :**
    ```bash
    npm run preview
    ```

## Scripts utiles

-   `npm run dev`: Lance le serveur de développement.
-   `npm run build`: Construit l'application pour la production.
-   `npm run preview`: Lance un serveur local pour prévisualiser la build de production.
-   `npm run check`: Exécute Svelte Check pour vérifier les types et les erreurs dans les composants Svelte.
-   `npm run lint`: Exécute ESLint pour vérifier les erreurs de style de code.
-   `npm run format`: Exécute Prettier pour formater le code.



## Préparation des données

Pour mettre à jour les données du corpus IWAC :

1.  **Installer les dépendances Python :**
    ```bash
    pip install datasets tqdm pandas
    ```

2.  **Exécuter le script de récupération des données :**
    ```bash
    python data-preprocess/data-fetch.py
    ```
    
    Ce script récupère automatiquement les données depuis le dataset Hugging Face et génère le fichier `iwac_articles.json` dans le bon format.

3.  **Générer l'analyse des extrêmes lexicaux (optionnel) :**
    ```bash
    python data-preprocess/extreme-analysis.py
    ```
    
    Ce script analyse les mots-clés associés aux cas extrêmes de sentiment et génère :
    - `iwac_extreme_analysis_chatgpt.json` : Analyse lexicale des extrêmes pour ChatGPT
    - `iwac_extreme_analysis_gemini.json` : Analyse lexicale des extrêmes pour Gemini
    
    Ces fichiers permettent d'alimenter la vue "Extremes" avec des insights sur les patterns lexicaux caractéristiques de chaque catégorie de sentiment.

## Technologies utilisées

### Frontend
- **Svelte 5** : Framework JavaScript moderne avec runes pour la réactivité
- **SvelteKit** : Framework full-stack pour Svelte avec SSG
- **TypeScript** : Typage statique pour une meilleure robustesse
- **Tailwind CSS** : Framework CSS utilitaire pour le styling
- **Skeleton UI** : Composants UI pour Svelte avec thème sombre

### Internationalisation
- **Stores Svelte** : Gestion réactive de la langue courante
- **Types TypeScript** : Interface stricte pour les traductions
- **Détection automatique** : Support de la langue du navigateur
- **Persistance** : localStorage et synchronisation URL

### Visualisations
- **ECharts** : Bibliothèque de graphiques interactifs haute performance
- **svelte-echarts** : Wrapper Svelte pour ECharts
- **Canvas API** : Pour l'ajout de métadonnées aux exports d'images

### Routage et état
- **URL State Management** : Synchronisation automatique filtres ↔ URL
- **Web Share API** : Partage natif sur appareils mobiles
- **History API** : Navigation naturelle avec boutons navigateur

### Optimisations de performance
- **vite-plugin-compression** : Compression automatique Brotli/Gzip des assets
- **SvelteKit precompress** : Précompression des fichiers statiques
- **Lazy loading** : Chargement intelligent des datasets à la demande
- **Hardware acceleration** : Animations optimisées avec GPU
- **Font optimization** : Préchargement et fallbacks pour les polices web

### SEO et métadonnées
- **Dynamic meta tags** : Métadonnées adaptatives par vue et langue
- **Open Graph** : Optimisation pour réseaux sociaux
- **JSON-LD** : Données structurées pour moteurs de recherche
- **Canonical URLs** : URLs canoniques pour le référencement

### Outils de développement
- **Vite** : Build tool rapide et moderne
- **ESLint** : Linting pour la qualité du code
- **Prettier** : Formatage automatique du code
- **PostCSS** : Traitement CSS avancé

## Déploiement

L'application est automatiquement déployée sur GitHub Pages à chaque push sur la branche `main`.

Vous pouvez accéder à la version en ligne ici : [https://fmadore.github.io/IWAC-sentiment-analysis/](https://fmadore.github.io/IWAC-sentiment-analysis/)

Le déploiement est géré par un workflow GitHub Actions défini dans `.github/workflows/deploy.yml`.

---

Ce README fournit une vue d'ensemble du projet. Pour des détails spécifiques sur l'implémentation, veuillez consulter le code source et les commentaires dans les fichiers respectifs.
