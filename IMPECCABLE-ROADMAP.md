# Design follow-ups

Updated 2026-09-09. The repository audit's fifteen findings are implemented; see
[the implementation record](REFACTORING-IMPLEMENTATION-2026-09-08.md) for changes
and validation. The September motion cleanup is also done: no layout-driving
property (`width`, `height`, `margin`) is transitioned anywhere in `src/` — the
sidebar rail and page content snap, the rail's labels fade in, the toggle
chevron rotates by transform, `ComparisonStats`' fills animate with
`transform: scaleX`, the stacked arbiter bars set instantly, and the CSV export
button shows the shared `Spinner` with `aria-busy` instead of a bouncing icon.
`.impeccable/design.json` was refreshed on the same date and the detector's two
`layout-transition` ignore entries were retired with the transitions.

## Open decisions (owner's call, not blocked on evidence)

- Enable Impeccable's edit-time detector for this project. It would need one
  ignore for the Roboto system-font fallback false positive; the
  `design-system-font-size: 1.75rem` ignore is still in `.impeccable/config.json`
  and should be reviewed at the same time. The hook remains disabled.
- Review first-use orientation and narrow tablet layouts when concrete usability
  evidence warrants another design pass. The completed browser checks cover
  desktop and 390px mobile layouts, plus a geometry walk of all thirteen views at
  768px and 1024px on 2026-09-09 that found no horizontal overflow (at 1024px the
  permanent rail and collapsed sidebar leave 545px chart cards, above the 400px
  floor). What remains unestablished is usability, not layout.

Keep `PRODUCT.md` and `DESIGN.md` as the product and design contracts. Future
changes should preserve bilingual copy, semantic data colours, dense research
layouts, accessibility and the existing verification gates. Further component or
worker extraction should follow demonstrated duplication or measured cost.

Delete this file when the remaining work is completed or explicitly retired.
