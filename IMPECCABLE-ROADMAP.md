# Design follow-ups

Updated 2026-09-08. The repository audit's fifteen findings are implemented; see
[the implementation record](REFACTORING-IMPLEMENTATION-2026-09-08.md) for changes
and validation. This replaces the August Impeccable phase plan and removes its
completed setup, design-contract work and superseded audit instructions.

## Remaining code cleanup

- Remove unnecessary width transitions or replace them with transform-based motion
  in `ArbiterStatsCards.svelte`, `ArbiterV2StatsCards.svelte`,
  `ComparisonStats.svelte` and `SidebarNav.svelte`; also review the shell's motion.
- Replace the CSV export button's bouncing icon with restrained progress feedback,
  preserving reduced-motion support.

These patterns remain in the source; they are not claimed as completed by the
September audit implementation.

## Optional design maintenance

- Refresh `.impeccable/design.json` to reflect the current tokens and components.
- Consider enabling Impeccable's edit-time detector, ignoring the Roboto system-font
  fallback false positive. The hook remains disabled.
- Review first-use orientation and narrow tablet layouts when concrete usability
  evidence warrants another design pass. The completed browser checks cover
  desktop and 390px mobile layouts; they do not establish every intermediate width.

Keep `PRODUCT.md` and `DESIGN.md` as the product and design contracts. Future
changes should preserve bilingual copy, semantic data colours, dense research
layouts, accessibility and the existing verification gates. Further component or
worker extraction should follow demonstrated duplication or measured cost.

Delete this file when the remaining work is completed or explicitly retired.
