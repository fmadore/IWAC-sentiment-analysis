# IWAC Sentiment Analysis — Design Refactor Roadmap

**North star.** Shift the dashboard from polished SaaS to investigative data-journalism (Reuters Graphics / FT Visual Journalism / Bellingcat references), aligned with the academic-researcher audience documented in [.impeccable.md](.impeccable.md). Dark-only. Density and methodological transparency over decoration.

**Operating principle.** Each phase lands as one or more atomic commits that pass `npm run lint && npm run check && npm run build`. No phase breaks the live dashboard.

**Status: every phase landed — 0, 1, 2, 3 and 4, including 4.8 (badge-class consolidation). No deferred items remain.** Final pass (4.8 badge consolidation): `lint` ✓, `check` 0 errors / 0 warnings, `test:run` 305/305, `build` ✓, and a Playwright sweep of the built site confirmed every sentiment element resolves a palette — 150 `SentimentBadge`s across all three families in the table and comparison views, all 16 methodology scale badges and 15 arbiter scale chips distinctly coloured, the subjectivity legend, and filter chips correct when unselected, selected, and selected-while-hovered.

---

## Phase 0 — Foundation: tokens, type system, body chrome ✅ LANDED

The lowest-level changes. All later phases depend on these tokens being correct.

| # | Change | Files | Status |
|---|---|---|---|
| 0.1 | Replace Inter with **Source Serif 4** (display) + **Public Sans** (body/UI) + **JetBrains Mono** (eyebrows/numbers) | `src/app.html`, `src/app.css`, `src/lib/utils/chartTheme.ts` | ✅ |
| 0.2 | Add `--font-display`, `--font-sans`, `--font-mono` variables; rebuild type presets to use them | `src/app.css` | ✅ |
| 0.3 | Tighten font-size scale (widen distance between `xl`/`2xl`/`3xl`) — `2xs`/`md` kept as legacy aliases | `src/app.css` | ✅ |
| 0.4 | Soften letter-spacing tokens (only display sizes get negative tracking) | `src/app.css` | ✅ |
| 0.5 | Enable `font-variant-numeric: tabular-nums` globally on `body` | `src/app.css` | ✅ |
| 0.6 | Add `--prose-width: 65ch` token | `src/app.css` | ✅ |
| 0.7 | Drop `text-rendering: optimizeLegibility` from body | `src/app.css` | ✅ |
| 0.8 | Re-spec **polarity** colors in OKLCH with monotonic lightness | `src/app.css`, `src/lib/utils/chartTheme.ts` | ✅ |
| 0.9 | Re-spec **subjectivity** scale as monotonic cool→warm lightness ramp | `src/app.css`, `src/lib/utils/chartTheme.ts` | ✅ |
| 0.10 | Re-spec **centrality** scale as single-hue amber sequential ramp | `src/app.css`, `src/lib/utils/chartTheme.ts` | ✅ |
| 0.11 | Replace `--surface-card` / `-elevated` / `-nested` with **opaque** OKLCH tints | `src/app.css` | ✅ |
| 0.12 | Strip `inset 0 1px 0 …` highlight from `--elevation-card` (only made sense on glass) | `src/app.css` | ✅ |
| 0.13 | Strip body `background-image` radial brand glows; replace with flat OKLCH bg | `src/app.css` | ✅ |
| 0.14 | Override Skeleton Cerberus `--color-primary-*` / `--color-secondary-*` to a single restrained editorial palette | `src/app.css` | ✅ |

## Phase 1 — Kill SaaS / AI-slop tells ✅ LANDED

| # | Change | Files | Status |
|---|---|---|---|
| 1.1 | Delete gradient-text on every view title | `ViewContent.svelte` | ✅ |
| 1.2 | Replace icon-tile + gradient title with eyebrow + plain h1 + lede | `ViewContent.svelte` | ✅ |
| 1.3 | Delete `.text-gradient*` utilities | `app.css` | ✅ |
| 1.4 | Delete `--gradient-{view}` and `--sentiment-{view}-icon-bg` tokens | `app.css` | ✅ — back-compat shims map them to the editorial accent for any remaining callers |
| 1.5 | Remove ChartCard `::before` accent stripe and `--accent-gradient` per-variant tokens | `ChartCard.svelte` | ✅ |
| 1.6 | Remove `border-left: 3px` on alert variants | `app.css` | ✅ |
| 1.7 | Replace `.nav-tab-mobile[data-state='active']` gradient + glow with tonal | `app.css` | ✅ |
| 1.8 | Replace `.filter-chip[data-selected='true']` (default variant) gradient + glow with tonal | `app.css` | ✅ |
| 1.9 | Replace `.pagination-btn[data-active='true']` gradient + glow with tonal | `app.css` | ✅ |
| 1.10 | Drop `--shadow-glow-*` and `--gradient-primary` | `app.css` | ✅ — shimmed to `none` / `var(--accent)` for back-compat |
| 1.11 | Remove `backdrop-filter` from main surfaces (header, sidebar, all card primitives, ArticleTable). Modals keep blur (it's the one place blur earns its keep). | `app.css`, `GlassCard`, `FilterCard`, `ChartCard`, `FiltersPanel`, `AppHeader`, `SidebarNav`, `ArticleTable` | ✅ — `--glass-blur-*` shimmed to `0px` so the ~20 components still using them silently no-op |
| 1.12 | Remove `.btn:hover translateY` and `.btn-gradient` glow hover | `app.css` | ✅ |
| 1.13 | Remove hover translateY on `.card-hover` and chart cards | `app.css`, `ChartCard`, `GlassCard`, `FilterCard` | ✅ |
| 1.14 | Remove `card-accent::before` gradient bar | `app.css` | ✅ |

## Phase 2 — Dataviz craft ✅ LANDED

| # | Change | Files | Status |
|---|---|---|---|
| 2.1 | `getBarSeriesStyle`: flat fill, no gradient, no rounded corners | `chartTheme.ts` | ✅ |
| 2.1b | Inline gradient bar fills in viz components → flat | `KeywordFrequencyChart`, `SentimentChart`, `SubjectivityChart`, `CorrelationChart`, `ArbiterDimensionChart` | ✅ |
| 2.2 | `getLineSeriesStyle`: drop `shadowColor/Blur/Offset` on lines | `chartTheme.ts` | ✅ |
| 2.3 | `getPieSeriesStyle`: drop emphasis shadow, refine donut radius (38/70), 1.5px white border on emphasis, dark slice separator border | `chartTheme.ts` | ✅ |
| 2.4 | Tooltip: opaque OKLCH background, no `backdrop-filter` blur, hairline border | `chartTheme.ts` | ✅ |
| 2.5 | DataZoom: replace primary blue (`#3B82F6`) with editorial chrome amber; handle/filler/selectedDataBackground all use the new chrome.accent token | `chartTheme.ts` | ✅ |
| 2.6 | Build a separate **categorical** palette (countries/journals) — 12 muted OKLCH hues spaced ≥40°, explicitly excluding polarity reds and greens | `chartTheme.ts` | ✅ |
| 2.7 | Update chart text `fontFamily` references from `Inter, ...` to the Public Sans literal stack (ECharts can't read CSS vars) | `chartTheme.ts` | ✅ |
| 2.8 | Drop chart-toolbar emojis (📊 🥧 📈) → Lucide icons + monospace caps labels with tonal accent active state | `SentimentChart`, `SubjectivityChart`, `VolumeChart` | ✅ — also stripped `hover-lift`, `variant-filled-primary`, and `glass-medium` from the same toolbars |
| 2.9 _(skipped)_ | Switch ECharts internal chart titles off in favour of ChartCard header. Not strictly required for the editorial aesthetic; ECharts titles read fine inside opaque cards. Defer. | — | — |

## Phase 3 — Layout & information architecture ✅ LANDED

| # | Change | Files | Status |
|---|---|---|---|
| 3.1 | Surface a one-line methodology eyebrow under each view title (`Model · X · Sample · N articles`) | `ViewContent.svelte` | ✅ — inlined into the existing snippet rather than a new component; suppressed in comparison view since `ComparisonView` has its own |
| 3.2 | Default sidebar **expanded** at viewport ≥1280px | `SidebarNav.svelte` | ✅ — flipped on mount only (preserves user toggle thereafter) |
| 3.3 | Move filters from a top accordion to a persistent sticky left rail (320px); chart area shifts right. Mobile (<1024px) gets an off-canvas drawer opened from the AppHeader instead. | `+page.svelte`, `FiltersPanel.svelte`, `AppHeader.svelte`, `ui.svelte.ts`, `ComparisonView.svelte` | ✅ — comparison/arbiter stay full-width (own internal filters); comparison gained its own Country/Journal filters first so nothing was lost |
| 3.4 | Drop CSS-columns masonry filter layout in favor of stacked rail | `FiltersPanel.svelte` | ✅ |
| 3.5 | Drop the `max-w-6xl mx-auto` container; use a 2-column grid (rail / content) | `+page.svelte` | ✅ — rail views run wide (105rem); full-width views (arbiter/comparison) keep the prior 1152px cap via `data-layout` so text doesn't stretch |

## Phase 4 — Polish & consolidation ✅ LANDED

| # | Change | Files | Status |
|---|---|---|---|
| 4.1 | Brand title in AppHeader: Source Serif 4 + JetBrains Mono subtitle | `AppHeader.svelte` | ✅ |
| 4.2 | Apply `max-width: var(--prose-width)` to long-form paragraphs | `AnalysisInfo.svelte` (`.info-description`, `.panel-description`) | ✅ |
| 4.3 _(was: badge consolidation)_ | Drop emoji from chart-toolbar (Bar/Pie/Lines controls) → Lucide icons | `SentimentChart`, `SubjectivityChart`, `VolumeChart` | ✅ |
| 4.4 | Drop `--font-size-2xs` and `--font-size-md` from new code paths; keep as legacy aliases for unmigrated callers | `app.css` | ✅ |
| 4.5 | Audit and add **back-compat shims** for the still-referenced legacy tokens (`--gradient-*`, `--shadow-glow-*`, `--glass-blur-*`, `--sentiment-{view}-icon-bg`, `--color-tertiary-*`). Resolves to the editorial vocabulary — no exhaustive sweep required. | `app.css` | ✅ |
| 4.6 | Remove the duplicated global `.filter-chip` base + 16 sentiment variants from `app.css`; the component-scoped copies (`FilterChip.svelte`, `DiscrepancyFilter.svelte`) are the single source | `app.css` | ✅ — the old global copy had already drifted (full color vs `-border` token) |
| 4.7 | Data-table column headers get the monospace eyebrow: added `font-mono` to the global `.table th` (single source for all three tables) and removed the per-component duplicates that caused an unstable specificity tie; added a subordinate `.col-subhead` for ComparisonTable's model-name sub-row | `app.css`, `ArticleTable.svelte`, `ComparisonTable.svelte` | ✅ |
| 4.8 | Consolidate sentiment badge classes via `[data-polarity]` / `[data-subjectivity]` / `[data-centrality]` attribute selectors | `app.css`, `utils/sentimentTokens.ts`, `SentimentBadge.svelte`, `FilterChip.svelte`, `SentimentScaleList.svelte`, `SubjectivityFilter.svelte`, `AnalysisInfo.svelte`, `ArbiterMethodology.svelte` | ✅ |

## Landed since: 4.8 — sentiment badge class consolidation

The 16 value→token mappings used to be copied into five places: the standalone
globals in `app.css`, plus `SentimentBadge.svelte`, `FilterChip.svelte`,
`SentimentScaleList.svelte` and `SubjectivityFilter.svelte`. Retuning one
colour meant editing all five in lockstep, and they had already drifted.

They are now one layer. [`app.css`](ma-visualisation-sentiments/src/app.css)
maps `[data-polarity]` / `[data-subjectivity]` / `[data-centrality]` onto three
custom properties (`--sentiment-fg` / `-bg` / `-border`) and sets *nothing*
else, so it answers "what colour is `Très positif`?" without assuming what the
element is. Each component emits the attribute via
[`utils/sentimentTokens.ts`](ma-visualisation-sentiments/src/lib/utils/sentimentTokens.ts)
and carries a single rule reading those three variables — which keeps their
differing semantics intact: a badge is always filled, a filter chip only once
selected, a scale chip is a circle.

`sentimentTokens.test.ts` also asserts the cross-file join, since a variant
with no matching rule in `app.css` would fail silently as
transparent-on-transparent rather than erroring.

Two fixes fell out of the sweep:

- `.badge-verdict-win` was **dead in every browser**. A `*/` inside the comment
  above it (`--verdict-*/`) closed that comment early, so the trailing prose was
  parsed as part of the selector.
- The arbiter methodology's subjectivity chips were all painted score-3 green;
  they now carry the same 1→5 cool→warm ramp as everywhere else.

### Back-compat shims

Removed. The "BACK-COMPAT SHIMS" block in `app.css` and its last callers went
in the July 2026 review pass — see `REPO-REVIEW-2026-07.md`.

## Out of scope (this refactor)

- Adding new analytical features.
- Restructuring stores or data layer (separate concern).
- Touching `AnalysisInfo.svelte` content/copy — only its container.
- The Arbiter Methodology component (849 lines) — same skin treatment as other views, but content is left alone.
- Component-level `@keyframes` consolidation. Per `MEMORY.md`, Svelte's CSS scoping hashes animation names, so dedup breaks animations.

## Verification per phase

Every phase must pass before merging:

```powershell
cd ma-visualisation-sentiments
npm run lint
npm run check
npm run test:run
npm run build
```

Plus a visual sanity pass on `localhost:5173`:

- `/` (charts default), `/?view=trends`, `/?view=comparison`, `/?view=arbiter`, `/?view=extremes`, `/?view=table`, `/?view=heatmap`, `/?view=correlation`, `/?view=volume`
- Toggle FR/EN
- Toggle ChatGPT / Gemini / Mistral dataset
- Resize to mobile (375), tablet (768)

## Phase ordering rationale

- **Phase 0 first** because every later change reads from these tokens. Doing it last would mean re-touching every component.
- **Phase 1 before Phase 2** because killing the SaaS chrome is what most visibly moves the design. The user's "investigative · serious · contemporary" brief is mostly an act of subtraction.
- **Phase 2 before Phase 3** because chart treatment can be verified in isolation; layout restructuring risks visual regressions.
- **Phase 3 last among the structural work** because moving filters to a rail touches navigation, page container, breakpoints, and mobile menu interplay all at once.
- **Phase 4 polish** is opportunistic: do these pieces as we touch the surrounding code, not as a single sweep.

---

_Roadmap last updated: 2026-05-29 — Phases 0, 1, 2, all of 3, and 4.1–4.7 landed; only 4.8 (badge-class consolidation) and the back-compat shim migration remain (see "Deferred work" above)._
