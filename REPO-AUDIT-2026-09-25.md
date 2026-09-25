# Repository audit — 25 September 2026

A follow-up to [the 7 September audit](REPO-AUDIT-2026-09-07.md), whose fifteen findings were implemented on 8 September ([record](REFACTORING-IMPLEMENTATION-2026-09-08.md)). This pass looks for what that one missed or what has appeared since, rather than re-checking its list. The foundation is still sound: no finding here calls for a rewrite, and most are small, local fixes.

The headline items are four defects a user or maintainer would hit without warning. **A browser that blocks site storage gets a blank dashboard.** **The Extremes view spins forever when its file fails to load.** **The next `places-export.py` run will fail CI.** **The pipeline's lock file ships in the Pages artifact.** Behind those sit a measured 20–60× slowdown in the filter hot path, two service-worker regressions left behind by content-addressed releases, and a cross-language shard function that the validator does not check, although the README says it does.

Scope: the Python pipeline and validator, the frontend stores, data layer, utilities and representative components, the service worker, build scripts, CI and tests. No datasets were regenerated and no paid API calls were made. Nothing under `static/data/` was modified.

## Evidence and validation

- The container shipped Node 22 and Python 3.11; the project requires Node ≥ 24 (`engine-strict`) and targets Python 3.12. Checks ran on Node 24.21 (via nvm) and a Python 3.12 venv.
- Frontend lint passed (Prettier, ESLint, store-cycle and design-token checks). Svelte check: **0 errors, 0 warnings** over 749 files. Vitest: **587 tests passed in 34 files**.
- Python: **117 tests passed**; `ruff check` and `ruff format --check` clean.
- Production build and every postbuild step passed: **355 artifact files; 151 KiB HTML-referenced JavaScript gzip**.
- Browser probes against the built artifact (Chromium, service workers blocked, as in the e2e suite): storage-blocked start-up, a failing extremes payload, and a build with a stray pipeline lock file. Each finding below says whether it was browser-, build-, benchmark- or code-confirmed.
- The micro-benchmarks ran in Vitest (jsdom, Svelte dev mode) over 12,349 synthetic articles. Dev mode and jsdom inflate absolute times, so read the ratios, not the milliseconds, and confirm with a production profile before claiming a user-visible speed-up.

## Priorities

P1 = a user or maintainer hits it with no workaround or warning. P2 = worthwhile, with a workaround or no current symptom. P3 = polish and hygiene. Effort: S is local, M crosses several files, L affects data publication.

| #   | Priority | Improvement                                                         | Evidence                              | Effort |
| --- | -------- | ------------------------------------------------------------------- | ------------------------------------- | ------ |
| 1   | P1       | Guard web-storage access; blocked storage renders nothing           | Browser-confirmed                     | S      |
| 2   | P1       | Give the Extremes view an error state; failure spins forever        | Browser-confirmed                     | S      |
| 3   | P1       | Scope `places-export.py` to the processed articles                  | Code-confirmed; corpus drift measured | S      |
| 4   | P1       | Keep pipeline scratch files out of `static/` and the artifact       | Build-confirmed                       | S      |
| 5   | P2       | Stop proxied filter arrays taxing every filter pass                 | Benchmark-confirmed                   | S      |
| 6   | P2       | Repair service-worker precache and evict superseded data releases   | Build- and code-confirmed             | S–M    |
| 7   | P2       | Separate "absent", "failed" and "invalid" in optional-data loaders  | Code-confirmed                        | M      |
| 8   | P2       | Validate justification-shard placement with one shared definition   | Code-confirmed; data checked clean    | S      |
| 9   | P2       | Stop CSV exports inventing dates; make them Excel-safe              | Data-confirmed                        | S      |
| 10  | P2       | One sortable-header component; arbiter tables lack `aria-sort`      | Code-confirmed                        | S–M    |
| 11  | P2       | Count refusals, save on interrupt, fail loudly on a corrupt cache   | Code- and data-confirmed              | S      |
| 12  | P2       | Import arbiter constants instead of redeclaring them                | Code-confirmed                        | S      |
| 13  | P2       | Replace effect-driven load orchestration with one resource layer    | Design; follows from 2 and 7          | M      |
| 14  | P2       | Move untested script logic into `iwac_preprocess`                   | Coverage gap                          | M      |
| 15  | P2       | Put every generated file behind the same stage/validate/lock path   | Consistency gap                       | M      |
| 16  | P3       | Lazy-load the inactive language and the prompt texts                | Build-measured, ~30 KiB gzip          | M      |
| 17  | P3       | Consolidate duplicated statistics helpers                           | Code-confirmed                        | S      |
| 18  | P3       | Make `URL_PARAMS` the real source of parameter names                | Code-confirmed                        | S      |
| 19  | P3       | Correct stale documentation and comments                            | Data- and code-confirmed              | S      |
| 20  | P3       | Small hygiene: `$app/state`, lint-driven `SvelteSet`, logs, tooling | Code-confirmed                        | S      |

## P1 — defects

### 1. A browser that blocks site storage gets a blank dashboard

Locations: `src/lib/i18n/index.ts:34`, `:59`; `src/routes/+layout.svelte:19`; `static/404.html:38`.

`initializeLanguage` reads `localStorage` inside `onMount`, via `initializeURLState`, before `loadData()` runs. A browser with site data blocked (Firefox or Chrome "block all cookies", some embedded and hardened contexts) throws `SecurityError` on the property access. The exception escapes `onMount`, `isInitialized` never becomes true, and nothing loads.

Observed: with `localStorage` access throwing, the page rendered **no heading and no chart**, with one uncaught `The operation is insecure.` With only `sessionStorage` blocked, the layout's SPA-redirect read threw during start-up, the heading rendered twice and no chart had appeared after five seconds. The control run drew two charts. Visits with `?lang=` skip the `getItem`, but `setItem` on any language change throws the same way.

Fix: one tiny `safeStorage` helper (`get`/`set`/`remove`, each in `try/catch`, returning `null` on failure), used in all four places. Language then falls back to the URL or `navigator.language`, as the code already intends.

Acceptance: an e2e case with an init script that makes both storages throw; the default chart renders and the language switcher works.

### 2. The Extremes view spins forever when its file fails

Locations: `src/lib/stores/extreme-analysis.svelte.ts:72`; `src/lib/components/viz/KeywordFrequencyChart.svelte:38`.

A failed load stores `null`, which also means "not loaded yet", and the chart computes `isLoading = uiState.isLoadingExtremeAnalysis || !extremeState.filtered`. A failure therefore reads as loading, permanently. Observed: with `iwac_extreme_analysis_*.json` answering 500, the view showed a loading indicator after eight seconds, with no alert and no retry.

This is the Sept 7 audit's finding 4 (a failed dependency becomes an endless spinner). It was fixed for model datasets, but the fix never reached this store. Minimal fix: keep a `LoadState` per dataset, as `articles.svelte.ts` does, render the shared error and retry block on `status === 'error'`, and derive `isLoading` from the state rather than from `!data`. The shared `isLoadingExtremeAnalysis` boolean has a related race: two overlapping loads clear it when the first finishes. The broader cure is finding 13.

### 3. The next `places-export.py` run will fail CI

Location: `data-preprocess/places-export.py:99`.

PR #167 (`dd00ac2`) found the Hugging Face corpus at **13,397** rows against the panel's **12,349**, and scoped `extreme-analysis.py` to the processed articles. `places-export.py` still calls `load_iwac_records()` unscoped. Its next run will write edges for the ~1,048 unannotated articles. `validate_places` requires every edge to name a base article, so the regenerated file fails `pytest data-preprocess` in CI, and nothing points at why. Its "Mappable articles: x / y" log line already uses the wrong denominator.

Fix: `restrict_to_base_articles(records, get_base_article_ids(), logger)`, the same three lines #167 added. Add a test built on `build_place_lookup` and a post-run corpus, mirroring `TestRestrictToBaseArticles`. That also covers its alias precedence, which has no test today.

### 4. The pipeline's lock file ships in the Pages artifact

Locations: `data-preprocess/data-fetch.py:104`, `:177`; `scripts/check-build-artifact.mjs`.

`publication_lock` creates `static/.iwac-generation.lock`, and the staging directory is `static/iwac-stage-*`. Everything in `static/` is copied into the build. Verified: with the lock file present, `build/sentiment-analysis/.iwac-generation.lock` was published, and `check-build-artifact.mjs` passed. `TemporaryDirectory` cleans up on normal exit, but a killed run leaves the staging directory behind. The next build would then publish a second full copy of the generation's scores and prose, outside `data/`, where `dataRelease()` does not look.

Fix: put the lock and the stage in a sibling of `static/` on the same filesystem, so `os.replace` stays atomic (for example `ma-visualisation-sentiments/.data-staging/`, gitignored). Also make the artifact check reject dot-files and unexpected top-level directories under the deploy path.

## P2 — correctness, performance and resilience

### 5. Proxied filter arrays tax every filter pass

Locations: `src/lib/stores/filters.svelte.ts:15–25`; `src/lib/stores/derivations.ts:62`, `:103`, `:343`; `src/lib/stores/articles.svelte.ts:34`.

The filter arrays are deep `$state`, and `filterArticles` calls `.includes()` on them once per article per criterion. Every call goes through a Proxy trap and a signal read. Benchmark over 12,349 articles, same data, changing only how the criteria arrive:

| Criteria passed as     | ms per filter change |
| ---------------------- | -------------------- |
| Proxied `$state` array | 43–65                |
| `$state.snapshot` copy | 1–2                  |

The arrays are only ever replaced wholesale: no `push` or `splice` anywhere, and no `bind:group`. So `$state.raw` is a drop-in change. Independently, have `filterArticles`, `computeAvailableJournals` and `filterComparisons` convert their criteria to `Set`s on entry. That makes them framework-agnostic and O(1) per lookup. `filterComparisons` also calls `filters.dimensions.includes` three times per row.

The article store has the same shape at larger scale. Iterating a deep-proxied corpus rather than `$state.raw` cost **about 2–3× per filter change in steady state (up to 10× with no country selected) and 20–35× on the first pass**, when every proxy and signal is created. That one is a genuine trade-off, not an oversight: `applyJustifications` relies on deep reactivity to make prose appear in an open modal without re-filtering (`articleRepository.ts:120–126`). The cleaner design keeps article arrays `$state.raw` and holds prose in a separate keyed store (`dataset → id → justification`) that the detail views read. Profile a production build first; the criteria fix above needs no such caution.

### 6. The service worker's precache is dead, and its data cache never shrinks

Locations: `static/sw.js:74`, `:146–155`; `scripts/publish-data-release.mjs`; `scripts/stamp-sw.mjs`.

Since the Sept 8 content-addressed releases, `publish-data-release.mjs` moves every data file under `data/releases/<id>/`. Two service-worker assumptions broke:

- `DATA_FILES_PRIORITY` still precaches `${BASE_PATH}/data/iwac_articles_base.json`. That path no longer exists in the build (verified), so every install spends a request on a 404 and the base file is never precached.
- `iwac-data-v4` is deliberately unversioned, and activation evicts only entries that do not look like data files. `/data/releases/<old-id>/iwac_*.json` still matches `isDataFilePath`, so every release a returning visitor ever loaded stays in Cache Storage indefinitely. That is several MB per release per visitor, growing with every regeneration.

Fix: `stamp-sw.mjs` already runs after `publish-data-release.mjs`, so it can also stamp the release id into `sw.js`. On activate, evict `/data/releases/*` entries that are not the current release, and precache `data/releases/<id>/iwac_articles_base.json`. Extend the existing "offline release isolation" e2e test to assert eviction.

### 7. Optional-data loaders cannot tell "absent" from "broken"

Locations: `src/lib/stores/arbiter.svelte.ts:334`; `src/lib/stores/arbiterV2.svelte.ts:345–355`; `extreme-analysis.svelte.ts`; `places.svelte.ts`.

Both arbiter loaders treat any non-OK response as "file not published". A transient 5xx is therefore cached as a permanent absence for the session, with no retry. A schema-validation failure, which means a genuinely bad published file, ends in `_evaluations = null` and shows the same empty state as a build that omits the file. The v1 files are always published, so for v1 "absent" is never the right reading.

Fix: a 404 means absent, which is cacheable and gets the empty state. Anything else, including a parse or validation error, is an error with retry, and validation errors are logged with the file name. The cleanest way there is finding 13.

### 8. Shard placement is unguarded, and the two shard functions disagree off the happy path

Locations: `data-preprocess/data-fetch.py:60`; `src/lib/domain/sentimentContract.ts:135`; `data-preprocess/validate_generated_data.py:128–150`.

The browser fetches exactly one prose shard, computed by `justificationShard(id)`. The pipeline places rows with a separately written Python `justification_shard(id)`. `validate_core` checks that shards are disjoint and cover the base, but not that each id sits in the shard the browser will fetch. The README nevertheless lists "prose shard placement" among the validator's checks. A misplaced row would silently show "no justification".

The two implementations also diverge on inputs today's data never produces:

| Id      | Python | TypeScript |
| ------- | ------ | ---------- |
| `-5`    | 27     | 5          |
| `1e3`   | FNV    | 8          |
| `0x10`  | FNV    | 16         |
| `1_000` | 8      | FNV        |
| `""`    | FNV    | 0          |
| > 2^53  | modulo | FNV        |

All 98,792 shipped prose rows are placed correctly and every id is a plain decimal. This is a guard gap, not a live bug.

Fix: move the shard function into `iwac_preprocess`, restrict the numeric path to `^\d+$` in both languages, and have `validate_core` assert `shard(id) == shard` for every row. Add a shared fixture file tested from both languages, the pattern `discrepancy-v*-fixtures.json` already follows.

### 9. CSV exports invent dates and garble accents in Excel

Location: `src/lib/utils/csv.ts:24–37`, used by all four export buttons.

- `formatDateForCSV` passes each date through `new Date(...).toISOString()`. Full dates come out unchanged, but the base carries **118 month-only dates**, and `"1995-03"` is exported as `"1995-03-01"`, a precision the source does not have. A year-only date would become `-01-01`. The function never helps, so export the stored value unchanged.
- No UTF-8 BOM is written. Excel on Windows, the likeliest tool for a researcher to double-click the file in, then decodes it as Windows-1252, and `Très négatif` or `Côte d'Ivoire` arrive mangled. Prepend `﻿`.
- There is no guard against formula injection. No current title or justification begins with `= + - @` (titles and one model's prose checked), so this is hardening. Still, LLM prose opening with a hyphenated list would render as `#NAME?`. Prefix such cells with `'`.

Minor: `URL.revokeObjectURL` runs synchronously after `click()`, which some browsers treat as cancelling the download; defer it. The four export buttons each assemble headers and rows by hand; a `toCSV(headers, rows)` helper would remove that duplication. Consider an optional column carrying the canonical French value keys, since translated labels do not join back to the Hugging Face dataset.

### 10. The arbiter tables' sortable headers lack `aria-sort` and a direction

Locations: `src/lib/components/data-display/ArbiterArticleTable.svelte:253–285`; `ArbiterV2ArticleTable.svelte:168–196`.

The Sept 8 fix (finding 6, "sortable headers announce direction") reached `ArticleTable` and `ComparisonTable` only. Both arbiter tables have sort buttons with no `aria-sort` and no `scope="col"`. Their visual cue is `ArrowUpDownIcon`, which marks the sorted column without saying which way, so sighted users cannot tell either. `ArticleTable` meanwhile spells out a nested ternary twice per column, six times over.

Fix: one `SortableHeader.svelte` taking `{label, key, active, direction, onsort}`, emitting `scope`, `aria-sort` and a directional glyph, used by all four tables.

### 11. The paid panel arbiter under-reports refusals and can lose work

Location: `data-preprocess/arbiter-evaluation-v2.py:563`, `:940`, `:1004`.

- `counts["refused"]` is initialised and published as `refused_evaluations`, and `data.ts` types it, but nothing ever increments it. `evaluate_with_arbiter` returns `None` for refusals, truncations, schema errors and transport failures alike, and all of them are counted as `failed`. Return an outcome (`ok | refused | truncated | invalid | error`) and count each one.
- The loop saves every tenth success. A `KeyboardInterrupt` or crash loses up to nine paid verdicts; wrap the loop in `try/finally: publish(...)`.
- `load_cached_evaluations` downgrades a corrupt or unreadable published file to "no cache" with a warning. The next run then draws a **new blind permutation**, and its estimate prices the whole frame again. The confirmation prompt is the only barrier. Since the file is the paid cache, fail loudly instead.
- `metadata.usage` records only the current run, so a resumed run overwrites the published US$17.61 with its own increment (the code comment says so). Accumulate onto the stored figure, or publish both.

## P2 — refactoring and design

### 12. Arbiter constants are redeclared rather than imported

The 8 September extraction moved selection and prompt logic into `iwac_preprocess/arbiter_selection.py` and `arbiter_prompt.py`. Yet `arbiter-evaluation-v2.py:174–205` still redeclares `SPREAD_KEYS`, `DIMENSIONS`, `RULE_*`, `RULES`, `DEFAULT_RULE` and `SUBJECTIVITY_LABELS`. Its argparse `choices` come from the local copies while `qualifies()` reads the module's, so the two can drift silently; `qualifies()` also treats an unknown rule as the union. Import the constants, and have `qualifies` raise on an unknown rule.

The blind labels `a–e` are hand-copied in three places (`types/data.ts:290`, `arbiter_prompt.py:11`, `validate_generated_data.py:44`) with no parity test. Add a test in the style of the existing prompt-parity test (`test_arbiter_evaluation_v2.py:857`) that reads the TypeScript literal.

Do **not** move the labels into `sentiment-v2.json` with a `schemaVersion` bump. The v2 schema version is part of every cache fingerprint, and the validator requires the published arbiter file to match it. A bump would invalidate all 301 paid verdicts and fail validation of the file already published.

### 13. Replace effect-driven loading with one resource layer

Locations: `src/routes/+page.svelte:72–189`; the four stores in finding 7.

Loading is coordinated by seven `$effect`s in the route, and their comments record the bugs this shape has produced: doubled requests, load cascades, and effects re-triggered by the very maps that dedup them. That last one explains the four `prefer-svelte-reactivity` exemptions. There are also four hand-built load, dedup and cache implementations: articles (typed `LoadState`), extremes (`null` doubling as both idle and error), places (a loading/error/payload triple) and the arbiters (cached-null plus an in-flight map). One sibling call, `loadArbiterV2Evaluations` at line 104, lacks the `untrack` its neighbours use.

Proposal: a small `createResource<K, T>(fetcher)` that owns dedup, `LoadState` per key, retry and absent-versus-error, with plain internal maps. Then one `$derived` computes the resources the current view needs from `(view, generation, dataset, pair, compare)`, and one effect calls `ensure()` on them inside `untrack`. That fixes findings 2 and 7 by construction and removes most of the orchestration comments. Keep articles' in-flight semantics and the data-saver-aware prefetch.

### 14. Script logic that tests cannot import

`data-fetch.py` (`justification_shard`, `assert_base_matches`, the stage → validate → publish sequence), `extreme-analysis.py` (`analyze_extreme_keywords`) and `places-export.py` (`build_place_lookup`, edge building) have no unit tests. Their hyphenated names make them unimportable except through `importlib` loading, the route the arbiter tests take. The checked-in-data tests validate outputs, not the code that would produce the next ones. Findings 3 and 8 are exactly the kind of regression this leaves open.

Apply the arbiter pattern: move the pure functions into `iwac_preprocess` (`shards.py`, `extremes.py`, `places.py`), keep the scripts as thin CLIs, and test the functions. While there, have the validator take a `data_dir` parameter. At present `data-fetch.py:245–252` redirects it by reassigning the module global `validator.DATA_DIR` in a `try/finally`.

### 15. Only one of four writers goes through the safe publication path

`data-fetch.py` stages, validates, holds the writer lock and promotes through a recoverable journal. `extreme-analysis.py`, `places-export.py` and `arbiter-evaluation-v2.py` write straight into `static/data/`: no lock, no staged validation, and no journal. Each file is atomic, but a concurrent run, or a build during a multi-file extremes write, can mix sets. The extremes files also carry no `schema_version` or `analysis_version`, which every other generated file has and the validator checks.

Route all writers through `publish_generation`. The pieces exist; this is mainly moving the calls.

## P3 — performance, duplication, hygiene

### 16. About a fifth of the initial JavaScript is text the reader may never see

The 151 KiB of HTML-referenced JavaScript includes both language catalogues, `en.ts` and `fr.ts` (~18 and ~20 KiB gzip), and `prompts.ts` (~11 KiB), which `AnalysisInfo` imports statically but only shows behind a disclosure. Loading the inactive catalogue on first switch, and the prompts when the disclosure opens, saves roughly 30 KiB gzip on every cold load. The catalogue switch needs care, because `t` is a synchronous derived store; keep the default language bundled.

### 17. Duplicated statistics helpers

- `newspaperRanking.ts:123–131` and `consensus.ts:425–434` compute the same mean, sample SD and `1.96 × SE` interval line for line.
- `correlation.ts:141–166` re-implements `consensus.ts:484`'s `pearson` inline, although Spearman's ρ is Pearson on ranks.
- `countExcludedNewspapers` and `countExcludedTitles` share a shape.

A `utils/stats.ts` (`mean`, `sampleSD`, `meanCI95`, `median`, `pearson`) removes the copies. A methodological nicety while there: at the 30-article floor, the normal `1.96` understates the t-based interval by about 4% (t₀.₉₇₅,₂₉ ≈ 2.045).

### 18. `URL_PARAMS` covers about half the real parameters

`stores/url/constants.ts:28` lists 14 names. `dimensions`, `excludeNA`, `scope`, `dimension`, `declined`, `arbiterArticleId`, `chartState` and `urlVersion` are string literals in the parser, the builder and the view-option stores. A typo would break round-tripping (the URL tests would likely catch it, but the "centralized" module misleads). The README's parameter list stops at the Sept 7 set. `docs/citable-urls.md` is the fuller reference, so link to it there.

### 19. Stale documentation and comments

- `sentiment-v2.json:4` says Qwen is "**153** articles short". The data carries 251 null polarity rows, less the 51 no model annotates, which is **200**, the figure README and CLAUDE.md give. The description is not part of any fingerprint, so correcting it is safe.
- README says the validator checks "prose shard placement"; it does not (finding 8).
- Header comments claiming "legacy store compatibility" (`articles`, `extreme-analysis` and `filters` stores) and "(transitional) legacy derived stores" (`derivations.ts`) describe a layer that no longer exists. `iwac_preprocess/__init__.py` still calls itself the "v1" pipeline. `pagination.svelte.ts` lists two users, but four tables use it. `articleRepository.ts` describes a single `iwac_justifications_<model>.json`, but the prose is sharded.

### 20. Small hygiene items

- `$app/stores` is deprecated since SvelteKit 2.12. Its one use (`url/actions.svelte.ts:7`, `get(page)`) can read `page` from `$app/state`.
- `SvelteSet` is used for non-reactive, local de-duplication: `articleRepository.ts:155` (12k ids), `articles.svelte.ts:225`, and the URL parser and builder. That pays reactive overhead to satisfy `prefer-svelte-reactivity`. Use `Set` with a scoped disable, or narrow the rule.
- `console.log` in shipped code: the prefetch queue, the arbiter loaders and PWAManager. Gate it on `dev`.
- `pyproject.toml` has no `requires-python = ">=3.12"`. The requirements use `~=` pins with no hashes, although the header says a re-run must reproduce published figures. `uv pip compile --generate-hashes` would make that literal.
- CI reinstalls Chromium on every run; cache `~/.cache/ms-playwright` keyed on the Playwright version. The job also runs `check` before `lint`, the reverse of the verify skill's cheapest-first order.
- `sentimentContract.ts` asserts that the two generations share scales and shard counts, but not `significantDimensionGap` or `maximumTotal`, which it reads from v1 for both. The v2 cross-language fixtures would catch a divergence today; an import-time invariant would make it explicit.

## Recommended sequence

1. **Defects, in one PR:** findings 1, 2 (minimal version), 3, 4, 9, 11 and the contract-text fix in 19. None needs a data regeneration. Finding 3 only matters at the next places export, which is the reason to land it first.
2. **Measured performance:** finding 5 (criteria and filter arrays first, article store only after a production profile), then finding 6.
3. **Loading architecture:** findings 13 and 7 together, retiring the minimal fix for 2.
4. **Pipeline hardening:** findings 8, 12, 14 and 15. Keep the v1 fingerprint fixture and every frozen file byte-stable.
5. **Hygiene:** findings 10, 16, 17, 18 and the rest of 19–20, opportunistically.

## Checked and fine

Recorded so the next pass does not repeat them.

- **Prompt parity.** The arbiter v2 system instruction shown in the methodology is asserted equal to the one sent (`test_arbiter_evaluation_v2.py:857`), and the v2 sentiment prompt is hash-pinned to the run's recorded fingerprint (`prompts.test.ts`).
- **Type hygiene.** No `any`, no `@ts-ignore`, and six ESLint disables, each with a stated reason.
- **Shipped shard placement.** All 98,792 prose rows are in the shard both functions compute.
- **Localisation.** No accessible label has regressed to hard-coded English. `Pagination` is the same word in French.
- **Contract text.** The contract's `description` fields feed no fingerprint, manifest or release hash.
- **Discrepancy thresholds.** A v2 threshold change would fail the cross-language fixtures (finding 20 only asks for it to be explicit).
- **`.impeccable/`** is still read by the design hook; it is not dead tooling.
- **Strengths from the last audit that still hold.** Versioned contracts with cross-language fixtures; frozen v1 data; the separate pairwise and panel arbiters; honest Qwen-coverage handling; score/prose splitting with on-demand shards; content-addressed releases and journaled publication; and the growth of browser coverage from 5 to 36 tests.
