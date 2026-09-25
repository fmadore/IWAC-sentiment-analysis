# Audit follow-up — implementation record, 25 September 2026

Implemented the twenty findings of [the 25 September audit](REPO-AUDIT-2026-09-25.md), in five commits on `claude/repo-refactoring-review-7prulj`. One item was deliberately left for a decision (see _Not done_). No dataset was regenerated, no provider API was called, and no file under `static/data/` changed: the frozen v1 files and the published v2 files keep their bytes, and the data release id is unchanged (`ef80115593289e3e85f9e0f9`).

## Changes by finding

| Finding                      | Implementation                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Blocked storage           | `utils/safeStorage.ts` never throws. The i18n store, the layout's SPA-redirect restore and `404.html` use it. When `sessionStorage` is blocked, `404.html` carries the query in the URL instead, so visitors are no longer stranded on "Redirecting…". New e2e test with both storages throwing.                                                       |
| 2. Extremes spinner          | The extremes store runs on the shared resource (finding 7). A failure is an `error` with Retry; only `idle` and `loading` spin. New e2e test.                                                                                                                                                                                                          |
| 3. Unscoped places export    | `places-export.py` scopes to the base articles through `restrict_to_base_articles`, and its logic moved to `iwac_preprocess/places.py`. A test reproduces the post-run corpus and asserts the extra article is left off the map.                                                                                                                       |
| 4. Scratch files in the site | The writer lock and stages live in `ma-visualisation-sentiments/.data-staging/` (gitignored). `check-build-artifact.mjs` rejects hidden files, unknown top-level directories and data outside the release; each rejection was exercised by hand.                                                                                                       |
| 5. Filter hot path           | The filter arrays, the corpora, the selected article and comparison, and the dataset load states are `$state.raw`. Derivations turn criteria into `Set`s. Prose written in place bumps a version signal, which `justificationsOf()` reads.                                                                                                             |
| 6. Service-worker cache      | `stamp-sw.mjs` stamps the data release. The worker precaches the release-scoped base file and evicts every data entry outside the current release. New e2e test seeds a stale release and a flat entry.                                                                                                                                                |
| 7. Absent vs failed          | `data/resource.svelte.ts`: `idle → loading → ready / absent (404) / error`, deduplicated in flight. `ensure` never retries an error; `retry` is explicit. Both arbiters, extremes, the map payload and the basemap use it, and each view shows `ResourceLoadError` with Retry. The basemap had the same swallowed-failure spinner as extremes.         |
| 8. Shard contract            | One `justification_shard` in `iwac_preprocess/shards.py` and a matching TypeScript function, both held to `justification-shard-fixtures.json` (16 cases). Canonical decimal ids take an exact digit-wise remainder; everything else is FNV-1a. `validate_core` checks every row's placement.                                                           |
| 9. CSV exports               | Dates are exported as stored. Files carry a UTF-8 BOM, text cells are guarded against formula injection (numbers are exempt), and object URLs are revoked on a later task. One `toCSV` helper serves all five exporters.                                                                                                                               |
| 10. Sortable headers         | `SortableHeader.svelte` provides `scope`, `aria-sort` and a direction glyph for all four tables, and `nextSort()` fixes the comparison table opening a new column the wrong way round. Computed styles of all 24 desktop header cells were compared before and after; only the intended attributes and glyph changed.                                  |
| 11. Paid arbiter safety      | Outcome enum (refusals counted as `refused_evaluations`); `finally` publish on interrupt; an unreadable cache is refused (exit 2); `metadata.usage` resumes from the published record. A no-op run had been wiping the recorded US$17.61.                                                                                                              |
| 12. Arbiter constants        | The script imports rules, dimensions, spread keys and blind labels, and `qualifies()` refuses an unknown rule. The validator reuses `BLIND_LABELS`, and a test holds the browser's `ARBITER_BLIND_LABELS` to them.                                                                                                                                     |
| 13. Load orchestration       | A pure `dataRequirements()` feeds one effect in `+page.svelte`, replacing five load effects and three views' mount-time loads and pair-watching effect roots. The map still loads itself, to stay in its lazy chunk. New e2e test tours five views and asserts no data file is fetched twice.                                                          |
| 14. Untested script logic    | `iwac_preprocess/extremes.py`, `places.py` and `shards.py`, with tests; the scripts are thin CLIs. The validator takes `data_dir`.                                                                                                                                                                                                                     |
| 15. One publication path     | `publish_json_files` stages, validates and promotes under the writer lock for extremes, places, the basemap and the panel arbiter (which waits for the lock instead of failing). Extremes payloads are stamped with schema and analysis version from the next run; the validator checks the stamp where present, since the frozen v1 files predate it. |
| 16. First-load weight        | Prompt texts load when a prompt modal first opens; the English catalogue loads when English is first needed. French, the default and prerendered language, stays bundled.                                                                                                                                                                              |
| 17. Statistics               | `utils/stats.ts` (`summarizeMean`, `median`, `pearson`, `countGroupsBelow`); Spearman's rho is `pearson` over ranks. Figures are unchanged.                                                                                                                                                                                                            |
| 18. URL names                | `URL_PARAMS` declares every non-view-option parameter; the parser and builder use no literals. README links the full list.                                                                                                                                                                                                                             |
| 19. Stale text               | The v2 contract now says 200 (not 153) Qwen articles. The README validator claim is now true (finding 8). Store, derivation, package, pagination and repository comments are corrected.                                                                                                                                                                |
| 20. Hygiene                  | `$app/state`; `unique()` instead of lint-driven `SvelteSet`/`SvelteURLSearchParams`; development-only logs; an invariant on the v1-read thresholds; CI lint-before-check and a Playwright cache; `requires-python >= 3.12`.                                                                                                                            |

Also found and fixed while implementing:

- `uiState.isLoadingComparison` was written but never read, and nothing read `uiState.isLoading`. Both are removed, along with the flags the resources replace.
- Three views requested prose inside effects without `untrack`, so they re-ran on every dataset load-state change.
- The raw-state change initially stopped prose appearing in the article modal. `+page.svelte` held the article in deep state, whose proxy cached the empty prose. The new e2e test caught it before commit, and `CLAUDE.md` now records the gotcha.

## Measurements

Filter-change latency in the production build is the time from a country-chip click to the next paint, measured in headless Chromium at 1440×1000 over eight clicks. The ranges below span two runs each.

| View       | Before     | After     |
| ---------- | ---------- | --------- |
| Charts     | 82–153 ms  | 30–46 ms  |
| Comparison | 168–241 ms | 43–95 ms  |
| Table      | 92–250 ms  | 41–142 ms |

About a third of the gain came from the raw filter arrays alone (charts 54–97 ms, comparison 104–151 ms); the rest came from the raw corpora.

JavaScript, from the build check and the e2e budget test:

| Measure                          | Before    | After     |
| -------------------------------- | --------- | --------- |
| HTML-referenced initial JS, gzip | 151 KiB   | 127 KiB   |
| Cold charts load (`lang=en`)     | 410.8 KiB | 402.7 KiB |
| Cold table load (`lang=en`)      | 156.9 KiB | 148.8 KiB |
| Cold map load (`lang=en`)        | 530.8 KiB | 522.7 KiB |

The cold loads use `lang=en`, so they still fetch the English catalogue; a French visit saves it as well.

## Validation

- Frontend: Prettier, ESLint, store-cycle and design-token checks pass. svelte-check reports **0 errors, 0 warnings** over 765 files. Vitest: **637 tests in 40 files** (from 587 in 34).
- Build: every postbuild step passes, and the stricter artifact check reports 357 files.
- Playwright: **44 tests pass** (from 36), with the configured two workers, against the final artifact. New tests cover blocked storage, the failed extremes payload, a 503 on the panel arbiter, a failed basemap, the view tour without duplicate fetches, prose arriving after a detail opens, service-worker release eviction, and sort announcements.
- Python: `ruff check` and `ruff format --check` are clean, `compileall` passes, and pytest runs **164 tests** (from 117). `validate_generated_data.py` passes for v1 and v2, now including shard placement.
- Visual checks were limited to computed geometry and styles. Automated browsers do not composite canvas, so the charts and map were not judged by eye; a real-browser look at the tables, the error states and a language switch is still worthwhile.

## Not done

- **Hashed Python requirement locks (finding 20).** They would change how Dependabot updates the pipeline (a compiled lock beside `requirements.txt`), which is a workflow decision for the maintainer, not a refactor. The `~=` pins stay as they are.
- **t-based confidence intervals.** The shared helper documents that the 1.96 normal interval is at most about 4% narrower at the 30-article floor. Changing it would alter intervals readers have already seen, so it is left as a methodological choice.
- **Extremes version stamps on existing files.** They appear with the next `extreme-analysis.py` run. Stamping the current files would have changed frozen v1 bytes.

## Operational notes

- Export commands now use `ma-visualisation-sentiments/.data-staging/` for their lock and stages. A second export fails at once while one holds the lock; the panel arbiter waits instead.
- `--prune-cache-only` and no-op arbiter runs now keep `metadata.usage`; a resumed run adds to it.
- This session's container had Node 22 and Python 3.11, while the project needs Node ≥ 24 and targets 3.12. The checks ran on Node 24.21 (nvm) and a Python 3.12 venv. Playwright ran against the container's pre-installed Chromium through a local, uncommitted config override.
