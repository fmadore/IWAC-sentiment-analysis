# Sentiment Analysis Visualization

This SvelteKit application visualizes sentiment analysis results performed on press article corpora. It loads and explores the [*Islam West Africa Collection* (IWAC)](https://islam.zmo.de/s/afrique_ouest/page/accueil), filtering articles by various criteria (country, newspaper, polarity, subjectivity score, centrality) and displaying sentiment distributions as interactive charts.

**Live site:** [https://fmadore.github.io/IWAC-sentiment-analysis/](https://fmadore.github.io/IWAC-sentiment-analysis/)

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
https://fmadore.github.io/IWAC-sentiment-analysis/?view=charts&countries=Togo

# Trends view in English with positive polarity
https://fmadore.github.io/IWAC-sentiment-analysis/?view=trends&lang=en&polarities=Positif

# Comparison mode with discrepancy filters
https://fmadore.github.io/IWAC-sentiment-analysis/?view=comparison&compare=true&diffMin=2&diffMax=5

# Heatmap with specific centrality
https://fmadore.github.io/IWAC-sentiment-analysis/?view=heatmap&centralities=Central,Très%20central

# Table with multiple filters
https://fmadore.github.io/IWAC-sentiment-analysis/?view=table&countries=Mali&subjectivities=1,2

# Model comparison
https://fmadore.github.io/IWAC-sentiment-analysis/?view=comparison&compare=true&dataset=chatgpt
```

## Performance Optimizations

The application has been optimized for high performance despite large data volumes (three per-model article datasets of 12–18MB each, plus extreme-analysis and arbiter data):

### Lazy Loading
- **Reduced initial transfer**: Only the selected model's dataset loads at startup
- **On-demand loading**: The other models' datasets load only when comparison mode is activated; arbiter and extreme-analysis data load with their views
- **Smart caching**: Datasets remain in memory after loading for instant switching

### Data Compression
- **Brotli/Gzip precompression**: Build assets are precompressed with `vite-plugin-compression` (~90% reduction for JSON)
- **Automatic configuration**: Precompression enabled in the Vite build

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

### Technical Configuration
```javascript
// svelte.config.js - Precompression enabled
precompress: true

// vite.config.ts - Compression plugin
compression({
  algorithm: 'brotliCompress',
  compressionOptions: { level: 11 }
})
```

## Project Structure

The project is structured as a modern SvelteKit application with Svelte 5 runes:

-   `src/`
    -   `lib/`: Main application logic.
        -   `components/`: Reusable Svelte components organized by category.
            -   `common/`: Base reusable components (AccordionItem, ArbiterSection, FilterCard, FilterChip, GlassCard, SentimentBadge, modals, etc.).
            -   `layout/`: Page structure (AppHeader, FiltersPanel, SidebarNav, ViewContent).
            -   `data-display/`: Data display components (AnalysisInfo, ArticleDetail, ArticleTable, ComparisonDetail, ComparisonStats, ComparisonTable, ComparisonView).
            -   `filters/`: Filter components (CentralityFilter, CountryFilter, DiscrepancyFilter, JournalFilter, PolarityFilter, SubjectivityFilter, etc.).
            -   `viz/`: Visualization components (CentralityHeatmap, CorrelationChart, KeywordFrequencyChart, SentimentChart, SentimentTrendsChart, SubjectivityChart, VolumeChart).
            -   `ui/`: UI controls (ArbiterCSVExportButton, CSVExportButton, ComparisonCSVExportButton, DatasetPicker, LanguageSwitcher, ModelPairPicker, etc.).
            -   `SEOHead.svelte`: Dynamic SEO metadata with multilingual support.
            -   `PWAManager.svelte`: PWA installation and update management.
        -   `stores/`: State management modules with Svelte 5 runes.
            -   `arbiter.svelte.ts`: Gemini 3 Pro arbiter evaluation state.
            -   `articles.svelte.ts`: Corpus article state.
            -   `comparison.svelte.ts`: Model comparison mode state.
            -   `datasets.svelte.ts`: Dataset and model selection state.
            -   `extreme-analysis.svelte.ts`: Lexical extreme analysis state.
            -   `filters.svelte.ts`: Filter state (country, newspaper, polarity, etc.).
            -   `ui.svelte.ts`: UI state (sidebar, active view, loading).
            -   `url/`: URL state management module (state, parser, builder, actions, constants, types).
            -   `*.test.ts`: Vitest unit tests for stores.
        -   `i18n/`: Internationalization system (index, fr, en, utils, types).
        -   `types/`: TypeScript definitions.
            -   `data.ts`: Data structures (Article, SentimentAnalysis, etc.) with named types (`PolarityValue`, `SubjectivityScore`, `CentralityValue`).
            -   `extremeAnalysis.ts`: Extreme analysis types.
            -   `pwa.ts`: PWA types.
        -   `utils/`: Shared utility functions.
            -   `format.ts`: Shared formatting (`formatDate`, `getArticleUrl`, `getModelDisplayName`).
            -   `csv.ts`: CSV export (`escapeCSVField`, `formatDateForCSV`, `downloadCSVFile`).
            -   `discrepancy.ts`: Discrepancy display styling (`getDiffClass`, `getDiffBadgeClass`).
            -   `chartTheme.ts`: ECharts theme configuration.
            -   `extremeAnalysis.ts`: Extreme analysis utilities.
            -   `pwa.ts`: PWA utilities.
        -   `urlState.ts`: Legacy URL state management (for compatibility).
        -   `utils.ts`: General utility functions.
        -   `index.ts`: Central entry point for exports.
    -   `routes/`: Application pages.
        -   `+page.svelte`: Main visualization page component.
        -   `+layout.svelte`: Common layout for all pages.
        -   `+layout.ts`: SSG prerender configuration.
    -   `app.html`: Main HTML template.
    -   `app.d.ts`: Global type declarations.
    -   `app.css`: Global CSS styles with CSS variables and theme.
-   `static/`: Static files.
    -   `data/`: **IWAC corpus JSON data files.**
        -   `iwac_articles_chatgpt.json`: Articles analyzed by ChatGPT.
        -   `iwac_articles_gemini.json`: Articles analyzed by Gemini.
        -   `iwac_articles_mistral.json`: Articles analyzed by Mistral.
        -   `iwac_arbiter_evaluations_*.json`: Arbiter evaluations for each model pair.
        -   `iwac_extreme_analysis_*.json`: Lexical extreme analyses per model.
-   `data-preprocess/`: Data preparation scripts.
    -   `shared.py`: Shared module (data loading, conversions, score mappings, export utilities).
    -   `data-fetch.py`: Fetches and transforms data from Hugging Face.
    -   `extreme-analysis.py`: Generates lexical extreme analysis.
    -   `significant-differences-export.py`: Exports significant differences between models.
    -   `arbiter-evaluation.py`: Arbiter evaluation via Gemini API.
-   `package.json`: Project dependencies and npm scripts.
-   `svelte.config.js`: SvelteKit configuration.
-   `tsconfig.json`: TypeScript configuration.
-   `vite.config.ts`: Vite configuration.

## Data

### Data Format

The application automatically loads the IWAC corpus from JSON files in `static/data/`:
- `iwac_articles_chatgpt.json`: Articles analyzed by ChatGPT
- `iwac_articles_gemini.json`: Articles analyzed by Gemini
- `iwac_articles_mistral.json`: Articles analyzed by Mistral

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

The Python scripts share a common module `data-preprocess/shared.py` that centralizes data loading from Hugging Face, score conversions, model name mappings, and JSON export utilities.

`data-preprocess/data-fetch.py` fetches data from the Hugging Face dataset ["fmadore/iwac-newspaper-articles"](https://huggingface.co/datasets/fmadore/iwac-newspaper-articles) and transforms it into the format expected by the application.

`data-preprocess/extreme-analysis.py` generates in-depth lexical analysis of extreme cases (subjectivity, polarity, centrality) by identifying the most frequent keywords for each category and model.

`data-preprocess/significant-differences-export.py` exports significant discrepancies between different model analyses for the comparison mode.

`data-preprocess/arbiter-evaluation.py` runs arbiter evaluations using the Gemini API to generate verdicts between model pairs.

## Available Visualizations

The application offers a comprehensive suite of interactive visualizations for exploring sentiment analysis data:

### 1. Charts - Sentiment Distributions
- **Polarity charts**: Sentiment distribution (Very positive -> Very negative) by newspaper
- **Subjectivity charts**: Subjectivity score distribution (1-5) by newspaper
- **Visualization modes**: Toggle between detailed bars and global pie charts
- **Consistent colors**: Logical gradations (dark green -> dark red) matching filters

### 2. Trends - Temporal Evolution
- **Sentiment trends**: Polarity evolution over the years
- **Interactive navigation**: Zoom and scroll to explore periods
- **Smoothed lines**: Clear visualization of long-term trends

### 3. Distribution - Cross-Dimensional Relationships
- **Grouped bar chart**: Cross-distribution between polarity and subjectivity
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

### 6. Table - Detailed Exploration
- **Interactive table**: Complete article list with sorting and pagination
- **Responsive mobile view**: Cards for small screens
- **Article details**: Modal with complete metadata and analysis justifications

### 7. Comparison - Model Comparative Analysis
- **Comparison table**: Side-by-side visualization of model analyses
- **Automatic discrepancy calculation**: Quantified differences per dimension
- **Discrepancy filters**: Customizable thresholds for exploring conflicts
- **Detailed statistics**: Metrics on convergences and divergences
- **Color codes**: Quick visual identification of conflict levels
- **Detailed view**: In-depth article-by-article analysis with justifications
- **Specialized export**: CSV including both models' data and their differences

### 8. Extremes - Lexical Extreme Analysis
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
-   `npm run lint`: Run ESLint for code style checking.
-   `npm run format`: Run Prettier for code formatting.
-   `npm run test`: Run Vitest unit tests in watch mode.
-   `npm run test:run`: Run unit tests once (used in CI).

## Data Preparation

To update the IWAC corpus data:

1.  **Install Python dependencies:**
    ```bash
    pip install -r data-preprocess/requirements.txt
    ```

2.  **Run the data fetch script:**
    ```bash
    python data-preprocess/data-fetch.py
    ```
    This script automatically fetches data from the Hugging Face dataset and generates `iwac_articles_chatgpt.json`, `iwac_articles_gemini.json`, and `iwac_articles_mistral.json`.

3.  **Generate arbiter evaluations (Admin only):**
    ```bash
    python data-preprocess/arbiter-evaluation.py
    ```
    This script uses the Gemini API to generate arbiter verdicts between models. Requires a valid Google API key.

4.  **Generate lexical extreme analysis (optional):**
    ```bash
    python data-preprocess/extreme-analysis.py
    ```
    This script analyzes keywords associated with extreme sentiment cases and generates:
    - `iwac_extreme_analysis_chatgpt.json`: Lexical extreme analysis for ChatGPT
    - `iwac_extreme_analysis_gemini.json`: Lexical extreme analysis for Gemini
    - `iwac_extreme_analysis_mistral.json`: Lexical extreme analysis for Mistral

5.  **Export significant differences (optional):**
    ```bash
    python data-preprocess/significant-differences-export.py
    ```
    Exports significant discrepancies between model analyses for the comparison mode.

## Tech Stack

### Frontend
- **Svelte 5**: Modern JavaScript framework with runes for reactivity
- **SvelteKit 2**: Full-stack Svelte framework with SSG via `adapter-static`
- **TypeScript**: Static typing (strict mode)
- **Tailwind CSS v4**: Utility-first CSS framework
- **Skeleton UI v4**: Svelte UI components with dark theme

### Visualizations
- **ECharts**: High-performance interactive charting library
- **svelte-echarts**: Svelte wrapper for ECharts

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
- **vite-plugin-compression**: Automatic Brotli/Gzip asset compression
- **SvelteKit precompress**: Static file precompression
- **Lazy loading**: Smart on-demand dataset loading
- **Hardware acceleration**: GPU-optimized animations

### SEO
- **Dynamic meta tags**: Adaptive metadata per view and language
- **Open Graph**: Social media optimization
- **JSON-LD**: Structured data for search engines
- **Canonical URLs**: SEO-friendly URLs

### Dev Tools
- **Vite 7**: Fast modern build tool
- **Vitest**: Unit testing framework
- **ESLint**: Code quality linting
- **Prettier**: Automatic code formatting

### Python Preprocessing
- **pandas**: Data manipulation
- **huggingface_hub**: Dataset loading from Hugging Face
- **google-genai**: Gemini API for arbiter evaluations

## Deployment

The application is automatically deployed to GitHub Pages on every push to the `main` branch.

Access the live version here: [https://fmadore.github.io/IWAC-sentiment-analysis/](https://fmadore.github.io/IWAC-sentiment-analysis/)

Deployment is managed by a GitHub Actions workflow defined in `.github/workflows/deploy.yml`.

---

This README provides an overview of the project. For specific implementation details, please refer to the source code.
