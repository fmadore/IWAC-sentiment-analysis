/**
 * Components Barrel Export
 *
 * Central export point for all components.
 * Provides clean import paths throughout the application.
 *
 * Usage:
 * import { FilterCard, SentimentBadge, SentimentChart } from '#lib/components/index.js';
 * import { CountryFilter, PolarityFilter } from '#lib/components/filters/index.js';
 * import { ArticleTable, ArticleDetail } from '#lib/components/data-display/index.js';
 *
 * Application code does not: it imports each component from its own file.
 * A Svelte component module is not provably side-effect-free, so importing one
 * name from a barrel ties every component it re-exports into the importer's
 * chunk — the detail modals and arbiter panels used to ride along on every
 * cold load that way. Barrels remain for tests and external consumers.
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
