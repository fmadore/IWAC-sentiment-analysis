/**
 * Utility functions for extreme analysis data management
 */

import { base } from '$app/paths';
import type { ExtremeAnalysisData, ExtremeCategoryConfig, ExtremeCategory } from '$lib/types/extremeAnalysis';

/**
 * Load extreme analysis data for a specific model
 */
export async function loadExtremeAnalysisData(
  model: 'chatgpt' | 'gemini',
  fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): Promise<ExtremeAnalysisData> {
  const filePath = `/data/iwac_extreme_analysis_${model}.json`;
  const resolvedPath = filePath.startsWith('http') ? filePath : `${base}${filePath}`;
  const response = await fetchFunction(resolvedPath);
  if (!response.ok) {
    throw new Error(`Failed to load extreme analysis data for ${model}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Configuration for extreme categories with display properties
 */
export const extremeCategoryConfigs: ExtremeCategoryConfig[] = [
  {
    id: 'subjectivity_extreme_high',
    labelKey: 'extremeAnalysis.categories.subjectivityHigh',
    color: '#DC2626', // red-600
    gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
  },
  {
    id: 'subjectivity_extreme_low',
    labelKey: 'extremeAnalysis.categories.subjectivityLow',
    color: '#2563EB', // blue-600
    gradient: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
  },
  {
    id: 'polarity_very_negative',
    labelKey: 'extremeAnalysis.categories.polarityNegative',
    color: '#991B1B', // red-800
    gradient: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)'
  },
  {
    id: 'polarity_very_positive',
    labelKey: 'extremeAnalysis.categories.polarityPositive',
    color: '#059669', // emerald-600
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
  },
  {
    id: 'centrality_very_central',
    labelKey: 'extremeAnalysis.categories.centralityHigh',
    color: '#7C3AED', // violet-600
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
  },
  {
    id: 'centrality_not_central',
    labelKey: 'extremeAnalysis.categories.centralityLow',
    color: '#6B7280', // gray-500
    gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
  }
];

/**
 * Get configuration for a specific extreme category
 */
export function getExtremeCategoryConfig(categoryId: ExtremeCategory): ExtremeCategoryConfig | undefined {
  return extremeCategoryConfigs.find(config => config.id === categoryId);
}

/**
 * Format number with localization
 */
export function formatNumber(num: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Get top N entries from a keyword frequency object
 */
export function getTopKeywords(
  keywords: Record<string, number>,
  limit: number = 10
): Array<{ keyword: string; count: number }> {
  return Object.entries(keywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
} 