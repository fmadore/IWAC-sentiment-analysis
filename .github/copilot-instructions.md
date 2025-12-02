# GitHub Copilot Instructions

## Project Overview

This is a **SvelteKit** application for visualizing sentiment analysis results on the Islam West Africa Collection (IWAC) corpus. It features comparative analysis between ChatGPT and Gemini models, multilingual support (French/English), and comprehensive filtering and export capabilities.

## Tech Stack

- **Framework**: SvelteKit with static adapter for GitHub Pages deployment
- **Language**: TypeScript with strict mode
- **UI Framework**: Skeleton UI v4 with Tailwind CSS v4
- **State Management**: Svelte 5 Runes (`$state`, `$derived`, `$effect`, `$props`)
- **Charts**: ECharts via svelte-echarts
- **Icons**: Lucide Svelte (`@lucide/svelte`)
- **Build Tool**: Vite 7

## Design Philosophy

This project follows a **modern glass morphism design** with consistent semantic coloring for sentiment analysis data.

### Core Principles

1. **Glass Morphism**: Use frosted glass effects with `backdrop-filter: blur()` and semi-transparent backgrounds via `color-mix(in oklab, ...)`.

2. **Semantic Colors**: Sentiment values (polarity, subjectivity, centrality) have **centralized color definitions** in `app.postcss`. Never hardcode sentiment colors in components.

3. **Data Attributes for State**: Use `data-state="active"` and `data-selected="true"` patterns instead of conditional class concatenation.

4. **Modern CSS**: Prefer `color-mix()`, `oklch()`, CSS custom properties over hardcoded hex values and rgba().

5. **Skeleton UI v4 Presets**: Extend but don't duplicate Skeleton's preset system. Custom presets like `.preset-glass` complement Skeleton's built-in presets.

6. **Micro-interactions**: Subtle `translateY(-1px)` on hover, smooth transitions with timing variables.

### CSS Architecture

```
app.postcss
├── CSS Custom Properties (sentiment colors, timing, blur)
├── Base Styles (html, body, focus)
├── Glass Presets (.preset-glass, .preset-glass-lg)
├── Card Enhancements
├── Button Enhancements
├── Navigation Tab System (.nav-tab[data-state])
├── Filter Chip System (.filter-chip[data-selected])
├── Sentiment Badge System (polarity, subjectivity, centrality)
├── Form Elements
├── Table Styling
├── Modal/Dialog System
├── Chart Container
└── Utilities (animations, scrollbar, text)
```

## Svelte 5 Runes Patterns

### ALWAYS use Svelte 5 Runes syntax:

```svelte
<script lang="ts">
  // ✅ CORRECT: Use $state for reactive variables
  let count = $state(0);
  let items = $state<string[]>([]);
  
  // ✅ CORRECT: Use $derived for computed values
  let doubled = $derived(count * 2);
  let filteredItems = $derived(items.filter(i => i.length > 3));
  
  // ✅ CORRECT: Use $effect for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
  
  // ✅ CORRECT: Use $props for component props
  let { title, onClose } = $props<{ title: string; onClose: () => void }>();
  
  // ✅ CORRECT: Use $bindable for two-way binding
  let { value = $bindable() } = $props<{ value: string }>();
</script>
```

### NEVER use legacy Svelte 4 syntax:

```svelte
<script>
  // ❌ WRONG: Do NOT use export let
  export let title;
  
  // ❌ WRONG: Do NOT use $: reactive statements
  $: doubled = count * 2;
  
  // ❌ WRONG: Do NOT use let for reactive state
  let count = 0;
</script>
```

### Event Handlers (Svelte 5)

```svelte
<!-- ✅ CORRECT: Use onclick, onchange, etc. -->
<button onclick={() => count++}>Click</button>
<input onchange={(e) => value = e.target.value} />

<!-- ❌ WRONG: Do NOT use on:click directive -->
<button on:click={() => count++}>Click</button>
```

### Class-based State

```typescript
// ✅ CORRECT: Use $state in classes for reactive properties
class Todo {
  done = $state(false);
  text = $state('');
  
  reset() {
    this.text = '';
    this.done = false;
  }
}
```

## Skeleton UI v4 Patterns

### Component Structure (Compound Components)

```svelte
<script lang="ts">
  import { AppBar, Avatar, Accordion } from '@skeletonlabs/skeleton-svelte';
</script>

<!-- ✅ CORRECT: Use compound component pattern -->
<AppBar class="bg-transparent">
  <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
    <AppBar.Lead>
      <!-- Leading content -->
    </AppBar.Lead>
    <AppBar.Headline>
      <!-- Center content -->
    </AppBar.Headline>
    <AppBar.Trail>
      <!-- Trailing content -->
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>

<!-- ✅ CORRECT: Avatar with fallback -->
<Avatar>
  <Avatar.Image src="..." alt="..." />
  <Avatar.Fallback>SK</Avatar.Fallback>
</Avatar>

<!-- ✅ CORRECT: Accordion with controlled state -->
<Accordion value={openItems} onValueChange={(details) => openItems = details.value}>
  {#each items as item (item.id)}
    <Accordion.Item value={item.id}>
      <h3>
        <Accordion.ItemTrigger>{item.title}</Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent>{item.content}</Accordion.ItemContent>
    </Accordion.Item>
  {/each}
</Accordion>
```

### Styling with Skeleton v4

```svelte
<!-- ✅ CORRECT: Use class prop for styling -->
<Avatar class="rounded-2xl">
  <Avatar.Image src="..." class="grayscale" />
</Avatar>

<!-- ✅ CORRECT: Use preset classes -->
<button class="btn preset-filled-primary-500">Primary</button>
<button class="btn preset-tonal">Tonal</button>
<button class="btn hover:preset-filled">Hover Fill</button>

<!-- ✅ CORRECT: Use data attributes for states -->
<button class="btn data-[state=on]:preset-filled">Toggle</button>
```

## CSS Custom Properties (Design System)

Always use the defined CSS custom properties from `app.postcss`:

### Animation Timing
```css
var(--timing-fast)      /* 150ms */
var(--timing-normal)    /* 250ms */
var(--timing-slow)      /* 350ms */
var(--easing-default)   /* cubic-bezier(0.4, 0, 0.2, 1) */
```

### Glass Blur Intensities
```css
var(--glass-blur-sm)    /* 8px */
var(--glass-blur-md)    /* 16px */
var(--glass-blur-lg)    /* 24px */
var(--glass-blur-xl)    /* 32px */
```

### Semantic Sentiment Colors

**CRITICAL**: Always use these CSS variables for sentiment-related colors to ensure consistency across the app.

#### Polarity Colors
```css
/* Very Positive - Bright green */
var(--sentiment-polarity-very-positive)         /* #22C55E */
var(--sentiment-polarity-very-positive-bg)      /* 20% opacity */
var(--sentiment-polarity-very-positive-border)  /* 35% opacity */

/* Positive - Softer green */
var(--sentiment-polarity-positive)              /* #4ADE80 */
var(--sentiment-polarity-positive-bg)
var(--sentiment-polarity-positive-border)

/* Neutral - Blue */
var(--sentiment-polarity-neutral)               /* #3B82F6 */
var(--sentiment-polarity-neutral-bg)
var(--sentiment-polarity-neutral-border)

/* Negative - Softer red */
var(--sentiment-polarity-negative)              /* #F87171 */
var(--sentiment-polarity-negative-bg)
var(--sentiment-polarity-negative-border)

/* Very Negative - Bright red */
var(--sentiment-polarity-very-negative)         /* #EF4444 */
var(--sentiment-polarity-very-negative-bg)
var(--sentiment-polarity-very-negative-border)

/* Not Applicable - Gray */
var(--sentiment-polarity-na)                    /* #6B7280 */
var(--sentiment-polarity-na-bg)
var(--sentiment-polarity-na-border)
```

#### Subjectivity Colors (Score 1-5)
```css
/* 1 - Very Objective: Cyan/Teal */
var(--sentiment-subjectivity-1)                 /* #06B6D4 */
var(--sentiment-subjectivity-1-bg)
var(--sentiment-subjectivity-1-border)

/* 2 - Rather Objective: Light blue */
var(--sentiment-subjectivity-2)                 /* #22D3EE */

/* 3 - Mixed: Purple/Violet */
var(--sentiment-subjectivity-3)                 /* #8B5CF6 */

/* 4 - Rather Subjective: Orange */
var(--sentiment-subjectivity-4)                 /* #FB923C */

/* 5 - Very Subjective: Deep orange */
var(--sentiment-subjectivity-5)                 /* #F97316 */
```

#### Centrality Colors
```css
/* Very Central: Gold/Yellow */
var(--sentiment-centrality-very-central)        /* #FBBF24 */
var(--sentiment-centrality-very-central-bg)
var(--sentiment-centrality-very-central-border)

/* Central: Amber */
var(--sentiment-centrality-central)             /* #FCD34D */

/* Secondary: Slate/Gray-blue */
var(--sentiment-centrality-secondary)           /* #94A3B8 */

/* Marginal: Cool gray */
var(--sentiment-centrality-marginal)            /* #64748B */

/* Not Addressed: Dark gray */
var(--sentiment-centrality-not-addressed)       /* #475569 */
```

### Using Sentiment Classes

Use the predefined semantic classes for sentiment badges and filter chips:

```svelte
<!-- ✅ CORRECT: Use semantic badge classes -->
<span class="badge sentiment-very-positive">Très positif</span>
<span class="badge sentiment-neutral">Neutre</span>
<span class="badge subjectivity-3">3</span>
<span class="badge centrality-central">Central</span>

<!-- ✅ CORRECT: Use semantic filter chip classes -->
<button 
  class="filter-chip polarity-positive" 
  data-selected={isSelected}
>
  Positif
</button>
```

### Modern CSS Patterns

Use `color-mix()` for transparent variations:
```css
/* ✅ CORRECT: Use color-mix for transparency */
background: color-mix(in oklab, var(--color-surface-900) 70%, transparent);
border: 1px solid color-mix(in oklab, var(--color-surface-50) 12%, transparent);

/* ❌ WRONG: Don't use rgba with hardcoded values */
background: rgba(15, 23, 42, 0.7);
```

Use `data-*` attributes for component states:
```svelte
<!-- ✅ CORRECT: Use data attributes for state -->
<button 
  class="nav-tab" 
  data-state={isActive ? "active" : "inactive"}
>
  Tab
</button>

<button 
  class="filter-chip polarity-positive" 
  data-selected={isSelected}
>
  Filter
</button>
```

## Icon Usage (Lucide Svelte)

```svelte
<script lang="ts">
  // ✅ CORRECT: Import from specific icon path for tree-shaking
  import MenuIcon from '@lucide/svelte/icons/menu';
  import SearchIcon from '@lucide/svelte/icons/search';
  import XIcon from '@lucide/svelte/icons/x';
</script>

<!-- ✅ CORRECT: Use size prop and Tailwind classes -->
<MenuIcon size={20} />
<SearchIcon class="size-6" />
<XIcon size={18} class="text-white" />
```

## Store Patterns

### Using Svelte Stores with Runes

```svelte
<script lang="ts">
  import { selectedDataset, countryFilters } from '$lib/stores';
  
  // ✅ CORRECT: Use $ prefix to subscribe to stores in templates
  // Access store value with $storeName
</script>

<p>Current dataset: {$selectedDataset}</p>
<p>Filters: {$countryFilters.join(', ')}</p>
```

### Creating Derived Stores

```typescript
// In stores.ts
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

## File Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── layout/        # Layout components (AppHeader, FiltersPanel)
│   │   ├── ui/            # UI components (buttons, inputs, modals)
│   │   └── viz/           # Visualization components (charts)
│   ├── i18n/              # Internationalization
│   │   ├── en.ts          # English translations
│   │   ├── fr.ts          # French translations
│   │   └── index.ts       # i18n utilities
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── stores.ts          # Svelte stores
│   └── index.ts           # Library exports
├── routes/
│   ├── +layout.svelte     # Root layout
│   ├── +layout.ts         # Layout data loading
│   ├── +page.svelte       # Main page
│   └── +page.ts           # Page data loading
└── app.postcss            # Global styles
```

## Naming Conventions

- **Components**: PascalCase (`ArticleTable.svelte`, `SentimentChart.svelte`)
- **Files**: kebab-case for utilities (`url-state.ts`), PascalCase for components
- **CSS Classes**: kebab-case (`glass-card`, `nav-tab-mobile`)
- **Props**: camelCase (`activeView`, `onClose`)
- **Events**: camelCase with 'on' prefix (`onChange`, `onValueChange`)

## TypeScript Patterns

```typescript
// ✅ CORRECT: Use interface for component props
interface ArticleTableProps {
  articles: Article[];
  onShowDetails: (details: { article: Article; position: Position }) => void;
}

// ✅ CORRECT: Use $props with type parameter
let { articles, onShowDetails } = $props<ArticleTableProps>();

// ✅ CORRECT: Type event handlers
function handleClick(event: MouseEvent) {
  // ...
}
```

## Accessibility Guidelines

- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<nav>`, `<main>`, `<header>`)
- Ensure keyboard navigation works (`tabindex`, `onkeydown`)
- Provide focus indicators (`:focus-visible` styles are global)

## Performance Considerations

- Use lazy loading for datasets (`loadCurrentDataset`, `loadComparisonDatasets`)
- Implement proper loading states with skeletons
- Use `$derived` for computed values instead of `$effect` for state sync
- Prefer CSS transitions over JavaScript animations
- Use Brotli compression for static assets

## MCP Tools to Use

When developing, use these MCP tools for accurate documentation:

1. **Context7** (`mcp_upstash_conte_get-library-docs`): Get latest documentation for any library
2. **Svelte MCP** (when available): Validate Svelte patterns and get autofixes

## Common Gotchas

1. **Store subscriptions**: Use `$` prefix in templates, not in script logic
2. **Effect cleanup**: Return cleanup function from `$effect` if needed
3. **Props mutation**: Don't mutate props directly; use callbacks or `$bindable`
4. **Skeleton v4**: Components use compound pattern (e.g., `AppBar.Toolbar`, not props)
5. **Tailwind v4**: No `tailwind.config.js` needed; config is in CSS
