# Visualisation d'Analyse de Sentiments

Cette application SvelteKit est conçue pour visualiser les résultats d'analyses de sentiments effectuées sur des corpus d'articles de presse. Elle permet de charger différents datasets, de filtrer les articles selon divers critères (journal, polarité, score de subjectivité) et d'afficher les répartitions de sentiments sous forme de graphiques.

## Objectif

L'objectif principal est de fournir une interface interactive pour explorer et comprendre les tendances de sentiments dans des ensembles de textes, en particulier en ce qui concerne la couverture médiatique de thématiques spécifiques.

## Structure du Projet

Le projet est structuré comme une application SvelteKit typique :

-   `src/`
    -   `lib/`: Contient la logique principale de l'application.
        -   `components/`: Composants Svelte réutilisables.
            -   `ui/`: Composants pour l'interface utilisateur (sélection de dataset, filtres).
                -   `DatasetSelector.svelte`: Permet de choisir le corpus de données à analyser.
                -   `JournalFilter.svelte`: Permet de filtrer les articles par source (nom du journal).
                -   `SentimentCriteriaFilter.svelte`: Permet de filtrer par polarité du sentiment et score de subjectivité.
            -   `viz/`: Composants pour la visualisation des données.
                -   `SentimentChart.svelte`: Affiche les données de sentiment (ex: distribution de la polarité) en utilisant ECharts.
        -   `stores.ts`: Stores Svelte pour la gestion d'état global de l'application (dataset sélectionné, filtres actifs, articles chargés et filtrés).
        -   `utils.ts`: (Actuellement vide) Fonctions utilitaires pouvant être utilisées à travers l'application.
    -   `routes/`: Définit les pages de l'application.
        -   `+page.svelte`: Le composant Svelte pour la page principale de la visualisation. Il assemble les différents composants UI et de visualisation.
        -   `+page.ts`: Script de chargement de données pour la page principale. Il récupère la liste des datasets disponibles à partir du `manifest.json`.
    -   `types/`: Contient les définitions TypeScript pour les structures de données.
        -   `data.ts`: Définit les interfaces pour `Article`, `SentimentAnalysis`, `Dataset`, et `DatasetInfo`.
    -   `app.html`: Le template HTML principal de l'application.
    -   `app.d.ts`: Déclarations de types globaux pour l'application.
-   `static/`: Contient les fichiers statiques.
    -   `data/`: **Emplacement pour vos fichiers de données JSON et le `manifest.json`.**
        -   `manifest.json`: Un fichier JSON qui liste les datasets disponibles et les chemins vers leurs fichiers JSON respectifs.
-   `package.json`: Définit les dépendances du projet et les scripts npm.
-   `svelte.config.js`: Configuration SvelteKit.
-   `tsconfig.json`: Configuration TypeScript.
-   `vite.config.ts`: Configuration Vite.

## Données

### Format des Données

Les données d'analyse de sentiments doivent être fournies sous forme de fichiers JSON. Chaque fichier représente un "dataset" (par exemple, un corpus d'articles spécifique).
Chaque fichier JSON doit contenir une liste d'objets `Article`, où chaque article inclut des métadonnées (titre, source, date) et un objet `sentiment_analysis` contenant les résultats de l'analyse (polarité, subjectivité, etc.).

Consultez `src/types/data.ts` pour la structure détaillée des objets `Article` et `SentimentAnalysis`.

### Emplacement des Fichiers de Données

1.  Placez vos fichiers JSON (ex: `corpus_A.json`, `corpus_B.json`) dans le dossier `static/data/`.
2.  Mettez à jour (ou créez) le fichier `static/data/manifest.json` pour lister vos datasets. Exemple :

    ```json
    [
      { "id": "corpus_A", "name": "Corpus Alpha - Année X", "filePath": "/data/corpus_A.json" },
      { "id": "corpus_B", "name": "Revue Z - Période Y", "filePath": "/data/corpus_B.json" }
    ]
    ```
    -   `id`: Un identifiant unique pour le dataset (généralement le nom du fichier sans l'extension `.json`).
    -   `name`: Un nom descriptif et lisible pour l'utilisateur, qui sera affiché dans le sélecteur de datasets.
    -   `filePath`: Le chemin d'accès au fichier JSON du dataset, relatif au dossier `static`.

## Gestion d'État (`stores.ts`)

L'application utilise les stores Svelte pour gérer l'état global :

-   `availableDatasets`: Liste des datasets disponibles (chargée depuis `manifest.json`).
-   `selectedDatasetId`: L'ID du dataset actuellement sélectionné par l'utilisateur.
-   `currentDatasetArticles`: La liste des articles du dataset sélectionné.
-   `isLoadingDataset`: Un booléen indiquant si un dataset est en cours de chargement.
-   `journalFilter`: Un tableau des journaux sélectionnés pour le filtrage.
-   `polarityFilter`: Un tableau des polarités sélectionnées pour le filtrage.
-   `subjectivityFilterRange`: Un intervalle `[min, max]` pour filtrer par score de subjectivité.
-   `filteredArticles`: Un store dérivé qui contient les articles après application de tous les filtres actifs. C'est ce store qui est généralement utilisé par les composants de visualisation.

## Composants Clés

-   **`DatasetSelector.svelte`**: Affiche une liste déroulante des datasets disponibles (basée sur `availableDatasets`) et met à jour `selectedDatasetId` lorsque l'utilisateur fait une sélection.
-   **`JournalFilter.svelte`**: Affiche une liste des sources de journaux uniques présentes dans le dataset actuel et permet à l'utilisateur de sélectionner un ou plusieurs journaux pour filtrer les articles. Met à jour `journalFilter`.
-   **`SentimentCriteriaFilter.svelte`**: Permet à l'utilisateur de sélectionner des polarités spécifiques et/ou de définir une plage pour le score de subjectivité. Met à jour `polarityFilter` et `subjectivityFilterRange`.
-   **`SentimentChart.svelte`**: Utilise le store `filteredArticles` pour afficher une visualisation (actuellement un diagramme à barres avec ECharts montrant la distribution des polarités).

## Page Principale (`+page.svelte` et `+page.ts`)

-   `+page.ts`: Sa fonction `load` est exécutée avant le rendu de la page. Elle récupère le contenu de `static/data/manifest.json` et le transmet au composant `+page.svelte`.
-   `+page.svelte`:
    -   Reçoit les `availableDatasets` de la fonction `load`.
    -   S'abonne aux changements de `selectedDatasetId`. Lorsqu'un dataset est sélectionné, il appelle `fetchDataset` (de `src/lib/utils.ts`) pour charger les articles correspondants et met à jour `currentDatasetArticles`.
    -   Affiche les composants d'interface utilisateur (`DatasetSelector`, `JournalFilterComponent`, `SentimentCriteriaFilter`) et le composant de visualisation (`SentimentChart`).
    -   Gère l'affichage des messages de chargement ou d'absence de données.

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

## Scripts Utiles

-   `npm run dev`: Lance le serveur de développement.
-   `npm run build`: Construit l'application pour la production.
-   `npm run preview`: Lance un serveur local pour prévisualiser la build de production.
-   `npm run check`: Exécute Svelte Check pour vérifier les types et les erreurs dans les composants Svelte.
-   `npm run lint`: Exécute ESLint pour vérifier les erreurs de style de code.
-   `npm run format`: Exécute Prettier pour formater le code.

## Déploiement

L'application est automatiquement déployée sur GitHub Pages à chaque push sur la branche `main`.

Vous pouvez accéder à la version en ligne ici : [https://fmadore.github.io/IWAC-sentiment-analysis/](https://fmadore.github.io/IWAC-sentiment-analysis/)

Le déploiement est géré par un workflow GitHub Actions défini dans `.github/workflows/deploy.yml`.

---

Ce README fournit une vue d'ensemble du projet. Pour des détails spécifiques sur l'implémentation, veuillez consulter le code source et les commentaires dans les fichiers respectifs.
