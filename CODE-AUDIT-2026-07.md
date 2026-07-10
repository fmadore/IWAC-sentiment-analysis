# IWAC Sentiment Analysis — Code & Design Audit (July 2026)

**Scope.** Full-repo examination for refactoring, design, maintainability, and
modularity improvements: five parallel deep-dives over (1) data-display/common
components, (2) viz/chart components, (3) stores & state architecture,
(4) CSS/design system/layout, (5) Python preprocessing, i18n, build config, docs.
Run against `main` @ `bdffc11`.

> **Implementation status (July 10, 2026):** everything in this audit has been
> implemented on `claude/dashboard-refactor-design-yva33p` — the §1 bugs, dead-CSS
> purge, store typing/layering/loading-concurrency work, viz twin-chart merges,
> component modularity (arbiter utils, PaginationControls, Spinner, EmptyState,
> methodology split), filter refactor with a11y fixes, SEOHead i18n, Python
> refactor, test-coverage batch, data-payload normalization (79 -> 50MB), and the
> docs corrections. One item remains open: extracting a shared StatCard for
> ComparisonStats/ArbiterStatsCards (roadmap Batch G) — the agent doing it was
> cut off; the per-folder token-consistency sweep (Batch H) also stays open.

**Relationship to existing roadmaps.** This audit cross-references
[CODE-REFACTORING-ROADMAP.md](CODE-REFACTORING-ROADMAP.md) (batches A–C2 landed,
C3–I pending) and [REFACTORING-ROADMAP.md](REFACTORING-ROADMAP.md) (design track,
essentially complete). Findings below are tagged:

- **[NEW]** — not covered by any pending roadmap batch
- **[CONFIRMS <batch>]** — independently re-verified a pending batch; still valid
- **[EXTENDS <batch>]** — pending batch covers part of it; this adds scope

---

## 1. Bugs found (fix regardless of refactoring)

These are behavior defects, not style issues. All are cheap to fix.

1. **[NEW] `mapArticleProperties` spread order clobbers fallbacks** —
   `stores/articles.svelte.ts:73-90` spreads `...item` *last*, so when a raw
   record carries `journal_source`/`publication_date` with a null/empty value,
   the carefully computed fallbacks (`Newspaper`, `dcterms:date`, `'N/A'`) are
   silently overwritten back to the bad value. Move the spread first (or omit
   mapped keys). Untested code path.
2. **[NEW] Hardcoded English in a bilingual UI** —
   `viz/ArbiterConfidenceChart.svelte:71` (`"${p.value} evaluations"`) and
   `viz/ArbiterVerdictChart.svelte:104` (`"${p.value} verdicts"`) bypass i18n;
   French users see English tooltips. Move to the i18n catalog.
3. **[NEW] Divergent pie legends between twin charts** — `SentimentChart`
   renders a journal legend on its pie (`:110-117`) that controls nothing on a
   globally-aggregated pie; `SubjectivityChart` sets `legend: {show: false}`
   (`:117-119`). One of the two is wrong; unify (disappears naturally if the
   twins are merged, see §3).
4. **[NEW] Off-brand pie styling** — the two arbiter pies hardcode
   `borderRadius: 8` + `shadowBlur: 20`, contradicting the flat
   `getPieSeriesStyle()` (chartTheme.ts:463) that SentimentChart's pie uses.
   Two visually inconsistent pie styles ship today.
5. **[NEW] PWA manifest references non-existent screenshots** —
   `static/manifest.json:60-74` declares `./screenshots/desktop.png` /
   `mobile.png`; `static/screenshots/` does not exist (404 in install
   prompts). `shortcuts` also only cover ChatGPT/Gemini, not Mistral.
6. **[NEW] Docs cite the wrong arbiter model** — README says "Gemini 2.5 Pro"
   in 5 places; the code uses `gemini-3-pro-preview`
   (`arbiter-evaluation.py:287`, stamped into every output's metadata).
   Anyone citing the methodology cites the wrong model.
7. **[NEW] Keyboard/AT accessibility defects** —
   `DiscrepancyFilter`'s info tooltip is a non-focusable `<span>` shown only
   on `:hover` (invisible to keyboard/touch users); its toggle switch is a
   `<button>` without `role="switch"`/`aria-checked` and sets `outline: none`
   with no `:focus-visible` replacement (invisible keyboard focus). Charts
   render to `<canvas>` with no `aria-label`/fallback, so all visualizations
   are invisible to screen readers; chart titles live inside the canvas
   instead of the `ChartCard` heading slot.
8. **[NEW] Dead ternaries** — `ArticleTable.svelte:199,219`:
   `{isMobile ? '←' : '←'}` (both branches identical).

---

## 2. State architecture (stores/)

- **[CONFIRMS I] The "hybrid runes + legacy writable" story is dead.** Zero
  `writable`/`derived` imports and zero `$store` subscriptions remain under
  `src/lib/stores/`; the runes migration is 100% complete. CLAUDE.md:17,
  203-206 and gotcha #8 describe a nonexistent architecture. Fix docs (Batch I
  already plans this; this audit re-verified it programmatically).
- **[NEW — highest-value store work] Data-loading race conditions.**
  - No request dedup: `loadSpecificDataset` (`articles.svelte.ts:126-158`)
    uses call-time length checks (TOCTOU); a foreground load and background
    prefetch of the same dataset can fetch twice (prefetch has its own dedup
    sets at `:54-55` that foreground loads don't share).
  - Overlapping `$effect` triggers in `+page.svelte`: `loadComparisonDatasets`
    fired from `:76` and `:154`, `loadArbiterEvaluations` from `:80` and
    `:168`, `loadCurrentDataset` from `:127` and `onMount:191` — nothing
    serializes them.
  - No `AbortController`: fast dataset switching is a last-write-wins race on
    `articleState.current`.
  - `setTimeout(..., 100)` hacks for pending-article selection
    (`+page.svelte:129,139,192`) — timing-based, not causal.
  - **Plan:** one `inFlight: Map<string, Promise<Article[]>>` in
    `articles.svelte.ts`; all callers (foreground + prefetch) go through it;
    replace the setTimeout hooks with an `$effect` that drains
    `pendingArticleState` when datasets change; abort superseded fetches.
- **[NEW] Inconsistent circular-dependency policy.** `url/` modules correctly
  import individual stores to dodge the barrel cycle, but
  `arbiter.svelte.ts:11` imports `datasetState`/`uiState` **from the barrel it
  is re-exported by** — a live cycle surviving only via ESM live bindings.
  Fix the import, then adopt explicit layering (L0 leaf stores → L1 data
  stores → L2 url → L3 barrel) and enforce with ESLint `import/no-cycle`.
- **[CONFIRMS C4] `datasetState.selected: string`** forces `as ValidDataset`
  casts at 5 boundaries; the `'chatgpt'|'gemini'|'mistral'` union is defined
  3 separate times (`url/constants.ts:24`, `extreme-analysis.svelte.ts:18-22`,
  dataset ids). Define `DatasetId` once.
- **[NEW] Duplicated load boilerplate ×4.** `articles`, `comparison`,
  `extreme-analysis`, `arbiter` each hand-roll "check loaded → set
  `uiState.isLoadingX` → fetch → store → clear flag" (~120 lines total).
  Extract a `loadOnce<T>()` helper and co-locate the dedup/abort logic there.
- **[NEW] Test gaps where risk is highest.**
  `computeArbiterStatistics` (`arbiter.svelte.ts:109-214`, the app's most
  intricate pure logic) is not tested — `arbiter.test.ts` re-implements the
  mapping inline instead of importing it. `mapArticleProperties` (the §1.1
  bug), the data-format branching in `loadDatasetArticles:109-118`,
  `extreme-analysis`, and `ui` stores have zero coverage. `comparison.test.ts:
  79-118` duplicates coverage already in `derivations.test.ts:147-181`. Also
  missing: a URL parse→apply→build round-trip test.
- **Positive:** the `url/` submodule (constants/types/parser/builder/state/
  actions) is the cleanest part of the store layer; parse/build are symmetric
  and fully param-covered.

## 3. Chart/viz layer

- **[CONFIRMS F] Three near-identical twin pairs.**
  SentimentChart ≈ SubjectivityChart (~92% identical, byte-identical 73-line
  `<style>`), SentimentTrendsChart ≈ SubjectivityTrendsChart (~85%),
  ArbiterConfidenceChart ≈ ArbiterVerdictChart (byte-identical option blocks).
  Merging the three pairs removes ~555 lines and kills bugs §1.2–1.4 by
  construction.
- **[CONFIRMS F] No shared chart shell.** `isMobile` derived identically in
  11/11 charts; the integer value-axis block appears verbatim 6×; the rotated
  category-axis block 3×; the empty-state guard 8× in two visual flavors.
  A `BaseChart.svelte` + `buildAxes()` helper removes ~300–450 lines.
  `createBaseChartOptions` (chartTheme.ts:571) and `getVisualMapConfig`
  (`:497`) currently have **zero callers** — adopt or delete.
- **[EXTENDS F] Four inline year-bucketing loops** (both Trends charts,
  VolumeChart:46-72, CentralityHeatmap:65-103) re-implement the shape of the
  tested `aggregateByJournalAndDimension`; add `aggregateByYearAndDimension`
  (+ country variant) to `chartAggregators.ts` and unit-test it.
- **[NEW] French display strings as color-lookup keys** is load-bearing risk:
  one orthography change in the data (`'Non abordé'` → anything) silently
  yields `undefined` → black fills. Two parallel subjectivity color maps
  (numeric-keyed and French-label-keyed) must be hand-synced. Key colors on
  stable codes; derive labels via i18n. Also worth a codegen step for the
  OKLCH→hex table so `chartTheme.ts` can't drift from `app.css` tokens.
- **[CONFIRMS F] Raw rgba/hex re-typed in components** where `chartColors.*`
  tokens already exist: KeywordFrequencyChart:143,150 re-types
  `#E3AD4B`/`#F3F5F9` literally equal to `chartColors.chrome.accent`/
  `text.primary`; CentralityHeatmap and CorrelationChart inline
  `rgba(255,255,255,…)` values.
- **Positive:** `echartsSetup.ts` is exemplary — correct per-module imports,
  and the lazy-registration trick defusing the `sideEffects` tree-shaking trap
  is well documented. No bundle work needed.

## 4. Component layer (data-display/, common/)

- **[CONFIRMS C3] `ArbiterArticleTable` ignores shared composables**: ~80
  lines hand-rolled pagination (near-verbatim copy of `createPagination`,
  minus the reset-on-total-change effect) plus a local `formatDate`
  (`:196-206`) that diverges from `utils/format.ts` (`month: 'short'` vs
  `'long'`, hardcoded `'N/A'` vs translated). ~90 lines removable.
- **[CONFIRMS G] Pagination markup + table CSS tripled.** The prev/pages/next
  bar and `.sortable-header`/sticky-`th`/`.table-container`/`.line-clamp-2`/
  pagination-button CSS are duplicated across the three tables (~250–350 CSS
  lines) — while `app.css` already ships unused `.table th.sortable` and
  `.pagination-btn` classes. Extract `PaginationControls.svelte` and converge
  on the global classes.
- **[EXTENDS G] Arbiter badge helpers duplicated AND hardcode Tailwind
  palette colors** — `getConfidenceBadgeClass`/verdict-class/label mappers are
  copy-pasted between `ArbiterSection.svelte:75-127` and
  `ArbiterArticleTable.svelte:223-262`, using literal
  `bg-emerald-500/20 text-emerald-400 …` (17 occurrences) — the one pocket of
  hardcoded color in an otherwise token-pure component set. Extract
  `$lib/utils/arbiter.ts` + back with `--sentiment-*`/`--verdict-*` tokens.
- **[EXTENDS G] `AnalysisInfo.svelte` (996 lines) split plan**: an ~86-line
  bilingual prompt string is embedded in the template (`:452-538`) — move to
  `$lib/data/prompts.ts` alongside ArbiterMethodology's embedded prompts;
  model cards hardcoded twice (`:186-266` and `:267-330`) → `MODELS` array;
  the collapsible shell + sentiment-scale lists are duplicated with
  `ArbiterMethodology` (~150 shared lines) → `CollapsibleMethodologyCard` +
  `SentimentScaleList`. Target: under ~250 lines.
- **[NEW] `ArbiterArticleDetailModal` breaks the thin-wrapper pattern.**
  `ArticleDetailModal` (54 lines) and `ComparisonDetailModal` (91) delegate to
  detail components; ArbiterArticleDetailModal hand-builds a Model A/VS/B grid
  (`:97-167`) + ~145 lines of CSS duplicating `ComparisonDetail`/
  `ComparisonPanel`. Reuse `ComparisonPanel` (possibly with a `compact` prop);
  ~150–200 lines removed.
- **[NEW] Detail-card CSS primitives copy-pasted ×4.** `.meta-label` mono
  eyebrow (byte-identical in 3 files), `.meta-value`, the `.justification`
  blockquote with `::before` quote glyph (×2), the empty-state block with an
  identical inline SVG (×2), the `clamp()` title rule (×3). The mono-eyebrow
  pattern recurs ~15×. Promote to shared classes / an `EmptyState.svelte`.
- **[EXTENDS G] Stat-card language duplicated** between `ComparisonStats`
  (561 lines — also inlines a whole arbiter-summary accordion) and
  `ArbiterStatsCards`: same `.stat-card`/`.stat-value`/`.stat-label` +
  progress-bar recipes → `StatCard.svelte` + `ProgressBar.svelte`.
- **Positive:** zero Svelte 4 leftovers anywhere (`on:`, `export let`,
  `createEventDispatcher`, `$:` all at 0 hits); `FullScreenModal` and the
  modal wrappers are a good pattern; `SentimentBadge` is the model to follow.

## 5. Design system, CSS, layout

- **[NEW — biggest CSS win] ~430 of app.css's 1654 lines (~27%) are dead**,
  verified by usage greps: the **entire typography preset system**
  (`.preset-typo-*`, lines 563-691, ~130 lines), `.nav-tab*` (872-934),
  `.badge*` (1231-1278), `.btn*` (827-867), `.input/.select/.textarea`
  (948-981), `.anchor*` (702-733), zero-caller shim tokens (`--glass-blur-*`,
  `--shadow-glow-*`, `--gradient-*`), responsive/animation utility classes.
  Meanwhile components hand-roll the same eyebrow/title rules the presets
  encode (ViewContent, AppHeader, FiltersPanel, ChartCard — 4+ copies).
  **Decide:** adopt the presets in components, or delete them — not both.
- **[NEW] `DiscrepancyFilter.svelte` (691 lines) opts out of the design
  system**: re-implements `FilterCard`/`FilterChip` from scratch (66% of the
  file is CSS) and inlines three widgets that belong in `common/`:
  a dual-thumb `RangeSlider` (~110 lines), a `ToggleSwitch` (~40), and an
  `InfoTooltip` (~110, with the a11y bugs in §1.7). With `FilterCard` +
  a new `comparison` FilterChip variant, realistic target is ~200 lines.
  `ExtremeAnalysisControls` (381 lines) similarly bypasses `FilterCard` and
  hand-rolls form controls (plus nested media queries with `!important`).
  The other 6 filters use the shared pattern correctly and are 60–131 lines
  each — hold everyone to that.
- **[NEW] Layout magic numbers duplicated across files**: the `1024px`
  desktop breakpoint is hardcoded in 6 files; sidebar widths
  (`4.5rem`/`14rem`/`16rem`) live in both `SidebarNav` and `+layout.svelte`
  with a comment admitting it; `--rail-top: 6.5rem` hardcodes the header
  height; `ViewContent` uses `calc(100vh - 200px)` and mixes `100vh` with the
  app's standard `100dvh`. Promote to tokens
  (`--breakpoint-desktop`, `--sidebar-width-*`).
- **[NEW] Strategic: Skeleton UI is imported only to be overridden.** No
  Skeleton components are used; the Cerberus theme is loaded then remapped.
  Either drop the dependency or actually use its dialog/dropdown primitives
  in place of the bespoke `DropdownMenu`/`FullScreenModal`.
- **[NEW] Spacing convention is split**: most spacing lives in `--space-*`
  tokens inside `<style>`, but several components use Tailwind utilities
  (`space-y-4 sm:space-y-6`, `p-2 sm:p-4 md:p-6`). Pick one.
- **[EXTENDS H] Remaining hardcoded values**: `#13161c` tooltip fallback
  (DiscrepancyFilter:603), `#f54e42` Mistral red (intentional — promote to
  `--brand-mistral` per Batch H), `#3B82F6` fallback (DatasetBadge:49),
  literal `white` slider/toggle thumbs, bespoke `1s`/`0.9s`/`1.5s` animation
  durations bypassing `--timing-*`, assorted px sizes.
- **Positive:** dark-mode is consistent, `:focus-visible` ring is global,
  z-index scale is used correctly, reduced-motion is honored nearly
  everywhere, drawer/scrim stacking is documented and correct.

## 6. Python preprocessing

- **[CONFIRMS D] `extreme-analysis.py` repeats its 6-category list ~8×**
  (skeleton :116-171, counters :180-209, keyword maps :227-243, stats
  :246-254, classification :296-403, compile :408-460). A
  `CATEGORIES = [(key, predicate)]` config loop halves the 613-line file and
  makes a 7th category a one-line change.
- **[CONFIRMS D] Output durability inconsistent**: only `data-fetch.py` uses
  `safe_save_json`; the arbiter script — whose output embodies paid API
  calls — writes with the unsafe variant (`arbiter-evaluation.py:519`).
- **[EXTENDS D] `significant-differences-export.py` is hardcoded to
  chatgpt-gemini only** (`:33-34`) while the arbiter parametrizes over all
  pairs — it cannot produce the two Mistral pairs; converge on the shared
  parametrized finder.
- **[CONFIRMS D]** No `logging` module anywhere (print + emoji); no type
  hints in `extreme-analysis.py`/`significant-differences-export.py`; magic
  numbers (`[:15000]`, `temperature=0.2`, save-every-10, top_n) unnamed;
  stale docstrings still say "ChatGPT or Gemini".
- **[NEW]** `scripts/oklch-to-hex.py` duplicates its own OKLCH→sRGB pipeline
  in two functions; also a candidate to become the codegen step for
  `chartTheme.ts` (§3).

## 7. i18n, SEO, build, data payload, docs

- **[CONFIRMS E] `i18n/types.ts` (491 lines) is a 100% hand-maintained mirror
  of `en.ts`** — verified: exactly the same 359 keys, zero divergence. Replace
  with `export type Translations = typeof en;` — en/fr drift becomes a compile
  error instead of a runtime `console.warn`.
- **[NEW] `SEOHead.svelte` runs a parallel hand-rolled translation system**
  (~150 lines: `getViewTitle`/`getViewTitleFr`/… ×6) outside the i18n store,
  and it's stale ("between ChatGPT and Gemini models", `:26` — no Mistral,
  same stale phrase in `package.json:4`). Route through a `meta.*` i18n
  namespace.
- **[CONFIRMS E] The app builds itself as a publishable npm library on every
  build**: `build` runs `svelte-package + publint` (`prepack`) producing a
  `dist/` nothing consumes; library-only fields (`exports`, `svelte`,
  `types`, `files`, `peerDependencies`) and `src/lib/index.ts` barrel are
  template leftovers. Drop them; CI/deploy gets meaningfully faster.
  `src/lib/utils.ts` (single stale `getJournalName` beside the real
  `utils/` directory) should fold into `utils/format.ts`.
- **[NEW — biggest end-user win] 76 MB of JSON in `static/data/`, heavily
  denormalized.** The three article files (42 MB) repeat identical base
  metadata per article, differing only in the `sentiment_analysis` block;
  the three extreme-analysis files (35 MB) re-embed full article lists inside
  each of 6 categories. Normalizing to one base-metadata file + slim
  per-model sentiment files + ID-only extreme lists would cut tens of MB of
  client download. (Flagged as deferred in the prior roadmap — this audit
  re-confirms it as the top load-time lever.)
- **[NEW] i18n `translate()` re-subscribes per call** (`i18n/index.ts:
  114-119`) — avoidable churn in hot chart-label paths; cache the last value.
- **[NEW] Doc corrections beyond Batch I's list**: CLAUDE.md:196 claims
  deploys use `peaceiris/actions-gh-pages@v4` — CI actually uses the official
  `actions/upload-pages-artifact@v5` + `deploy-pages@v5`; CLAUDE.md lists a
  `utils/pwa` module that doesn't exist; README's performance section still
  describes the 2-model era ("22MB of JSON", "the second dataset"); README's
  "Gemini 2.5 Pro" ×5 (§1.6); `CountryFilter.svelte:19-20` keeps its own
  inline `{fr, en}` country map.

---

## Prioritized plan

Quick wins (hours each, low risk):
1. Fix the §1 bugs: spread order, i18n'd pie tooltips, unified pie
   style/legend, manifest screenshots, README model name, dead ternaries.
2. Delete the ~430 dead app.css lines; decide presets-vs-hand-rolled type.
3. Land pending C3 + C4 (composables + union types) — both re-verified here.
4. `Translations = typeof en` (delete types.ts mirror); strip the library
   build from `package.json`.
5. Fix `arbiter.svelte.ts` barrel import + add `import/no-cycle` lint.

Structural (days, ordered):
6. Data-loading concurrency layer: `loadOnce`/in-flight map/abort +
   remove the `setTimeout` hacks (new; highest-value store work).
7. Viz: BaseChart shell → merge the three twin pairs → year aggregators
   (pending F, extended by this audit).
8. Components: `PaginationControls`, `utils/arbiter.ts`, shared detail-card
   primitives/`EmptyState`, ArbiterArticleDetailModal → `ComparisonPanel`,
   then the `AnalysisInfo` split (pending G, extended).
9. `DiscrepancyFilter`/`ExtremeAnalysisControls` onto `FilterCard` +
   extract `RangeSlider`/`ToggleSwitch`/`InfoTooltip` with the a11y fixes.
10. Layout tokens (breakpoint/sidebar/rail); spacing convention; Skeleton
    keep-or-drop decision.
11. Python Batch D as planned + parametrize significant-differences-export.
12. Tests: `computeArbiterStatistics` direct coverage, `mapArticleProperties`,
    URL round-trip; de-dupe `comparison.test.ts`.
13. Data payload normalization (base metadata + ID-only extreme lists) —
    coordinate Python writers and store loaders together.
14. Docs: Batch I plus the additional corrections in §7.

**Estimated dedup potential** across §§3–5 alone: ~1,800–2,300 lines removed
with behavior preserved, plus ~430 lines of dead CSS.
