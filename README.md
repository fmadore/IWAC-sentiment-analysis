# Sentiment Analysis Visualization

[![Deploy](https://github.com/fmadore/IWAC-sentiment-analysis/actions/workflows/deploy.yml/badge.svg)](https://github.com/fmadore/IWAC-sentiment-analysis/actions/workflows/deploy.yml)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21806223-1682D4?logo=doi&logoColor=white)](https://doi.org/10.5281/zenodo.21806223)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![ORCID](https://img.shields.io/badge/ORCID-0000--0003--0959--2092-A6CE39?logo=orcid&logoColor=white)](https://orcid.org/0000-0003-0959-2092)
[![Dataset](https://img.shields.io/badge/dataset-Hugging%20Face-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/datasets/fmadore/islam-west-africa-collection)

![IWAC Sentiment Analysis: polarity distributions from GPT-5 mini, Gemini 3 Flash preview and Ministral 14B 2512 across 12,356 francophone West African press articles](ma-visualisation-sentiments/static/social-preview.png)

This SvelteKit application visualizes sentiment analysis results performed on press article corpora. It loads and explores the [*Islam West Africa Collection* (IWAC)](https://islam.zmo.de/s/afrique_ouest/page/accueil), filtering articles by various criteria (country, newspaper, polarity, subjectivity score, centrality) and displaying sentiment distributions as interactive charts.

**Live site:** [https://iwac.frederickmadore.com/sentiment-analysis/](https://iwac.frederickmadore.com/sentiment-analysis/)

## Purpose

Provide an interactive interface to explore and understand sentiment trends in media coverage of Islam and Muslims in francophone West African press.

## Features

### Multi-Model Comparison Mode
Comparative analysis of results across three AI models (ChatGPT, Gemini, Mistral):
- Model pair selection (chatgpt-gemini, chatgpt-mistral, gemini-mistral)
- Side-by-side sentiment analysis comparison
- Automatic discrepancy calculation between models
- Advanced filters by disagreement level
- Detailed convergence and conflict statistics
- **Arbiter evaluations**: Gemini 3 Pro as third-party evaluator to determine which model is most relevant
- CSV export including compared model data

### Multilingual Interface
French and English support with automatic sentiment value translation and URL synchronization.

### Filtering and Export
- Hierarchical filtering by country, newspaper, and sentiment criteria
- Shareable URLs with filter state
- CSV export of filtered data with complete metadata

### Example URLs
```
# Charts view with country filter
https://iwac.frederickmadore.com/sentiment-analysis/?view=charts&countries=Togo

# Trends view in English with positive polarity
https://iwac.frederickmadore.com/sentiment-analysis/?view=trends&lang=en&polarities=Positif

# Comparison mode with discrepancy filters
https://iwac.frederickmadore.com/sentiment-analysis/?view=comparison&compare=true&pair=chatgpt-gemini&diffMin=2&diffMax=11

# Heatmap with specific centrality
https://iwac.frederickmadore.com/sentiment-analysis/?view=heatmap&centralities=Central&centralities=Très%20central

# Table with multiple filters
https://iwac.frederickmadore.com/sentiment-analysis/?view=table&countries=Togo&subjectivities=1&subjectivities=2

# Model comparison
https://iwac.frederickmadore.com/sentiment-analysis/?view=comparison&compare=true&pair=chatgpt-mistral
```

## Performance Optimizations

The application has been optimized for high performance despite a 12,356-article corpus (a shared 3.9 MiB metadata file, per-model score and justification files, plus extreme-analysis and arbiter data):

### Lazy Loading
- **Score/prose split**: Each model's data is stored as a small score file (~57–59 KiB gzipped) plus 32 stable justification shards. Charts, trends, filters and aggregates need only the scores; opening one article downloads one ~40–90 KiB prose shard, while CSV export fetches all shards in bounded batches
- **Reduced initial transfer**: Only the selected model's scores load at startup
- **On-demand loading**: Justification prose loads when an article detail is opened or a CSV is exported; the other models' datasets load only when comparison mode is activated; arbiter and extreme-analysis data load with their views
- **Smart caching**: Datasets remain in memory after loading for instant switching; the service worker keeps corpus files in a deploy-stable cache so a new release doesn't re-download them
- **View-level code splitting**: Charts, maps, tables, comparisons, agreement, extremes and arbiter UI are lazy chunks. The build gate currently measures 111 KiB gzip of initial JavaScript against a 300 KiB budget

### Delivery
- **Host-native HTTP compression**: GitHub Pages negotiates transfer compression; the repository does not duplicate every asset as checked-in `.gz`/`.br` files
- **Artifact checks**: Postbuild validation rejects unresolved deploy placeholders, missing nested Pages files, precompressed duplicates, and an initial JavaScript bundle over 300 KiB gzip

### CLS Optimization (Cumulative Layout Shift)
- Optimized font loading with preconnect and preload for Google Fonts
- System fallback fonts to avoid reflows during loading
- Minimum heights defined for accordion components
- Hardware-accelerated animations using `transform` and `will-change`

### SEO and Dynamic Metadata
- Dedicated `SEOHead.svelte` component with adaptive metadata per view
- Multilingual descriptions and keywords
- Open Graph tags for social media sharing
- JSON-LD structured data with WebApplication schema
- Canonical URLs with view and language parameters

## Project Structure

Two top-level areas: `ma-visualisation-sentiments/` (the SvelteKit app) and `data-preprocess/` (the Python that builds its JSON payloads).

### `ma-visualisation-sentiments/src/`

-   `lib/components/` — grouped by role: `common/` (base pieces), `layout/` (page structure), `filters/` (the shared filter rail), `viz/` (ECharts charts and the MapLibre map), `ui/` (pickers and export buttons), `data-display/` (tables, detail views, comparison).
-   `lib/stores/` — Svelte 5 runes accessor objects, one per domain (`filters`, `articles`, `datasets`, `comparison`, `arbiter`, `extreme-analysis`, `ui`), plus `url/` for filter-state to URL synchronisation.
-   `lib/utils/` — pure helpers, including the statistics modules: `agreement.ts` (Cohen's/Fleiss' kappa), `correlation.ts` (Spearman's rho), `newspaperRanking.ts` (means with confidence intervals), `hijri.ts` (Islamic calendar conversion), `placeAggregation.ts` (per-place counts and means).
-   `lib/data/sentiment-v1.json` and `lib/domain/sentimentContract.ts` — the language-neutral v1 model/scale/schema contract shared with Python. `lib/i18n/` contains exact-typed French and English catalogues; `lib/types/` contains the browser data types.
-   `routes/` — a single prerendered page; `app.css` holds the design tokens and the sentiment-colour resolver.

### `ma-visualisation-sentiments/static/data/`

`iwac_articles_base.json` (shared metadata), per-model score files, 32 prose shards per model, per-model extreme-analysis files, per-pair arbiter files, `iwac_places.json`, `world-110m.geojson`, and a checksummed generation manifest. See [Data](#data) for how they fit together.

### `data-preprocess/`

`iwac_preprocess/` is an importable package split into the v1 contract, source normalization, discrepancy rules, atomic serialization, and arbiter-cache reconciliation. `shared.py` remains a compatibility facade for the command-line scripts.

## Data

### Data Format

The application automatically loads the IWAC corpus from JSON files in `static/data/`:
- `iwac_articles_base.json`: Shared article metadata, stored once for all models
- `iwac_sentiment_{model}.json`: Per-model sentiment **scores** (polarity, subjectivity, centrality), keyed by article id
- `iwac_justifications_{model}_{00..31}.json`: Per-model justification **prose**, deterministically sharded by article id
- `iwac_data_manifest.json`: v1 schema/analysis version, immutable Hugging Face source revision, sizes, and SHA-256 hashes for every core file
- `iwac_places.json`: The map's geography — a registry of geocoded IWAC `Lieux` authority records plus an **edge list** of article id to place ids. Edges rather than pre-computed averages, so the map answers to the same filters as every other view; aggregation happens in the browser
- `world-110m.geojson`: Natural Earth 1:110m country outlines (public domain), the map's basemap. Written minified on purpose — pretty-printing it costs roughly 700 kB of whitespace

The frontend validates each JSON boundary at runtime, joins base metadata to the selected model's score map by article id, and exposes a retryable error state on fetch/schema failure. It uses stored `hijri_year`, `hijri_month`, and `hijri_day` values for Islamic-calendar views, with browser conversion only as a legacy fallback.

Each file contains a list of `Article` objects, where each article includes metadata (title, newspaper, country, date) and a `sentiment_analysis` object with analysis results (polarity, subjectivity, centrality, etc.).

Comparison mode uses two datasets simultaneously (selected from the three possible pairs) to identify and analyze discrepancies between model analyses.

### Arbiter Data

For each model pair, arbiter evaluations by Gemini 3 Pro are available:
- `iwac_arbiter_evaluations_chatgpt-gemini.json`
- `iwac_arbiter_evaluations_chatgpt-mistral.json`
- `iwac_arbiter_evaluations_gemini-mistral.json`

These files contain arbiter verdicts for each analysis dimension (polarity, subjectivity, centrality), indicating which model produced the most relevant analysis.

See `src/lib/types/data.ts` for the detailed structure of `Article`, `SentimentAnalysis`, and `ComparisonData` objects.

### Data Preparation

The Python scripts share the importable `data-preprocess/iwac_preprocess/` package. Both Python and TypeScript read the same checked-in v1 contract, and cross-language fixtures assert identical discrepancy behavior.

`data-preprocess/data-fetch.py` fetches data from the Hugging Face dataset ["fmadore/islam-west-africa-collection"](https://huggingface.co/datasets/fmadore/islam-west-africa-collection) and transforms it into the format expected by the application.

`data-preprocess/extreme-analysis.py` generates in-depth lexical analysis of extreme cases (subjectivity, polarity, centrality) by identifying the most frequent keywords for each category and model.

`data-preprocess/significant-differences-export.py` exports significant discrepancies between different model analyses for the comparison mode.

`data-preprocess/arbiter-evaluation.py` runs arbiter evaluations using the Gemini API to generate verdicts between model pairs.

The published v1 contract deliberately reads only `gpt_5_mini_*`, `gemini_3_flash_preview_*`, and `ministral_14b_2512_*` (with legacy vendor-prefix fallback). Newer Hugging Face analyses—including GPT-5.6 Luna, DeepSeek v4 Flash, and the newer Mistral series—are intentionally deferred to a separately versioned migration so existing figures and URLs remain reproducible.

`data-preprocess/places-export.py` joins articles to the geocoded `Lieux` authority records and writes the map's `iwac_places.json` payload.

`data-preprocess/basemap-export.py` rebuilds the Natural Earth basemap (`world-110m.geojson`). Rarely needed — only when the source data itself changes.

## Available Visualizations

The application offers a comprehensive suite of interactive visualizations for exploring sentiment analysis data:

### 1. Charts - Sentiment Distributions
- **Polarity charts**: Sentiment distribution (Very positive -> Very negative) by newspaper
- **Subjectivity charts**: Subjectivity score distribution (1-5) by newspaper
- **Visualization modes**: Toggle between detailed bars and global pie charts
- **Consistent colors**: Logical gradations (dark green -> dark red) matching filters

### 2. Trends - Temporal Evolution
- **Sentiment trends**: Polarity evolution over the years
- **Count/share toggle**: 100% stacked bands separate composition from publication volume, which varies by two orders of magnitude across the corpus
- **Interactive navigation**: Zoom and scroll to explore periods
- **Smoothed lines**: Clear visualization of long-term trends

### 3. Distribution - Cross-Dimensional Relationships
- **Grouped bar chart**: Cross-distribution between polarity and subjectivity
- **Spearman's ρ**: Rank correlation with p-value and n, reported under the chart
- **Polarity categories**: Very negative, Negative, Neutral, Positive, Very positive, Not applicable
- **Subjectivity levels**: Very objective, Rather objective, Mixed, Rather subjective, Very subjective
- **Informative tooltips**: Article count per category and totals

### 4. Volume - Media Activity
- **Volume by country**: Number of articles published per country over time
- **Display modes**: Stacked areas (cumulative view) or lines (individual view)
- **Peak identification**: Spotting periods of intense media activity

### 5. Heatmap - Geographic and Temporal Centrality
- **Centrality by country/year**: Intensity of Islam/Muslim coverage
- **Color scale**: From blue (low centrality) to red (high centrality)
- **Spatio-temporal patterns**: Identifying geographic and historical trends

### 6. Seasonality - Islamic Lunar Calendar
- **Coverage by Hijri month**: Article volume and mean centrality across the twelve Hijri months
- **Cycle and bar layouts**: Polar view for the calendar cycle, bar view for precise month-to-month comparison
- **Coverage index**: 1.0 = a month's even share of the corpus, so months are comparable
- **Why it exists**: the Hijri year drifts ~11 days against the Gregorian one, so lunar patterns are invisible in any year- or month-based view. Coverage nearly doubles during Ramadan and the hajj months
- **Methodological note**: tabular (arithmetic) Islamic calendar, stated on the chart

### 7. Newspapers - Ranked by Sentiment
- **Ranked dot plot**: Newspapers ordered by mean polarity, subjectivity or centrality
- **95% confidence intervals**: Whiskers keep small-sample titles honest
- **Minimum-n threshold**: Titles under 30 rated articles are omitted, and the count omitted is stated
- **Neutral reference line**: Marks the midpoint of each measure's own scale

### 8. Map - Where Coverage Lands
- **Bubble map**: One bubble per geocoded place cited by the corpus, sized by article count
- **Colour by dimension**: Mean polarity, subjectivity or centrality, not polarity alone
- **Mentions, not aboutness**: A bubble counts articles that *mention* a place (`dcterms:spatial` is item-level tagging, ~3.8 places per article), never articles *about* it
- **`Non applicable` excluded from the mean**: It means "no stance expressed", so averaging it in would drag heavily-covered places toward the negative pole; the article is still counted
- **Answers to the shared filters**: Places ship as an article-to-place edge list and are aggregated in the browser, so the map responds to the same filter rail as every other view
- **Loaded on demand**: MapLibre GL is larger than the rest of the vendor bundle combined, so the view is code-split

### 9. Agreement - How the Models Relate
- **Confusion matrix**: Row-normalized cross-tabulation of two models' labels per dimension, diagonal outlined
- **Cohen's κ and weighted κ**: Chance-corrected agreement, unweighted and quadratic-weighted; a large gap between them signals a systematic offset rather than genuine conflict
- **Fleiss' κ**: Agreement across all three models at once, complete cases only
- **Model calibration**: Each model's own label distribution on a shared axis
- **Corpus-scope facets only**: Country and newspaper; sentiment filters are deliberately absent because selecting by the label under comparison would make the statistics circular

### 10. Table - Detailed Exploration
- **Interactive table**: Complete article list with sorting and pagination
- **Responsive mobile view**: Cards for small screens
- **Article details**: Modal with complete metadata and analysis justifications

### 11. Comparison - Model Comparative Analysis
- **Comparison table**: Side-by-side visualization of model analyses
- **Automatic discrepancy calculation**: Quantified differences per dimension
- **Discrepancy filters**: Customizable thresholds for exploring conflicts
- **Detailed statistics**: Metrics on convergences and divergences
- **Disagreement breakdown**: Mean discrepancy by decade and by country, locating where the models diverge
- **Color codes**: Quick visual identification of conflict levels
- **Detailed view**: In-depth article-by-article analysis with justifications
- **Specialized export**: CSV including both models' data and their differences

### 12. Extremes - Lexical Extreme Analysis
- **Keyword analysis**: Identification of most frequent keywords in extreme cases
- **Extreme categories**:
  - **Very high subjectivity** (4-5): Articles expressing strong opinions on Islam/Muslims
  - **Very low subjectivity** (1-2): Very objective and factual articles
  - **Very negative polarity**: Articles with extremely unfavorable portrayal
  - **Very positive polarity**: Articles with extremely favorable portrayal
  - **Very high centrality**: Articles primarily about Islam/Muslims
  - **Marginal centrality**: Articles briefly mentioning Islam/Muslims
- **Keyword types**: Subject (thematic) and Spatial (geographic)
- **Interactive visualization**: Horizontal charts with color gradients by category
- **Comparative analysis**: Compare lexical patterns across models
- **Flexible filtering**: Adjustable keyword count (5-25) and type selection

## State Management (`stores/`)

The application uses state management modules based on **Svelte 5 runes** for optimal reactivity:

### `filters.svelte.ts`
- `countryFilters`: Selected countries (main hierarchical filter)
- `journalFilters`: Selected newspapers
- `polarityFilters`: Selected polarities
- `subjectivityFilters`: Selected subjectivity scores
- `centralityFilters`: Selected centrality levels
- `discrepancyFilters`: Discrepancy filters for comparison mode

### `articles.svelte.ts`
- `datasetArticles`: Articles cache by dataset
- `currentDatasetArticles`: Articles from the selected dataset
- `selectedArticle`: Currently selected article for detailed display
- `filteredArticles`: Articles after applying all filters
- `availableJournals`: Journals available based on selected countries

### `datasets.svelte.ts`
- `availableDatasets`: Available datasets list (ChatGPT, Gemini, Mistral)
- `selectedDataset`: Currently selected dataset
- `comparisonMode`: Boolean indicating if comparison mode is active
- `comparisonPair`: Selected model pair for comparison

### `comparison.svelte.ts`
- `selectedComparison`: Currently selected comparison for detailed display
- `comparisonData`: Comparison data between models
- `filteredComparisons`: Comparisons after applying filters
- `comparisonStatistics`: Comparison statistics and metrics

### `arbiter.svelte.ts`
- `arbiterEvaluations`: Arbiter evaluations by Gemini 3 Pro
- `currentArbiterPair`: Model pair for which evaluations are loaded
- `arbiterStatistics`: Arbiter verdict statistics
- `getArbiterForArticle()`: Retrieves arbiter evaluation for an article

### `ui.svelte.ts`
- `sidebarExpanded`: Sidebar expansion state
- `activeView`: Currently active view (charts, trends, comparison, etc.)
- `isLoadingDataset`, `isLoadingComparison`, `isLoadingArbiter`: Loading states

### `url/`
Modular URL state management with automatic synchronization:
- `getCurrentState()`: Gets current application state
- `parseURLState()`: Parses URL parameters
- `buildURLSearchParams()`: Builds URL parameters
- `updateURL()`: Updates URL with current state
- `initializeURLState()`: Initializes state from URL
- `clearAllFilters()`: Clears all filters

## Multi-Model Comparison Mode

### What is Comparison Mode?

Comparison mode is an advanced feature that analyzes differences between sentiment analyses performed by **three AI models** (ChatGPT, Gemini, Mistral) on the same article corpus. This comparative approach provides valuable insights into:

- **Inter-model consistency**: Identifying where models converge or diverge
- **Potential biases**: Detecting systematic disagreement patterns
- **Analysis reliability**: Evaluating result robustness
- **Complex cases**: Spotting articles requiring human expertise
- **Objective arbitration**: Gemini 3 Pro verdicts to adjudicate between models

### How to Activate Comparison Mode

1. **Via the dataset selector**: Click the comparison button in the DatasetPicker
2. **Via navigation**: Select the "Comparison" view in the sidebar menu
3. **Via URL**: Add `?compare=true&pair=chatgpt-gemini` to the URL

### Available Model Pairs
- **chatgpt-gemini**: Compares ChatGPT and Gemini analyses
- **chatgpt-mistral**: Compares ChatGPT and Mistral analyses
- **gemini-mistral**: Compares Gemini and Mistral analyses

### Comparison Mode Features

#### Automatic Discrepancy Calculation
- **Polarity**: Difference between sentiment evaluations (0-4 points)
- **Subjectivity**: Gap between objectivity scores (0-4 points)
- **Centrality**: Difference in Islam centrality evaluation (0-4 points)
- **Total score**: Sum of discrepancies across all dimensions

#### Advanced Discrepancy Filters
- **Customizable thresholds**: Define difference ranges (e.g., 2-5 points)
- **Quick filters**: Preset buttons (1 point, 2 points, 3+ points)
- **Dimension selection**: Analyze one or more specific dimensions
- **Smart exclusion**: Hide "Not applicable" articles that create artificial discrepancies

#### Discrepancy Color Codes
- **Green (0 points)**: Perfect agreement between models
- **Yellow (1 point)**: Minor discrepancy
- **Orange (2 points)**: Moderate discrepancy
- **Red (3+ points)**: Major discrepancy requiring attention

### Limitations and Considerations

- **No model as ground truth**: Neither ChatGPT, Gemini, nor Mistral should be considered absolute truth
- **Discrepancies != errors**: Disagreements may reflect legitimate different perspectives
- **Context needed**: Interpreting discrepancies requires domain expertise
- **Complementarity**: Results are more useful for identifying trends than for definitive judgments

## Development

Prerequisites: Node.js and npm installed.

1.  **Clone the project and navigate to the folder:**
    ```bash
    cd ma-visualisation-sentiments
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

4.  **Build for production:**
    ```bash
    npm run build
    ```

5.  **Preview the production build:**
    ```bash
    npm run preview
    ```

## Useful Scripts

-   `npm run dev`: Start the development server.
-   `npm run build`: Build the application for production.
-   `npm run preview`: Preview the production build locally.
-   `npm run check`: Run Svelte Check for type and error verification.
-   `npm run lint`: Run Prettier, ESLint, store-cycle detection, and design-token validation.
-   `npm run format`: Run Prettier for code formatting.
-   `npm run test`: Run Vitest unit tests in watch mode.
-   `npm run test:run`: Run unit tests once (used in CI).
-   `npm run test:e2e`: Run Playwright deep-link, failure-state, and axe accessibility smoke tests.

Repository-level helpers live in `scripts/` and run against the root `.venv`:

-   `python scripts/social-preview.py`: Regenerate `static/social-preview.png` — the Open Graph card and GitHub social preview — from the shipped data. Re-run after a data refresh, since the counts and polarity stacks on the card are read from `static/data/`.
-   `python scripts/oklch-to-hex.py`: Print the sRGB renderings of the OKLCH design tokens, for the chart palette and the `theme-color` meta tags.

## Data Preparation

To update the IWAC corpus data:

1.  **Install Python dependencies:**
    ```bash
    pip install -r data-preprocess/requirements-dev.txt
    ```

2.  **Run the data fetch script:**
    ```bash
    python data-preprocess/data-fetch.py
    ```
    This script fetches the current Hugging Face `articles` parquet and atomically publishes the v1 base file, three score files, 96 prose shards, and the generation manifest.

3.  **Reconcile existing arbiter caches without paid API calls:**
    ```bash
    python data-preprocess/arbiter-evaluation.py --prune-cache-only
    ```
    This removes stale/duplicate evaluations, adopts or checks deterministic cache fingerprints, and refreshes provenance metadata.

4.  **Generate missing arbiter evaluations (Admin only):**
    ```bash
    python data-preprocess/arbiter-evaluation.py
    ```
    This script uses the Gemini API to generate arbiter verdicts between models. Requires a valid Google API key.

5.  **Generate lexical extreme analysis:**
    ```bash
    python data-preprocess/extreme-analysis.py
    ```
    This script analyzes keywords associated with extreme sentiment cases and generates:
    - `iwac_extreme_analysis_chatgpt.json`: Lexical extreme analysis for ChatGPT
    - `iwac_extreme_analysis_gemini.json`: Lexical extreme analysis for Gemini
    - `iwac_extreme_analysis_mistral.json`: Lexical extreme analysis for Mistral

6.  **Export significant differences (optional):**
    ```bash
    python data-preprocess/significant-differences-export.py
    ```
    Exports significant discrepancies between model analyses for the comparison mode.

7.  **Rebuild the map payload:**
    ```bash
    python data-preprocess/places-export.py
    ```
    Joins articles to the geocoded place authority records and writes `iwac_places.json`.

8.  **Validate before committing generated data:**
    ```bash
    python -m pytest data-preprocess -q
    python data-preprocess/validate_generated_data.py
    ```
    The validator checks category domains, article-id coverage and references, prose shard placement, arbiter eligibility/fingerprints, and manifest hashes entirely offline.

## Tech Stack

### Frontend
- **Svelte 5**: Modern JavaScript framework with runes for reactivity
- **SvelteKit 2**: Full-stack Svelte framework with SSG via `adapter-static`
- **TypeScript**: Static typing (strict mode)
- **Tailwind CSS v4**: Utility-first CSS framework
- **Repository-owned design system**: CSS tokens and reusable Svelte controls, with automated token/class checks

### Visualizations
- **ECharts 6**: High-performance interactive charting library
- **svelte-echarts**: Svelte wrapper for ECharts
- **MapLibre GL v6**: Vector-tile map behind the corpus map view, loaded on demand

### Internationalization
- **Svelte stores**: Reactive current language management
- **TypeScript types**: Strict interface for translations
- **Automatic detection**: Browser language support
- **Persistence**: localStorage and URL synchronization

### State & Routing
- **URL State Management**: Automatic filter <-> URL synchronization
- **Web Share API**: Native sharing on mobile devices
- **History API**: Natural browser button navigation

### Performance
- **Measured build budget**: Initial JavaScript must remain below 300 KiB gzip
- **Lazy loading**: View-level code splitting plus on-demand datasets and prose shards
- **Service worker caching**: Immutable app assets and deploy-stable corpus data caches
- **Hardware acceleration**: GPU-optimized animations

### SEO
- **Dynamic meta tags**: Adaptive metadata per view and language
- **Open Graph**: Social media optimization
- **JSON-LD**: Structured data for search engines
- **Canonical URLs**: SEO-friendly URLs

### Dev Tools
- **Vite 8 (Rolldown)**: Fast modern build tool
- **Vitest**: Unit testing framework
- **Playwright + axe-core**: Browser, deep-link, error-path, and WCAG smoke testing
- **ESLint**: Code quality linting
- **Prettier**: Automatic code formatting
- **Ruff + pytest + pip-audit**: Python formatting/linting, tests, and dependency auditing

### Python Preprocessing
- **pandas**: Data manipulation
- **huggingface_hub**: Dataset loading from Hugging Face
- **google-genai**: Gemini API for arbiter evaluations

## Deployment

The application is automatically deployed to GitHub Pages on every push to `main` by `.github/workflows/deploy.yml`. Frontend and Python jobs run in parallel; type checks, lint, 388 Vitest tests, the measured production build, Playwright/axe, 39 Python/data tests, Ruff, npm audit, pip-audit, and pull-request dependency review gate deployment. Actions are pinned to immutable commit SHAs and only the deploy job receives Pages permissions.

Access the live version here: [https://iwac.frederickmadore.com/sentiment-analysis/](https://iwac.frederickmadore.com/sentiment-analysis/)

The site is served from a custom subdomain at a sub-path, so the build output is **nested**: the adapter writes the app into `build/sentiment-analysis/`, and `scripts/nest-build.mjs` populates the build root with the three files GitHub Pages only reads from there (`CNAME`, `404.html`, and a redirect `index.html`). This is necessary because a GitHub *project page* supplies the `/repo-name/` path prefix itself, whereas a *custom domain* serves the artifact at the subdomain root.

`ma-visualisation-sentiments/deploy.config.js` is the single source of truth for the path and the domain — changing where the dashboard is served means editing that file and nothing else. Setting `DEPLOY_PATH = ''` serves it at the subdomain root instead.

## Citation

Each release is archived on Zenodo. Machine-readable metadata lives in [`CITATION.cff`](CITATION.cff); GitHub's *Cite this repository* button renders APA and BibTeX from it.

Cite the concept DOI — `10.5281/zenodo.21806223` — unless you need to pin a specific version; it always resolves to the most recent release.

> Madore, F. (2026). *IWAC Sentiment Analysis Visualization* (Version 4.1.0) [Computer software]. University of Bayreuth. https://doi.org/10.5281/zenodo.21806223

```bibtex
@software{madore_iwac_sentiment_analysis,
  author    = {Madore, Frédérick},
  title     = {IWAC Sentiment Analysis Visualization},
  version   = {4.1.0},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.21806223},
  url       = {https://github.com/fmadore/IWAC-sentiment-analysis},
  license   = {MIT}
}
```

The underlying corpus should be cited separately — see the *Islam West Africa Collection* ([islam.zmo.de](https://islam.zmo.de/s/afrique_ouest/)) and its machine-readable export ([doi:10.57967/hf/9857](https://doi.org/10.57967/hf/9857)).

## License

The application code is released under the [MIT License](LICENSE). The IWAC corpus it visualizes is distributed under CC BY-NC-SA 4.0 and is **not** covered by that licence — reuse of the data follows the collection's own terms.

---

This README provides an overview of the project. For specific implementation details, please refer to the source code.
