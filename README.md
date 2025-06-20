# Visualisation d'analyse de sentiments

Cette application SvelteKit est conçue pour visualiser les résultats d'analyses de sentiments effectuées sur des corpus d'articles de presse. Elle permet de charger et d'explorer le corpus [*Collection Islam Afrique de l'Ouest* (IWAC)](https://islam.zmo.de/s/afrique_ouest/page/accueil), de filtrer les articles selon divers critères (pays, journal, polarité, score de subjectivité, centralité) et d'afficher les répartitions de sentiments sous forme de graphiques interactifs.

## Objectif

L'objectif principal est de fournir une interface interactive pour explorer et comprendre les tendances de sentiments dans la couverture médiatique de l'islam et des musulmans dans la presse d'Afrique de l'Ouest francophone.

## Structure du projet

Le projet est structuré comme une application SvelteKit typique :

-   `src/`
    -   `lib/`: Contient la logique principale de l'application.
        -   `components/`: Composants Svelte réutilisables.
            -   `ui/`: Composants pour l'interface utilisateur.
                -   `AppHeader.svelte`: En-tête de l'application avec branding et bouton plein écran.
                -   `CountryFilter.svelte`: Permet de filtrer les articles par pays (filtre hiérarchique principal).
                -   `JournalFilter.svelte`: Permet de filtrer les articles par source (nom du journal), avec recherche et pagination.
                -   `PolarityFilter.svelte`: Permet de filtrer les articles par polarité du sentiment.
                -   `SubjectivityFilter.svelte`: Permet de filtrer les articles par score de subjectivité (1-5).
                -   `CentralityFilter.svelte`: Permet de filtrer les articles par centralité de l'islam/musulmans.
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
        -   `stores.ts`: Stores Svelte pour la gestion d'état global de l'application.
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
    -   `data/`: **Emplacement pour le fichier de données JSON du corpus IWAC.**
        -   `iwac_articles.json`: Le fichier JSON contenant les articles du corpus IWAC avec leurs analyses de sentiment.
-   `data-preprocess/`: Scripts de préparation des données.
    -   `data-fetch.py`: Script Python pour récupérer et transformer les données depuis le dataset Hugging Face.
-   `package.json`: Définit les dépendances du projet et les scripts npm.
-   `svelte.config.js`: Configuration SvelteKit.
-   `tsconfig.json`: Configuration TypeScript.
-   `vite.config.ts`: Configuration Vite.

## Données

### Format des données

L'application charge automatiquement le corpus IWAC depuis le fichier `static/data/iwac_articles.json`. Ce fichier contient une liste d'objets `Article`, où chaque article inclut des métadonnées (titre, journal, pays, date) et un objet `sentiment_analysis` contenant les résultats de l'analyse (polarité, subjectivité, centralité, etc.).

Consultez `src/lib/types/data.ts` pour la structure détaillée des objets `Article` et `SentimentAnalysis`.

### Préparation des données

Le script `data-preprocess/data-fetch.py` permet de récupérer les données depuis le dataset Hugging Face ["fmadore/iwac-newspaper-articles"](https://huggingface.co/datasets/fmadore/iwac-newspaper-articles) et de les transformer au format attendu par l'application.

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

De plus, le store expose la fonction :
-   `loadDatasetArticles`: Fonction pour charger un dataset depuis un fichier JSON.

## Composants clés

### Composants d'interface utilisateur

-   **`AppHeader.svelte`**: En-tête moderne de l'application avec :
    - **Branding élégant** : Logo avec dégradé et animations subtiles
    - **Mode plein écran** : Bouton pour basculer en mode plein écran avec icônes dynamiques
    - **Design responsive** : Adaptation automatique aux différentes tailles d'écran
    - **Effets visuels** : Glassmorphism, animations hover et transitions fluides

### Composants de filtrage

-   **`CountryFilter.svelte`**: Permet de sélectionner un ou plusieurs pays. Ce filtre est hiérarchique et influence la liste des journaux disponibles.
-   **`JournalFilter.svelte`**: Permet de filtrer les articles par journal, avec fonctionnalités de recherche, pagination et affichage du nombre de journaux disponibles.
-   **`PolarityFilter.svelte`**: Permet de filtrer les articles selon leur polarité (Très positif, Positif, Neutre, Négatif, Très négatif, Non applicable).
-   **`SubjectivityFilter.svelte`**: Permet de filtrer les articles selon leur score de subjectivité (échelle de 1 à 5) avec légende explicative.
-   **`CentralityFilter.svelte`**: Permet de filtrer les articles selon la centralité du sujet islam/musulmans (Très central, Central, Secondaire, Marginal, Non abordé).



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
-   **`AnalysisInfo.svelte`**: Fournit des informations explicatives détaillées sur la méthodologie d'analyse (polarité, subjectivité, centralité) sous forme d'accordéon.

## Page principale (`+page.svelte` et `+page.ts`)

-   `+page.ts`: Fonction de chargement simplifiée qui ne charge plus de manifest externe.
-   `+page.svelte`:
    -   Charge automatiquement le corpus IWAC au démarrage de l'application.
    -   Propose six vues différentes via un menu de navigation latéral (desktop) ou modal (mobile):
      - **Charts**: Graphiques de distribution de polarité et subjectivité (barres/camembert)
      - **Trends**: Évolution des sentiments au fil du temps
      - **Distribution**: Distribution croisée entre polarité et subjectivité
      - **Volume**: Volume d'articles par pays au fil du temps
      - **Heatmap**: Heatmap de centralité par pays et année
      - **Table**: Articles dans un tableau interactif
    -   Inclut un système de filtrage hiérarchique (Pays → Journaux → Critères de sentiment)
    -   Gère l'affichage des détails d'articles dans un modal responsive
    -   Interface entièrement responsive avec navigation mobile optimisée
    -   Gère l'affichage des messages de chargement ou d'absence de données.



## Nouvelles fonctionnalités

### 🔗 **Routage basé sur l'URL** 
L'application prend désormais en charge le partage et la mise en signet de vues spécifiques :
- **URLs partageables** : Partagez des vues filtrées avec des collègues
- **Synchronisation automatique** : Les filtres et vues sont reflétés dans l'URL
- **Navigation naturelle** : Utilisez les boutons précédent/suivant du navigateur
- **Bouton de partage** : Copiez l'URL actuelle en un clic
- **Effacement rapide** : Bouton pour supprimer tous les filtres

Consultez le [Guide du routage URL](./URL_ROUTING_GUIDE.md) pour plus de détails.

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
    pip install datasets tqdm
    ```

2.  **Exécuter le script de récupération des données :**
    ```bash
    python data-preprocess/data-fetch.py
    ```
    
    Ce script récupère automatiquement les données depuis le dataset Hugging Face et génère le fichier `iwac_articles.json` dans le bon format.

## Technologies utilisées

### Frontend
- **Svelte 5** : Framework JavaScript moderne avec runes pour la réactivité
- **SvelteKit** : Framework full-stack pour Svelte avec SSG
- **TypeScript** : Typage statique pour une meilleure robustesse
- **Tailwind CSS** : Framework CSS utilitaire pour le styling
- **Skeleton UI** : Composants UI pour Svelte avec thème sombre

### Visualisations
- **ECharts** : Bibliothèque de graphiques interactifs haute performance
- **svelte-echarts** : Wrapper Svelte pour ECharts
- **Canvas API** : Pour l'ajout de métadonnées aux exports d'images

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
