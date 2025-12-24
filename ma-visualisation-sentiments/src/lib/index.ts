/**
 * Library Entry Point
 * 
 * Central export for all library modules.
 * Components are now organized in subfolders - import from there for better tree-shaking.
 * 
 * Usage:
 * import { selectedDataset, countryFilters } from '$lib';
 * import { SentimentChart, VolumeChart } from '$lib/components/viz';
 * import { CountryFilter, PolarityFilter } from '$lib/components/filters';
 * import { ArticleTable, ArticleDetail } from '$lib/components/data-display';
 */

// Stores and state management
export * from './stores';
export * from './urlState';

// Utilities
export * from './utils';
export * from './utils/extremeAnalysis';

// Types
export * from './types/data';
export * from './types/extremeAnalysis';

// i18n
export * from './i18n';

// Re-export types for convenience
export type { Article } from './types/data';
export type { ExtremeCategory, KeywordType, ExtremeArticle } from './types/extremeAnalysis';
