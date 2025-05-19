Contexte de vos données :

Vos fichiers JSON sont générés par un script Python qui télécharge des articles depuis Omeka. Chaque fichier JSON (nommé d'après le titre de l'item Omeka) représente un "dataset".
Chaque dataset est une liste d'articles.
Vous allez intégrer l'analyse de sentiments (avec centralite_islam_musulmans, subjectivite_score, polarite, et justifications) à chaque article dans ces fichiers JSON.
Vous avez besoin d'extraire ou d'ajouter le "nom du journal" et la "date de publication" pour chaque article.
Feuille de Route Détaillée pour la Visualisation Svelte + TypeScript
Phase 0 : Préparation des Données et Raffinements (Côté Python)
Objectif : Produire des fichiers JSON enrichis, prêts pour la visualisation.

Modifier le script omeka_item_downloader.py (ou créer un script de post-traitement) :
Intégration de l'analyse de sentiments :
Pour chaque article récupéré (après process_article_content), utilisez le contenu textuel pertinent (par ex., item['bibo:content'][0]['@value'] ou item['processed_text']['article']) pour appeler votre API d'analyse de sentiments (utilisant le prompt que nous avons défini).
Stockez le JSON de l'analyse de sentiments (contenant centralite_islam_musulmans, subjectivite_score, polarite, et leurs justifications) comme une nouvelle clé dans l'objet article. Par exemple, article['sentiment_analysis'] = resultat_analyse_ia.
Gestion des appels API : Prévoyez des délais, une gestion des erreurs robuste, et potentiellement une mise en cache des résultats pour ne pas ré-analyser des textes identiques si vous relancez le script.
Extraction/Ajout de Métadonnées Clés :
Nom du journal (journal_source) :
Inspectez les champs Omeka disponibles pour chaque article (par ex., dcterms:source, dcterms:publisher, dcterms:provenance ou un champ de métadonnées personnalisé). Extrayez cette information.
Si elle n'est pas disponible de manière fiable, envisagez une étape de curation manuelle ou une table de correspondance si le journal peut être déduit d'autres informations.
Date de publication (publication_date) :
Extrayez-la depuis des champs comme dcterms:date, dcterms:issued, dcterms:created.
Normalisez-la au format YYYY-MM-DD.
Identifiant unique de l'article : Assurez-vous que chaque article a un identifiant unique (par exemple, o:id fourni par Omeka).
Structure JSON finale pour chaque article (exemple) :
JSON

{
  "o:id": 12345, // ID Omeka de l'article
  "o:title": "Titre de l'article...",
  // ... autres métadonnées Omeka pertinentes (dcterms:creator, etc.) ...
  "journal_source": "Le Monde Diplomatique", // Extrait ou ajouté
  "publication_date": "2023-10-26", // Extrait et normalisé
  "bibo:content": [{"@value": "Texte original de l'article..."}],
  "processed_text": {
    "article": "texte normalisé et traité...",
    "paragraphs": [],
    "sentences": []
  },
  "sentiment_analysis": {
    "centralite_islam_musulmans": "Central",
    "centralite_justification": "L'article discute principalement de l'impact des nouvelles régulations sur les pratiques religieuses musulmanes.",
    "subjectivite_score": 4,
    "subjectivite_justification": "L'article utilise un langage chargé et présente un point de vue clair.",
    "polarite": "Négatif",
    "polarite_justification": "Le ton général est critique envers les nouvelles régulations et leurs conséquences pour les musulmans."
  }
}
Chaque fichier ITEM_TITLE.json sera une liste de ces objets articles.
Phase 1 : Configuration du Projet Svelte + TypeScript
Objectif : Mettre en place un environnement de développement Svelte fonctionnel.

Initialisation du projet :
Ouvrez votre terminal et exécutez : npm create svelte@latest ma-visualisation-sentiments
Choisissez "SvelteKit" (recommandé pour la structure et le routage) ou "Svelte app (skeleton)".
Sélectionnez "TypeScript".
Ajoutez ESLint, Prettier, Playwright/Vitest si souhaité.
cd ma-visualisation-sentiments
npm install
Installation des bibliothèques de graphiques :
Recommandation : Chart.js (populaire, bonne documentation, flexible) ou ECharts (très puissant).
Pour Chart.js : npm install chart.js svelte-chartjs
Pour ECharts : npm install echarts svelte-echarts
Structure du projet (si SvelteKit) :
ma-visualisation-sentiments/
├── src/
│   ├── app.html
│   ├── app.d.ts       // Types globaux
│   ├── hooks.server.ts // (Optionnel)
│   ├── lib/
│   │   ├── components/  // Vos composants Svelte
│   │   │   ├── viz/
│   │   │   │   └── SentimentChart.svelte
│   │   │   ├── ui/
│   │   │   │   ├── DatasetSelector.svelte
│   │   │   │   ├── JournalFilter.svelte
│   │   │   │   └── SentimentCriteriaFilter.svelte
│   │   ├── stores.ts    // Stores Svelte pour la gestion d'état
│   │   └── utils.ts     // Fonctions utilitaires
│   ├── routes/        // Structure de vos pages
│   │   └── +page.svelte // Page principale de la visualisation
│   ├── types/
│   │   └── data.ts      // Définitions TypeScript pour vos données
│   └── service-worker.js // (Optionnel)
├── static/
│   └── data/          // Emplacement pour vos fichiers ITEM_TITLE.json
│       └── manifest.json // Fichier listant vos datasets (voir Phase 2)
├── vite.config.ts
├── svelte.config.js
└── tsconfig.json
Vérification de tsconfig.json : Assurez-vous que les options sont adaptées à Svelte.
Lancement du serveur de développement : npm run dev
Phase 2 : Chargement et Traitement des Données dans Svelte
Objectif : Rendre les données JSON accessibles et typées dans l'application Svelte.

Définition des Types TypeScript (src/types/data.ts) :
TypeScript

export interface SentimentAnalysis {
  centralite_islam_musulmans: 'Très central' | 'Central' | 'Secondaire' | 'Marginal' | 'Non abordé' | string | null; // string pour flexibilité si l'API renvoie autre chose
  centralite_justification: string | null;
  subjectivite_score: number | null;
  subjectivite_justification: string | null;
  polarite: 'Très positif' | 'Positif' | 'Neutre' | 'Négatif' | 'Très négatif' | 'Non applicable' | string | null;
  polarite_justification: string | null;
}

export interface Article {
  'o:id': number | string;
  'o:title'?: string;
  journal_source?: string;
  publication_date?: string; // YYYY-MM-DD
  // ... autres champs Omeka que vous souhaitez utiliser ...
  sentiment_analysis: SentimentAnalysis | null;
  // Propriété ajoutée dynamiquement pour savoir de quel dataset vient l'article
  dataset_id: string;
}

export type Dataset = Article[]; // Un fichier JSON est un Dataset

export interface DatasetInfo { // Pour le manifest
    id: string; // Nom du fichier sans .json
    name: string; // Nom lisible pour l'utilisateur (par ex., titre de l'item Omeka)
    filePath: string; // Chemin vers le fichier JSON
}
Préparation des fichiers de données :
Placez vos fichiers ITEM_TITLE.json dans le dossier static/data/.
Créez un fichier static/data/manifest.json qui liste vos datasets. Cela évite d'avoir à lire le système de fichiers (ce qui n'est pas possible directement depuis le navigateur).
JSON

// static/data/manifest.json
[
  { "id": "item_omeka_1_titre", "name": "Corpus Presse X Année Y", "filePath": "/data/item_omeka_1_titre.json" },
  { "id": "item_omeka_2_titre", "name": "Revue Z sur Période A", "filePath": "/data/item_omeka_2_titre.json" }
]
Service de chargement des données (peut être dans src/routes/+page.ts avec SvelteKit ou un fichier utilitaire) :
TypeScript

// src/routes/+page.ts (si vous utilisez SvelteKit et voulez charger les données côté serveur ou universel)
import type { PageLoad } from './$types';
import type { DatasetInfo, Article, Dataset } from '$lib/types/data'; // Ajustez le chemin

export const load: PageLoad = async ({ fetch }) => {
  try {
    const manifestResponse = await fetch('/data/manifest.json'); // SvelteKit fetch peut accéder à static
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest');
    }
    const availableDatasets: DatasetInfo[] = await manifestResponse.json();
    return {
      availableDatasets
    };
  } catch (error) {
    console.error("Error loading manifest:", error);
    return {
      availableDatasets: [],
      error: "Could not load dataset list."
    };
  }
};

// Fonction pour charger un dataset spécifique (peut être appelée depuis un composant)
export async function fetchDataset(filePath: string, datasetId: string, appFetch = fetch): Promise<Dataset> {
    try {
        const response = await appFetch(filePath); // Utiliser le fetch de SvelteKit ou le fetch global
        if (!response.ok) {
            throw new Error(`Failed to load dataset ${filePath}`);
        }
        const articles: Article[] = await response.json();
        // Injecter le dataset_id dans chaque article pour référence future
        return articles.map(article => ({ ...article, dataset_id: datasetId }));
    } catch (error) {
        console.error(`Error fetching dataset ${filePath}:`, error);
        return [];
    }
}
Gestion de l'état global (src/lib/stores.ts) :
TypeScript

import { writable, derived } from 'svelte/store';
import type { Article, DatasetInfo } from '$lib/types/data'; // Ajustez le chemin

export const availableDatasets = writable<DatasetInfo[]>([]);
export const selectedDatasetId = writable<string | null>(null);
export const currentDatasetArticles = writable<Article[]>([]); // Articles du dataset sélectionné
export const isLoadingDataset = writable<boolean>(false);

// Filtres
export const journalFilter = writable<string[]>([]); // Liste des journaux sélectionnés
export const polarityFilter = writable<string[]>([]); // Liste des polarités sélectionnées
export const subjectivityFilterRange = writable<[number, number] | null>([1, 5]); // [min, max]

// Données filtrées pour les graphiques
export const filteredArticles = derived(
    [currentDatasetArticles, journalFilter, polarityFilter, subjectivityFilterRange],
    ([$currentDatasetArticles, $journalFilter, $polarityFilter, $subjectivityFilterRange]) => {
        if (!$currentDatasetArticles) return [];
        return $currentDatasetArticles.filter(article => {
            const sa = article.sentiment_analysis;
            if (!sa) return false; // Ou inclure si on veut montrer les articles sans analyse

            const journalMatch = $journalFilter.length === 0 || ($journalFilter.includes(article.journal_source || ''));
            const polarityMatch = $polarityFilter.length === 0 || ($polarityFilter.includes(sa.polarite || ''));

            let subjectivityMatch = true;
            if ($subjectivityFilterRange && sa.subjectivite_score !== null) {
                subjectivityMatch = sa.subjectivite_score >= $subjectivityFilterRange[0] && sa.subjectivite_score <= $subjectivityFilterRange[1];
            } else if ($subjectivityFilterRange && sa.subjectivite_score === null) {
                subjectivityMatch = false; // Exclure si score null et filtre actif
            }

            return journalMatch && polarityMatch && subjectivityMatch;
        });
    }
);
Phase 3 : Composants d'Interface et de Visualisation de Base
Objectif : Afficher la liste des datasets, permettre la sélection, et afficher un premier graphique.

Composant principal (src/routes/+page.svelte) :
HTML

<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { availableDatasets as availableDatasetsStore, selectedDatasetId, currentDatasetArticles, isLoadingDataset } from '$lib/stores'; // Ajustez chemin
  import { fetchDataset } from './+page'; // Ou depuis un fichier utils

  import DatasetSelector from '$lib/components/ui/DatasetSelector.svelte';
  import JournalFilterComponent from '$lib/components/ui/JournalFilter.svelte';
  import SentimentCriteriaFilter from '$lib/components/ui/SentimentCriteriaFilter.svelte';
  import SentimentChart from '$lib/components/viz/SentimentChart.svelte';

  export let data: PageData; // Données du `load` de +page.ts

  onMount(() => {
    if (data.availableDatasets) {
      availableDatasetsStore.set(data.availableDatasets);
    }
  });

  selectedDatasetId.subscribe(async (id) => {
    if (id) {
      const selectedInfo = $availableDatasetsStore.find(d => d.id === id);
      if (selectedInfo) {
        isLoadingDataset.set(true);
        currentDatasetArticles.set(await fetchDataset(selectedInfo.filePath, selectedInfo.id, fetch));
        isLoadingDataset.set(false);
      }
    } else {
      currentDatasetArticles.set([]);
    }
  });
</script>

<main class="container">
  <h1>Analyse de Sentiments des Articles de Presse</h1>

  <DatasetSelector />

  {#if $isLoadingDataset}
    <p>Chargement des données du dataset...</p>
  {:else if $currentDatasetArticles.length > 0}
    <div class="filters-container">
      <JournalFilterComponent />
      <SentimentCriteriaFilter />
    </div>
    <div class="chart-container">
      <SentimentChart />
    </div>
  {:else if $selectedDatasetId && !$isLoadingDataset}
    <p>Aucun article trouvé pour ce dataset ou le dataset est vide.</p>
  {:else}
    <p>Veuillez sélectionner un dataset pour commencer.</p>
  {/if}
</main>

<style>
  .container { max-width: 1200px; margin: auto; padding: 20px; }
  .filters-container { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
  .chart-container { min-height: 400px; /* Pour éviter le "layout shift" */ }
</style>
Composant DatasetSelector.svelte (src/lib/components/ui/DatasetSelector.svelte) :
HTML

<script lang="ts">
  import { availableDatasets, selectedDatasetId } from '$lib/stores'; // Ajustez chemin
</script>

<div class="filter-group">
  <label for="dataset-select">Choisir un Dataset :</label>
  <select id="dataset-select" bind:value={$selectedDatasetId}>
    <option value={null}>-- Sélectionner --</option>
    {#each $availableDatasets as ds (ds.id)}
      <option value={ds.id}>{ds.name}</option>
    {/each}
  </select>
</div>
Composant SentimentChart.svelte (src/lib/components/viz/SentimentChart.svelte) (Exemple avec Chart.js pour la polarité) :
HTML

<script lang="ts">
  import { Bar } from 'svelte-chartjs';
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
  import type { ChartData, ChartOptions } from 'chart.js';
  import { filteredArticles } from '$lib/stores'; // Utilise les données déjà filtrées
  import { onDestroy } from 'svelte';

  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

  let chartInstance: ChartJS | null = null;
  let chartData: ChartData<'bar'> = { labels: [], datasets: [] };

  const polarityLabels = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  const polarityColors = ['#2E7D32', '#4CAF50', '#BDBDBD', '#F44336', '#B71C1C', '#757575']; // Couleurs personnalisées

  const unsubscribe = filteredArticles.subscribe($articles => {
    const counts: Record<string, number> = Object.fromEntries(polarityLabels.map(l => [l, 0]));
    let articlesAnalyzed = 0;
    $articles.forEach(article => {
      if (article.sentiment_analysis?.polarite) {
        counts[article.sentiment_analysis.polarite] = (counts[article.sentiment_analysis.polarite] || 0) + 1;
        articlesAnalyzed++;
      }
    });

    chartData = {
      labels: polarityLabels,
      datasets: [
        {
          label: `Distribution de la Polarité (${articlesAnalyzed} articles analysés)`,
          data: polarityLabels.map(l => counts[l]),
          backgroundColor: polarityColors,
          borderColor: polarityColors.map(c => `${c}B3`), // Ajouter une bordure légèrement transparente
          borderWidth: 1
        },
      ],
    };

    // Forcer la mise à jour du graphique si ChartJS est déjà initialisé
    if (chartInstance) {
        chartInstance.data = chartData;
        chartInstance.update();
    }
  });

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Distribution de la Polarité des Articles' }
    },
    scales: {
        y: { beginAtZero: true, title: { display: true, text: "Nombre d'articles" } }
    }
  };

  onDestroy(() => {
    unsubscribe(); // Important pour éviter les fuites mémoire
  });
</script>

{#if $filteredArticles.length > 0}
  <div style="height:450px; position: relative;">
    <Bar bind:chart={chartInstance} data={chartData} {options} />
  </div>
{:else}
  <p>Aucun article ne correspond aux filtres actuels, ou aucun dataset n'est chargé.</p>
{/if}
Phase 4 : Implémentation des Facettes de Filtrage
Objectif : Permettre à l'utilisateur de filtrer les données par dataset, journal, et critères de sentiments.

Composant JournalFilter.svelte (src/lib/components/ui/JournalFilter.svelte) :
HTML

<script lang="ts">
  import { currentDatasetArticles, journalFilter } from '$lib/stores'; // Ajustez chemin
  import { derived } from 'svelte/store';

  const uniqueJournals = derived(currentDatasetArticles, $articles => {
    const journals = new Set<string>();
    $articles.forEach(article => {
      if (article.journal_source) journals.add(article.journal_source);
    });
    return Array.from(journals).sort();
  });

  // Gérer la sélection multiple (par exemple, avec des checkboxes)
  // Ici, un simple select multiple pour l'exemple
  function handleChange(event: Event) {
      const selectedOptions = Array.from((event.target as HTMLSelectElement).selectedOptions);
      journalFilter.set(selectedOptions.map(opt => opt.value));
  }
</script>

<div class="filter-group">
  <label for="journal-filter">Filtrer par Journal :</label>
  {#if $uniqueJournals.length > 0}
    <select id="journal-filter" multiple on:change={handleChange}>
      {#each $uniqueJournals as journal (journal)}
        <option value={journal} selected={$journalFilter.includes(journal)}>{journal}</option>
      {/each}
    </select>
    <button on:click={() => journalFilter.set([])} title="Réinitialiser le filtre journal">Effacer sélection</button>
  {:else}
    <p>Aucun journal à filtrer pour ce dataset.</p>
  {/if}
</div>
<style>.filter-group {display: flex; flex-direction: column; gap: 5px;}</style>
Composant SentimentCriteriaFilter.svelte (src/lib/components/ui/SentimentCriteriaFilter.svelte) :
HTML

<script lang="ts">
  import { polarityFilter, subjectivityFilterRange } from '$lib/stores'; // Ajustez chemin

  const allPolarities = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif', 'Non applicable'];
  // Pour le score de subjectivité, un simple input range ou deux inputs number
  let minSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[0] : 1;
  let maxSubjectivity = $subjectivityFilterRange ? $subjectivityFilterRange[1] : 5;

  function updateSubjectivity() {
      subjectivityFilterRange.set([minSubjectivity, maxSubjectivity]);
  }

  // Gérer la sélection des polarités avec des checkboxes
  function handlePolarityChange(event: Event) {
      const target = event.target as HTMLInputElement;
      const polarity = target.value;
      const checked = target.checked;
      if (checked) {
          polarityFilter.update(current => [...current, polarity]);
      } else {
          polarityFilter.update(current => current.filter(p => p !== polarity));
      }
  }
</script>

<div class="filter-group">
  <fieldset>
    <legend>Filtrer par Polarité :</legend>
    {#each allPolarities as p (p)}
      <label>
        <input type="checkbox" value={p} on:change={handlePolarityChange} checked={$polarityFilter.includes(p)} />
        {p}
      </label>
    {/each}
    <button on:click={() => polarityFilter.set([])}>Effacer sélection</button>
  </fieldset>
</div>

<div class="filter-group">
  <fieldset>
    <legend>Filtrer par Score de Subjectivité (1-5) :</legend>
    <label>Min: <input type="number" min="1" max="5" bind:value={minSubjectivity} on:input={updateSubjectivity} /></label>
    <label>Max: <input type="number" min="1" max="5" bind:value={maxSubjectivity} on:input={updateSubjectivity} /></label>
    <button on:click={() => subjectivityFilterRange.set([1,5])}>Réinitialiser</button>
  </fieldset>
</div>
<style>
  .filter-group { margin-bottom: 15px; }
  fieldset { border: 1px solid #ccc; padding: 10px; }
  label { margin-right: 10px; display: inline-block; }
</style>
Logique de filtrage : Déjà gérée via le derived store filteredArticles. Les graphiques utilisent ce store et se mettront à jour automatiquement.
Phase 5 : Améliorations et Interactivité Avancée
Objectif : Affiner la visualisation et ajouter des fonctionnalités utiles.

Tooltips améliorés : Consultez la documentation de votre bibliothèque de graphiques pour personnaliser les tooltips (afficher le pourcentage, le nombre exact, des extraits de justification, etc.).
Interactivité "Click-through" :
Configurez les événements de clic sur les graphiques (par ex., onClick dans les options de Chart.js).
Lors d'un clic, identifiez les articles correspondants au segment cliqué.
Affichez ces articles dans une modale ou une section dédiée (titre, date, journal, extrait de la justification du sentiment).
Plus de graphiques et de vues :
Sentiment au fil du temps : Si vous avez des dates de publication, un graphique linéaire montrant l'évolution de la polarité moyenne (convertissez la polarité en score numérique : Très Négatif=-2, Négatif=-1, Neutre=0, etc.) par mois/année.
Comparaison de la subjectivité/polarité par journal : Diagrammes à barres groupées.
Tableau de données filtrées : Affichez les articles filtrés dans un tableau avec tri et pagination.
Options d'exportation :
Chart.js permet d'exporter en image (chartInstance.toBase64Image()).
Pour les données CSV/JSON, créez une fonction qui convertit $filteredArticles en CSV/JSON et déclenche un téléchargement.
Design et UX :
Utilisez un framework CSS simple (comme Pico.css, Tailwind CSS) ou stylisez manuellement pour une apparence professionnelle.
Assurez une bonne responsivité pour différentes tailles d'écran.
Ajoutez des indicateurs de chargement clairs.
Phase 6 : Tests, Optimisation et Déploiement
Objectif : Assurer la qualité et rendre l'application accessible.

Tests :
Testez avec différents datasets, y compris des datasets vides ou avec des données manquantes.
Vérifiez le fonctionnement des filtres dans diverses combinaisons.
Testez sur différents navigateurs.
Optimisation des performances :
Pour de très grands datasets, envisagez la virtualisation des listes si vous affichez des tableaux d'articles.
Débottleneckez les calculs lents dans les derived stores.
Svelte est généralement très performant, mais soyez attentif avec de gros volumes de données manipulées entièrement côté client.
Build pour la production :
npm run build
Déploiement :
Hébergement statique (recommandé si pas de backend complexe) :
Utilisez adapter-static pour SvelteKit.
Déployez sur GitHub Pages, Netlify, Vercel, GitLab Pages. Ces plateformes offrent souvent des intégrations CI/CD simples.