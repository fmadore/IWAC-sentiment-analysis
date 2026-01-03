---
description: How to write and run unit tests for the sentiment visualization app
---

# Testing Workflow

## Overview
This project uses **Vitest** as the testing framework, integrated with SvelteKit.

## Running Tests

// turbo
### Watch Mode (Development)
```bash
cd ma-visualisation-sentiments; npm run test
```
This runs Vitest in watch mode - tests re-run on file changes.

// turbo
### Single Run (CI/Pre-commit)
```bash
cd ma-visualisation-sentiments; npm run test:run
```
Runs all tests once and exits.

## Test File Location

- Place test files next to the code they test
- Use the naming convention: `*.test.ts` or `*.spec.ts`
- Example: `arbiter.svelte.ts` → `arbiter.test.ts`

## Writing Tests

### Basic Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from '$lib/path/to/module';

describe('functionToTest', () => {
  it('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Testing Store Logic
Since Svelte stores use runes that need a component context, test the **pure logic** separately:

```typescript
// Extract testable pure functions
function mapCountsToModels(counts, metadata) {
  // Pure logic without Svelte dependencies
}

describe('mapCountsToModels', () => {
  it('handles model_a_is_first = true', () => {
    // Test the pure function
  });
});
```

### Mocking Svelte Modules
The project has mocks in `src/mocks/`:
- `app-paths.ts` - Mock for `$app/paths`

Add new mocks as needed and configure in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '$app/paths': resolve('./src/mocks/app-paths.ts'),
    '$app/stores': resolve('./src/mocks/app-stores.ts'), // example
  }
}
```

## Test Patterns for This Project

### 1. Type/Data Functions
Test pure functions from `types/data.ts`:
```typescript
import { getModelsFromPair } from '$lib/types/data';

it('returns correct models for pair', () => {
  expect(getModelsFromPair('chatgpt-gemini')).toEqual(['chatgpt', 'gemini']);
});
```

### 2. Store Logic
Test the mapping/transformation logic in stores:
```typescript
// Test that model_a_is_first flag is respected
it('swaps counts when model_a_is_first is false', () => {
  const result = mapCountsToModels(counts, { model_a_is_first: false });
  expect(result.firstModelPreferred).toBe(counts.model_b);
});
```

### 3. Utility Functions
Test i18n helpers, formatters, validators, etc.

## CI Integration
Tests run automatically in GitHub Actions before deployment. See `.github/workflows/deploy.yml`.

## Adding New Tests

1. Create `*.test.ts` file next to the module
2. Import from vitest: `describe`, `it`, `expect`
3. Write tests for pure functions first
4. Use mocks for Svelte-specific imports
5. Run `npm run test:run` to verify
