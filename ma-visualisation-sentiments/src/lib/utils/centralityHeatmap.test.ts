import { describe, expect, it } from 'vitest';
import { CENTRALITY_ORDER, type CentralityValue } from '$lib/domain/sentimentContract';
import type { Article } from '$lib/types/data';
import {
	aggregateCentralityHeatmap,
	HEATMAP_CENTRALITY_MIN,
	HEATMAP_CENTRALITY_MAX
} from './centralityHeatmap';

function article(
	id: number,
	centrality: CentralityValue | null,
	overrides: Partial<Article> = {}
): Article {
	return {
		'o:id': id,
		dataset_id: 'luna',
		Country: 'Bénin',
		publication_date: '2024-01-01',
		sentiment_analysis: {
			centralite_islam_musulmans: centrality,
			centralite_justification: null,
			subjectivite_score: null,
			subjectivite_justification: null,
			polarite: null,
			polarite_justification: null
		},
		...overrides
	} as Article;
}

describe('aggregateCentralityHeatmap', () => {
	it('keeps Not addressed as an observed low rank on the shared scale', () => {
		const result = aggregateCentralityHeatmap([article(1, 'Non abordé')]);
		expect(result.heatmapData).toEqual([[0, 0, CENTRALITY_ORDER['Non abordé'], 1]]);
		expect(result.cells).toEqual([{ country: 'Bénin', year: '2024', meanCentrality: 1, count: 1 }]);
		expect(HEATMAP_CENTRALITY_MIN).toBe(1);
		expect(HEATMAP_CENTRALITY_MAX).toBe(5);
	});

	it('excludes missing and non-applicable ratings from the mean and sample size', () => {
		const result = aggregateCentralityHeatmap([
			article(1, 'Non abordé'),
			article(2, 'Très central'),
			article(3, null),
			article(4, 'Non applicable')
		]);
		expect(result.cells[0]).toMatchObject({ meanCentrality: 3, count: 2 });
		expect(result.articlesAnalyzed).toBe(2);
	});

	it('uses rated n for the minimum and leaves means and axes stable', () => {
		const articles = [
			article(1, 'Central'),
			article(2, 'Très central'),
			article(3, 'Non abordé', { Country: 'Togo', publication_date: '2023' }),
			article(4, null, { Country: 'Togo', publication_date: '2023' })
		];
		const all = aggregateCentralityHeatmap(articles);
		const filtered = aggregateCentralityHeatmap(articles, 2);
		expect(filtered.countries).toEqual(all.countries);
		expect(filtered.years).toEqual(all.years);
		expect(filtered.cells).toEqual([all.cells[0]]);
		expect(filtered.cells[0]).toMatchObject({ meanCentrality: 4.5, count: 2 });
		expect(filtered.heatmapData).toEqual([[1, 0, 4.5, 2]]);
		expect(filtered.hiddenCellCount).toBe(1);
		expect(filtered.articlesAnalyzed).toBe(3);
	});

	it('does not fabricate zero cells where a country has no rated articles in a year', () => {
		const result = aggregateCentralityHeatmap([
			article(1, 'Central', { publication_date: '2023' }),
			article(2, 'Marginal', { Country: 'Togo' })
		]);
		expect(result.countries).toHaveLength(2);
		expect(result.years).toHaveLength(2);
		expect(result.heatmapData).toHaveLength(2);
	});

	it('skips missing country or year without creating synthetic geographic groups', () => {
		const result = aggregateCentralityHeatmap([
			article(1, 'Central', { Country: '' }),
			article(2, 'Central', { publication_date: 'N/A' }),
			article(3, null),
			article(4, 'Non applicable')
		]);
		expect(result.cells).toEqual([]);
		expect(result.articlesAnalyzed).toBe(0);
		expect(result.hiddenCellCount).toBe(0);
	});
});
