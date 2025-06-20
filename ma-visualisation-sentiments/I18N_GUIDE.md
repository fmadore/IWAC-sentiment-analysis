# Internationalization (i18n) Guide

This guide explains how to use the internationalization system implemented in the sentiment analysis application.

## Overview

The application now supports multiple languages (French and English) with a comprehensive translation system that covers:

- UI labels and navigation
- Chart titles and descriptions
- Filter labels and sentiment values
- Error messages and notifications
- Analysis methodology descriptions

## Architecture

### Core Files

- `src/lib/i18n/index.ts` - Main i18n store and functions
- `src/lib/i18n/types.ts` - TypeScript interfaces for translations
- `src/lib/i18n/fr.ts` - French translations (default)
- `src/lib/i18n/en.ts` - English translations
- `src/lib/i18n/utils.ts` - Utility functions for sentiment value mapping

### Components

- `src/lib/components/ui/LanguageSwitcher.svelte` - Language selection dropdown
- Updated filter components with translation support
- Updated chart components with translated labels

## Usage

### Basic Translation

```svelte
<script>
  import { t } from '$lib/i18n';
</script>

<h1>{$t.appTitle}</h1>
<p>{$t.appSubtitle}</p>
```

### Nested Translation Keys

```svelte
<script>
  import { t } from '$lib/i18n';
</script>

<h2>{$t.nav.charts}</h2>
<button>{$t.filters.clearAll}</button>
<span>{$t.analysis.methodology}</span>
```

### Sentiment Value Translation

For components that work with sentiment data (which is stored in French), use the utility functions:

```svelte
<script>
  import { translateSentimentValue, getSentimentLabels } from '$lib/i18n/utils';
  import { currentLanguage } from '$lib/i18n';
  
  // Translate a single sentiment value
  const translatedPolarity = translateSentimentValue(article.sentiment_analysis.polarite, $currentLanguage);
  
  // Get all labels for a category
  const polarityLabels = getSentimentLabels('polarity', $currentLanguage);
  const subjectivityLabels = getSentimentLabels('subjectivity', $currentLanguage);
  const centralityLabels = getSentimentLabels('centrality', $currentLanguage);
</script>
```

### Number Formatting

```svelte
<script>
  import { formatNumber } from '$lib/i18n/utils';
  import { currentLanguage } from '$lib/i18n';
  
  const formattedNumber = formatNumber(1234, $currentLanguage);
  // French: "1 234", English: "1,234"
</script>
```

### Language Switching

```svelte
<script>
  import { switchLanguage } from '$lib/i18n';
  
  function changeToEnglish() {
    switchLanguage('en');
  }
  
  function changeToFrench() {
    switchLanguage('fr');
  }
</script>
```

## Data Handling

### Important Note on Sentiment Values

The application data is stored with French sentiment values. When working with filters or data operations:

1. **Display**: Use translated values for UI
2. **Filtering**: Convert back to French values for data operations
3. **Storage**: Always store French values

Example:

```svelte
<script>
  import { getFrenchSentimentValue } from '$lib/i18n/utils';
  
  // User selects "Very positive" (English)
  const userSelection = "Very positive";
  
  // Convert to French for data filtering
  const frenchValue = getFrenchSentimentValue(userSelection); // "Très positif"
  
  // Use French value for filtering the data
  polarityFilters.set([frenchValue]);
</script>
```

## Adding New Languages

1. Create a new translation file (e.g., `src/lib/i18n/es.ts` for Spanish)
2. Implement the `Translations` interface
3. Add the language to `LANGUAGES` in `src/lib/i18n/index.ts`
4. Update the translations object to include the new language

Example:

```typescript
// src/lib/i18n/es.ts
import type { Translations } from './types.js';

export const es: Translations = {
  appTitle: 'Análisis de Sentimientos',
  appSubtitle: 'Visualización y exploración de datos de artículos',
  // ... rest of translations
};
```

```typescript
// src/lib/i18n/index.ts
export const LANGUAGES = {
  fr: 'Français',
  en: 'English',
  es: 'Español'  // Add new language
} as const;

const translations: Record<Language, Translations> = {
  fr,
  en,
  es  // Import and add here
};
```

## Adding New Translation Keys

1. Update the `Translations` interface in `src/lib/i18n/types.ts`
2. Add the translations to all language files (`fr.ts`, `en.ts`, etc.)
3. Use the new keys in your components

Example:

```typescript
// types.ts
export interface Translations {
  // ... existing keys
  newSection: {
    title: string;
    description: string;
  };
}
```

```typescript
// fr.ts
export const fr: Translations = {
  // ... existing translations
  newSection: {
    title: 'Nouveau titre',
    description: 'Nouvelle description'
  }
};
```

```typescript
// en.ts
export const en: Translations = {
  // ... existing translations
  newSection: {
    title: 'New title',
    description: 'New description'
  }
};
```

## Best Practices

1. **Consistent Keys**: Use descriptive, hierarchical keys (e.g., `filters.polarity` instead of `pol`)

2. **Sentiment Values**: Always use the utility functions when working with sentiment data

3. **Reactive Updates**: Use `$derived` for computed values that depend on language changes

4. **Error Handling**: The translation function returns the key if translation is missing

5. **Performance**: Translations are cached and reactive, no need to worry about performance

6. **Accessibility**: All translated text maintains proper semantic structure

## Language Persistence

The language selection is persisted through multiple mechanisms:

1. **URL Parameters**: The current language is included in the URL as `?lang=en` or `?lang=fr`
2. **localStorage**: Language preference is saved locally for future visits
3. **Browser Detection**: Automatically detects browser language on first visit

### Priority Order

When determining the initial language, the system follows this priority:

1. **URL Parameter** (highest priority) - `?lang=en`
2. **localStorage** - Previously saved user preference
3. **Browser Language** - Detected from `navigator.language`
4. **Default** (lowest priority) - French (`fr`)

This means that URLs with language parameters will always take precedence, making them perfect for sharing specific language views.

### URL Examples

- `https://example.com/` - Uses default language (French)
- `https://example.com/?lang=en` - Forces English interface
- `https://example.com/?lang=fr&view=charts` - French interface with charts view
- `https://example.com/?lang=en&countries=Niger,Mali&view=table` - English interface with specific filters

The language parameter is automatically added to URLs when users switch languages, ensuring that bookmarks and shared links preserve the language preference.

## Components Updated

The following components have been updated with i18n support:

- ✅ AppHeader.svelte - App title, subtitle, fullscreen button
- ✅ LanguageSwitcher.svelte - Language selection dropdown
- ✅ ClearFiltersButton.svelte - Clear filters button
- ✅ PolarityFilter.svelte - Polarity filter with translated labels
- ✅ SentimentChart.svelte - Chart titles and labels
- ✅ Main page navigation - All tab labels
- ✅ Loading and error messages

### Still To Update

You can extend the i18n support to other components following the same patterns:

- SubjectivityFilter.svelte
- CentralityFilter.svelte
- CountryFilter.svelte
- JournalFilter.svelte
- Other chart components
- ArticleTable.svelte
- ArticleDetail.svelte
- AnalysisInfo.svelte

## Testing

The i18n system is now active. You can:

1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Use the language switcher in the top-right corner
4. Verify that text changes between French and English
5. Check that sentiment filters work correctly in both languages
6. Confirm that charts display translated titles and labels

The system handles all the complexity of mapping between display languages and data storage automatically. 