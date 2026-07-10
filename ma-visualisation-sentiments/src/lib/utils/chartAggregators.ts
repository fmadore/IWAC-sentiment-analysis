/**
 * Chart data aggregators
 *
 * Pure helpers shared by the per-journal sentiment/subjectivity charts.
 * Extracted from the chart components so the grouping logic is unit-tested
 * once instead of being copy-pasted into each `$derived.by` block.
 */
import type { Article } from '$lib/types/data';
import { getJournalName } from '$lib/utils/format';

export interface JournalDimensionAggregation {
	/** journal -> { frenchLabel -> count }, every label pre-seeded to 0 */
	newspaperCounts: Record<string, Record<string, number>>;
	/** sorted list of journals that had at least one analysed article */
	newspaperList: string[];
	/** number of articles that contributed a value */
	articlesAnalyzed: number;
}

/**
 * Group articles by journal and by a sentiment dimension label.
 *
 * `getKey` returns the French dimension label for an article, or `null` to
 * skip it (e.g. the dimension was not analysed). Counts are only incremented
 * for keys present in `frenchLabels`, matching the original per-chart logic.
 */
export function aggregateByJournalAndDimension(
	articles: Article[],
	frenchLabels: string[],
	getKey: (article: Article) => string | null
): JournalDimensionAggregation {
	const newspaperCounts: Record<string, Record<string, number>> = {};
	const uniqueNewspapers = new Set<string>();
	let articlesAnalyzed = 0;

	articles.forEach((article) => {
		const key = getKey(article);
		if (key === null) return;

		const journal = getJournalName(article);
		uniqueNewspapers.add(journal);

		if (!newspaperCounts[journal]) {
			newspaperCounts[journal] = Object.fromEntries(frenchLabels.map((l) => [l, 0]));
		}
		if (Object.prototype.hasOwnProperty.call(newspaperCounts[journal], key)) {
			newspaperCounts[journal][key]++;
		}
		articlesAnalyzed++;
	});

	return {
		newspaperCounts,
		newspaperList: Array.from(uniqueNewspapers).sort(),
		articlesAnalyzed
	};
}

/** Numeric subjectivity score (1-5) to the French label used in the data. */
export function getSubjectivityLabel(score: number | null | undefined): string {
	switch (score) {
		case 1:
			return 'Factuel';
		case 2:
			return 'Plutôt factuel';
		case 3:
			return 'Mixte';
		case 4:
			return 'Plutôt subjectif';
		case 5:
			return 'Subjectif';
		default:
			return 'Non applicable';
	}
}
