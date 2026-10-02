import { CENTRALITY_ORDER, type CentralityValue } from '$lib/domain/sentimentContract';
import type { Article } from '$lib/types/data';
import { extractYear } from './chartAggregators';

/** The numeric centrality scale excludes the explicit non-applicable verdict. */
export const HEATMAP_CENTRALITY_VALUES = Object.entries(CENTRALITY_ORDER)
	.filter(([, score]) => score >= 1)
	.sort((a, b) => a[1] - b[1])
	.map(([label]) => label as Exclude<CentralityValue, 'Non applicable'>);

export const HEATMAP_CENTRALITY_MIN = Math.min(
	...HEATMAP_CENTRALITY_VALUES.map((label) => CENTRALITY_ORDER[label])
);
export const HEATMAP_CENTRALITY_MAX = Math.max(
	...HEATMAP_CENTRALITY_VALUES.map((label) => CENTRALITY_ORDER[label])
);

export interface CentralityHeatmapCell {
	country: string;
	year: string;
	meanCentrality: number;
	count: number;
}

/**
 * Means use the shared contract's 1–5 ranks, including Non abordé = 1.
 * Missing and Non applicable ratings do not contribute to the mean or its n.
 * The threshold hides sparse cells without changing their means or the axes.
 */
export function aggregateCentralityHeatmap(articles: Article[], minimumCount = 0) {
	const groups = new Map<string, Map<string, { total: number; count: number }>>();
	let articlesAnalyzed = 0;
	for (const article of articles) {
		const year = extractYear(article);
		const country = article.Country;
		const label = article.sentiment_analysis?.centralite_islam_musulmans;
		const score = label ? CENTRALITY_ORDER[label] : undefined;
		if (!year || !country || score === undefined || score < HEATMAP_CENTRALITY_MIN) continue;
		let countryGroups = groups.get(country);
		if (!countryGroups) {
			countryGroups = new Map();
			groups.set(country, countryGroups);
		}
		const cell = countryGroups.get(year) ?? { total: 0, count: 0 };
		cell.total += score;
		cell.count++;
		countryGroups.set(year, cell);
		articlesAnalyzed++;
	}

	const countries = [...groups.keys()].sort();
	const years = [...new Set([...groups.values()].flatMap((group) => [...group.keys()]))].sort();
	const cells: CentralityHeatmapCell[] = [];
	const heatmapData: [number, number, number, number][] = [];
	let hiddenCellCount = 0;
	for (const [y, country] of countries.entries()) {
		for (const [x, year] of years.entries()) {
			const cell = groups.get(country)?.get(year);
			if (!cell) continue;
			if (cell.count < minimumCount) {
				hiddenCellCount++;
				continue;
			}
			const meanCentrality = cell.total / cell.count;
			cells.push({ country, year, meanCentrality, count: cell.count });
			heatmapData.push([x, y, meanCentrality, cell.count]);
		}
	}
	return { countries, years, cells, heatmapData, articlesAnalyzed, hiddenCellCount };
}
