# Impeccable roadmap

Plan for applying the **Impeccable** design skill (installed version **4.1.1**) to this
repo. Audited 2026-08-17 against the skill's own `doctor`, `context`, and `detect`
scripts. Work through the phases in order; each numbered pass is meant to be its own
session and its own PR. Delete this file when the roadmap is done.

---

## Where things stand

Impeccable's artifact set changed between versions. What this version actually reads:

| Artifact | Status | Notes |
| --- | --- | --- |
| `PRODUCT.md` | ✅ current | Written by `init` (schema 1), landed via PR #144. Accurately describes the product; nothing to do. |
| `DESIGN.md` | ✅ merged 2026-08-17 | Now spec-format: YAML frontmatter + the eight canonical sections, with the six lint-enforced authoring rules and the accessibility floors preserved verbatim at the end. North Star: **"The Overnight Wire Desk"**; accent named **Wire Amber**, backdrop **Ink Slate**; component philosophy **"set, not styled"**; elevation doctrine **lightness first, shadows whisper**. |
| `.impeccable.md` | ✅ deleted 2026-08-17 | Was written by an **old skill version** (commit `4ac625b`); nothing in 4.1.1 read it. Its aesthetic direction (investigative-editorial, dark-only, anti-SaaS) was migrated into DESIGN.md's Overview and Do's and Don'ts before deletion. |
| `.impeccable/config.json` | ✅ added 2026-08-17 | `projectRoots: ["ma-visualisation-sentiments"]`. Without it, impeccable's scripts looked for source at the repo root, found nothing (`hasCode: false`), and treated the project as pre-implementation. Verified: with the config, the workspace resolves, `hasVisualImplementation: true`, and root PRODUCT.md/DESIGN.md are inherited (doctor's `workspace-context-inherited` mention is the intended state — one app, one record). |
| `.impeccable/design.json` | ✅ written 2026-08-17 | Sidecar schemaVersion 2: tonal ramps, shadow/motion/breakpoint tokens, seven `ds-` component snippets (eyebrow, select, chips, nav item, chart card, table, toggle) with resolved literal values, and the narrative block. The live panel now renders this project's real primitives. |
| Surface briefs | none | Normal — they get created per-surface as commands run. |
| Design hook | off | `/impeccable hooks on` enables an auto-detector after UI edits. Deliberately deferred to Phase 4 (see below). |

**Modes for this app:** every dashboard view is **Operate** (researcher completes an
analytical task); the methodology/about content is **Read**. There are no Persuade
surfaces — resist any suggestion that adds marketing-page moves to the shell.

### Detector baseline (2026-08-17, 11 findings)

`detect.mjs` over `ma-visualisation-sentiments/src`:

- **`layout-transition` ×6 (quality)** — `transition: width` in
  `ArbiterStatsCards.svelte`, `ArbiterV2StatsCards.svelte`, `ComparisonStats.svelte`
  (×2), `SidebarNav.svelte`, `+layout.svelte`. Real fixes: animate `transform:
  scaleX()` on the stat bars instead of `width` (keep `transform-origin` on the
  correct edge), or drop the transition where it isn't meaningful.
- **`bounce-easing` ×4 (slop)** — Tailwind `animate-bounce` in
  `CsvDownloadButton.svelte` (success state). Replace with a small
  ease-out-expo/quart motion consistent with whatever motion grammar Phase 3.3 sets.
- **`overused-font` ×1 — false positive.** "Roboto" appears only in the
  pre-hydration system-font fallback stack in `app.html`. The real stack is Public
  Sans / Source Serif 4 / JetBrains Mono. When the hook is enabled in Phase 4, ignore
  this finding (`/impeccable hooks ignore-value`).

---

## Phase 0 — Bring the tooling current ✅ (done 2026-08-17)

- [x] `doctor` run; drift understood (this document is the report).
- [x] `.impeccable/config.json` with `projectRoots` created and verified.
- [x] Committed on `feat/impeccable-design-contract` together with Phase 1.

**How every future session should invoke the skill:** name a target inside the app,
e.g. `/impeccable critique ma-visualisation-sentiments/src/lib/components/views/...`
or run with cwd in `ma-visualisation-sentiments/`. Targeting the repo root resolves
the workspace only via the config; a named target is what makes surface-brief
resolution work.

## Phase 1 — Rebuild the design contract ✅ (done 2026-08-17)

Completed as planned: `document` ran in scan mode with the **merge** strategy.
Interview outcomes — North Star **"The Overnight Wire Desk"**; voice
**investigative · rigorous · contemporary**; elevation **lightness first,
shadows whisper**; accent **Wire Amber**; backdrop **Ink Slate**; components
**"set, not styled"**. The plan below is kept for the record:

**Preserve verbatim** (this is the part `npm run lint` enforces and CLAUDE.md points
component authors at):

- The six authoring rules (Tailwind = layout only; tokens for everything; no
  `var(--x, fallback)`; container queries in the rail; `data-*` state + single
  sentiment resolver; every control carries its own box).
- The Accessibility floors section.
- Keep them as their own section(s) — the DESIGN.md spec preserves non-canonical
  sections; a heading like `## Authoring Rules (lint-enforced)` after the canonical
  eight keeps both audiences served.

**Add** (what `document` scan mode extracts from the code):

- YAML frontmatter: `name`, `description`, `colors` (from the `app.css` token layer —
  keep **oklch** as the canonical format; it is this project's normative source),
  `typography` (display/headline/title/body/label from the type scale; Public Sans /
  Source Serif 4 / JetBrains Mono), `rounded`, `spacing`, `components`
  (button/select/toggle variants). Use this repo's existing token names as keys, not
  Material defaults.
- Canonical body sections in spec order: Overview (with a named Creative North Star),
  Colors, Typography, Layout (three breakpoints 640/1024/1280, the rail/container
  model), Elevation & Depth (the `--elevation-*` vocabulary and the
  mirrored-drawer-shadow trick), Shapes, Components, Do's and Don'ts.
- `.impeccable/design.json` sidecar (schemaVersion 2): tonal ramps, shadow and motion
  tokens, breakpoints, 5–10 self-contained component snippets (`ds-` prefixed,
  Tailwind expanded to literal CSS, hover/focus states inline), and the narrative
  block quoting the Overview and rules verbatim.

**Migrate `.impeccable.md`, then delete it:**

| `.impeccable.md` content | Where it goes |
| --- | --- |
| Users / use context | Already covered by PRODUCT.md — drop. |
| Brand personality ("Investigative · serious · contemporary", Reuters Graphics / FT / Bellingcat reference language) | DESIGN.md Overview — feeds the North Star discussion. |
| Dark-only theme, density-over-decoration, charts-as-content | Overview + Layout. |
| Anti-references (no SaaS tells, no gradient pills, no card-grid sameness, no emoji in chrome) | Do's and Don'ts (Don't list). |
| Editorial typography + tabular numerals | Typography (now true in code: `--font-display` serif headings, `--font-mono` tabular data). |

**Decisions the interview will ask you (be ready):** a named North Star metaphor
(candidates will be offered — something in the register of the investigative desk /
light table, not a SaaS metaphor), descriptive color names for the key tokens, the
elevation philosophy (this app is mostly flat with a deliberate drawer exception —
say so), and a one-phrase component character.

**Two candidate Named Rules worth writing down** (they encode existing invariants):
"The Chart Hex Rule" (ECharts/MapLibre can't parse oklch — chart-facing colour is
duplicated as annotated hex, guarded by `chartTheme.palette.test.ts`) and "The Shape
Rule" (sentiment is never hue-alone; polarity poles are equal-lightness, so glyphs
and words always accompany colour).

After the merge: re-read CLAUDE.md's one-line description of DESIGN.md and adjust if
needed; run the verify skill; commit.

## Phase 2 — Baseline evaluation (1–2 sessions, no edits yet)

Evidence before taste. `critique` has never run (`critique.latest: null`), so nothing
exists yet for `polish` to read as a backlog.

1. **`/impeccable critique`** on the surfaces where researchers actually live, in
   this grouping (one critique each, one session for the lot if they fit):
   - the default analytic views (distributions + trends),
   - the differential views (comparison + agreement + arbiter),
   - the evidence views (map + articles table),
   - the shell (header, nav drawer/sidebar, filter rail, language switch).
   Critique scores heuristically and snapshots its findings; that snapshot is the
   input to Phase 4's `polish`.
2. **`/impeccable audit`** once over the app — a11y / performance / responsive
   technical checks. The repo already automates WCAG A/AA serious+critical, so the
   value here is what those miss: focus order, touch targets, reflow, data-alternative
   readability.
3. Triage the union of critique + audit + the detector baseline above into: quick
   mechanical fixes (do immediately in one PR), items for a specific Phase 3 pass
   (tag them), items to reject with a reason (write the reason down — "dense by
   design" is a legitimate answer for this audience, and PRODUCT.md backs it).

## Phase 3 — Targeted refinement passes (one command per session/PR)

Ordered so later passes don't disturb earlier ones (structure → type → motion →
copy → edge cases → devices). Skip any pass whose Phase 2 evidence doesn't justify
it — the skip list at the bottom is deliberate.

1. **Quick wins PR** — fix the 10 real detector findings (`transition: width` →
   transform; `animate-bounce` → restrained easing). Small, mechanical, immediately
   testable.
2. **`layout`** — spacing, rhythm, hierarchy within the dense views: chart-to-chrome
   weight, card internals, the filter rail's vertical rhythm, methodology-caveat
   placement. Watch the container-query rule; the rail is a container, not a viewport.
3. **`typeset`** — the editorial ambition, now that the stack is right: hierarchy
   between view title / eyebrow / figure caption / axis label, tabular-numeral
   coverage everywhere data appears, and **French/English parity at ~30% expansion**
   (test both locales in the same pass).
4. **`animate`** — one motion grammar for the app: state transitions on filters,
   drawer, chart mode switches; everything behind `prefers-reduced-motion` (existing
   floor); ECharts' own animation settings included so canvas and DOM move alike.
5. **`clarify`** — scoped: error/empty/loading state copy and methodology caveat
   phrasing only. A full copy-edit + number-localisation pass just landed (PR #143);
   don't redo it. All copy goes through the i18n catalogs (en is the type source).
6. **`harden`** — edge cases as design: the v2 arbiter's *intentional* empty state
   (unpaid run — it must read as "not yet", never as an error), minimum-sample rules,
   long place/newspaper names, offline (there's a service worker), slow-data loading.
7. **`onboard`** — first-run orientation for a dense research instrument: does a
   first-time scholar know what the thirteen views are and where to start? Lightweight
   cues, no product-tour SaaS-isms.
8. **`adapt`** — phones and small tablets: charts at 320–640px, drawer ergonomics,
   table overflow. The container-query architecture is strong; this pass is about
   judging the result, not rebuilding it.

**Skip (with reasons, so nobody "helpfully" runs them):**

- `colorize` — colour here is a semantic system (sentiment ramps), not decoration;
  adding strategic accent colour would compete with data encoding.
- `overdrive`, `delight` beyond a light touch — wrong register for a scholarly
  instrument; the polarity glyph system already is the signature detail.
- `bolder` / `quieter` — only if Phase 2's critique explicitly scores the shell as
  timid or noisy. The restraint is a documented choice, not an accident.
- `distill` — only if critique finds a specific view overloaded; density is a feature
  for this audience.
- `optimize` — only if `audit` finds real jank; bundle discipline is already enforced
  (300 KiB gzip budget, lazy 368 kB map chunk).

**Optional at any point once the dev server runs:** **`/impeccable live`** for
in-browser variant iteration on a specific element (e.g. stat-card treatments,
nav-item states). Caveat from this repo's history: automated browsers never
composite — judge canvas/WebGL and "does it look right" in a real browser, and trust
console/network/computed-geometry checks over screenshots.

## Phase 4 — Finish and lock in (1–2 sessions)

1. **`/impeccable polish`** — the final pass; it reads Phase 2's critique snapshot as
   its backlog, so anything still open there gets closed or consciously rejected.
2. **Finish review** — the `impeccable-finish-reviewer` agent against DESIGN.md and
   the committed direction; fix what's material.
3. **`/impeccable document`** again (refresh mode) so DESIGN.md + sidecar carbonize
   any tokens/components the refinement passes introduced.
4. **`/impeccable extract`** — if recurring patterns emerged. Known candidate going
   in: a shared **StatCard** for `ComparisonStats` / `ArbiterStatsCards` /
   `ArbiterV2StatsCards` (an old roadmap item; the same components the detector
   flagged — one consolidation closes both).
5. **`/impeccable hooks on`** — now that the codebase is clean, enable the
   auto-detector so regressions surface at edit time; immediately ignore the Roboto
   fallback-stack false positive.

---

## Ground rules for every Impeccable session in this repo

The skill's generic instincts collide with this repo's guardrails in specific ways.
The repo wins:

1. **Tokens only.** No raw hex/px/ms in components, no Tailwind colour utilities, no
   `var(--x, fallback)` — `npm run lint` fails on all of it. The one place literal
   colour is legal is `app.css` token definitions and the annotated chart hex layer.
2. **ECharts/MapLibre can't parse oklch/`color-mix`/CSS vars.** Chart-facing colour
   changes go through `chartTheme.ts` with the `// oklch(...)` annotation intact —
   the palette test parses those comments.
3. **Svelte 5 runes only**; `onclick` not `on:click`. `<svelte:element>` silently
   deletes scoped CSS; component-level `@keyframes` duplication is intentional.
4. **Copy is bilingual by construction** — both catalogs, en as the type source; e2e
   specs locate elements by accessible name, so copy changes break tests until specs
   are updated.
5. **Dark-only, dense, anti-SaaS** is the committed direction; treat any suggestion
   toward light theme, card-grid sameness, or marketing moves as off-brief.
6. **Every session ends with the verify skill** (lint → check → test → build) before
   commit; one impeccable pass per PR.
