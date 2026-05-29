import { describe, it, expect } from 'vitest';
import type { Article } from '$lib/types/data';
import { aggregateByJournalAndDimension, getSubjectivityLabel } from './chartAggregators';

function article(id: number, journal: string, polarite: string | null): Article {
	return {
		'o:id': id,
		journal_source: journal,
		Newspaper: journal,
		Country: 'Bénin',
		sentiment_analysis: polarite
			? {
					centralite_islam_musulmans: 'Central',
					centralite_justification: null,
					subjectivite_score: 3,
					subjectivite_justification: null,
					polarite,
					polarite_justification: null
				}
			: null,
		dataset_id: 'chatgpt'
	};
}

const labels = ['Positif', 'Neutre', 'Négatif'];

describe('aggregateByJournalAndDimension', () => {
	it('groups counts by journal with every label pre-seeded', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', 'Positif'), article(2, 'A', 'Neutre'), article(3, 'B', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.newspaperList).toEqual(['A', 'B']);
		expect(result.articlesAnalyzed).toBe(3);
		expect(result.newspaperCounts.A).toEqual({ Positif: 1, Neutre: 1, Négatif: 0 });
		expect(result.newspaperCounts.B).toEqual({ Positif: 1, Neutre: 0, Négatif: 0 });
	});

	it('skips articles whose key resolver returns null', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', null), article(2, 'A', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.newspaperList).toEqual(['A']);
	});

	it('ignores keys not present in the label set', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'A', 'Inconnu')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		// counted as analysed (journal seen) but no label bucket incremented
		expect(result.articlesAnalyzed).toBe(1);
		expect(result.newspaperCounts.A).toEqual({ Positif: 0, Neutre: 0, Négatif: 0 });
	});

	it('sorts the journal list', () => {
		const result = aggregateByJournalAndDimension(
			[article(1, 'Zebra', 'Positif'), article(2, 'Alpha', 'Positif')],
			labels,
			(a) => a.sentiment_analysis?.polarite ?? null
		);
		expect(result.newspaperList).toEqual(['Alpha', 'Zebra']);
	});
});

describe('getSubjectivityLabel', () => {
	it('maps 1-5 to French labels', () => {
		expect(getSubjectivityLabel(1)).toBe('Factuel');
		expect(getSubjectivityLabel(2)).toBe('Plutôt factuel');
		expect(getSubjectivityLabel(3)).toBe('Mixte');
		expect(getSubjectivityLabel(4)).toBe('Plutôt subjectif');
		expect(getSubjectivityLabel(5)).toBe('Subjectif');
	});

	it('falls back to "Non applicable" for null/unknown', () => {
		expect(getSubjectivityLabel(null)).toBe('Non applicable');
		expect(getSubjectivityLabel(undefined)).toBe('Non applicable');
		expect(getSubjectivityLabel(0)).toBe('Non applicable');
	});
});
