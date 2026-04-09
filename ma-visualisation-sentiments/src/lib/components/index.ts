/**
 * Components Barrel Export
 *
 * Central export point for all components.
 * Provides clean import paths throughout the application.
 *
 * Usage:
 * import { FilterCard, SentimentBadge, SentimentChart } from '$lib/components';
 * import { CountryFilter, PolarityFilter } from '$lib/components/filters';
 * import { ArticleTable, ArticleDetail } from '$lib/components/data-display';
 */

// Common - Base reusable components
export * from './common';

// Layout - Page structure components
export * from './layout';

// Filters - All filter components
export * from './filters';

// Data Display - Article and comparison views
export * from './data-display';

// Visualization - Charts and data viz
export * from './viz';

// UI - General UI utilities and pickers
export * from './ui';

// Utility Components
export { default as SEOHead } from './SEOHead.svelte';
export { default as PWAManager } from './PWAManager.svelte';
