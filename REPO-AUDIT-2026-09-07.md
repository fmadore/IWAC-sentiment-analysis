# Repository audit — 7 September 2026

The repository has a sound foundation and warrants targeted refactoring rather than a rewrite. The highest-value work is restoring reproducible navigation, making secondary-data failures recoverable, and making the charts easier to interrogate. Preserve the existing editorial identity, generation contracts, and frozen v1 data.

Scope: Svelte application shell, URL and data stores, chart/statistical utilities, shared controls, representative tables and methodology components, Python source loading/export/cache code, generated-data validation, service worker, build tooling, and CI. This is an audit, not an implementation change. No datasets were regenerated and no paid API calls were made.

## Evidence and validation

- Frontend lint passed, including formatting, ESLint, store-cycle detection, and design-token checks.
- Svelte check: **0 errors, 0 warnings**.
- Vitest: **492 tests passed in 27 files**.
- Python: **92 tests passed**; Ruff lint and formatting passed.
- Playwright: **all 5 existing browser tests passed** against the production preview. The first attempt could not launch Chromium inside the sandbox (`spawn EPERM`); the authorized rerun completed successfully.
- Production build and postbuild checks passed: **348 artifact files; 137 KiB initial JavaScript gzip**, as measured by the existing budget script. That measurement is narrower than the full JavaScript loaded to render the first view; see finding 11.
- Browser inspection covered the default chart surface at 1440×1000 and 390×844, French interface text, comparison-table semantics, and same-page navigation. Back-navigation mismatch was directly observed. Visual conclusions concern these inspected surfaces, not every chart and interaction.
- Impeccable's engine was unavailable. Its audit guidance and the repository's PRODUCT.md/DESIGN.md were read; the repository's own token detector ran successfully. Scores below are provisional engineering assessments, not accessibility certification.

| UI audit dimension | Score / 4 | Assessment |
|---|---:|---|
| Accessibility | 2 | Good shared primitives, but default charts lack equivalent data tables and comparison rows replace row semantics. |
| Performance | 3 | Split score/prose data and lazy views are strong; avoidable aggregation and eager chart loading remain. |
| Responsive design | 3 | Rails become drawers; the dense newspaper legend is difficult on mobile and tooltip bounds need hardening. |
| Theming | 4 | Coherent dark-only design, centralized tokens, chart-palette parity tests. A light theme is not required by the brief. |
| Implementation integrity | 3 | Product-specific system with enforced conventions; navigation, sharing, and error-state gaps remain. |
| **Total** | **15 / 20** | **Good foundation; address the functional and accessibility gaps first.** |

## Priorities

P1 = high-impact correctness, reproducibility, recovery, or accessibility issue. P2 = worthwhile improvement with a workaround. P3 = optional polish. Effort is relative: S is a localized change, M crosses several components/tests, L affects data publication or application architecture. No P0 issue was established.

| # | Priority | Improvement | Evidence | Effort |
|---|---|---|---|---|
| 1 | P1 | Restore state on browser Back/Forward | Browser-confirmed defect | M |
| 2 | P1 | Serialize analysis settings that change results | Code-confirmed omission | M |
| 3 | P1 | Pin and accurately record upstream revisions | Code-confirmed defect | M |
| 4 | P1 | Model secondary-dataset errors explicitly | Code-confirmed missing UI paths | M |
| 5 | P1 | Extend chart data alternatives to primary views | Code and browser-confirmed gap | M |
| 6 | P2 | Preserve table-row semantics | Code and accessibility-tree evidence | S |
| 7 | P2 | Make newspaper breakdown an explicit chart mode | Desktop/mobile visual evidence | M |
| 8 | P2 | Harden tooltip interaction and bounds | Code-confirmed limitations; overflow needs dedicated reproduction | S |
| 9 | P2 | Complete French accessibility and explanatory copy | Code and browser-confirmed gap | S |
| 10 | P2 | Separate data aggregation from chart presentation | Code-confirmed repeated work; no timing claim | M |
| 11 | P2 | Make chart imports truly demand-driven and budget them | Code-confirmed loading and measurement gap | M |
| 12 | P2 | Split modules along existing responsibility boundaries | Maintenance opportunity | M |
| 13 | P2 | Guard generated releases and cached data as a coherent set | Resilience opportunity, not observed corruption | L |
| 14 | P2 | Expand interaction and accessibility regression coverage | Code-confirmed coverage gap | M |
| 15 | P3 | Reduce repeated chart chrome and improve information hierarchy | Visual refinement | S |

## Detailed findings

### 1. Browser history changes the URL without restoring the view

Locations: `ma-visualisation-sentiments/src/lib/stores/url/actions.svelte.ts:156`, `:181`; `src/routes/+page.svelte:194`.

Observed sequence: start on Graphiques, select Tendances, press browser Back. The URL returned to `?view=charts&lang=fr&dataset=luna`, but the h1 still read **Tendances**. Initialization reads URL state once; outgoing changes call `goto`, but no corresponding navigation subscription re-applies subsequent URL changes to the stores.

Refactor URL synchronization into one lifecycle owner. Apply a complete normalized state on navigation, including resetting values absent from the URL; the existing `applyURLState` is a patch-style setter and cannot safely restore cleared filters by itself. Suppress write-back while restoring, and avoid navigating when the canonical query already matches.

Acceptance: change view, country, model pair, and article selection; Back/Forward must restore both controls and results without introducing extra history entries. Test removing a filter as well as adding it.

### 2. Shared URLs omit settings that materially change the analysis

Locations: `src/lib/stores/url/types.ts:14`, `url/state.svelte.ts:73`, `stores/filters.svelte.ts:20`, `components/data-display/AgreementView.svelte:51`, `ConsensusSection.svelte:55`.

The URL persists discrepancy bounds, but not selected discrepancy dimensions or `excludeNonApplicable`. Agreement scope, selected dimension, and inclusion of declined ratings are local state. Consequently, copying a link after changing these settings can give another researcher different rows or a different chart. This conflicts with PRODUCT.md's reproducible-state objective.

Add explicit, validated URL fields for settings that affect results. Keep transient presentation details out unless useful, but serialize analytical choices. Retain backward-compatible defaults. Consider including the data-release identity in a downloadable analysis-context sidecar so a future release can be distinguished from today's data.

Acceptance: configure a nondefault comparison and panel-agreement state, open each copied URL in a fresh context, and compare visible settings, sample sizes, and exported values.

### 3. The fallback can report a revision it did not actually load

Location: `data-preprocess/iwac_preprocess/source.py:84–109`.

Neither `hf_hub_download` nor `load_dataset` receives a revision. The fallback nevertheless sets `_last_source_revision` from `IWAC_HF_REVISION`. If that environment variable names an older commit, the data can come from current upstream while provenance claims the older revision. Without the variable, fallback provenance becomes null. Loading related subsets separately also allows upstream to advance between requests.

Accept a revision as an input, resolve it once per repository, pass it to both loading paths, and report the revision actually used. Return a small source-result object containing data, repository, and revision instead of relying on mutable module globals. Keep the public and private mirror revisions distinct. Narrow the broad fallback exception so malformed Parquet or a transformation problem does not silently become a different loading path.

Acceptance: mock both download paths and assert they receive the same pinned revision; test that the emitted manifest and arbiter fingerprint match the resolved revision. Preserve existing v1 fingerprint fixtures.

### 4. A secondary model failure becomes endless loading or an empty comparison

Locations: `components/data-display/AgreementView.svelte:78`, `:99`; `ComparisonView.svelte:96`, `:149`; `stores/comparison.svelte.ts:64`; `routes/+page.svelte` load effects.

Agreement requires all generation datasets before rendering and shows `LoadingState` whenever readiness is false. It does not inspect failed model load states. Comparison clears its loading flag in `finally` and can then display “no discrepancies” when required pair data failed. The root error card checks only the selected dataset, so it cannot represent every failed dependency.

Derive an aggregate load state for the datasets each view actually needs: idle/loading/ready/error with failed model IDs and a retry action. Pair scope should require the selected pair, while panel scope requires the panel. Continue background prefetch separately. Use the existing typed `LoadState` pattern, not another boolean layer.

Acceptance: fail a nonselected pair member and a third panel member; show a localized error and successful retry rather than an empty result or permanent spinner. Also test rapid pair changes during a pending request.

### 5. Primary charts do not expose equivalent inspectable data

Locations: `components/viz/DimensionDistributionChart.svelte:254`, `SentimentTrendsChart.svelte`, `SubjectivityTrendsChart.svelte`; `components/common/ChartDataTable.svelte`.

The default polarity/subjectivity charts expose descriptive image labels, but those labels do not convey the values. The existing data-table component is currently used by only four chart components: AgreementMatrix, HijriSeasonalityChart, NewspaperDisagreementChart, and NewspaperRankingChart. The default charts and trends lack it.

Extend the existing collapsible table/export pattern to the primary charts first, then inventory the remaining visualizations. Derive the canvas and table from the same aggregate object so values cannot drift. Include units, denominators, excluded rows, and machine-readable CSV values. An article-level export is not an equivalent replacement for the aggregate shown in a chart.

Acceptance: a keyboard user can reach and read every plotted value without interacting with canvas tooltips; table/CSV values match the chart under filters and both languages.

### 6. Comparison table rows are exposed as buttons rather than rows

Location: `components/data-display/ComparisonTable.svelte:229–241`.

The desktop `<tr>` has `role="button"`. Browser inspection consequently exposes data-row entries as buttons with cell descendants. The row is visually correct, but the semantic relationship needed for table navigation is weakened.

Keep the native `<tr>` role and put a real, localized details button or link in the title cell. Pointer activation of the row can remain as a convenience. Apply the same review to other interactive tables, and ensure sort headers announce direction.

Acceptance: accessibility-tree data rows remain rows, columns retain associations, and the details action works with keyboard Enter/Space as appropriate to the chosen element.

### 7. The default stacked chart asks readers to distinguish 58 newspapers

Locations: `components/viz/DimensionDistributionChart.svelte:151–162`; `utils/chartTheme.ts:105`.

The default bar chart creates one series per newspaper and cycles a 12-color palette. In the inspected full-corpus chart the legend required **11 pages on desktop and 26 on mobile**. Several newspapers necessarily reuse colors; users cannot reliably identify a segment from its color. Switching to pie also changes the grouping semantics from newspaper breakdown to global distribution, which the shape-only labels do not explain.

Make global distribution the default, using the existing semantic polarity/subjectivity colors and direct values. Offer “By newspaper” as a separate analytical mode, with explicit journal selection or small multiples. If offering Top N + Other, make N and the grouping visible and preserve access to every newspaper in the data table. Separate grouping from chart-shape controls.

Acceptance: the mobile default communicates the distribution without paging a legend; grouping choices and denominators remain explicit. Compare this with the incumbent chart before choosing a final layout.

### 8. The shared rich tooltip needs a stronger interaction contract

Locations: `components/common/InfoTooltip.svelte:33`, `:55–56`, `:94–95`; `app.css:608`; `components/filters/DiscrepancyFilter.svelte:153`.

The trigger is 16×16 CSS pixels. The panel has a 320px minimum width and no viewport collision handling, and visibility is CSS hover/focus-driven without Escape or click-to-toggle state. At narrow widths, its placement depends on how far the trigger sits from the left edge. Overflow was not conclusively reproduced during this audit and should be verified before reporting a specific clipped viewport.

Keep the visible icon small but enlarge its interactive area. Add explicit open state, Escape dismissal, touch activation, and viewport-aware positioning. For substantial explanatory content, an inline disclosure can be simpler than a floating tooltip. Validate pointer travel between trigger and panel as well as keyboard focus.

### 9. French localization stops short of accessible labels and explanations

Examples: `layout/SidebarNav.svelte:57`, `:68`; `common/FullScreenModal.svelte:92`, `:119`; `common/SearchInput.svelte:66`; `data-display/ComparisonTable.svelte:241`; `ComparisonStats.svelte`; `filters/DiscrepancyFilter.svelte`.

The French browser view still announced “Main navigation”, “Collapse sidebar”, “Change language”, English comparison-row actions, and English statistical explanations. This is especially noticeable to a screen-reader user even when the visible labels are French.

Move accessible labels and interpolated explanations into the existing typed translations. Audit `aria-label`, `title`, control defaults, and fallback messages together. Test representative French accessible names rather than only translation-key parity.

### 10. Aggregation is coupled to presentation changes and repeated across consumers

Locations: `components/viz/DimensionDistributionChart.svelte:81–92`; `stores/agreement.svelte.ts:86–101`, `:186`; `ConsensusSection.svelte:65–69`; `viz/DirectionalDissentChart.svelte:58`.

Distribution aggregation runs inside the chart-options derivation, alongside language, breakpoint, and chart-type dependencies. Presentation changes can therefore reaggregate the corpus. Pair agreement builds a confusion matrix and separately scans the same label pairs for each of two kappas. Marginals repeat corpus filtering per dimension. The consensus parent computes a dissent profile while the directional chart computes profiles for all dimensions, including the same one.

Extract data-only derived aggregates; let chart options depend on those plus presentation state. Build pair contingency counts once and derive both kappas and matrix views from them. Share filtered corpus slices and dimension profiles where there are actual duplicate consumers. Benchmark before adding a worker or normalized frontend entity layer.

Important non-finding: `consensusRows.current` is currently consumed once through a parent `$derived` and passed to children. It is not rebuilding the join separately in every chart. Do not refactor on that mistaken premise.

Acceptance: unchanged statistical fixtures; instrument aggregate invocations so a language or size change does not rescan article rows. Measure filter-to-render latency on the five-model panel before claiming a speedup.

### 11. Dynamic imports and the bundle budget do not fully capture first-view cost

Locations: `components/layout/ViewContent.svelte:38–46`, `:235`; `components/views/ChartViews.svelte:2–10`; `utils/echartsSetup.ts`; `scripts/check-build-artifact.mjs:51`.

`const chartViews = import(...)` starts loading when ViewContent is instantiated, even for a table, map, or arbiter visit. ChartViews statically imports all seven chart-view families. The common ECharts initializer registers chart types used only by specialized views. The build budget counts JS directly referenced by HTML, not all subsequent imports needed for the default view. Its 137 KiB result must not be described as the complete first-view transfer.

Use a memoized chart loader invoked only for relevant views, then consider splitting heavier chart families if measured savings justify it. Preserve the existing MapLibre split. Add a production cold-load budget for default charts and direct table/map links, including transitive imports and separate data transfer. Add localized error/reload handling to await blocks; the map promise should not permanently memoize a rejected load without a recovery path.

Acceptance: a direct table link does not request ChartViews; expected map isolation remains; failed chunks show recovery; measure requests against the built app.

### 12. Split the largest modules by responsibility, not by arbitrary line count

Useful seams:

- `AnalysisInfo.svelte` (~40 KB): separate the bilingual model/methodology registry, generation-specific methodology body, and prompt disclosure. It embeds content alongside state and layout while other translations live in `i18n/`.
- `articles.svelte.ts` (~20 KB): separate fetch/parse/join functions, justification-shard loading, and prefetch scheduling from reactive state. Preserve in-flight deduplication and the intentional plain Maps used inside effects.
- `arbiter-evaluation-v2.py` (~42 KB): separate candidate selection, prompt/response conversion, provider execution, and CLI orchestration behind pure boundaries. Retain its distinct panel semantics and the frozen v1 cache shape.
- `app.css` (~56 KB): separate token definitions, foundation rules, and genuinely shared component styles while keeping cascade order explicit. Scope feature-only selectors in their components. Prior class collisions make order and selector ownership more important than merely reducing file length.

Do not create a generic chart framework or universal arbiter abstraction. Existing dimension wrappers, generation-specific views, and pure statistical functions are productive abstractions already. Extract one boundary per change and retain public APIs initially.

### 13. Per-file atomic writes do not make a whole generation atomic

Locations: `data-preprocess/iwac_preprocess/serialization.py:32`, `:81`; `data-preprocess/data-fetch.py:164–207`; `ma-visualisation-sentiments/static/sw.js:25`, `:254`.

The Python writer safely replaces individual files and publishes a manifest last, which is good. An interrupted run can still leave a mixed set of files until validation rejects it. The browser loads fixed filenames and the service worker falls back to a persistent data cache file by file; the frontend does not use release manifests to ensure one coherent release. This is a future regeneration/offline resilience risk, not evidence that today's checked-in files are inconsistent.

Generate into a staging directory, validate the entire set, and promote it as a release. For stronger browser reproducibility, use immutable release paths or release-scoped cache keys backed by a small manifest. Preserve v1 filenames/bytes where required and distinguish corpus metadata from current annotations. Avoid asking the browser to download all prose merely to validate a release.

Acceptance: interrupt an export halfway and verify the published set remains usable; simulate an old cache plus a new release with one failed fetch and ensure the app does not silently mix revisions.

### 14. The test suite is strong on pure logic and thin on real research workflows

Locations: `e2e/app.spec.ts`, `playwright.config.ts:24–26`.

There are five browser tests. They cover initial URLs, comparison geometry, a resized model picker, initial corpus failure, and serious/critical axe findings on one archived English chart page. They do not cover Back/Forward, nondefault analytical-state sharing, French accessible names, secondary model failures, modal/drawer focus return, or offline updates. Service workers are blocked, so that suite cannot exercise the cache behavior described above.

Add focused scenarios around findings 1–9, and a separate small service-worker-enabled suite. Scan representative v2 comparison/agreement views and both languages. Include keyboard access to chart alternatives and 390px/1024px layouts. Keep the existing two-worker setting; there is no reason to discard the documented contention lessons. Review lower-severity axe results instead of silently treating their exclusion as full accessibility coverage.

### 15. Let the main question and chart carry more of the visual hierarchy

Locations: `components/layout/ViewContent.svelte`, `components/viz/DimensionDistributionChart.svelte:237`, `components/ui/DatasetBadge.svelte`, `routes/+page.svelte`.

The inspected page repeats the view name as eyebrow and heading, repeats the selected model in the header, methodology line, and each chart badge, and reserves a full-width methodology row above the chart. On mobile, the small provider logo survives after its text disappears, giving it little informational value. These details push the plot down while adding limited analytical context.

Keep the serif headings, restrained amber, dark surfaces, and dense research workflow. Test one concise view heading, a readable sample/coverage line, and a compact methodology disclosure near it. Repeat model labels only where needed for independently exported or compared charts; replace a standalone mobile logo with meaningful text or remove the redundant badge. Group navigation by research activity only if a usability check supports it; preserve stable view IDs and deep links.

## Recommended sequence

1. **Correctness and reproducibility:** findings 1–4, with browser/source-loading regression tests. This is the highest-return batch.
2. **Accessible investigation:** findings 5–9. Reuse ChartDataTable and existing translation/control primitives. Relevant design passes: `/impeccable harden`, `/impeccable adapt`, `/impeccable clarify`.
3. **Measured performance and modularity:** findings 10–12. Capture a production baseline first; preserve numerical fixtures and lazy map loading.
4. **Release resilience:** finding 13 in its own change because it affects data publication and cache compatibility.
5. **Verification and visual finish:** extend finding 14 alongside each batch, then apply finding 15 and `/impeccable polish`. The existing IMPECCABLE-ROADMAP.md should be triaged against these findings rather than executed wholesale.

## Keep these strengths

- Shared, versioned Python/TypeScript contracts and cross-language fixtures.
- Frozen archive data and intentional separation of pairwise and panel arbiters.
- Correctly documented Qwen coverage limitations; do not “repair” declined annotations or pool generations.
- Base metadata separated from scores, with justification shards loaded on demand.
- In-flight deduplication, retryable base loading, bounded prose concurrency, and data-saver-aware prefetch.
- Pure statistical functions and meaningful tests for numerical and serialization behavior.
- Centralized chart theme, semantic scales, token enforcement, and palette-parity tests.
- Shared Drawer, pagination, dimension-chart wrappers, and existing aggregate data tables.
- Build artifact checks, checked-in-data validation, and dependency review in CI.

Avoid a framework migration, cosmetic dependency upgrades, mandatory light mode, blanket virtualization, or a Web Worker rewrite without evidence. The inspected issues have much more direct remedies.
