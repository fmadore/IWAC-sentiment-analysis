# IWAC Sentiment Analysis

SvelteKit dashboard visualising LLM sentiment annotations of the Islam West
Africa Collection corpus. Two annotation generations are published side by side
(see below). The app is `ma-visualisation-sentiments/`; the Python that builds
its JSON payloads is `data-preprocess/`.

**Live:** https://iwac.frederickmadore.com/sentiment-analysis/

- Orientation, data layout, and how to regenerate anything: [README.md](README.md)
- Writing CSS or a component: [DESIGN.md](DESIGN.md) — `npm run lint` enforces most of it
- Before committing anything that ships through CI: the [verify skill](.claude/skills/verify/SKILL.md),
  whose ordering and pass criteria are not guessable

The rest of this file is gotchas — things that are silent when you get them
wrong. Structure, scripts and dependencies are discoverable from the repo.

## Two analysis generations

v2 (`luna`, `mistral-small`, `deepseek`, `gemma`, `qwen` — five models, ten
pairs) is showcased; v1 (`chatgpt`, `gemini`, `mistral`) is a hidden archive
whose data files are frozen so published figures stay reproducible. The
contracts are `src/lib/data/sentiment-v{1,2}.json`, read by both languages.

**The panel size is never a constant.** It grew from three to five on
2026-08-25, and everything that survived the move reads `datasetIdsOf(gen)` or a
`models.length` argument. Anything you write that hardcodes three is wrong for
v2, and anything that hardcodes five is wrong for the archive — including UI
copy, which is why the strings say "the panel" rather than a number.

- **Generation is derived from the id, never stored.** `generationOf()` in
  `domain/sentimentContract.ts` does the work; there is no generation URL
  parameter. Hence the two id sets must never collide — an import-time invariant
  asserts it, along with pair membership, shared scales and shard counts
- **Never split a pair id on `-`.** A v2 model id contains a hyphen, so
  `mistral-small-deepseek` would split into a model that does not exist. Both
  languages read `pairs: [{id, models}]` from the contract
- **Anything that pools models must be scoped to one generation.** An
  eight-rater kappa would measure the prompt rewrite as if it were disagreement
  between models. Agreement, prefetch and `loadAllDatasets` are already scoped;
  new cross-model features need the same treatment
- **Qwen's coverage gap is deliberate, permanent and not missing at random.**
  It carries 251 null polarity/centrality rows (the 51 no model annotates, plus
  200 it declined across a full pass and three retry rounds) and 538 null
  subjectivity. The missing rows concentrate on articles where Islam is
  peripheral, so every complete-case statistic — Fleiss' κ, the consensus
  charts, arbiter eligibility — skews towards high-centrality material. Say so
  when reporting one; never present the gap as repairable
- **The ternary triangle in `DissentProfileChart` is three-rater geometry.** A
  simplex over n models needs n corners, so `barycentric()` returns null for
  anything but three shares and the chart hides the mode unless the generation
  has exactly three models. Same reason `classifyDissent`'s `split` bucket is
  labelled "divided several ways" rather than "all three differ": at five
  raters it also absorbs 3-2 splits
- **The two arbiters are different shapes, not two versions of one thing.** v1 is
  pairwise (Gemini 3 Pro, one file per pair); v2 judges the whole panel at once
  (Claude Opus 5, one file, blind labels a–e). They have separate stores,
  components and scripts on purpose —
  `ArbiterView`'s A/B `model_a_is_first` logic is deeply pairwise and has to stay
  stable for the archive. `arbiter.svelte.ts` refuses to load for a non-v1 pair;
  without that guard it builds a filename nothing will ever publish and 404s on
  every comparison mount
- **The v2 arbiter run is paid and has not been made.** `iwac_arbiter_evaluations_v2.json`
  does not exist, so that view shows an empty state by design — not a bug
- A v1↔v2 difference **confounds model change with prompt change** (v2 asks for
  subjectivity as a label, drops the self-checklist, adds boundary rules). Say so
  when reporting one

`--generation` is required on `data-fetch.py` and `extreme-analysis.py`,
deliberately without a default: an unflagged re-run would rewrite the frozen v1
files. A v2 run does not write `iwac_articles_base.json` at all; it asserts the
live article id set still matches it and fails loudly on drift.

## Data model

Sentiment values are stored as **French strings used as lookup keys**, and the
accents are part of the key:

- Polarity: `Très positif`, `Positif`, `Neutre`, `Négatif`, `Très négatif`, `Non applicable`
- Centrality: `Très central`, `Central`, `Secondaire`, `Marginal`, `Non abordé`, `Non applicable`
- Subjectivity: `1` (very objective) to `5` (very subjective) in our files, both
  generations. v1 is an integer upstream; **v2 is an ordinal label upstream**
  (`Très objectif` … `Très subjectif`) mapped to the rank at generation time,
  with a declined answer becoming `null`. An unknown label _raises_ — returning
  `None` would ship a complete set of well-formed files full of nulls
- `chartTheme.ts` keys its lookups on these same French strings

Agreement statistics retain the full ordinal scales, but discrepancy and arbiter
comparisons treat `Non applicable`, `Non abordé` and missing categorical values
as **non-comparable** and exclude the row; missing subjectivity skips only that
dimension. These rules live in the contracts, and cross-language fixtures ensure
Python and TypeScript cannot drift.

**Model ids are this repo's, not the dataset's column prefixes.** The Hugging
Face dataset names its columns after the model that produced each annotation
(`gpt_5_mini_`, `gpt_5_6_luna_`, …), while the ids remain the `dataset` and
`pair` URL parameters and the `static/data/iwac_*_{model}.json` filenames. Each
contract holds its own mapping and `sentiment_column()` is the only place a
column name is assembled — never interpolate `f"{model_id}_{suffix}"`. The
failure mode is silent, which is why `load_iwac_dataset()` validates the
generation's columns up front: otherwise every `.get()` misses, every score
becomes `None`, and the pipeline writes well-formed JSON full of nulls without
erroring anywhere.

Two load-time shapes worth knowing before you "simplify" them: `iwac_places.json`
is an **edge list** (article id → place ids) plus a registry, not pre-computed
averages, so the map answers to the shared filter rail; and
`iwac_extreme_analysis_{model}.json` is normalized, denormalized at load in
`utils/extremeAnalysis.ts`. `world-110m.geojson` is **written minified on
purpose** and excluded in `.prettierignore` — pretty-printing costs ~700 kB of
whitespace. Both map files are listed in `sw.js`'s `DATA_FILE_PREFIXES` so they
land in the deploy-stable cache rather than the per-build one.

`placeAggregation` excludes `Non applicable` from its mean while still counting
the article: it sorts to 0 in `POLARITY_ORDER` but means "no stance expressed",
so averaging it in drags every heavily-covered place toward the negative pole. A
map bubble counts articles that **mention** a place (`dcterms:spatial` is
item-level tagging, ~3.8 places per article), never articles _about_ it.

## Deployment and the base path

`ma-visualisation-sentiments/deploy.config.js` is the single source of truth
(`DEPLOY_PATH`, `CUSTOM_DOMAIN`) and its header comment explains the whole
nesting mechanism. Read it before touching anything path-related; changing where
the dashboard is served means editing that file and nothing else.

What that comment does not cover:

- DNS: `frederickmadore.com` is registered at Porkbun but its DNS is managed at
  **Cloudflare**. Records added at Porkbun are inert. The `iwac` CNAME must stay
  **DNS-only (grey cloud)** or GitHub cannot complete the Let's Encrypt challenge
- Pages binds **one repo per hostname** — a sibling tool cannot be served from
  `iwac.frederickmadore.com/<other>/` out of a different repo
- The build intentionally emits no `.gz`/`.br` siblings: GitHub Pages handles
  transfer compression and duplicated files bloated the artifact.
  `check-build-artifact.mjs` rejects unstamped placeholders, precompressed
  duplicates, missing nested files, and initial JS over 300 KiB gzip

## Svelte, CSS and UI

**Svelte 5 runes only** — `$state`/`$derived`/`$effect`/`$props`, and `onclick`
never `on:click`. Training data is full of Svelte 4, and `runes: true` also
forces runes mode on `node_modules`: a Dependabot bump shipping a legacy
`export let` component breaks the build and the Pages deploy dies quietly.

- **Tailwind v4 has no `tailwind.config.js`** — configuration lives in the
  `@theme` block at the top of `app.css`, which also _removes_ the `md` and `2xl`
  breakpoints, so this app has three: 640 / 1024 / 1280
- **Unlayered CSS beats Tailwind utilities.** Tailwind v4 utilities sit in a
  layer, so plain `app.css` rules win ties
- **No Skeleton**, and its removal is still the repo's most productive source of
  bugs. Three shapes of the same failure — a class that no longer means what it
  looks like, applied to an element it does not fit, staying valid markup and
  valid CSS while being wrong only on screen:
  - `class="btn btn-sm"` outlived the library, leaving buttons at
    `display: inline` with the icon stacked on the label. There is **no global
    `.btn`**; every control declares its own box, and `check-design-tokens.mjs`
    fails on a watched class that neither `app.css` nor the component defines
  - `.comparison-row` names the _card_ view's stacked dimension block
    (`display: flex; flex-direction: column`). Putting it on the comparison
    table's `<tr>` overrode `display: table-row` and collapsed all eight `<td>`s
    into column 1. Before reusing a class name inside a component, check what
    else already answers to it
  - Skeleton's typography utilities hard-coded `@variant md`, silently requiring
    a breakpoint this app does not have
- **`<svelte:element>` defeats Svelte's CSS scoping.** The compiler cannot prove
  which tag a dynamic element produces, so it prunes scoped selectors targeting
  it as unused and the component renders with _no_ styles, silently.
  `Drawer.svelte` needs it (the nav drawer must stay a `<nav>` landmark, the
  filter rail an `<aside>`), so its panel rules are deliberately `:global()`
- **Component-level `@keyframes` duplication is intentional** — Svelte hashes
  animation names with the same scope hash as the selectors referencing them, so
  a shared global keyframe silently fails. Share spinners via `common/Spinner.svelte`
- A `class` passed to a Lucide component is a _prop_, not a scoped class — wrap
  the icon in a real element and let `currentColor` cascade. Import icons from
  their specific paths (`@lucide/svelte/icons/menu`) so they tree-shake
- Off-canvas panels go through **`common/Drawer.svelte`** — scrim, focus trap,
  `inert` background, Escape, scroll lock and the z-index-above-its-own-scrim
  dance all live there; don't hand-roll another. Its `inert` walk climbs from the
  panel to `<body>` marking each ancestor's _other_ children, because SvelteKit
  renders the whole app inside one wrapper div. A drawer enters from the edge its
  trigger sits on, so only the _closed_ offset moves (`--drawer-offscreen`) and
  the shadow mirrors via `--elevation-drawer-mirrored`. Both become a static rail
  at 1024px (`enabled={false}`), and Drawer closes itself if disabled while open
- Which views carry the shared filter rail is `VIEW_META` in `types/data.ts`,
  typed as a total `Record<ViewId, …>` so omitting a new view is a compile error.
  Ask `hasFilterRail(view)`; don't re-enumerate the list

## Charts

- **ECharts (zrender) cannot parse `oklch()`, `color-mix()` or CSS variables.**
  Chart-facing colours stay hex/rgba — this is why `chartTheme.ts` duplicates
  values that look like they should come from tokens. Each hex carries the
  `// oklch(...)` it was converted from, and `chartTheme.palette.test.ts` fails
  the build if a hex stops matching its annotation or if that colour is no longer
  defined in `app.css`. Don't strip those comments — they are the test's input.
  Anything else chart-facing needing a literal colour must be listed, with a
  reason, in `scripts/check-design-tokens.mjs`
- **Sentiment is not encoded by hue alone.** The polarity ramp is equal-lightness
  at the poles on purpose, so red and green differ only in hue — tooltip swatches
  therefore also carry a shape (`POLARITY_GLYPHS` in `chartFormatters.ts`)
- **`setOption` merges by default.** A chart switching coordinate systems (polar ↔
  cartesian) must be wrapped in `{#key mode}` or the old one is left behind — see
  `HijriSeasonalityChart.svelte`
- **MapLibre GL v6 is ESM-only and does not bundle its worker.** It resolves one
  from `import.meta.url`, which no bundler's module graph can answer, so
  `setWorkerUrl()` must run first. The `import 'svelte-maplibre-gl/vite'` side
  effect at the top of `SentimentMap.svelte` is what does it — delete it and the
  map builds, registers every source and layer, throws nothing, and paints a
  blank canvas, because no GeoJSON source ever finishes parsing. It lives in that
  component rather than the root layout so the worker stays in the map's lazy chunk
- That side-effect module resolves the worker with `?worker&url`, **not** `?url`.
  The dist worker imports a sibling `maplibre-gl-shared.mjs`; `?url` would emit it
  verbatim without the sibling, so it would die on its first import — in
  production only, since dev serves the sibling. The emitted chunk is referenced
  relative to the importing chunk, so the deploy sub-path resolves on its own
- `map` is the only view with a heavyweight dependency — **368 kB gzipped**, more
  than the rest of the vendor bundle combined — so it sits behind a memoized
  dynamic `import()` in `ViewContent.svelte`. Keep it that way, and check the
  built entry's modulepreload list if you touch the import. Its worker chunk
  lands under `_app/immutable/workers/`, already covered by `sw.js`'s `/_app/`
  immutable rule — don't narrow that rule

## State

- Stores are runes accessor objects only — no legacy writable layer (the sole
  `writable` is the i18n `currentLanguage`)
- **Modules inside `stores/` must import individual store files, never the
  `./index` barrel** — the barrel re-exports everything, so that is an instant
  cycle. `scripts/check-store-cycles.mjs` fails `npm run lint` if one reappears.
  Leaf stores (filters/datasets/ui) import from no other store
- **Store accessors read as narrow unions** (`DatasetId`, `ViewId`) but their
  setters deliberately accept `string` with one internal cast. Don't "fix" the
  setter signatures — a prior attempt cascaded svelte-check errors across every
  call site
- Data loading is idempotent with in-flight dedup (see `articles.svelte.ts`)

## Testing

- **`vitest.config.ts` sets `resolve.conditions: ['browser']`** — without it
  Svelte 5 resolves its server build and `render()` throws
- `test-setup.ts` stubs `matchMedia`/`ResizeObserver`, which every chart needs via
  `svelte/reactivity/window`
- **Stub `svelte-echarts` with `src/mocks/echarts-chart-stub.svelte`** — ECharts
  needs a canvas jsdom lacks
- Prefer testing pure functions extracted from stores over runes directly
- **Automated browsers never composite**, so screenshots time out and
  canvas/WebGL looks broken in the pane no matter what. Console, network and
  computed geometry (`getBoundingClientRect`, `getComputedStyle`) are reliable
  and are how to verify a layout fix; judge "does it look right" in a real browser
