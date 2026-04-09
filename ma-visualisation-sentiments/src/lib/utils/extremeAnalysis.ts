/**
 * Utility functions for extreme analysis data management
 */

import { base } from '$app/paths';
import type {
	ExtremeAnalysisData,
	ExtremeCategoryConfig,
	ExtremeCategory,
	ExtremeCategoryAnalysis,
	ExtremeStatistics,
	ExtremeArticle
} from '$lib/types/extremeAnalysis';

/**
 * Load extreme analysis data for a specific model
 */
export async function loadExtremeAnalysisData(
	model: 'chatgpt' | 'gemini' | 'mistral',
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
export function getExtremeCategoryConfig(
	categoryId: ExtremeCategory
): ExtremeCategoryConfig | undefined {
	return extremeCategoryConfigs.find((config) => config.id === categoryId);
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

/**
 * Filter extreme analysis data based on country and journal filters
 */
export function filterExtremeAnalysisData(
	data: ExtremeAnalysisData | null,
	countryFilters: string[],
	journalFilters: string[]
): ExtremeAnalysisData | null {
	if (!data) return null;

	// If no filters are applied, return the original data
	if (countryFilters.length === 0 && journalFilters.length === 0) {
		return data;
	}

	// Create a new filtered analysis data structure
	const filteredData: ExtremeAnalysisData = {
		model: data.model,
		analysis: {} as ExtremeAnalysisData['analysis'],
		statistics: { ...data.statistics },
		facets: { ...data.facets }
	};

	// Filter each category
	Object.entries(data.analysis).forEach(([categoryKey, categoryData]) => {
		const filteredCategoryData = filterCategoryAnalysis(
			categoryData,
			countryFilters,
			journalFilters
		);
		filteredData.analysis[categoryKey as ExtremeCategory] = filteredCategoryData;
	});

	// Update global statistics based on filtered data
	filteredData.statistics = calculateFilteredStatistics(filteredData.analysis);

	return filteredData;
}

/**
 * Filter a single category analysis
 */
function filterCategoryAnalysis(
	categoryData: ExtremeCategoryAnalysis,
	countryFilters: string[],
	journalFilters: string[]
): ExtremeCategoryAnalysis {
	// Filter articles based on country and journal filters
	const filteredArticles = categoryData.articles.filter((article: ExtremeArticle) => {
		// Apply country filter
		if (countryFilters.length > 0 && !countryFilters.includes(article.country)) {
			return false;
		}

		// Apply journal filter
		if (journalFilters.length > 0 && !journalFilters.includes(article.newspaper)) {
			return false;
		}

		return true;
	});

	// Recalculate keyword frequencies based on filtered articles
	const subjectKeywords: Record<string, number> = {};
	const spatialKeywords: Record<string, number> = {};

	filteredArticles.forEach((article: ExtremeArticle) => {
		// Count subject keywords
		article.subject_keywords.forEach((keyword: string) => {
			subjectKeywords[keyword] = (subjectKeywords[keyword] || 0) + 1;
		});

		// Count spatial keywords
		article.spatial_keywords.forEach((keyword: string) => {
			spatialKeywords[keyword] = (spatialKeywords[keyword] || 0) + 1;
		});
	});

	// Recalculate facet distributions
	const byCountry: Record<string, number> = {};
	const byNewspaper: Record<string, number> = {};

	filteredArticles.forEach((article: ExtremeArticle) => {
		byCountry[article.country] = (byCountry[article.country] || 0) + 1;
		byNewspaper[article.newspaper] = (byNewspaper[article.newspaper] || 0) + 1;
	});

	// Recalculate keywords by facet
	const keywordsByCountry: Record<
		string,
		{ subject: Record<string, number>; spatial: Record<string, number> }
	> = {};
	const keywordsByNewspaper: Record<
		string,
		{ subject: Record<string, number>; spatial: Record<string, number> }
	> = {};

	filteredArticles.forEach((article: ExtremeArticle) => {
		// Initialize country entry if needed
		if (!keywordsByCountry[article.country]) {
			keywordsByCountry[article.country] = { subject: {}, spatial: {} };
		}

		// Initialize newspaper entry if needed
		if (!keywordsByNewspaper[article.newspaper]) {
			keywordsByNewspaper[article.newspaper] = { subject: {}, spatial: {} };
		}

		// Count keywords by country
		article.subject_keywords.forEach((keyword: string) => {
			keywordsByCountry[article.country].subject[keyword] =
				(keywordsByCountry[article.country].subject[keyword] || 0) + 1;
		});
		article.spatial_keywords.forEach((keyword: string) => {
			keywordsByCountry[article.country].spatial[keyword] =
				(keywordsByCountry[article.country].spatial[keyword] || 0) + 1;
		});

		// Count keywords by newspaper
		article.subject_keywords.forEach((keyword: string) => {
			keywordsByNewspaper[article.newspaper].subject[keyword] =
				(keywordsByNewspaper[article.newspaper].subject[keyword] || 0) + 1;
		});
		article.spatial_keywords.forEach((keyword: string) => {
			keywordsByNewspaper[article.newspaper].spatial[keyword] =
				(keywordsByNewspaper[article.newspaper].spatial[keyword] || 0) + 1;
		});
	});

	return {
		subject: subjectKeywords,
		spatial: spatialKeywords,
		by_country: byCountry,
		by_newspaper: byNewspaper,
		keywords_by_country: keywordsByCountry,
		keywords_by_newspaper: keywordsByNewspaper,
		articles: filteredArticles
	};
}

/**
 * Calculate statistics for filtered data
 */
function calculateFilteredStatistics(
	analysis: Record<ExtremeCategory, ExtremeCategoryAnalysis>
): ExtremeStatistics {
	return {
		total_articles: Object.values(analysis).reduce((total, categoryData) => {
			return total + categoryData.articles.length;
		}, 0),
		subjectivity_high_count: analysis.subjectivity_extreme_high?.articles.length || 0,
		subjectivity_low_count: analysis.subjectivity_extreme_low?.articles.length || 0,
		polarity_very_negative_count: analysis.polarity_very_negative?.articles.length || 0,
		polarity_very_positive_count: analysis.polarity_very_positive?.articles.length || 0,
		centrality_very_central_count: analysis.centrality_very_central?.articles.length || 0,
		centrality_not_central_count: analysis.centrality_not_central?.articles.length || 0
	};
}
