# Refactoring Roadmap — IWAC Sentiment Analysis

## Completed

### Phase 1: Dead Code Removal
- Deleted `src/lib/utils/pwa.ts` (8 unused PWA functions)
- Deleted `src/lib/types/pwa.ts` (unused PWA type definitions)
- Removed `TRANSLATION_KEY_TO_FRENCH_MAP` from `src/lib/i18n/utils.ts`
- Inlined `ExtendedServiceWorkerRegistration` type in `PWAManager.svelte` (was only consumer of `pwa.ts`)

### Phase 2: Chart Tooltip Formatter Extraction
- Created `src/lib/utils/chartFormatters.ts` with 4 factory functions:
  - `createPieTooltipFormatter()` — pie charts with color dot + name + value + percent
  - `createStackedBarTooltipFormatter()` — stacked bar with header + sorted items + total
  - `createTrendTooltipFormatter()` — trend/line charts with conditional total
  - `createSimpleTooltipFormatter()` — single-item tooltip with key-value pair
- Updated 7 chart components to use shared formatters (~150 lines removed)

### Phase 3: Pagination Composable Extraction
- Created `src/lib/utils/pagination.svelte.ts` with `createPagination()` composable
- Updated `ArticleTable.svelte` and `ComparisonTable.svelte` (~160 lines removed)
- Auto-reset to page 1 on filter changes built into the composable

### Phase 4: Accessibility Fix
- Added `prefers-reduced-motion` support to `ArbiterMethodology.svelte` modal

### Phase 5: Skipped
- Chart container classes are already consistent across standard charts (7/11 use same pattern)
- Differences in Arbiter charts and KeywordFrequencyChart are intentional (different contexts)

### Phase 6: AnalysisInfo Decomposition
- Created `src/lib/utils/accordion.svelte.ts` with `createAccordion()` composable
- Created `src/lib/components/common/PromptModal.svelte` shared modal component
- Extracted prompt modal from `AnalysisInfo.svelte` into shared `PromptModal`
- Applied accordion composable to `AnalysisInfo.svelte`
- Reduced from 1202 to 985 lines (~18% reduction)

### Phase 7: ArbiterMethodology Decomposition
- Applied accordion composable to `ArbiterMethodology.svelte`
- Extracted prompt modal into shared `PromptModal`
- Reduced from 849 to 715 lines (~16% reduction)

---

## Future Work

| Phase | Scope | Priority | Effort |
|-------|-------|----------|--------|
| 6b | Further split AnalysisInfo: extract MethodologySection (model cards, config) | MEDIUM | Medium |
| 8 | Extract shared ModelComparisonStatsCard from ComparisonStats + ArbiterStatsCards | MEDIUM | Medium |
| 9 | Dual runes+writable store pattern consolidation | LOW | Large |
| 10 | Python preprocessing cleanup (data-fetch.py model mapping, extreme-analysis.py structure init) | LOW | Small |
