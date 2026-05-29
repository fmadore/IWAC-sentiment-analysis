# IWAC Sentiment Analysis — Code Refactoring Roadmap

**Scope.** Code-level maintainability: bug fixes, dead-code removal, deduplication,
type-safety, modularity, build hygiene, and the Python preprocessing pipeline.

This is a **separate track** from [REFACTORING-ROADMAP.md](REFACTORING-ROADMAP.md),
which logs the (largely complete) *editorial design* overhaul and explicitly scoped
out "restructuring stores or data layer." This document covers exactly that
remaining code work.

**Source.** Findings come from a six-agent audit (state, components, viz, design,
utils/i18n/build, Python) run against `main` @ `3340fd4` (post PR #46). Each
headline bug was verified against source before being acted on.

**Operating principle.** Each batch lands as one or more commits that pass the full
gate before commit:

```bash
cd ma-visualisation-sentiments
npm run lint        # prettier --check + eslint
npm run check       # svelte-check — must report 0 ERRORS / 0 WARNINGS
npm run test:run    # vitest (currently 126 tests)
npm run build       # vite build (+ prepack until Batch E removes it)
# Python: cd data-preprocess && python -m py_compile <file>.py
```

**Hard constraints (do not violate):**
- Never deduplicate component-level `@keyframes` into global CSS — Svelte hashes
  animation names per scope; consolidate the *markup* (a shared component) instead.
- Omeka-style rule N/A here, but: ECharts/zrender cannot parse `oklch()` /
  `color-mix()`; chart code legitimately uses hex/`rgba()` with provenance comments.
  Do not "fix" those to tokens.
- Verify the svelte-check summary line literally reads `0 ERRORS` — a non-zero
  count is a failure even if the command's shape looks fine.

---

## Status

| Batch | Title | Status |
|-------|-------|--------|
| A | Fix latent bugs | ✅ landed (`e9214ec`) |
| B | Remove dead code | ✅ landed (`5b19090`) |
| C1+C2 | `getPairModelNames` + delete `urlState` shim | ✅ landed (`38d7bf7`) |
| C3 | `ArbiterArticleTable` → shared `createPagination` | ⏳ pending |
| C4 | Tighten store union types (`ValidDataset` / `ValidView`) | ⏳ pending |
| D | Python preprocessing refactor | ⏳ pending |
| E | Build config + i18n type derivation | ⏳ pending |
| F | Viz modularity (BaseChart, twin-chart unification) | ⏳ pending |
| G | Component modularity (Pagination, Spinner, scales) | ⏳ pending |
| H | Design-system token consistency sweep | ⏳ pending |
| I | Docs & memory refresh | ⏳ pending |

---

## ✅ Completed

### Batch A — Fix latent bugs (`e9214ec`)
Seven real bugs, none covered by the design roadmap:
- **Data loss:** `significant-differences-export.py` read OCR text from `item.get('ocr')`
  but the dataset column is uppercase `OCR` (as `arbiter-evaluation.py` already uses)
  → every exported `article_text` was `null`. Fixed to `item.get('OCR')`.
- **Paid-API inflation:** `shared.py:calculate_discrepancies` coerced a missing
  subjectivity score (`None`/NaN) to `0`, manufacturing a spurious 4–5 point gap that
  flagged false "significant conflicts" sent to the paid Gemini arbiter. Now skips the
  dimension when either score is missing (mirrors the `Non applicable` handling).
- **Undefined token `--sentiment-trends`** (ArbiterArticleDetailModal) → invisible
  model-A accent. Repointed to the defined `--sentiment-comparison`.
- **Undefined token `--chrome-accent`** (9 usages across PWAManager, FullScreenModal,
  PromptModal, ArticleDetail) → transparent buttons/stripes. Repointed to `--accent`.
- **Font drift:** CentralityHeatmap + CorrelationChart hardcoded `Inter`; now use the
  Public Sans stack like every other chart.
- **Missing scroll-lock** in PromptModal (FullScreenModal already had it).
- **Stale FR i18n:** `modelDetails` still described Gemini; rewritten to match the EN
  GPT-5 mini copy. (Key is currently unused by components but corrected for reconnection.)

### Batch B — Remove dead code (`5b19090`)
Zero-consumer code, confirmed by repo-wide grep:
- `GlassCard.svelte` (~130 lines) + its barrel export.
- `arbiterState` object + its `stores/index.ts` export (`type ArbiterStatistics` kept).
- Duplicate `ComparisonStatistics` interface in `types/data.ts` (canonical copy lives in
  `stores/derivations.ts`, which all consumers import).
- Orphaned `Dataset` / `DatasetInfo` types.
- Unused `chartTheme.ts` helpers `adjustBrightness`, `withOpacity`, `getAccessibilityConfig`.
  (`getVisualMapConfig` + `createBaseChartOptions` intentionally kept for Batch F.)

### Batch C1+C2 — Dedup + shim removal (`38d7bf7`)
- **`getPairModelNames(pair, datasets)`** added to `types/data.ts`; replaced the
  copy-pasted "split pair → look up each name" block at all **7** sites (6 components +
  `arbiter.svelte.ts`). `getModelsFromPair` stays for ID-only uses.
- **Deleted `$lib/urlState.ts`** (deprecated 47-line re-export). Repointed its 5
  importers to `$lib/stores/url`; dropped the redundant barrel re-export in `lib/index.ts`.

---

## ⏳ Remaining

### Batch C3 — `ArbiterArticleTable` → `createPagination` — **S**
`ArbiterArticleTable.svelte` hand-rolls `currentPage`/`itemsPerPage`/`totalPages`/
`visiblePages`/`goToPage`/`next`/`prev` (~80 lines) — a near-verbatim copy of the
shared `utils/pagination.svelte.ts` composable that `ArticleTable` and `ComparisonTable`
already use. It also lacks the composable's "reset to page 1 on total change" effect.
Replace with `createPagination({ totalItems, initialItemsPerPage: 25, ... })`.

### Batch C4 — Tighten store union types — **S–M**
`datasetState.selected` is `string` and `uiState.activeView` is `string`, forcing
`as ValidDataset` / `as ValidView` casts at 5 boundaries (`url/parser`, `url/state`,
`url/actions`, `extreme-analysis`). Narrow the backing `$state` + getter to the union.
**Use the internal-cast pattern to avoid call-site ripple:** keep the *setter* parameter
as `string` (or the union) and cast once inside, so the ~6 component call sites that
assign raw strings keep compiling. A prior attempt that changed setter signatures
produced 6 cascading svelte-check errors — narrow the read type + remove the external
casts, not the write surface, and re-gate carefully.

### Batch D — Python preprocessing — **M–L**
Consolidation reached field-extraction/score-mapping but stopped at dataset loading,
paths, the OCR field name, output durability, and the extreme-analysis loop.
- **Perf:** `arbiter-evaluation.py` calls `find_significant_differences` twice per pair
  (count pass in `main` + `process_pair`); cache per-pair results once. Replace
  `df.iterrows()` (slowest mode) with `df.to_dict('records')`.
- **Dedup into `shared.py`:** `load_iwac_records()`; `get_article_text(item)` keyed on
  the confirmed `OCR` column (kills the C1-class bug at the source + the 4-deep `.get`
  fallback); `IWAC_ITEM_URL_BASE` + `get_item_url(o_id)`; optional `build_article_metadata`
  to unify the four divergent key vocabularies (`o:id`/`id`/`article_id`).
- **Robustness:** `--yes` flag (+ `EOFError` guard) so the arbiter script doesn't hang in
  CI; narrow bare/broad `except:` to `(OSError, json.JSONDecodeError)` for cache reads and
  distinguish retryable vs fatal API errors; route all JSON writes through `safe_save_json`;
  add `validate_columns(df, required)` that fails loudly.
- **Maintainability:** refactor the ~390-line `analyze_extreme_keywords` 6-fold copy-paste
  into a `CATEGORIES = [(name, predicate)]` loop; promote magic numbers to constants
  (`SIGNIFICANT_CONFLICT_THRESHOLD = 3`, `ARBITER_MODEL`, `ARBITER_MAX_INPUT_CHARS`,
  `ARBITER_TEMPERATURE`, save-interval); drop the vestigial `{"train": ...}` wrapper; add
  type hints/docstrings to `extreme-analysis.py` + a `main()` to `data-fetch.py`.
- **Cleanup:** pin `requirements.txt`; delete the stale `__pycache__/*.pyc` with no source.

### Batch E — Build config + i18n types — **M**
- **Drop the library build:** `package.json` `build` runs `vite build && prepack`
  (`svelte-package` + `publint`) and declares `svelte`/`types`/`exports`/`files`/
  `peerDependencies`. This is a **deployed GitHub-Pages app**, not a published library —
  `deploy` ships `build/` via `gh-pages`, and `dist/` is never used. Change `build` to just
  `vite build`; remove the library fields. (Re-confirm `npm run deploy` still emits `build/`.)
- **Derive i18n types:** replace the hand-maintained ~480-line `i18n/types.ts` interface
  with `export type Translations = typeof en;` (import the `en` *value*). Preserves the
  compile-enforced EN/FR parity guarantee while deleting the third place every new string
  must be added.

### Batch F — Viz modularity — **L**
- **`BaseChart.svelte`** owning the repeated option scaffold (`backgroundColor`/`title`/
  `isMobile`), the `{#if filtered}…{:else}<empty>` shell, and `<Chart {init} {options}/>`.
  Removes the `init`/`Chart`/`innerWidth` imports + `isMobile` line from ~11 charts and
  the duplicated empty-state markup. Adopt the kept `createBaseChartOptions`.
- **Unify twins:** SentimentTrendsChart ≈ SubjectivityTrendsChart (~95% identical) and
  SentimentChart ≈ SubjectivityChart (bar/pie) → one `dimension`-parameterized component
  each; ArbiterVerdictChart ≈ ArbiterConfidenceChart (donut) → shared pie config.
- **Aggregation:** move the year-binning inlined in 4 charts into `chartAggregators.ts`
  (`extractYear`, `aggregateByYearAndDimension`, `aggregateByCountryAndYear`).
- **Extract `ChartTypeToggle.svelte`** (bar/pie/area toggle markup+CSS, copied 3×); the
  identical ~73-line `<style>` blocks then vanish (absorbed by BaseChart + the toggle).
- **Theme:** adopt `getVisualMapConfig` in CentralityHeatmap; add `getCountYAxis(isMobile)`
  for the integer-y-axis block repeated 5×; replace the hardcoded `rgba(255,255,255,…)`
  axis-name colors with `chartColors.*`.

### Batch G — Component modularity — **M–L**
- **`PaginationControls.svelte`** — the pagination *markup + CSS shell* (results-info,
  per-page `<select>`, prev/pages/next) is duplicated across ArticleTable, ComparisonTable,
  ArbiterArticleTable (~180 template + ~150 CSS lines); the *logic* is already shared via
  `createPagination`. (Do after C3 so all three consume the composable first.)
- **`Spinner.svelte`** — 6 components reinvent a spinner (markup + `@keyframes spin` +
  3 different durations 0.8/0.9/1.0s). One component fixes both the duplication and the
  inconsistency. (This is the *right* way to dedup the keyframes — via a shared component,
  not global CSS.)
- **`SentimentScaleList`** + a `config/sentimentScales.ts` source of truth for the
  polarity/subjectivity/centrality scale lists hand-written in AnalysisInfo +
  ArbiterMethodology (and mirrored in SentimentBadge + filters).
- **`AnalysisInfo` model registry** — replace ~145 lines of per-model prose (written 2–3×
  with inline FR/EN ternaries) with a `MODELS` config + i18n keys; shrinks the 903-line file.
- **`utils/arbiter.ts`** — extract the verdict/confidence label+badge mappers duplicated in
  ArbiterArticleTable + ArbiterSection.
- **`formatDiff(n)`** in `discrepancy.ts` for the `±N / =` indicator inlined ~9×; optional
  `DiffIndicator.svelte`.
- Optional: `createSort<T>()` composable (sort-toggle pattern repeated in 3 tables);
  narrow `ChartCard`'s 11-value `variant` union to the 4 that actually style anything.

### Batch H — Design-system token consistency — **L (mechanical, do per-folder)**
- The canonical card recipe (`--surface-card` + `--border-subtle` + `--radius` +
  `--elevation-card`) is re-inlined in **23 files / 54 spots** despite `.preset-surface-card`
  existing — apply the preset / compose on top of it.
- Model-brand colors (chatgpt/gemini/mistral) hardcoded in 3 files → `--model-*` tokens +
  a shared `.model-badge`; promote the Mistral red `#f54e42` to `--brand-mistral`.
- Tables use Tailwind `bg-surface-700/800` (a different scale) instead of the `--surface-*`
  tokens / global `.table` styling; reconcile.
- Arbiter chart heights hardcode `350px`/`300px` → `--height-chart-sm/md`.
- Decide the fate of the self-described-legacy `--font-size-2xs` / `--font-size-md`
  (still used 14 / 7×): bless or migrate, then remove the "avoid" comment.
- `.section-title` is defined globally *and* overridden in 4 components — pick one owner.
- Add a `--border-width-accent` token + `.surface-card--accent` utility for the "2px
  colored top rule" recipe repeated 15×.

### Batch I — Docs & memory refresh — **S**
- The "hybrid state / legacy writable / bidirectional sync" narrative in `CLAUDE.md`,
  `MEMORY.md`, and six store-file headers is **false** — there are no legacy writables;
  each store is a single runes accessor. Correct it so the next agent doesn't hunt for a
  sync layer that doesn't exist.
- Fix `app.postcss` → `app.css` references (CLAUDE.md + component comments).
- `app.css` / `chartTheme.ts` reference a `REFACTORING-ROADMAP.md` design doc and "Phase N"
  — verify those pointers resolve; add a short token-vocabulary doc if useful.
- Update `MEMORY.md`: pagination is now shared (only ArbiterArticleTable lags, until C3);
  `getPairModelNames`, `urlState` shim removed.

---

## Suggested order
C3 → C4 (quick, isolated, close out PR #46's intent) → **D** (isolated from the app,
`py_compile`-verifiable, contains the last latent correctness issues) → E → F → G → H → I.
F and G interlock (BaseChart/Spinner/Pagination), so do F before G's PaginationControls.

## Notes / gotchas learned
- `svelte-check` is the real arbiter for the type-tightening batches; its summary line must
  read `0 ERRORS`. Don't trust a green-looking shell exit alone.
- Prefer assertion-guarded edit scripts (exact-byte match, abort on mismatch) for
  multi-site mechanical changes — the editor's whitespace matching proved unreliable on the
  tab-indented `.svelte`/`.ts` blocks here.

---

_Created by the code-quality refactor pass. Batches A, B, C1–C2 landed; C3 onward pending._
