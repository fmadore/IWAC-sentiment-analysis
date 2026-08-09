import { describe, expect, it } from 'vitest';
import fixtures from '$lib/data/discrepancy-v1-fixtures.json';
import type { SentimentAnalysis } from '$lib/types/data';
import { calculateDiscrepancies } from './derivations';
import { TOTAL_DISCREPANCY_MAXIMUM } from '$lib/domain/sentimentContract';

const fullAnalysis = (value: (typeof fixtures)[number]['analysisA']): SentimentAnalysis => ({
	...value,
	polarite: value.polarite as SentimentAnalysis['polarite'],
	centralite_islam_musulmans:
		value.centralite_islam_musulmans as SentimentAnalysis['centralite_islam_musulmans'],
	subjectivite_score: value.subjectivite_score as SentimentAnalysis['subjectivite_score'],
	polarite_justification: null,
	subjectivite_justification: null,
	centralite_justification: null
});

describe('shared v1 discrepancy contract', () => {
	for (const fixture of fixtures) {
		it(fixture.name, () => {
			const result = calculateDiscrepancies(
				fullAnalysis(fixture.analysisA),
				fullAnalysis(fixture.analysisB)
			);
			expect(result).toEqual({
				polarityDiff: fixture.expected.polarity,
				subjectivityDiff: fixture.expected.subjectivity,
				centralityDiff: fixture.expected.centrality,
				totalDiff: fixture.expected.total,
				hasConflict: fixture.expected.conflict,
				isComparable: fixture.expected.comparable
			});
		});
	}

	it('documents the maximum comparable total', () => {
		expect(Math.max(...fixtures.map((fixture) => fixture.expected.total))).toBe(
			TOTAL_DISCREPANCY_MAXIMUM
		);
	});
});
