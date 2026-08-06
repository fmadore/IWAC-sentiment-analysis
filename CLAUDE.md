# IWAC Sentiment Analysis

SvelteKit dashboard visualising sentiment analysis of the Islam West Africa
Collection corpus, comparing three models (ChatGPT, Gemini, Mistral) with an
arbiter evaluation layer. The app is `ma-visualisation-sentiments/`; the Python
that builds its JSON payloads is `data-preprocess/`.

**Live:** https://iwac.frederickmadore.com/sentiment-analysis/

Before committing anything that ships through CI, run the checks in
[.claude/skills/verify/SKILL.md](.claude/skills/verify/SKILL.md) — the ordering
and the pass criteria are not guessable.

Writing CSS or a component? The rules are in [DESIGN.md](DESIGN.md). Most of them
are enforced by `npm run lint`.

The rest of this file is gotchas. Structure, scripts and dependencies are
discoverable from the repo; what follows is not.

## Deployment and the base path

Served from a **custom subdomain at a sub-path**, which is why the build output
is nested. `ma-visualisation-sentiments/deploy.config.js` is the single source of
truth (`DEPLOY_PATH`, `CUSTOM_DOMAIN`) and its header comment explains the whole
mechanism — read it before touching anything path-related.

The trap in one line: a GitHub *project page* supplies the `/repo-name/` prefix,
a *custom domain* does not — Pages serves the artifact at the subdomain root, so
`paths.base` alone would ship a site where every base-prefixed URL 404s. Hence
the adapter writes into `build/sentiment-analysis/` and `scripts/nest-build.mjs`
populates the build root with the three files Pages only reads from there
(`CNAME`, hoisted `404.html`, redirect `index.html`).

- `static/404.html` carries a `__DEPLOY_PATH__` placeholder stamped at build time;
  `static/sw.js` derives `BASE_PATH` from `self.location`. Neither hardcodes the path
- Anything generated before the postbuild stamp — the `.gz`/`.br` variants from
  `vite-plugin-compression` — captures placeholders verbatim. `stamp-sw.mjs`
  re-compresses the worker; `nest-build.mjs` drops the 404 variants instead
- Changing the served path means editing `deploy.config.js` and nothing else.
  `DEPLOY_PATH = ''` serves at the subdomain root and skips the nesting
- DNS: `frederickmadore.com` is registered at Porkbun but its DNS is managed at
  **Cloudflare**. Records added at Porkbun are inert. The `iwac` CNAME must stay
  **DNS-only (grey cloud)** or GitHub cannot complete the Let's Encrypt challenge
- Pages binds **one repo per hostname** — a sibling tool cannot be served from
  `iwac.frederickmadore.com/<other>/` out of a different repo

## Svelte, CSS and UI

- **Svelte 5 runes only.** `$state`/`$derived`/`$effect`/`$props`, and `onclick`
  never `on:click`. Training data is full of Svelte 4; the compiler is in
  `runes: true`, which also forces runes mode on `node_modules` — a Dependabot
  bump shipping a legacy `export let` component breaks the build and the Pages
  deploy dies quietly
**The design rules a component author has to follow are in [DESIGN.md](DESIGN.md),
and `npm run lint` enforces most of them.** Read that before writing CSS. What
follows is only the non-obvious mechanics.

- **Tailwind v4 has no `tailwind.config.js`** — configuration lives in CSS, in
  the `@theme` block at the top of `app.css`. That block also *removes* the `md`
  and `2xl` breakpoints, so this app has three: 640 / 1024 / 1280
- **Unlayered CSS beats Tailwind utilities.** Tailwind v4 utilities sit in a
  layer, so plain `app.css` rules win ties
- **No Skeleton.** It was dropped once the sweep left only ~8 colour values and a
  `.h4` class behind it. Beyond the runes-mode Dependabot risk, its typography
  utilities hard-coded `@variant md`, so it silently required a breakpoint this
  app does not have. The `--color-*` ramps it used to supply are declared in
  `app.css` now and are ours
- **Component-level `@keyframes` duplication is intentional** — Svelte hashes
  animation names with the same scope hash as the selectors referencing them, so
  a shared global keyframe silently fails. Share spinners via `common/Spinner.svelte`
- **`<svelte:element>` defeats Svelte's CSS scoping.** The compiler cannot prove
  which tag a dynamic element produces, so it prunes scoped selectors targeting
  it as unused and the component renders with *no* styles, silently. `Drawer.svelte`
  needs `<svelte:element>` (the nav drawer must stay a `<nav>` landmark, the
  filter rail an `<aside>`), so its panel rules are deliberately `:global()`
- Off-canvas panels go through **`common/Drawer.svelte`** — scrim, focus trap,
  `inert` background, Escape, scroll lock and the z-index-above-its-own-scrim
  dance all live there. Its `inert` walk climbs from the panel to `<body>`
  marking each ancestor's *other* children: SvelteKit renders the whole app
  inside one wrapper div, so inerting `document.body.children` would neutralise
  the drawer along with the page
- `--z-overlay` (500) outranks `--z-sidebar` (400), which is why a drawer sits at
  `calc(var(--z-overlay) + 1)`. Drawer handles this; don't re-derive it
- Import icons from their specific paths (`@lucide/svelte/icons/menu`) so they
  tree-shake. A `class` passed to a Lucide component is a *prop*, not a scoped
  class — wrap the icon in a real element and let `currentColor` cascade

## Charts

- **ECharts (zrender) cannot parse `oklch()`, `color-mix()` or CSS variables.**
  Chart-facing colours stay hex/rgba — this is why `chartTheme.ts` duplicates
  values that look like they should come from tokens. Each hex carries the
  `// oklch(...)` it was converted from, and `chartTheme.palette.test.ts` fails
  the build if a hex stops matching its annotation or if that colour is no longer
  defined in `app.css`. Don't strip those comments — they are the test's input
- Anything else chart-facing that needs a literal colour must be listed, with a
  reason, in `scripts/check-design-tokens.mjs`
- `chartTheme.ts` keys its lookups on the **French** sentiment strings
- **Sentiment is not encoded by hue alone.** The polarity ramp is equal-lightness
  at the poles on purpose, so red and green differ only in hue — tooltip swatches
  therefore also carry a shape (`POLARITY_GLYPHS` in `chartFormatters.ts`)
- **`setOption` merges by default.** A chart switching coordinate systems (polar ↔
  cartesian) must be wrapped in `{#key mode}` or the old one is left behind — see
  `HijriSeasonalityChart.svelte`
- **MapLibre GL v6 is ESM-only and does not bundle its worker.** It resolves one
  from `import.meta.url`, which no bundler's module graph can answer, so
  `setWorkerUrl()` must run before any map is constructed. The
  `import 'svelte-maplibre-gl/vite'` side effect at the top of
  `SentimentMap.svelte` is what does it — delete it and the map builds, registers
  every source and layer, throws nothing, and paints a blank canvas, because no
  GeoJSON source ever finishes parsing. It lives in that component rather than the
  root layout so the worker stays inside the map's lazy chunk
- That side-effect module resolves the worker with `?worker&url`, **not** `?url`.
  The dist worker imports a sibling `maplibre-gl-shared.mjs`; `?url` would emit it
  verbatim without the sibling, so it would die on its first import — in
  production only, since dev serves the sibling. The emitted chunk is referenced
  as `new URL('../workers/…', import.meta.url)`, relative to the importing chunk,
  so the deploy sub-path resolves on its own and `DEPLOY_PATH` needs no wiring
- `map` is the only view with a heavyweight dependency, and v6 made it heavier:
  **368 kB gzipped** (242 kB chunk + a separate 126 kB worker) against v5's single
  271 kB, because `maplibre-gl-shared` is now inlined into both. That is more than
  the rest of the vendor bundle combined, so it sits behind a memoized dynamic
  `import()` in `ViewContent.svelte`. Keep it that way, and check the built entry's
  modulepreload list if you touch the import
- The worker chunk lands under `_app/immutable/workers/`, so `sw.js` already
  treats it as an immutable cache-first asset via its `/_app/` rule — no change
  needed there, but don't narrow that rule
- `comparison`, `agreement` and `arbiter` are **self-contained**: full-width, own
  internal filters, no shared filter rail (`SELF_CONTAINED_VIEWS` in `+page.svelte`)

## State

- Stores are runes accessor objects only — no legacy writable layer (the sole
  `writable` is the i18n `currentLanguage`)
- **Modules inside `stores/` must import individual store files, never the
  `./index` barrel** — the barrel re-exports everything, so that is an instant
  cycle. `scripts/check-store-cycles.mjs` fails `npm run lint` if one reappears
- Leaf stores (filters/datasets/ui) import from no other store; data stores
  (articles/comparison/extreme/arbiter) import leaf stores directly
- **Store accessors read as narrow unions** (`DatasetId`, `ViewId`) but their
  setters deliberately accept `string` with one internal cast. Don't "fix" the
  setter signatures — a prior attempt cascaded svelte-check errors across every
  call site
- Data loading is idempotent with in-flight dedup (see `articles.svelte.ts`)

## Data model

Sentiment values are stored as **French strings and used as lookup keys**:

- Polarity: `Tres positif`, `Positif`, `Neutre`, `Negatif`, `Tres negatif`, `Non applicable`
- Subjectivity: `1` (very objective) to `5` (very subjective)
- Centrality: `Tres central`, `Central`, `Secondaire`, `Marginal`, `Non aborde`

Ordinal scales put `Non applicable` / `Non abordé` at the **bottom**, matching
`stores/derivations.ts`. Weighted kappa reads ordinal positions, so moving them
changes published figures — `utils/agreementCorpus.test.ts` pins those figures
against the shipped data and will fail if they drift.

**`chatgpt`/`gemini`/`mistral` are this repo's ids, not the dataset's column
prefixes.** They were the same word until the Hugging Face dataset renamed its
sentiment columns on 2026-07-31 from a vendor slot to the model that actually
produced each annotation (`gpt_5_mini_`, `gemini_3_flash_preview_`,
`ministral_14b_2512_`). Only the read side moved: the ids remain the `dataset`
and `pair` URL parameters, the `static/data/iwac_*_{model}.json` filenames and
the `model` key inside them, and the UI already names the precise models on its
cards. `shared.HF_COLUMN_PREFIXES` holds the mapping and `sentiment_column()`
is the only place a column name is assembled — never interpolate
`f"{model_id}_{suffix}"` again. The failure mode is silent, which is why
`load_iwac_dataset()` now validates all 18 columns up front: every `.get()`
misses, every score becomes `None`, and the pipeline writes a complete set of
well-formed JSON files full of nulls without erroring anywhere.

`static/data/` is split for load-time reasons, not tidiness:

- `iwac_articles_base.json` holds shared article metadata once;
  `iwac_sentiment_{model}.json` holds per-model scores keyed by article id, joined
  at load time in `articles.svelte.ts`
- `iwac_justifications_{model}.json` is ~90% of a model's bytes and is read only
  by detail views and CSV exports, so `loadJustifications()` fetches it lazily and
  merges into the existing `sentiment_analysis` objects
- `iwac_extreme_analysis_{model}.json` is normalized (`articles_index` +
  per-category `article_ids`), denormalized at load in `utils/extremeAnalysis.ts`
- `iwac_places.json` is an **edge list** (article id → place ids) plus a place
  registry, not pre-computed averages, so the map answers to the shared filter
  rail. Aggregated client-side by `utils/placeAggregation.ts`, fetched lazily
- `world-110m.geojson` is **written minified on purpose** and excluded in
  `.prettierignore` — pretty-printing it costs ~700 kB of whitespace

Both map files are listed in `sw.js`'s `DATA_FILE_PREFIXES` so they land in the
deploy-stable data cache rather than the per-build one.

`placeAggregation` excludes `Non applicable` from its mean while still counting
the article: it sorts to 0 in `POLARITY_ORDER` but means "no stance expressed",
so averaging it in drags every heavily-covered place toward the negative pole. A
map bubble counts articles that **mention** a place (`dcterms:spatial` is
item-level tagging, ~3.8 places per article), never articles _about_ it.

## Testing

- **`vitest.config.ts` sets `resolve.conditions: ['browser']`** — without it
  Svelte 5 resolves its server build and `render()` throws
- `test-setup.ts` stubs `matchMedia`/`ResizeObserver`, which every chart needs via
  `svelte/reactivity/window`
- **Stub `svelte-echarts` with `src/mocks/echarts-chart-stub.svelte`** — ECharts
  needs a canvas jsdom lacks
- Test pure functions extracted from stores rather than runes directly
- **Automated browsers never composite**, so canvas/WebGL looks broken in a
  headless pane no matter what. Console and network output are still reliable;
  judge "does it render" in a real browser

## Other

- `AnalysisInfo.svelte` is 1200+ lines — be careful with edits
