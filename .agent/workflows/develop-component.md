---
description: How to create or modify a Svelte component in the sentiment visualization app
---

# Component Development Workflow

## 1. Pre-Development
- Check `app.postcss` for available CSS custom properties and semantic classes
- Review existing similar components in `src/lib/components/` for patterns
- Identify the appropriate component folder: `common/`, `layout/`, `ui/`, `viz/`, `filters/`, `data-display/`

## 2. Create Component Structure
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  
  // Define props interface
  interface ComponentProps {
    // Props here
    children?: Snippet;
  }
  
  let { /* destructure props */ }: ComponentProps = $props();
</script>

<!-- Template with data-* attributes for state -->

<style>
  /* Component-scoped styles using CSS custom properties */
</style>
```

## 3. Key Patterns to Follow
- Use `$state()`, `$derived()`, `$effect()`, `$props()` (Svelte 5 runes)
- Use `onclick`, `onchange` etc. (not `on:click` Svelte 4 syntax)
- Use `data-*` attributes for state: `data-selected={true}`, `data-state="active"`
- Use CSS custom properties: `var(--timing-normal)`, `var(--glass-blur-md)`
- Use `color-mix()` not `rgba()` for transparency

## 4. Export Component
- Add export to the folder's `index.ts` barrel file
- Add re-export to `src/lib/components/index.ts` if needed

// turbo
## 5. Run Development Server
```bash
cd ma-visualisation-sentiments; npm run dev
```

## 6. Verify Build
// turbo
```bash
cd ma-visualisation-sentiments; npm run build
```
