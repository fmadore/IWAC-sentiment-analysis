---
name: IWAC Sentiment Analysis
description: Investigative-editorial dark dashboard comparing AI sentiment readings of the Islam West Africa Collection press corpus
colors:
  wire-amber: "oklch(0.78 0.13 80)"
  wire-amber-strong: "oklch(0.72 0.15 78)"
  comparison-steel: "oklch(0.7 0.08 240)"
  arbiter-amber: "oklch(0.74 0.16 75)"
  ink-slate: "oklch(0.16 0.012 260)"
  ink-slate-elevated: "oklch(0.19 0.014 260)"
  surface-card: "oklch(0.205 0.012 260)"
  surface-card-hover: "oklch(0.225 0.014 260)"
  surface-card-elevated: "oklch(0.235 0.015 260)"
  surface-nested: "oklch(0.175 0.011 260)"
  text-primary: "oklch(0.97 0.005 260)"
  text-faint: "oklch(0.42 0.005 260)"
  text-on-light: "oklch(0.18 0.014 260)"
  polarity-very-negative: "oklch(0.62 0.2 25)"
  polarity-negative: "oklch(0.7 0.14 25)"
  polarity-neutral: "oklch(0.66 0.045 250)"
  polarity-positive: "oklch(0.7 0.13 150)"
  polarity-very-positive: "oklch(0.62 0.18 150)"
  polarity-na: "oklch(0.55 0.01 260)"
  subjectivity-1: "oklch(0.72 0.06 220)"
  subjectivity-2: "oklch(0.7 0.085 200)"
  subjectivity-3: "oklch(0.68 0.09 130)"
  subjectivity-4: "oklch(0.68 0.13 60)"
  subjectivity-5: "oklch(0.7 0.17 35)"
  centrality-not-addressed: "oklch(0.42 0.005 80)"
  centrality-marginal: "oklch(0.52 0.04 80)"
  centrality-secondary: "oklch(0.62 0.075 80)"
  centrality-central: "oklch(0.72 0.115 80)"
  centrality-very-central: "oklch(0.82 0.14 80)"
  status-error: "oklch(0.7 0.14 25)"
  status-caution: "oklch(0.74 0.145 55)"
  status-warning: "oklch(0.8 0.13 85)"
  status-success: "oklch(0.7 0.13 150)"
  status-info: "oklch(0.72 0.09 240)"
typography:
  display:
    fontFamily: "Source Serif 4, Source Serif Pro, Georgia, serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Source Serif 4, Source Serif Pro, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.008em"
  body:
    fontFamily: "Public Sans, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.08em"
rounded:
  none: "0"
  hairline: "1px"
  panel: "2px"
  circle: "9999px"
spacing:
  pad-card: "20px"
  pad-card-compact: "16px"
  gap-stack: "16px"
  gap-inline: "8px"
components:
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.panel}"
  select:
    backgroundColor: "color-mix(in oklab, oklch(0.99 0 0) 4%, transparent)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "8px 12px"
  filter-chip:
    rounded: "{rounded.hairline}"
    padding: "6px 12px"
  nav-item:
    rounded: "{rounded.panel}"
    padding: "10px 12px"
  badge:
    rounded: "{rounded.hairline}"
    padding: "2px 10px"
  toggle-btn:
    rounded: "{rounded.hairline}"
    padding: "6px 12px"
---

# Design System: IWAC Sentiment Analysis

## Overview

**Creative North Star: "The Overnight Wire Desk"**

A wire service's overnight desk: matte dark surfaces under low light, dispatches
arriving as data, everything read against everything else before morning. The
interface is investigative · rigorous · contemporary — a piece of data
journalism that happens to be interactive, never a SaaS product, never a museum
exhibit. Charts are the primary content; every piece of chrome earns its weight
against the chart it surrounds. The reference language is Reuters Graphics, FT
Visual Journalism, Bellingcat, Bloomberg's editorial graphics — density as
respect for a scholarly audience that works here for hours at a time, in French
and English as equals.

The desk's materials are matte and opaque: solid ink-dark panels, square
corners, hairline borders, no glass and no glow. Its voice is typographic — a
serif byline face for titles, a working sans for prose, and the monospace
eyebrow that runs through the whole interface like a ticker: section labels,
table headers, captions, methodology notes. Colour belongs to the data;
the interface itself speaks in one warm amber, sparingly.

**Key Characteristics:**

- Dark only, dense, editorial; charts foregrounded, chrome restrained
- Opaque matte surfaces, square corners, hairline borders — no glassmorphism
- Serif display / sans body / mono eyebrow three-voice typography
- Tabular numerals everywhere data appears
- Sentiment carried by perceptually-uniform OKLCH ramps, never by hue alone
- Methodology visible, uncertainty named in words

Component authors: the binding, lint-enforced authoring rules live in
[Authoring Rules](#authoring-rules-lint-enforced) at the end of this file.

## Colors

An ink-dark neutral field where colour is reserved for meaning: one warm accent
for the interface's own voice, cool steel for comparison, and the sentiment
ramps — the real palette — for the data.

### Primary

- **Wire Amber** (`oklch(0.78 0.13 80)`, strong `oklch(0.72 0.15 78)`): the
  editorial accent — reads as "investigative wire", not "brand". The single
  primary action, focus rings, text selection, the active nav rail, the active
  state of segmented toggles. Defined as `--accent` with a `--color-primary-*`
  ramp (200–700) around it.

### Secondary

- **Comparison Steel** (`oklch(0.7 0.08 240)`): muted steel-blue that pairs the
  two-model comparison views; the `--color-secondary-*` ramp (300–600) and
  `--status-info` share its hue. A magenta sidekick
  (`--sentiment-comparison-accent`, `oklch(0.74 0.12 320)`) exists only inside
  comparison charts.

### Tertiary

- **Arbiter Amber** (`oklch(0.74 0.16 75)`): the judge's colour, deliberately
  more saturated than the centrality ramp it neighbours; arbiter views only.
  Verdict and confidence badge hues (emerald/purple/blue/gray,
  green/yellow/red) are preserved Tailwind v4 values kept verbatim for
  continuity with published figures — see `--verdict-*` and `--confidence-*`.

### Neutral

- **Ink Slate** (`oklch(0.16 0.012 260)`, elevated `oklch(0.19 0.014 260)`):
  the page backdrop — flat, slightly cool, no radial brand glows.
- **Card surfaces** (`oklch(0.205 → 0.235 0.012 260)`): the opaque panel
  ladder — card, card-hover, card-elevated — plus a nested step
  (`oklch(0.175 0.011 260)`) for panels inside panels.
- **Text ladder**: an opacity ladder over `--text-primary`
  (`oklch(0.97 0.005 260)`) — secondary 84%, muted 64% (the AA floor for body
  text), subtle 46% (decorative only), disabled 30% (disabled controls only),
  and opaque `--text-faint` (`oklch(0.42 0.005 260)`) for decorative marks.
- **Borders**: white mixed at 8/13/20/28/36% over transparent
  (subtle → default → hover → active → strong). Hairlines, always 1px.

### Data palettes

The heart of the system, built as perceptually-uniform OKLCH ramps in
`app.css` (the construction reasoning lives there, next to the values):

- **Polarity** (diverging): red ↔ green through a low-chroma blue neutral,
  plus a grey `Non applicable`.
- **Subjectivity** (sequential, scores 1–5): cool/calm objective →
  warm/loud subjective.
- **Centrality** (sequential): single-hue amber, more central = brighter.

Every data colour has `-bg` and `-border` companions mixed at 16%/32% over
transparent (18%/36% at ramp poles) — fills for badges and chips that keep the
foreground value legible.

**The Two Inks Rule.** Wire Amber is the interface's ink; the sentiment ramps
are the data's ink. The accent never fills a chart, and a data colour never
decorates chrome. If amber appears inside a plot, something is wrong.

**The Equal-Lightness Rule.** The polarity poles sit at equal OKLCH lightness
so a `Très négatif` bar reads no brighter than a `Très positif` bar at equal
area. Red and green therefore differ only in hue — which is why sentiment is
never carried by hue alone (glyphs and words always accompany it).

**The Chart Hex Rule.** ECharts and MapLibre cannot parse `oklch()`,
`color-mix()` or CSS variables. Chart-facing colour is duplicated as hex in
`chartTheme.ts`, each value annotated with the `// oklch(...)` it mirrors, and
`chartTheme.palette.test.ts` fails the build if the copies drift.

## Typography

**Display Font:** Source Serif 4 (with Georgia fallback)
**Body Font:** Public Sans (stylistic set ss01; system-ui fallback)
**Label/Mono Font:** JetBrains Mono (ui-monospace fallback)

**Character:** an editorial three-voice pairing — the serif carries the byline
voice on titles, the sans does the working prose, and the mono eyebrow is the
wire ticker that labels everything. Tabular numerals are enabled globally
(`font-variant-numeric: tabular-nums`), so columns of statistics align by
default.

### Hierarchy

- **Display / view title** (700, 1.625rem/26px, line-height 1.15,
  tracking −0.018em, serif): one per view, set by `ViewContent`.
- **Title / chart-card title** (600, 1.0625rem → 1.25rem at ≥640px,
  tracking −0.008em, serif): panel headers; large/comparison variants step up
  to 1.625rem.
- **Body** (400, 0.9375rem/15px, line-height 1.55, sans): prose and controls;
  paragraphs capped at `--prose-width` (65ch).
- **Eyebrow / label** (600, 0.6875rem/11px, uppercase, tracking 0.08em, mono):
  section labels, table `th`, chip captions, chart notes, badges.
- The full size scale runs 11/12/13/15/17/20/26/34/46px with ~1.33× steps
  between display sizes; 34px (`--font-size-3xl`) and the 46px hero-numeric
  step are reserved for hero statistics.

**The Eyebrow Rule.** The 11px mono uppercase eyebrow is the smallest type in
the app and the floor — nothing goes below it. If content does not fit, the
control needs less content, not smaller text.

**The Tabular Rule.** Numerals are tabular everywhere data appears, and
numbers are localised per language. A proportional numeral in a stat column is
a defect.

## Layout

Three breakpoints — **640, 1024, 1280** — `min-width` only, mobile-first.
Tailwind's scale is redefined to the same three (`md:` and `2xl:` are removed),
so the two dialects cannot disagree. At 1024px the filter rail and sidebar
become permanent; at 1280px the sidebar defaults to expanded
(collapsed 4.5rem / expanded 14rem, drawer 16rem). The header is a declared
6rem tall and the sticky filter rail clears it by reading the same token.

Spacing runs on a 4px primitive scale, but components reach for the semantic
layer first: `--pad-card` (20px), `--pad-card-compact` (16px, dense contexts),
`--gap-stack` (16px between stacked blocks), `--gap-inline` (8px between
inline siblings). Chart grids use
`repeat(auto-fit, minmax(var(--width-chart-min), 1fr))` with a 25rem floor —
auto-fit handles the reflow, so no media query restates it.

**The Container Rule.** A component inside the 320px filter rail never
branches on viewport width — it asks its container
(`@container filter-rail (max-width: …)`). In JavaScript, `MediaQuery` from
`svelte/reactivity`, never a one-shot `window.innerWidth` read.

## Elevation & Depth

Lightness first, shadows whisper. Depth on this dark surface is conveyed by
the opaque surface ladder (backdrop → nested → card → card-hover →
card-elevated), not by drop shadows: a resting card carries only a 1px
hairline of black at 35% (`--elevation-card`), and hover adds a soft
`8px/24px` lift. There is no inset highlight and no `backdrop-filter` — those
were glassmorphism cues and the panels are matte.

### Shadow Vocabulary

- **`--elevation-card`** (`0 1px 2px` black 35%): resting cards.
- **`--elevation-card-hover`** (+ `0 8px 24px` black 22%): hovered cards.
- **`--elevation-sticky`**: sticky table headers and the filter rail.
- **`--elevation-modal`**: dialogs.
- **`--elevation-drawer` / `--elevation-drawer-mirrored`**: off-canvas
  drawers; a hairline edge plus a wide lift off the scrim.
- **`--ring-focus`**: the 3px Wire Amber focus ring (error variant in red).

**The Mirrored Drawer Rule.** A drawer's shadow falls onto the page it
covers, so a right-edge drawer casts left. The two drawer tokens are mirror
images differing only in the sign of the x-offset — edit them together, and
never reach for one token to serve both edges.

## Shapes

Square editorial surfaces. The radius vocabulary is four tokens with jobs, not
a t-shirt scale: **none** (0 — inputs, table cells, flush edges), **hairline**
(1px — chips and badges), **panel** (2px — cards, panels, buttons: the default
surface corner), **circle** (9999px — true circles only: dots, spinner rings;
a pill wants `panel`, not `circle`). Borders are 1px hairlines from the
white-mix ladder; the one thicker mark in the system is the 3px Wire Amber
rail on the active nav item. Chart caveats sit above a 1px *dashed* hairline —
the footnote rule of the system.

## Components

Controls are **set, not styled**: typographic, square-cornered, quiet until
engaged. There is no global `.btn` — every control declares its own box
(see Authoring Rule 6).

### Cards (`ChartCard`)

- **Corner:** panel (2px); opaque `surface-card` fill; 1px `border-subtle`.
- **Shadow:** `--elevation-card` at rest; hover brightens the border, not the
  shadow.
- **Header:** eyebrow + serif title over a hairline; body padding `--space-3`
  (mobile) → `--space-4`; large/comparison variants step padding and title up.

### Buttons & toggles

- Self-carried boxes: `inline-flex`, own padding/gap/radius per component.
- Segmented toggles (chart-type, view toggles): a `surface-nested` track with
  2px padding; buttons are mono uppercase 12px, hairline radius, transparent
  at rest, `surface-hover` on hover, Wire Amber text on `--accent-soft` when
  active (`data-active`).

### Filter chips

- Hairline radius, `--space-1-5 --space-3` padding, 13px medium text.
- Unselected: `surface-subtle` fill, `border-default`, secondary text.
- Selected: painted entirely by the three resolver variables
  (`--sentiment-fg/-bg/-border`) from the `data-*` attribute — one rule, no
  per-value classes.

### Inputs / Selects

- `.select`: panel radius, `surface-muted` fill, `border-default`; hover
  brightens both; focus swaps the border to Wire Amber under `--ring-focus`.
  `.select-sm` is the compact toolbar variant.

### Navigation

- `nav-item`: transparent at rest with muted text; tonal `surface-hover` on
  hover; active state is a 14% Wire Amber tonal fill plus the 3px accent rail
  (`::before`, inset 20% top/bottom) with the icon tinted amber. State rides
  `data-state`, never class concatenation.

### Tables

- The wire idiom: sticky mono uppercase 11px headers on an **opaque**
  `surface-card-elevated` fill (translucency lets rows read through), hairline
  row separators, row hover in `surface-muted`, tabular numerals throughout.
- The container paints CSS-only scroll shadows so a sideways-scrollable table
  is visibly scrollable.

### Badges & alerts

- Badges: hairline radius, 12px medium, tinted `-bg`/`-border` fills from the
  value's ramp.
- Alerts: tinted fill + 1px hairline border, no side stripe; a leading Lucide
  icon (16–18px) in the alert colour carries the status cue.

### Signature: the sentiment resolver

One rule set in `app.css` maps `data-polarity` / `data-subjectivity` /
`data-centrality` attributes to `--sentiment-fg/-bg/-border`; components emit
attributes via `utils/sentimentTokens.ts` and read the three variables. Chips,
badges, table cells and tooltips all draw from it, and tooltip swatches add a
per-value glyph (`POLARITY_GLYPHS`) plus the value's name in words.

**The One Resolver Rule.** No component maps a sentiment value to a colour
itself — ever. Emit the data attribute; read the three variables.

## Do's and Don'ts

### Do:

- **Do** reach for semantic tokens first (`--pad-card`, `--gap-stack`,
  `--font-size-eyebrow`); numbered primitives are for one-off nudges.
- **Do** label sections, tables and captions in the mono eyebrow voice —
  it is the system's signature.
- **Do** keep every surface opaque and every border a 1px hairline.
- **Do** name sentiment in words and shapes alongside colour, and keep
  tooltips glyph-marked.
- **Do** guard all motion behind `prefers-reduced-motion`, including
  scroll behaviour.
- **Do** keep French and English layouts equal — copy must survive ~30%
  expansion without breaking.

### Don't:

- **Don't** use SaaS tells: gradient pill buttons, rainbow icon backgrounds,
  purple→blue gradients, marketing hero panels, identical elevate-everything
  card grids, emoji in chrome.
- **Don't** use glassmorphism — no `backdrop-filter`, no translucent panels,
  no inset highlights.
- **Don't** put Wire Amber in a chart or a sentiment colour in chrome
  (the Two Inks Rule).
- **Don't** invent radii, breakpoints, or font sizes outside the declared
  vocabularies.
- **Don't** ship a light theme; `color-scheme` is dark and the palettes
  assume it.
- **Don't** let a component ask the viewport what its container knows
  (the Container Rule).

---

## Authoring Rules (lint-enforced)

Six rules. They are the ones that actually constrain someone writing a Svelte
component, which is why they are here rather than in a comment at the top of a
1200-line stylesheet that a component author never opens.

`npm run lint` enforces rules 1, 2, 3 and 6 mechanically
([`scripts/check-design-tokens.mjs`](ma-visualisation-sentiments/scripts/check-design-tokens.mjs)).
A rule nobody can violate does not need to be remembered.

The reasoning behind the palettes — why the polarity ramp is equal-lightness at
the poles, why surfaces are opaque, why the type scale steps the way it does —
lives in `src/app.css` next to the values. This file is the contract; that file
is the argument.

### 1. Tailwind sets layout. Nothing else.

Allowed: `flex` `grid` `items-*` `justify-*` `gap-*` `hidden` `w-*` `max-w-*`
and the rest of the geometry.

Not allowed: **any** colour utility — `text-white/60`, `text-amber-400`,
`bg-surface-700`, `border-white/10`. Every property that carries design meaning
goes through a token, in a scoped `<style>` block.

This is the rule that was missing. "Never hardcode colours" read as though it
were only about hex, so a hundred Tailwind colour utilities walked straight past
it and the newest views drifted furthest.

### 2. Colour, type, spacing and motion come from tokens.

No raw hex, `rgb()`, `hsl()`, no raw `rem`/`px` font sizes, no raw `em`
letter-spacing, no raw millisecond durations. The one legitimate place for a
colour literal is the right-hand side of a token definition in `app.css` — that
_is_ the token layer.

Exceptions exist and are listed, with reasons, in the check script: ECharts and
MapLibre cannot parse `oklch()`, so chart-facing colour is duplicated as hex.
That duplication is guarded by `chartTheme.palette.test.ts`, which fails the
build if the two copies drift.

Reach for the semantic tokens before the primitives: `--pad-card`,
`--gap-stack`, `--font-size-eyebrow`, `--width-chart-min`. The numbered scales
(`--space-4`, and so on) exist to define those and to handle one-off nudges.

### 3. Never write `var(--token, fallback)`.

A fallback turns a missing token into silence. `--elevation-overlay` and
`--text-faint` both shipped referenced-but-never-defined; CSS threw the whole
declaration away and the elements silently inherited, for months, with no tool
complaining.

If a component needs a themable knob, declare it with its default on the
component's root selector and reference it plainly:

```css
.spinner {
	--spinner-accent: var(--color-primary-500); /* component API */
	border-top-color: var(--spinner-accent);
}
```

That also puts the default in one place instead of repeating it at every use
site — `RangeSlider` had the same fallback written out five times.

### 4. Ask the container, not the viewport.

Three breakpoints — **640**, **1024**, **1280** — `min-width` only, mobile-first.
Tailwind's scale is redefined to match, so the two dialects cannot disagree.

A component inside the 320px filter rail must never branch on viewport width: it
sees the window, not the column it lives in. Use
`@container filter-rail (max-width: …)`. This shipped as a bug twice while it was
only a convention.

The same applies to JavaScript: use `MediaQuery` from `svelte/reactivity`, not a
one-shot `window.innerWidth` read in `onMount`. A width read once is a width that
is wrong as soon as the window is resized.

### 5. State goes in `data-*`, not in concatenated class names.

```svelte
<button class="nav-item" data-state={isActive ? 'active' : 'inactive'}>
```

not `class:active={isActive}`. It reads the same in the DOM inspector as in the
stylesheet, and it composes with the sentiment resolver below.

**Sentiment colour has exactly one resolver.** Never map a value to a token in a
component. Emit the data attribute from `utils/sentimentTokens.ts` and read
`--sentiment-fg` / `-bg` / `-border`; `app.css` resolves them. The same shape
applies to discrepancy severity (`utils/discrepancy.ts` → `--discrepancy-*`).
This is the strongest rule in the codebase and the model for the rest.

### 6. Every control carries its own layout.

There is no global `.btn`. A component that needs a button declares its own
`display`, padding, gap and radius in its `<style>` block, the way
`.control-btn`, `.csv-export-btn` and `.view-toggle` already do.

The failure this closes is quiet in a way the others are not. `class="btn btn-sm
view-toggle"` survived Skeleton's removal in three places, and those buttons lost
their entire box: a `<button>` with an icon and a label falls back to `display:
inline` and stacks one on top of the other. The class names are valid strings,
the markup is valid HTML, and the compiler, `svelte-check`, `eslint` and the
tests all pass. Only a person looking at the screen can see it — which is why
`check-design-tokens.mjs` now fails on a watched class name that neither
`app.css` nor the component itself defines.

Shared component classes are legitimate, but they live in `app.css` and are
defined once: `.select-sm` had been copied into two components with two different
corner radii, and a third component used it without defining it at all.

---

## Accessibility floors

- `--text-muted` is the floor for text. `--text-subtle` (~3:1) is for decorative
  rules and icon strokes beside a real label; `--text-disabled` (~2:1) is for the
  disabled state of a control and nothing else.
- 11px (`--font-size-eyebrow`) is the smallest type in the app. Nothing goes
  below it — if it does not fit, the control needs less content, not smaller text.
- Controls are `--size-control-lg` (40px) in the header and in any touch context.
  Never shrink a target on a smaller screen.
- Guard motion behind `prefers-reduced-motion`, including `scroll-behavior`.
- Sentiment must not be carried by hue alone. The polarity ramp is
  equal-lightness at the poles by design, so red and green differ only in hue —
  chart swatches therefore also carry a shape, and every tooltip names the value
  in words.
