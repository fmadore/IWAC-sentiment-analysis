# Design rules

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

---

## 1. Tailwind sets layout. Nothing else.

Allowed: `flex` `grid` `items-*` `justify-*` `gap-*` `hidden` `w-*` `max-w-*`
and the rest of the geometry.

Not allowed: **any** colour utility — `text-white/60`, `text-amber-400`,
`bg-surface-700`, `border-white/10`. Every property that carries design meaning
goes through a token, in a scoped `<style>` block.

This is the rule that was missing. "Never hardcode colours" read as though it
were only about hex, so a hundred Tailwind colour utilities walked straight past
it and the newest views drifted furthest.

## 2. Colour, type, spacing and motion come from tokens.

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

## 3. Never write `var(--token, fallback)`.

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

## 4. Ask the container, not the viewport.

Three breakpoints — **640**, **1024**, **1280** — `min-width` only, mobile-first.
Tailwind's scale is redefined to match, so the two dialects cannot disagree.

A component inside the 320px filter rail must never branch on viewport width: it
sees the window, not the column it lives in. Use
`@container filter-rail (max-width: …)`. This shipped as a bug twice while it was
only a convention.

The same applies to JavaScript: use `MediaQuery` from `svelte/reactivity`, not a
one-shot `window.innerWidth` read in `onMount`. A width read once is a width that
is wrong as soon as the window is resized.

## 5. State goes in `data-*`, not in concatenated class names.

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

## 6. Every control carries its own layout.

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
