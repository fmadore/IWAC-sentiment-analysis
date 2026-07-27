# IWAC Sentiment Analysis - Claude Code Instructions

## Project Overview

Interactive SvelteKit application for visualizing sentiment analysis results on the Islam West Africa Collection (IWAC) corpus. Features comparative analysis between AI models (ChatGPT, Gemini, Mistral), multilingual support (French/English), comprehensive filtering, export capabilities, and an arbiter evaluation system.

**Live site:** https://fmadore.github.io/IWAC-sentiment-analysis/

## Repository Structure

```
IWAC-sentiment-analysis/
├── ma-visualisation-sentiments/   # SvelteKit frontend app (main codebase)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/        # Svelte components (common/, layout/, ui/, viz/, filters/, data-display/)
│   │   │   ├── stores/            # State management (Svelte 5 runes accessor objects)
│   │   │   ├── i18n/              # Internationalization (en.ts, fr.ts, types.ts)
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   └── utils/             # Utility functions (format, csv, discrepancy, chartTheme, chartAggregators, extremeAnalysis, pagination, accordion, agreement, agreementData, correlation, hijri, newspaperRanking, placeAggregation)
│   │   ├── routes/                # SvelteKit routes (single-page app)
│   │   └── mocks/                 # Test mocks for $app/* modules
│   ├── static/data/               # JSON data files served at runtime
│   └── build/                     # Production build output (gitignored)
├── data-preprocess/               # Python scripts for data preprocessing
│   ├── shared.py                  # Shared utilities (safe_int_convert, dataset loading, score mappings, output helpers)
│   ├── data-fetch.py              # Fetches articles from HuggingFace dataset
│   ├── extreme-analysis.py        # Computes extreme sentiment analysis
│   ├── significant-differences-export.py  # Exports model comparison discrepancies
│   ├── arbiter-evaluation.py      # Runs arbiter evaluations via Gemini API
│   ├── places-export.py           # Joins articles to geocoded places (map payload)
│   └── basemap-export.py          # Builds the Natural Earth world basemap
└── exports/                       # Exported evaluation data (gitignored)
```

## Tech Stack

- **Framework:** SvelteKit 2 with `adapter-static` for GitHub Pages
- **Language:** TypeScript (strict mode)
- **UI:** Skeleton UI v4 (compound components) + Tailwind CSS v4
- **State:** Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`)
- **Charts:** ECharts via svelte-echarts
- **Icons:** Lucide Svelte (`@lucide/svelte`)
- **Build:** Vite 8 (Rolldown) with gzip + brotli compression
- **Testing:** Vitest + @testing-library/svelte + jsdom
- **Python:** pandas, huggingface_hub, google-genai (for preprocessing)

## Common Commands

All frontend commands run from `ma-visualisation-sentiments/`:

```bash
cd ma-visualisation-sentiments

# Development
npm run dev              # Start dev server
npm run build            # Production build (vite build + service-worker stamp)
npm run preview          # Preview production build

# Quality
npm run check            # TypeScript + Svelte type checking
npm run lint             # Prettier + ESLint check
npm run format           # Auto-format with Prettier

# Testing
npm run test             # Vitest in watch mode
npm run test:run         # Single run (used in CI)

# Deployment
npm run deploy           # Build + deploy to GitHub Pages via gh-pages
```

Python preprocessing (from repo root):

```bash
cd data-preprocess
python data-fetch.py                  # Fetch and process articles
python extreme-analysis.py            # Run extreme analysis
python significant-differences-export.py  # Export comparison data
python arbiter-evaluation.py          # Run arbiter evaluations (needs GOOGLE_API_KEY)
python places-export.py               # Join articles to geocoded places (map payload)
python basemap-export.py              # Rebuild the Natural Earth basemap (rarely needed)
python -m py_compile <file>.py        # Syntax check a script
```

## Core Conventions

### Svelte 5 Runes (MANDATORY)

Always use Svelte 5 syntax. Never use Svelte 4 patterns.

```svelte
<script lang="ts">
  // Props: use $props() with typed interface
  interface MyComponentProps { title: string; onClose?: () => void; children?: Snippet; }
  let { title, onClose, children }: MyComponentProps = $props();

  // State: use $state, $derived, $effect
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { console.log(count); });
</script>

<!-- Events: use onclick, NOT on:click -->
<button onclick={() => count++}>Click</button>
```

### CSS Patterns

- Use CSS custom properties from `app.css` -- never hardcode colors or timing
- Use `color-mix(in oklab, ...)` for transparency -- never `rgba()`
- Use `data-*` attributes for state instead of conditional class concatenation
- Sentiment colors: never map a value to a token in a component. Emit the data attribute from `utils/sentimentTokens.ts` and read `--sentiment-fg` / `--sentiment-bg` / `--sentiment-border`, which `app.css` resolves from `[data-polarity]` / `[data-subjectivity]` / `[data-centrality]`. The underlying tokens (`--sentiment-polarity-{value}`, `--sentiment-subjectivity-{n}`, `--sentiment-centrality-{value}`) belong to that one resolver block
- Timing: `--timing-fast` (150ms), `--timing-normal` (250ms), `--timing-slow` (350ms)
- Glass blur: `--glass-blur-sm/md/lg/xl`

### Component Structure

```svelte
<!-- Brief component description -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface ComponentNameProps {
    propName: string;
    children?: Snippet;
  }

  let { propName, children }: ComponentNameProps = $props();
</script>

<div class="component-root" data-state={...}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .component-root { transition: all var(--timing-normal) var(--easing-default); }
</style>
```

### Import Patterns

```typescript
// Components: prefer barrel exports
import { FilterCard, SentimentBadge } from "$lib/components/common";
import { SentimentChart } from "$lib/components/viz";

// Stores: import from barrel
import { filterState, datasetState, uiState } from "$lib/stores";

// Shared utilities: import from specific util modules
import {
  formatDate,
  getArticleUrl,
  getModelDisplayName,
} from "$lib/utils/format";
import {
  escapeCSVField,
  formatDateForCSV,
  downloadCSVFile,
} from "$lib/utils/csv";
import { getDiffClass, getDiffBadgeClass } from "$lib/utils/discrepancy";

// Icons: import from specific paths for tree-shaking
import MenuIcon from "@lucide/svelte/icons/menu";
```

### Component Organization

| Folder          | Purpose                   | Examples                                            |
| --------------- | ------------------------- | --------------------------------------------------- |
| `common/`       | Base reusable components  | FilterCard, FilterChip, GlassCard, SentimentBadge   |
| `layout/`       | Page structure            | AppHeader, FiltersPanel, SidebarNav, ViewContent    |
| `ui/`           | Controls and pickers      | DatasetPicker, CSVExportButton, LanguageSwitcher    |
| `viz/`          | Charts and visualizations | SentimentChart, CentralityHeatmap, CorrelationChart |
| `filters/`      | Filter components         | CountryFilter, PolarityFilter, SubjectivityFilter   |
| `data-display/` | Data views and tables     | ArticleTable, ArticleDetail, ComparisonView         |

### Naming Conventions

- **Components:** PascalCase (`ArticleTable.svelte`)
- **Utility files:** kebab-case (`extreme-analysis.svelte.ts`)
- **CSS classes:** kebab-case (`glass-card`, `nav-tab-mobile`)
- **Props/events:** camelCase with `on` prefix for callbacks (`onChange`, `onClose`)
- **Store state objects:** `{domain}State` pattern (`filterState`, `uiState`, `datasetState`)

## Data Model

### Sentiment Values (French, stored in data)

- **Polarity (`PolarityValue`):** Tres positif, Positif, Neutre, Negatif, Tres negatif, Non applicable
- **Subjectivity (`SubjectivityScore`):** 1 (Very Objective) to 5 (Very Subjective)
- **Centrality (`CentralityValue`):** Tres central, Central, Secondaire, Marginal, Non aborde

### Data files (static/data/)

- `iwac_articles_base.json` — shared article metadata, stored once
- `iwac_sentiment_{model}.json` — per-model sentiment **scores** keyed by article id (joined with the base at load time in `articles.svelte.ts`)
- `iwac_justifications_{model}.json` — per-model justification **prose**, keyed by article id. ~90% of a model's bytes and read only by the detail views and CSV exports, so it is fetched lazily by `loadJustifications()` and merged into the existing `sentiment_analysis` objects
- `iwac_extreme_analysis_{model}.json` — normalized: `articles_index` + per-category `article_ids` (denormalized at load in `utils/extremeAnalysis.ts`)
- `iwac_arbiter_evaluations_{pair}.json` — arbiter verdicts per model pair
- `iwac_places.json` — the map's geography: a `places` registry (geocoded IWAC `Lieux` authority records) plus an `articles` edge list of article id → place ids. Edges, not pre-computed averages, so the map answers to the shared filter rail; aggregated client-side by `utils/placeAggregation.ts`. Fetched lazily by `loadPlaces()`
- `world-110m.geojson` — Natural Earth 1:110m country outlines (public domain), the map's basemap. **Written minified on purpose** and excluded in `.prettierignore`; pretty-printing it costs ~700 kB of whitespace

Both map files are listed in `sw.js`'s `DATA_FILE_PREFIXES` so they land in the deploy-stable data cache rather than the per-build one.

### Datasets and Comparisons

- Datasets: `chatgpt`, `gemini`, `mistral`
- Comparison pairs: `chatgpt-gemini`, `chatgpt-mistral`, `gemini-mistral`

### Views

`charts`, `trends`, `correlation`, `volume`, `seasonality`, `heatmap`,
`ranking`, `map`, `table`, `comparison`, `agreement`, `extremes`, `arbiter`.

`comparison`, `agreement` and `arbiter` are **self-contained**: they run
full-width, own their internal filters, and get no shared filter rail (see
`SELF_CONTAINED_VIEWS` in `+page.svelte`).

`map` is the only view with a heavyweight dependency (MapLibre GL, ~243 kB
gzipped — more than everything else in the vendor bundle combined). It is
behind a memoized dynamic `import()` in `ViewContent.svelte` so the other
views don't pay for it; keep it that way, and check the built entry's
modulepreload list if you touch the import.

### Statistics modules

| Module                      | Purpose                                                                          |
| --------------------------- | -------------------------------------------------------------------------------- |
| `utils/agreement.ts`        | Cohen's/Fleiss' kappa, confusion matrices. Knows nothing about `Article`         |
| `utils/agreementData.ts`    | Shapes `Article[]` into label pairs / rater items / marginals                    |
| `utils/correlation.ts`      | Spearman's rho with tie-averaged ranks + t-approximation p-value                 |
| `utils/newspaperRanking.ts` | Per-newspaper means with 95% confidence intervals                                |
| `utils/hijri.ts`            | Tabular Islamic calendar conversion (month-level aggregates only)                |
| `utils/placeAggregation.ts` | Shapes `Article[]` + the place edge list into per-place counts and mean polarity |

`placeAggregation` excludes `Non applicable` from its mean while still counting
the article: it sorts to 0 in `POLARITY_ORDER` but means "no stance expressed",
so averaging it in drags every heavily-covered place toward the negative pole.
A map bubble counts articles that **mention** a place (`dcterms:spatial` is
item-level tagging, ~3.8 places per article), never articles _about_ it.

Ordinal scales put `Non applicable` / `Non abordé` at the **bottom**, matching
`stores/derivations.ts`. Weighted kappa reads ordinal positions, so moving them
changes published figures — `utils/agreementCorpus.test.ts` pins those figures
against the shipped data and will fail if they drift.

## Testing

- Test files live next to source: `arbiter.svelte.ts` -> `arbiter.test.ts`
- Test pure functions extracted from stores (avoid testing Svelte runes directly)
- Component tests work: `vitest.config.ts` sets `resolve.conditions: ['browser']`
  (without it Svelte 5 resolves its server build and `render()` throws), and
  `test-setup.ts` stubs `matchMedia`/`ResizeObserver`, which every chart needs
  via `svelte/reactivity/window`. Stub `svelte-echarts` with
  `src/mocks/echarts-chart-stub.svelte` — ECharts needs a canvas jsdom lacks
- Python: `python -m pytest data-preprocess/test_shared.py` (runs in CI)
- Mocks for SvelteKit modules: `src/mocks/app-paths.ts`, `app-environment.ts`, `app-navigation.ts`, `app-stores.ts`
- CI runs `npm run test:run` before build in GitHub Actions

## Deployment

- Static site deployed to GitHub Pages via the official `actions/upload-pages-artifact` + `actions/deploy-pages`
- CI pipeline: checkout -> install -> test -> build -> deploy
- Base path in production: `/IWAC-sentiment-analysis`
- Triggered on push to `main`

## State Management Architecture

State is exposed exclusively through runes-based accessor objects (e.g. `filterState`, `datasetState`, `uiState`) — there is no legacy writable-store layer (the only `writable` in the app is the i18n `currentLanguage` store). Store layering is enforced: leaf stores (filters/datasets/ui) import nothing from other stores, data stores (articles/comparison/extreme/arbiter) import leaf stores directly (never the `./index` barrel — that's a cycle), and `scripts/check-store-cycles.mjs` fails `npm run lint` if a cycle reappears. Data loading is idempotent with in-flight dedup (see articles.svelte.ts).

URL state is managed through `$lib/stores/url/` with parser, builder, actions, and state modules.

## Shared Utilities

### Frontend (`src/lib/utils/`)

| Module               | Functions                                                      | Purpose                                                                                       |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `format.ts`          | `formatDate`, `getArticleUrl`, `getModelDisplayName`           | Common formatting across components                                                           |
| `csv.ts`             | `escapeCSVField`, `formatDateForCSV`, `downloadCSVFile`        | CSV export helpers                                                                            |
| `discrepancy.ts`     | `getDiffClass`, `getDiffBadgeClass`                            | Discrepancy display styling                                                                   |
| `chartTheme.ts`      | Chart theme configuration                                      | ECharts theme with sentiment colors                                                           |
| `extremeAnalysis.ts` | Extreme category configs and filtering                         | Extreme analysis data management                                                              |
| `sentimentTokens.ts` | `sentimentVariant`, `variantAttributes`, `sentimentAttributes` | Sentiment value → `data-polarity`/`-subjectivity`/`-centrality`; app.css resolves the colours |

### Python (`data-preprocess/shared.py`)

| Function/Constant                      | Purpose                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `safe_int_convert()`                   | NaN-safe integer conversion                            |
| `load_iwac_dataset()`                  | Load articles from HuggingFace (parquet with fallback) |
| `calculate_discrepancies()`            | Compare two model analyses for significant differences |
| `get_webapp_data_dir()`                | Get/create the webapp's `static/data/` directory       |
| `save_json()`                          | Write JSON with UTF-8 encoding                         |
| `POLARITY_SCORES`, `CENTRALITY_SCORES` | Score string-to-number mappings                        |
| `MODEL_NAMES`                          | Model ID-to-display-name mapping                       |

## Key Gotchas

1. The base path differs between dev (`''`) and production (`'/IWAC-sentiment-analysis'`)
2. Chart colors in `chartTheme.ts` use French strings as lookup keys
3. The `AnalysisInfo.svelte` component is 1200+ lines -- be careful with edits
4. Modules inside `stores/` must import individual store files, never the `./index` barrel (instant cycle — the barrel re-exports everything). `scripts/check-store-cycles.mjs` enforces this via `npm run lint`
5. Skeleton UI v4 uses compound components (`AppBar.Toolbar`, not props)
6. Tailwind v4 has no `tailwind.config.js` -- configuration is in CSS
7. Component-level `@keyframes` duplication is intentional -- Svelte CSS scoping hashes animation names, so they must be defined alongside the scoped selectors that use them
8. ECharts `setOption` **merges** by default. A chart that switches coordinate systems (e.g. polar ↔ cartesian) must be wrapped in `{#key mode}` or the old one is left behind — see `HijriSeasonalityChart.svelte`
9. Store accessors read as narrow unions (`DatasetId`, `ViewId` from `types/data.ts`) but their setters deliberately accept `string` with one internal cast — don't 'fix' the setter signatures; a prior attempt caused cascading svelte-check errors at component call sites
