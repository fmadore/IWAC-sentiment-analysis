/**
 * Utility functions for extreme analysis data management
 */

import type { DatasetId } from '$lib/types/data';
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
 * On-disk shape of the extreme-analysis files: article payloads are stored
 * once in `articles_index` and categories reference them by id, because an
 * article can appear in several categories (the denormalized form duplicated
 * ~7MB per file). The app-facing `ExtremeAnalysisData` shape (with embedded
 * `articles` arrays) is reconstructed at load time so nothing downstream
 * changes.
 */
interface RawExtremeCategoryAnalysis extends Omit<ExtremeCategoryAnalysis, 'articles'> {
	article_ids: string[];
}

interface RawExtremeAnalysisData extends Omit<ExtremeAnalysisData, 'analysis'> {
	articles_index: Record<string, ExtremeArticle>;
	analysis: Record<ExtremeCategory, RawExtremeCategoryAnalysis>;
}

/** Rebuild the in-memory shape from the normalized on-disk file (exported for tests). */
export function denormalizeExtremeAnalysis(raw: RawExtremeAnalysisData): ExtremeAnalysisData {
	const index = raw.articles_index ?? {};
	const analysis = {} as ExtremeAnalysisData['analysis'];
	for (const key of Object.keys(raw.analysis) as ExtremeCategory[]) {
		const { article_ids, ...rest } = raw.analysis[key];
		analysis[key] = {
			...rest,
			articles: (article_ids ?? []).map((id) => index[id]).filter(Boolean)
		};
	}
	return { model: raw.model, analysis, statistics: raw.statistics, facets: raw.facets };
}

/**
 * Load extreme analysis data for a specific model
 */
export async function loadExtremeAnalysisData(
	model: DatasetId,
	fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): Promise<ExtremeAnalysisData> {
	const filePath = `/data/iwac_extreme_analysis_${model}.json`;
	const resolvedPath = filePath.startsWith('http') ? filePath : `${base}${filePath}`;
	const response = await fetchFunction(resolvedPath);
	if (!response.ok) {
		throw new Error(`Failed to load extreme analysis data for ${model}: ${response.statusText}`);
	}
	return denormalizeExtremeAnalysis(await response.json());
}

/**
 * Configuration for extreme categories with display properties.
 * Colours mirror the OKLCH-derived editorial sentiment palette in app.css /
 * chartTheme.ts so the extremes view stays coherent with the rest of the
 * dashboard. Hex values (not OKLCH) because ECharts/zrender needs them.
 */
export const extremeCategoryConfigs: ExtremeCategoryConfig[] = [
	{
		id: 'subjectivity_extreme_high',
		labelKey: 'extremeAnalysis.categories.subjectivityHigh',
		color: '#E76444', // subjectivity_5 — warm, loud
		gradient: 'linear-gradient(135deg, #E76444 0%, #D2833B 100%)'
	},
	{
		id: 'subjectivity_extreme_low',
		labelKey: 'extremeAnalysis.categories.subjectivityLow',
		color: '#7AAEBF', // subjectivity_1 — cool, calm
		gradient: 'linear-gradient(135deg, #7AAEBF 0%, #56AFB3 100%)'
	},
	{
		id: 'polarity_very_negative',
		labelKey: 'extremeAnalysis.categories.polarityNegative',
		color: '#E64343', // polarity_very_negative
		gradient: 'linear-gradient(135deg, #E64343 0%, #E97871 100%)'
	},
	{
		id: 'polarity_very_positive',
		labelKey: 'extremeAnalysis.categories.polarityPositive',
		color: '#00A245', // polarity_very_positive
		gradient: 'linear-gradient(135deg, #00A245 0%, #5CB572 100%)'
	},
	{
		id: 'centrality_very_central',
		labelKey: 'extremeAnalysis.categories.centralityHigh',
		color: '#F3B94C', // centrality_very_central — bright amber
		gradient: 'linear-gradient(135deg, #F3B94C 0%, #CA9C48 100%)'
	},
	{
		id: 'centrality_not_central',
		labelKey: 'extremeAnalysis.categories.centralityLow',
		color: '#4E4D4A', // centrality_not_addressed — dark neutral
		gradient: 'linear-gradient(135deg, #4E4D4A 0%, #75674F 100%)'
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
