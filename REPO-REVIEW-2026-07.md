# IWAC Sentiment Analysis — Repository Review (25 July 2026)

**Scope.** Full-repo examination with two questions in front: (1) what
*analytical* visualizations is the dashboard missing, and (2) what other
improvements — refactoring, correctness, performance, research integrity — are
worth doing next. Run against `main` @ `2b999ad`.

**Relationship to the previous audit.** [CODE-AUDIT-2026-07.md](CODE-AUDIT-2026-07.md)
is essentially *done*: the twin-chart merges landed (`TrendsChart`,
`DimensionDistributionChart`, `ArbiterPieChart` are now shared shells with thin
wrappers), `i18n/types.ts` is 11 lines (`typeof en`), the store cycle checker
runs in `npm run lint`, the in-flight load map replaced the TOCTOU checks, the
data payload was normalized (base metadata split out), `utils/arbiter.ts` and
`PaginationControls` exist, the dead CSS is gone and the back-compat shim block
is down to 5 call sites. Baseline health confirmed locally: `check` 0 errors /
0 warnings across 537 files, `test:run` 140/140, `lint` clean, store-cycle
check "OK — 16 modules, no cycles".

So this review deliberately does **not** re-litigate that list. Everything
below is new, and every quantitative claim is computed from the JSON actually
shipped in `static/data/`.

---

> ## Implementation status — everything below has shipped
>
> Landed on `claude/repo-review-improvements-6xdel1` in eight commits. Final
> state: `check` 0 errors / 0 warnings across 598 files, `lint` clean,
> 262 frontend tests + 20 Python tests passing, production build green, and a
> browser sweep of all 12 views.
>
> | § | Item | Where it landed |
> |---|------|-----------------|
> | 1.1, 1.2 | Confusion matrix + Cohen's/Fleiss' κ | new **Agreement** view |
> | 1.3 | Cross-model calibration | `ModelCalibrationChart`, in Agreement |
> | 1.4 | Hijri seasonality | new **Seasonality** view |
> | 1.5 | Newspaper ranking with CIs | new **Newspapers** view |
> | 1.6 | Share-vs-count toggle | `TrendsChart` |
> | 1.7 | Spearman's ρ | reported under the Distribution chart |
> | 1.8 | Disagreement by decade/country | `DisagreementBreakdownChart`, in Comparison |
> | 1.9 | Arbiter sampling frame | `ArbiterCoverage`, above the verdicts |
> | 1.10 | Per-chart data disclosure | `ChartDataTable` |
> | 2.1–2.4 | Service worker, theme colours, `CITATION.cff` | — |
> | 3 | Score/justification payload split | 1.46 MB → 59 KB gzipped per model |
> | 4.1–4.5 | `StatCard`, shim removal, tests, pinned deps, arbiter index | — |
>
> **One correction to the figures below.** The weighted-κ values in §1.2 were
> computed with `Non applicable` at the *top* of the polarity scale. The
> shipped app puts it at the *bottom*, matching the score maps already in
> `stores/derivations.ts` — weighted κ reads ordinal positions, so polarity
> weighted κ is **0.701** in the app, not the 0.594 tabulated below. Centrality
> is unaffected (0.919 / 0.732 / 0.701) because its ordering already matched.
> `utils/agreementCorpus.test.ts` pins the shipped values against the real
> corpus.
>
> Three bugs surfaced while building, beyond those the review identified:
> ECharts `setOption` merges, so the seasonality chart's polar↔bar toggle left
> a pinwheel behind; `text-transform: uppercase` renders ρ as a Latin-looking
> Ρ; and component tests were impossible at all until `vitest.config.ts` got
> `resolve.conditions: ['browser']` and jsdom got a `matchMedia` stub.

---

## Part 1 — Visualizations the dashboard should have

The nine existing views cover *distributions* well. What they don't cover is
**agreement**, **calibration**, and **domain-specific time**. Three of the four
highest-value additions are in that gap.

### 1.1 Model agreement matrix (confusion matrix) — highest value

The comparison view collapses every inter-model difference into a scalar
"discrepancy score" and reports averages over it. That scalar cannot
distinguish *systematic recalibration* from *genuine disagreement*, and for
this corpus the difference is enormous.

Centrality, ChatGPT (rows) × Mistral (columns), all 12,287 articles:

| | Non abordé | Marginal | Secondaire | Central | Très central |
|---|---:|---:|---:|---:|---:|
| **Non abordé** | 360 | 232 | 30 | 2 | 0 |
| **Marginal** | 23 | **672** | 212 | 20 | 0 |
| **Secondaire** | 1 | 157 | **818** | 413 | 0 |
| **Central** | 0 | 31 | 316 | **1470** | 2 |
| **Très central** | 0 | 19 | 118 | **5839** | 1552 |

That bottom-left 5,839 is one cell. Mistral relabels ChatGPT's *Très central*
as *Central* almost half the time, and virtually never disagrees by more than
one step. The dashboard currently renders this as "mean total discrepancy
1.48 points per article" — which reads like noise, and is actually a
one-notch scale offset.

**Build:** a 5×5 (polarity 6×6) heatmap per dimension per pair, row-normalized
shading, diagonal outlined, row/column marginals on the edges, and per-cell
click-through into the filtered article list. `getVisualMapConfig` and the
existing heatmap plumbing in `CentralityHeatmap.svelte` already do 90% of it.
Natural home: a new panel in the comparison view, or a fourth tab beside it.

### 1.2 Inter-rater agreement statistics (Cohen's κ)

The confusion matrix's companion, and the number a peer reviewer will ask for
first. Computed from the shipped data:

| Dimension | Pair | Exact | κ | κ (quadratic-weighted) |
|---|---|---:|---:|---:|
| Polarity | chatgpt–gemini | 0.710 | 0.529 | 0.594 |
| Polarity | chatgpt–mistral | 0.709 | 0.535 | 0.558 |
| Polarity | gemini–mistral | 0.641 | 0.450 | 0.562 |
| Centrality | chatgpt–gemini | 0.810 | 0.659 | 0.919 |
| Centrality | chatgpt–mistral | 0.397 | 0.252 | **0.732** |
| Centrality | gemini–mistral | 0.353 | 0.208 | **0.701** |
| Subjectivity | chatgpt–gemini | 0.590 | 0.428 | 0.655 |
| Subjectivity | chatgpt–mistral | 0.592 | 0.362 | 0.570 |
| Subjectivity | gemini–mistral | 0.562 | 0.315 | 0.513 |

The κ / weighted-κ gap on centrality (0.25 → 0.73) is the same finding as §1.1,
expressed as one number: near-zero *categorical* agreement, substantial
*ordinal* agreement. Three-way exact agreement on polarity is 0.543.

**Build:** a pure function in `utils/agreement.ts` (unweighted, linear- and
quadratic-weighted κ; Fleiss' κ for the 3-way case), unit-tested against the
values above, surfaced as a stat row in the comparison view with Landis & Koch
interpretation bands in a footnote. Small, high credibility payoff, and it
gives the still-unextracted `StatCard` (§4.1) a second consumer to justify it.

### 1.3 Marginal distribution comparison across all three models

Model label distributions differ sharply, and you currently can only see it by
switching datasets and remembering the bars:

| | ChatGPT | Gemini | Mistral |
|---|---:|---:|---:|
| Polarity *Très positif* | 370 | **1400** | 447 |
| Polarity *Non applicable* | 629 | 311 | 596 |
| Centrality *Très central* | 7528 | 8130 | **1554** |
| Centrality *Central* | 1819 | 1538 | **7744** |
| Subjectivity 2 | 5508 | 5482 | **8863** |
| Subjectivity 3 | 2080 | 1082 | **627** |

Gemini uses the top polarity grade 3.8× more than ChatGPT; Mistral concentrates
79% of subjectivity judgements in a single score. These are calibration
signatures, and they belong on one axis, not three page-loads apart.

**Build:** grouped horizontal bars or three small multiples on a shared scale,
one panel per dimension, plus a per-model "declined to answer" rate
(*Non applicable* / *Non abordé*). Reuses `aggregateByJournalAndDimension`'s
shape with the model as the grouping key.

### 1.4 Hijri-calendar seasonality — the genuinely novel one

12,178 of 12,287 articles carry a full `YYYY-MM-DD` date, but every temporal
view buckets by Gregorian year. For a corpus about Islam in the press, the
Islamic lunar calendar is the analytically correct time axis — and the signal
is strong. Articles per Hijri month (index 1.00 = even distribution), with mean
centrality on the 1–5 scale (ChatGPT labels):

| Hijri month | n | Index | Mean centrality |
|---|---:|---:|---:|
| Muharram | 772 | 0.76 | 3.95 |
| Safar | 658 | 0.65 | 3.87 |
| Rabi I | 964 | 0.95 | 4.22 |
| Rabi II | 724 | 0.71 | 3.89 |
| Jumada I | 756 | 0.74 | 3.94 |
| Jumada II | 706 | 0.70 | 3.80 |
| Rajab | 789 | 0.78 | 3.95 |
| Sha'ban | 798 | 0.79 | 4.01 |
| **Ramadan** | **1729** | **1.70** | **4.51** |
| **Shawwal** (Eid al-Fitr) | **1517** | **1.49** | **4.47** |
| Dhu al-Qa'dah | 1064 | 1.05 | 4.06 |
| **Dhu al-Hijjah** (hajj, Eid al-Adha) | **1701** | **1.68** | **4.52** |

Coverage roughly doubles during Ramadan and the hajj/Eid months, *and* what
gets published in those months is markedly more centred on Islam. Because the
Hijri year drifts ~11 days against the Gregorian one, this pattern is invisible
in every current chart — the existing Gregorian month counts are nearly flat
(840–1,289 per month).

**Build:** a polar bar chart (12 Hijri months) with volume as radius and mean
centrality as colour, alongside a Gregorian-month version for contrast.
Requires a small tabular-Islamic-calendar conversion in a util (~15 lines,
pure, easily unit-tested) — no dependency needed. This is the addition most
likely to produce a citable finding rather than just a nicer chart.

### 1.5 Newspaper net-sentiment ranking with confidence intervals

The per-newspaper polarity chart stacks absolute counts for all 56 newspapers
in alphabetical order, so it reads as a volume chart with colour on it. Ranked
by a net-polarity index (*Très négatif* = −2 … *Très positif* = +2), the 30
newspapers with n ≥ 50 span a genuine editorial range:

| Newspaper | n | Net | 95% CI |
|---|---:|---:|---:|
| La Nouvelle Tribune | 70 | +0.057 | ±0.138 |
| Nord-Sud | 89 | +0.292 | ±0.151 |
| FasoZine | 110 | +0.400 | ±0.114 |
| … | | | |
| Fraternité Matin | 911 | +0.817 | ±0.038 |
| Fraternité Hebdo | 69 | +0.870 | ±0.145 |
| Plume Libre | 62 | +1.000 | ±0.211 |

**Build:** a ranked dot plot with CI whiskers, an adjustable minimum-n
threshold, and the same treatment available for mean subjectivity and mean
centrality. Honest about small samples in a way the current stacked bar isn't,
and directly answers "which papers cover Islam most favourably?" — a question
the dashboard implicitly promises and doesn't currently let you ask.

### 1.6 Share-vs-count toggle on the trends charts

Corpus volume runs from 22 articles (1960s) to 4,360 (2010s). The trends charts
plot absolute yearly counts, so every series' shape is dominated by the volume
curve rather than by any change in sentiment. A 100%-stacked-area / share mode
separates composition from volume.

**Build:** one `normalize` prop on the shared `TrendsChart.svelte` plus a toggle
reusing `ChartTypeToggle`. Both wrappers inherit it. Cheapest item on this list.

### 1.7 An actual correlation view

The "Distribution" view is a stacked bar of polarity × subjectivity — useful,
but it isn't a correlation and doesn't report one. Add either a jittered
article-level scatter (polarity × subjectivity, centrality as point colour, count
as size) or, at minimum, a reported Spearman ρ with n on the existing chart.

### 1.8 Where models disagree — over time and across countries

Mean total discrepancy bucketed by year and by country would locate whether
inter-model disagreement concentrates in a period (older, OCR-degraded text?) or
a national press. Reuses `aggregateByYearAndDimension`'s shape with the
discrepancy as the measure. Currently the comparison view can tell you *how
much* models disagree but never *where*.

### 1.9 Foreground the arbiter's sampling frame

The arbiter files hold 61 / 129 / 176 evaluations against a 12,287-article
corpus — 0.5%–1.4%, selected for high conflict, i.e. a deliberately
non-random sample. The arbiter view reports percentages ("Model A preferred
X%") without that denominator in view. Anyone reading those percentages as
"Gemini beats Mistral 60% of the time on this corpus" is reading them wrong.

**Build:** a coverage bar (evaluated / eligible / total) and a one-line sampling
note in the methodology eyebrow. This is a research-integrity fix that happens
to look like a chart, and it fits `.impeccable.md`'s principle 3
("methodological transparency … not hidden in tooltips").

### 1.10 Per-chart data disclosure

Every chart is a `<canvas>` with an `aria-label` — better than nothing, but
there's no tabular fallback for screen readers and no way to get the aggregated
numbers behind a chart short of exporting all 12,287 rows. A collapsible
"Data" disclosure under each `ChartCard`, rendering the aggregation as a small
table with a CSV button, serves accessibility and citation with one component.
The aggregators (`chartAggregators.ts`) already return exactly the right shape.

---

## Part 2 — Bugs

### 2.1 The service worker still points at deleted data files

[`static/sw.js:50-52`](ma-visualisation-sentiments/static/sw.js) precaches:

```js
`${BASE_PATH}/data/iwac_articles_chatgpt.json`,
`${BASE_PATH}/data/iwac_articles_gemini.json`,
`${BASE_PATH}/data/iwac_articles_mistral.json`
```

Those files were removed by the payload-normalization refactor. `static/data/`
now holds `iwac_articles_base.json` + `iwac_sentiment_{model}.json`. The
install handler is tolerant, so this fails silently — three 404s on every
service-worker install, and the files that *are* used never get precached.

### 2.2 …and never data-caches the sentiment payloads at all

The runtime routing rule tests for three filename prefixes:

```js
url.pathname.includes('iwac_articles_') ||
url.pathname.includes('iwac_arbiter_evaluations_') ||
url.pathname.includes('iwac_extreme_analysis_')
```

`iwac_sentiment_chatgpt.json` matches none of them, so the 8–14 MB model
payloads fall through to the generic rule and land in `CACHE_NAME` —
`iwac-runtime-${SW_VERSION}` — which `activate()` purges on every deploy. The
file's own comment states the opposite intent: *"The data JSON is large and
network-first, so keep its cache stable to avoid re-downloading the whole
corpus on every deploy."* Today every deploy forces returning users to
re-download the entire corpus.

Fix both by adding `iwac_sentiment_` to the prefix list and replacing the stale
precache entries with the base + sentiment files. Worth reconsidering the
install-time precache generally, which currently pulls ~35 MB of
extreme-analysis data on a first visit before the user has opened that view.

### 2.3 Theme colour drifted from the design refactor

`static/manifest.json` declares `theme_color: #1e293b` / `background_color:
#0f172a` and `app.html:54` repeats `#1e293b` — the pre-refactor slate palette.
The app now paints `--app-bg: oklch(0.16 0.012 260)` (`app.css:308`). The PWA
splash and browser chrome therefore don't match the app. `manifest.json` also
still declares `"lang": "fr"` for a bilingual app and
`"orientation": "portrait-primary"` for a desktop-first research dashboard.

### 2.4 `CITATION.cff` is stale — and it's the file that matters most

```yaml
version: 3.0.0                    # package.json says 4.0.0
date-released: 2025-05-19
abstract: "… comparative analysis between ChatGPT and Gemini models …"
```

Mistral is missing from the abstract and from `keywords`, the version is a
major release behind, and the referenced HuggingFace dataset abstract also says
"ChatGPT and Gemini". For a research artefact whose whole point is that anyone
citing it cites the right thing, this is the highest-leverage doc fix in the
repo. (The README's "Gemini 2.5 Pro" error from the last audit *is* fixed —
this one was missed.)

---

## Part 3 — Performance: 86–92% of every model payload is prose nobody reads

This is the single largest end-user improvement available, and it's orthogonal
to the base-metadata normalization that already landed.

Each `iwac_sentiment_{model}.json` carries three scores and three long
free-text justifications per article. The justifications are read in exactly
two places: the article-detail modal and the CSV export. Every chart, trend,
heatmap and filter needs only the scores.

| File | Shipped | Scores only | Shipped (gzip) | Scores only (gzip) |
|---|---:|---:|---:|---:|
| `iwac_sentiment_chatgpt.json` | 8.33 MB | 0.68 MB | 1.46 MB | **49 KB** |
| `iwac_sentiment_gemini.json` | 8.52 MB | 0.68 MB | 1.45 MB | **48 KB** |
| `iwac_sentiment_mistral.json` | 14.05 MB | 0.64 MB | 2.86 MB | **48 KB** |

Justification prose is 7.18 / 7.37 / 12.93 MB of those files respectively.

**Proposal.** Have `data-fetch.py` emit two files per model —
`iwac_sentiment_{model}.json` (scores; the shape `articles.svelte.ts` already
joins) and `iwac_sentiment_{model}_justifications.json` (lazy). Fetch the
second only when the detail modal opens or CSV export runs, with the same
in-flight dedup the base file uses. Effects:

- First paint of any chart view: **1.46 MB → 49 KB** on the wire (30×).
- Comparison mode (two models): ~4.3 MB → ~100 KB (43×).
- All three models prefetched: ~5.8 MB → ~150 KB.

The justification payload is then paid once, on demand, by the users who
actually open an article — and never at all by someone who just wants the
charts. Coordinate the Python writer and the store loader in one change, as
with the previous normalization.

Two smaller notes: the SW's install-time precache (§2.2) should be reconsidered
in the same pass, and `iwac_sentiment_mistral.json` is 69% larger than the
others purely because Mistral writes longer justifications — after the split
that asymmetry stops mattering.

---

## Part 4 — Refactoring and engineering

### 4.1 The last two open items from the July audit

- **`StatCard` / `ProgressBar` extraction** (Batch G) — `ComparisonStats.svelte`
  (561 lines) and `ArbiterStatsCards.svelte` (455) still duplicate the
  `.stat-card` / `.stat-value` / `.stat-label` + progress-bar recipe. §1.2's
  κ statistics would be a third consumer; do the extraction when adding it.
- **Per-folder token-consistency sweep** (Batch H) — the back-compat shim block
  is down to 5 call sites across `src/lib`. It's now a finishable job rather
  than a sweep: migrate those five, delete the block.

### 4.2 Remaining large components

`AnalysisInfo.svelte` (788), `ArbiterArticleTable.svelte` (648),
`ComparisonTable.svelte` (639), `ArbiterMethodology.svelte` (528). The two
tables are the better target — they still carry per-file sticky-header,
sortable-header and container CSS that `app.css` already provides globally.

### 4.3 Test coverage is store-shaped only

140 tests across 8 files, all covering stores and pure utils — good ones. There
are zero component tests, despite `@testing-library/svelte` being installed and
`src/mocks/` being fully set up for it. The shared chart shells
(`TrendsChart`, `DimensionDistributionChart`, `ArbiterPieChart`) are now the
single point of failure for 8 of the 11 charts and have no smoke test at all.
A handful of "renders with data / renders the empty state / respects the
language switch" tests would cover a lot of surface cheaply.

Any new analytics from Part 1 (κ, Hijri conversion, net-sentiment index, CI
computation) should land as tested pure functions in `utils/` first, components
second — the pattern `chartAggregators.ts` already established.

### 4.4 Python reproducibility

`data-preprocess/requirements.txt` is eight unpinned package names. For a
project whose methodology is meant to be citable and re-runnable, pinning
(`pandas==x.y.z`, and especially `google-genai`, which determines what
`gemini-3-pro-preview` resolves to) is the difference between reproducible and
approximately reproducible. There are also no tests for the preprocessing
scripts, though `shared.py`'s helpers (`safe_int_convert`,
`calculate_discrepancies`, the score maps) are exactly the kind of pure logic
that should have them — and `calculate_discrepancies` is duplicated logic
against the frontend's `derivations.ts`, so a shared fixture would catch drift
between the two.

### 4.5 Minor

- `getArbiterForArticle` (`arbiter.svelte.ts:82`) linear-scans the evaluations
  array on every call. Harmless at n ≤ 176; build the `Map` at load time if
  arbiter coverage ever grows.
- `.npmrc` sets `engine-strict=true` against `engines: { node: ">=24" }`, so
  `npm ci` hard-fails on Node 22 rather than warning. Intentional and
  consistent with CI, but worth knowing before debugging an install.

---

## Prioritized plan

**Do first (hours each, high value/effort ratio):**

1. Service-worker data-file fix (§2.1, §2.2) — a real regression costing every
   returning user a full corpus re-download.
2. `CITATION.cff` refresh (§2.4) + theme-colour alignment (§2.3).
3. Share-vs-count toggle on trends (§1.6) — one prop on the shared shell.

**Then (days, ordered by value):**

4. Justification/score payload split (§3) — biggest end-user win in the repo.
5. Agreement matrix + κ statistics (§1.1, §1.2), with the `StatCard`
   extraction (§4.1) folded in.
6. Hijri seasonality view (§1.4) — the most likely to yield a publishable
   finding.
7. Marginal distribution comparison (§1.3) and newspaper net-sentiment
   ranking (§1.5).
8. Arbiter sampling-frame disclosure (§1.9) and per-chart data disclosure
   (§1.10).

**Ongoing:**

9. Component smoke tests for the three shared chart shells (§4.3); pin the
   Python requirements (§4.4); finish the back-compat shim migration (§4.1).

---

_All figures in this document were computed directly from the JSON in
`ma-visualisation-sentiments/static/data/` at commit `2b999ad`. Hijri dates use
the tabular (civil) Islamic calendar._
