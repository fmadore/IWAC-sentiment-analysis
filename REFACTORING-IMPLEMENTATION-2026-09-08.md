# Refactoring and interface improvements — implementation record

Implemented the fifteen findings in [the repository audit](REPO-AUDIT-2026-09-07.md). No datasets were regenerated or provider APIs called during implementation. The older design roadmap has been reduced to verified remaining cleanup and optional maintenance; it is separate from the completed audit findings.

## Changes by audit finding

| Finding                      | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Browser history           | Complete URL snapshots restore views, cleared facets, pairs and article selections on Back/Forward. Restoration suppresses write-back; identical URL writes are skipped and synchronous updates are batched.                                                                                                                                                                                                                                                    |
| 2. Reproducible analysis     | Discrepancy dimensions and non-applicable exclusion, agreement scope/dimension and declined-rating inclusion now round-trip through shared URLs. Invalid flags are rejected and reversed discrepancy bounds are normalized.                                                                                                                                                                                                                                     |
| 3. Source provenance         | Both source-loading paths use a resolved immutable commit. Public and private repositories have separate revision settings. Source results carry their actual repository and revision; malformed parquet no longer silently triggers a fallback.                                                                                                                                                                                                                |
| 4. Dataset recovery          | Readiness checks name the required failed models and offer retry. Pair scope does not depend on unrelated failed panel members. Background prefetch cannot repeatedly replace an error state with an unsolicited retry. Late responses do not change the pair restored by navigation.                                                                                                                                                                           |
| 5. Inspectable chart data    | Shared native tables and CSV exports now accompany distribution, trends, volume, centrality heatmap, correlation, calibration, dissent, directional dissent, label flow, consensus scatter, disagreement breakdown, arbiter pies, keywords and map values. Existing agreement-matrix, seasonality and newspaper tables remain. Tables use the same aggregates as their charts; trend share mode exports percentages and map tables include scored denominators. |
| 6. Table semantics           | Article, comparison and archived-arbiter rows retain native table semantics. Real title buttons open details; sortable headers announce direction.                                                                                                                                                                                                                                                                                                              |
| 7. Newspaper comparison      | Overall distribution is the default, with semantic colours and direct counts. Newspaper grouping is an explicit mode with six leading titles plus a labelled remainder; its table retains all contributing newspapers.                                                                                                                                                                                                                                          |
| 8. Tooltips                  | Help controls have 44px targets, explicit click/touch activation, native Escape/light dismissal and viewport-clamped popovers.                                                                                                                                                                                                                                                                                                                                  |
| 9. Localization              | Navigation, language selection, search, article/comparison actions, modal controls, IIIF actions and explanatory help use typed English/French catalogues. Badge and helper-text contrast was corrected after the expanded axe scans.                                                                                                                                                                                                                           |
| 10. Aggregation              | Data aggregates are separated from chart presentation. One confusion matrix supplies both kappas; corpus-filtered model arrays and dissent profiles are shared. A component regression test counts row visits and proves that language/shape changes reuse the distribution aggregate.                                                                                                                                                                          |
| 11. Lazy loading and budgets | Chart imports begin only when requested. Rejected view imports show a localized recovery action. Actual production requests, including transitive imports and scheduled score prefetches, are measured; map/chart isolation is asserted against the generated chunk manifest.                                                                                                                                                                                   |
| 12. Module boundaries        | Extracted article fetch/parse/join transport, prefetch scheduling, the bilingual model registry, pure panel-candidate selection and prompt construction. Global CSS now has an explicit token → foundation → shared-component import order. Public compatibility APIs remain.                                                                                                                                                                                   |
| 13. Release coherence        | Generation exports stage and validate before promotion, use an exclusive writer lock and recoverable journal, and restore the prior set after interruption. Builds refuse pending publication and verify the copied data against the identifier embedded in the frontend. Production data paths are content-addressed; offline cache lookup never substitutes a different release.                                                                              |
| 14. Workflow coverage        | Browser coverage grew from 5 to 20 tests: history, analytical sharing, late pair responses, failed pair/panel members, chunk failures, native modal focus, drawer focus return, mobile chart tables/tooltips, French comparison accessibility, panel accessibility, production budgets and offline release isolation.                                                                                                                                           |
| 15. Visual hierarchy         | Removed the repeated view eyebrow and redundant primary-chart model badges. Added readable chart headings and sample counts; methodology is a compact disclosure. Duplicate canvas titles were removed from distribution modes.                                                                                                                                                                                                                                 |

The focus tests also exposed a pre-existing full-screen modal gap: native modal dialogs now make the background inert, contain keyboard focus and return focus when closed. Agreement tabs support arrow/Home/End navigation, and the scope controls sit outside the tab list.

## Validation

- Frontend lint passed: Prettier, ESLint, store-cycle detection and design-token checks.
- Svelte check: **0 errors, 0 warnings**.
- Vitest: **532 tests passed in 32 files**.
- Python: **113 tests passed**, including checked-in generated-data validation, numerical fixtures, pinned revisions, publication rollback and recovery from the journal left by a killed process. Ruff lint and formatting passed.
- Playwright: **20 tests passed using the configured two workers**, against the final static Pages artifact.
- Production build and every postbuild step passed: **353 artifact files; 148 KiB HTML-referenced JavaScript gzip**.
- Real-browser visual inspection covered French charts at **1440×1000** and **390×844**, overall/newspaper grouping and the complete newspaper data table.
- `git diff --check` passed. **No changes under `static/data/`**; frozen v1 data and the current annotation files retain their original bytes.

### Complete cold-load budgets

These are actual JavaScript responses gzip-normalized from the final preview, not merely scripts referenced directly by HTML. Data totals include all five scheduled score prefetches; the map also loads its places and basemap.

| Direct view |   JS gzip | JS budget |   Data gzip | Data uncompressed |
| ----------- | --------: | --------: | ----------: | ----------------: |
| Charts      | 406.6 KiB |   450 KiB |   887.0 KiB |      11,886.4 KiB |
| Table       | 153.3 KiB |   180 KiB |   887.0 KiB |      11,886.4 KiB |
| Map         | 526.9 KiB |   600 KiB | 1,025.4 KiB |      12,376.3 KiB |

No before/after wall-clock speedup is claimed. These measurements establish enforceable transfer budgets; the aggregation test verifies avoided work independently of machine timing. Further chart-family or worker splitting should follow a measured need.

## Integration with main

Integrated the upstream changes through `e1669fa` before committing: the published
301-article panel-arbiter run, valence-flip selection, per-article blind prompt ordering,
cost accounting, article verdict details and the separate not-annotated filter bucket.
The extracted Python modules preserve those selection and prompt behaviours. The
upstream annotation files are unchanged by this implementation. Counts and transfer
budgets above describe the integrated build.

## Operational notes

`npm run preview` now serves `build/`, because Vite's preview serves the intermediate SvelteKit output and misses release publication and service-worker stamping. Run `npm run build` before previewing.

This build's data release is `23f73e51c168161140e5fb6d`. Code-only builds retain that data namespace. A changed data file produces a different namespace; an interrupted publication blocks the build until the next export recovers the journal. Recovery covers process interruption, not a guarantee against storage-device failure.

`IWAC_HF_REVISION` selects the public source revision; `IWAC_HF_FULL_REVISION` selects the private OCR mirror revision. Both resolve to immutable commits. The v1 pair arbiter and v2 panel arbiter retain separate contracts, and intentionally declined/missing model ratings are unchanged.
