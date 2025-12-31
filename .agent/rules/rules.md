# Antigravity Agent Instructions - IWAC Sentiment Analysis

## Project Overview

This is a **SvelteKit** application for visualizing sentiment analysis results on the Islam West Africa Collection (IWAC) corpus. It features comparative analysis between AI models (ChatGPT, Gemini, Mistral), multilingual support (French/English), and comprehensive filtering and export capabilities.

## Tech Stack

- **Framework**: SvelteKit with static adapter for GitHub Pages deployment
- **Language**: TypeScript with strict mode
- **UI Framework**: Skeleton UI v4 with Tailwind CSS v4
- **State Management**: Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`)
- **Charts**: ECharts via svelte-echarts
- **Icons**: Lucide Svelte (`@lucide/svelte`)
- **Build Tool**: Vite 7

---

## Core Principles

### 1. Svelte 5 Runes (MANDATORY)

**ALWAYS use Svelte 5 syntax. NEVER use Svelte 4 syntax.**

```svelte
<script lang="ts">
  // ✅ CORRECT: Svelte 5 Runes
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  $effect(() => {
    console.log('Count changed:', count);
  });
  
  let { title, onClose } = $props<{ title: string; onClose: () => void }>();
  let { value = $bindable() } = $props<{ value: string }>();
</script>

<!-- ✅ CORRECT: onclick not on:click -->
<button onclick={() => count++}>Click</button>

<!-- ❌ WRONG: Do NOT use -->
<!-- export let, $: reactive, on:click -->
```

### 2. Global CSS Custom Properties

**Use CSS custom properties from `app.postcss`. Never hardcode colors or timing values.**

```css
/* ✅ CORRECT */
background: color-mix(in oklab, var(--color-surface-900) 70%, transparent);
transition: all var(--timing-normal) var(--easing-default);
backdrop-filter: blur(var(--glass-blur-md));

/* ❌ WRONG */
background: rgba(15, 23, 42, 0.7);
transition: all 250ms ease;
```

#### Available Custom Properties

**Timing:**
- `--timing-fast` (150ms), `--timing-normal` (250ms), `--timing-slow` (350ms)
- `--easing-default` (cubic-bezier(0.4, 0, 0.2, 1))

**Glass Blur:**
- `--glass-blur-sm` (8px), `--glass-blur-md` (16px), `--glass-blur-lg` (24px), `--glass-blur-xl` (32px)

**Sentiment Colors (always use these for sentiment styling):**
- `--sentiment-polarity-{very-positive|positive|neutral|negative|very-negative|na}`
- `--sentiment-polarity-{value}-bg`, `--sentiment-polarity-{value}-border`
- `--sentiment-subjectivity-{1-5}`, `--sentiment-subjectivity-{n}-bg`
- `--sentiment-centrality-{very-central|central|secondary|marginal|not-addressed}`
- `--sentiment-arbiter`, `--sentiment-discrepancy`

### 3. Data Attributes for State

**Use `data-*` attributes instead of conditional class concatenation.**

```svelte
<!-- ✅ CORRECT -->
<button class="nav-tab" data-state={isActive ? "active" : "inactive"}>
<button class="filter-chip" data-selected={isSelected}>

<!-- ❌ WRONG -->
<button class="nav-tab {isActive ? 'active' : ''}">
```

### 4. Modern CSS with color-mix()

**Always use `color-mix()` for transparent variations, not `rgba()`.**

```css
/* ✅ CORRECT */
background: color-mix(in oklab, var(--color-surface-900) 70%, transparent);
border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);

/* ❌ WRONG */
background: rgba(15, 23, 42, 0.7);
```

### 5. Skeleton UI v4 Compound Components

```svelte
<script lang="ts">
  import { AppBar, Avatar, Accordion } from '@skeletonlabs/skeleton-svelte';
</script>

<!-- ✅ CORRECT: Compound pattern -->
<AppBar class="bg-transparent">
  <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
    <AppBar.Lead>...</AppBar.Lead>
    <AppBar.Headline>...</AppBar.Headline>
    <AppBar.Trail>...</AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
```

### 6. Glass Morphism Design

Use the preset glass classes or the design patterns:

```svelte
<!-- Using global classes -->
<div class="preset-glass rounded-xl p-4">
<div class="preset-glass-lg">

<!-- Or using reusable components -->
<GlassCard variant="default" hover gradientBorder>
</GlassCard>
```

---

## Component Architecture

### File Organization

```
src/lib/components/
├── common/        # Base reusable: FilterCard, FilterChip, GlassCard, SentimentBadge
├── layout/        # Layout: AppHeader, FiltersPanel, SidebarNav, ViewContent
├── ui/            # UI controls: DatasetPicker, CSVExportButton, LanguageSwitcher
├── viz/           # Charts: SentimentChart, CentralityHeatmap, CorrelationChart
├── filters/       # Filter components: CountryFilter, PolarityFilter, etc.
├── data-display/  # Data display: ArticleTable, ArticleDetail, ComparisonView
└── index.ts       # Main barrel export
```

### Import Patterns

```svelte
<script lang="ts">
  // ✅ CORRECT: Import from barrel exports
  import { FilterCard, FilterChip, SentimentBadge } from '$lib/components/common';
  import { SentimentChart, VolumeChart } from '$lib/components/viz';
  
  // ✅ ALSO CORRECT: Import from main barrel
  import { FilterCard, SentimentChart } from '$lib/components';
  
  // ❌ AVOID: Long individual imports
  import FilterCard from '$lib/components/common/FilterCard.svelte';
</script>
```

### Component Template

```svelte
<!--
  ComponentName Component
  
  Brief description of what this component does.
  
  Usage:
  <ComponentName prop1="value" prop2={data} />
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface ComponentProps {
    /** Prop description */
    propName: string;
    /** Optional prop with default */
    optionalProp?: boolean;
    /** Child content */
    children?: Snippet;
  }

  let { 
    propName,
    optionalProp = false,
    children
  }: ComponentProps = $props();
</script>

<div class="component-root" data-state={optionalProp ? "active" : "inactive"}>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .component-root {
    /* Use CSS custom properties */
    transition: all var(--timing-normal) var(--easing-default);
  }
  
  .component-root[data-state="active"] {
    /* Active state styles */
  }
  
  @media (prefers-reduced-motion: reduce) {
    .component-root {
      transition: none;
    }
  }
</style>
```

---

## Reusable Component Patterns

### FilterCard - Filter Container

```svelte
<FilterCard 
  title={$t.filters.myFilter}
  showClear={selectedItems.length > 0}
  onClear={() => selectedItems = []}
>
  {#snippet chips()}
    {#each options as option}
      <FilterChip 
        label={option.label}
        selected={selectedItems.includes(option.value)}
        variant={option.variant}
        onclick={() => toggle(option.value)}
      />
    {/each}
  {/snippet}
</FilterCard>
```

### FilterChip - Semantic Variants

```svelte
<FilterChip variant="polarity-positive" label="Positif" selected={true} />
<FilterChip variant="subjectivity-3" label="3" selected={false} />
<FilterChip variant="centrality-central" label="Central" selected={true} />
```

### SentimentBadge - Display Values

```svelte
<SentimentBadge type="polarity" value="Très positif" />
<SentimentBadge type="subjectivity" value={3} />
<SentimentBadge type="centrality" value="Central" size="sm" />
```

### GlassCard - Container

```svelte
<GlassCard variant="default" hover gradientBorder>
  Card content
</GlassCard>

<GlassCard variant="large" padding="lg">
  Chart content
</GlassCard>
```

---

## Store Patterns

### Using Stores with Runes

```svelte
<script lang="ts">
  import { selectedDataset, countryFilters } from '$lib/stores';
  
  // Use $ prefix to subscribe in templates
</script>

<p>Dataset: {$selectedDataset}</p>
<p>Filters: {$countryFilters.join(', ')}</p>
```

### Derived Stores

```typescript
import { derived } from 'svelte/store';

export const filteredArticles = derived(
  [currentDatasetArticles, countryFilters, journalFilters],
  ([$articles, $countries, $journals]) => {
    return $articles.filter(article => {
      // Filter logic
    });
  }
);
```

---

## Icon Usage

```svelte
<script lang="ts">
  // Import from specific path for tree-shaking
  import MenuIcon from '@lucide/svelte/icons/menu';
  import SearchIcon from '@lucide/svelte/icons/search';
</script>

<MenuIcon size={20} />
<SearchIcon class="size-6" />
```

---

## Accessibility Guidelines

- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<nav>`, `<main>`, `<header>`)
- Ensure keyboard navigation works (`tabindex`, `onkeydown`)
- Provide focus indicators (`:focus-visible` styles are global)

---

## Naming Conventions

- **Components**: PascalCase (`ArticleTable.svelte`)
- **Files**: kebab-case for utilities (`url-state.ts`)
- **CSS Classes**: kebab-case (`glass-card`, `nav-tab-mobile`)
- **Props**: camelCase (`activeView`, `onClose`)
- **Events**: camelCase with 'on' prefix (`onChange`, `onValueChange`)

---

## Common Gotchas

1. **Store subscriptions**: Use `$` prefix in templates, not in script logic
2. **Effect cleanup**: Return cleanup function from `$effect` if needed
3. **Props mutation**: Don't mutate props directly; use callbacks or `$bindable`
4. **Skeleton v4**: Components use compound pattern (e.g., `AppBar.Toolbar`, not props)
5. **Tailwind v4**: No `tailwind.config.js` needed; config is in CSS

---

## MCP Tools

When developing, use these MCP tools for accurate documentation:

1. **Context7** (`mcp_context7_query-docs`): Get latest documentation for any library
   - First call `resolve-library-id` to get the library ID
   - Then call `query-docs` with specific questions

---

## Project-Specific Data

### Sentiment Values (French)

**Polarity**: Très positif, Positif, Neutre, Négatif, Très négatif, Non applicable
**Subjectivity**: 1 (Very Objective) to 5 (Very Subjective)
**Centrality**: Très central, Central, Secondaire, Marginal, Non abordé

### Available Datasets

- `chatgpt`: ChatGPT analysis
- `gemini`: Gemini analysis  
- `mistral`: Mistral analysis

### Comparison Pairs

- `chatgpt-gemini`
- `chatgpt-mistral`
- `gemini-mistral`
