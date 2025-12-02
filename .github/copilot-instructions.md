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

```css
/* Spacing */
var(--spacing-xs)    /* 0.25rem */
var(--spacing-sm)    /* 0.5rem */
var(--spacing-md)    /* 1rem */
var(--spacing-lg)    /* 1.5rem */
var(--spacing-xl)    /* 2rem */
var(--spacing-2xl)   /* 3rem */

/* Border Radius */
var(--radius-sm)     /* 0.5rem */
var(--radius-md)     /* 0.75rem */
var(--radius-lg)     /* 1rem */
var(--radius-xl)     /* 1.25rem */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
var(--shadow-2xl)

/* Glass Effects */
var(--glass-bg)           /* rgba(255, 255, 255, 0.08) */
var(--glass-border)       /* rgba(255, 255, 255, 0.12) */
var(--glass-hover-bg)     /* rgba(255, 255, 255, 0.12) */
var(--glass-hover-border) /* rgba(255, 255, 255, 0.2) */

/* Transitions */
var(--transition-fast)    /* 150ms cubic-bezier(0.4, 0, 0.2, 1) */
var(--transition-normal)  /* 250ms cubic-bezier(0.4, 0, 0.2, 1) */
var(--transition-slow)    /* 350ms cubic-bezier(0.4, 0, 0.2, 1) */

/* Accent Colors */
var(--accent-primary)     /* #3B82F6 */
var(--accent-secondary)   /* #8B5CF6 */
var(--accent-tertiary)    /* #10B981 */
```

### Glass Effect Pattern

```svelte
<style>
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-normal);
  }
  
  .glass-card:hover {
    background: var(--glass-hover-bg);
    border-color: var(--glass-hover-border);
    transform: translateY(-2px);
  }
</style>
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
