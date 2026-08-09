/**
 * Comparison Store Unit Tests
 *
 * Tests the comparison logic including:
 * - Discrepancy calculations (core business logic)
 * - Score mappings for polarity and centrality
 * - Comparison state management
 */
import { describe, it, expect } from 'vitest';
import type { SentimentAnalysis } from '$lib/types/data';
// Test the REAL shipped function — this file previously exercised a local
// re-implementation, which silently preserved bugs the real code had.
import { calculateDiscrepancies } from './derivations';

// ============================================
// calculateDiscrepancies Tests
// ============================================

describe('calculateDiscrepancies', () => {
	const createAnalysis = (overrides: Partial<SentimentAnalysis> = {}): SentimentAnalysis => ({
		centralite_islam_musulmans: 'Central',
		centralite_justification: 'Test justification',
		subjectivite_score: 3,
		subjectivite_justification: 'Test justification',
		polarite: 'Neutre',
		polarite_justification: 'Test justification',
		...overrides
	});

	describe('null handling', () => {
		it('returns zeros when modelA is null', () => {
			const result = calculateDiscrepancies(null, createAnalysis());
			expect(result.totalDiff).toBe(0);
			expect(result.hasConflict).toBe(false);
		});

		it('returns zeros when modelB is null', () => {
			const result = calculateDiscrepancies(createAnalysis(), null);
			expect(result.totalDiff).toBe(0);
			expect(result.hasConflict).toBe(false);
		});

		it('returns zeros when both are null', () => {
			const result = calculateDiscrepancies(null, null);
			expect(result.totalDiff).toBe(0);
			expect(result.hasConflict).toBe(false);
		});

		it('returns zeros when both are undefined', () => {
			const result = calculateDiscrepancies(undefined, undefined);
			expect(result.totalDiff).toBe(0);
		});
	});

	describe('identical analyses', () => {
		it('returns zero discrepancy when analyses are identical', () => {
			const analysis = createAnalysis();
			const result = calculateDiscrepancies(analysis, analysis);

			expect(result.polarityDiff).toBe(0);
			expect(result.subjectivityDiff).toBe(0);
			expect(result.centralityDiff).toBe(0);
			expect(result.totalDiff).toBe(0);
			expect(result.hasConflict).toBe(false);
		});
	});

	describe('polarity differences', () => {
		it('calculates correct diff for adjacent polarities (1 step)', () => {
			const modelA = createAnalysis({ polarite: 'Positif' });
			const modelB = createAnalysis({ polarite: 'Neutre' });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.polarityDiff).toBe(1);
		});

		it('calculates correct diff for extreme polarities (4 steps)', () => {
			const modelA = createAnalysis({ polarite: 'Très positif' });
			const modelB = createAnalysis({ polarite: 'Très négatif' });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.polarityDiff).toBe(4);
		});

		it('excludes Non applicable polarity from comparison', () => {
			const modelA = createAnalysis({ polarite: 'Non applicable' });
			const modelB = createAnalysis({ polarite: 'Neutre' });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.polarityDiff).toBe(0);
			expect(result.isComparable).toBe(false);
		});
	});

	describe('subjectivity differences', () => {
		it('calculates correct diff for adjacent scores (1 step)', () => {
			const modelA = createAnalysis({ subjectivite_score: 3 });
			const modelB = createAnalysis({ subjectivite_score: 4 });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.subjectivityDiff).toBe(1);
		});

		it('calculates correct diff for extreme scores (4 steps)', () => {
			const modelA = createAnalysis({ subjectivite_score: 1 });
			const modelB = createAnalysis({ subjectivite_score: 5 });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.subjectivityDiff).toBe(4);
		});

		it('skips the subjectivity dimension when either score is missing', () => {
			// Regression: a missing score used to be coerced to 0, manufacturing
			// a spurious 4-point gap (and false "significant conflicts" sent to
			// the paid arbiter). The dimension is now skipped instead.
			const modelA = createAnalysis({ subjectivite_score: null });
			const modelB = createAnalysis({ subjectivite_score: 4 });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.subjectivityDiff).toBe(0);
			expect(result.hasConflict).toBe(false);
		});
	});

	describe('centrality differences', () => {
		it('calculates correct diff for adjacent centralities (1 step)', () => {
			const modelA = createAnalysis({ centralite_islam_musulmans: 'Central' });
			const modelB = createAnalysis({ centralite_islam_musulmans: 'Très central' });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.centralityDiff).toBe(1);
		});

		it('excludes Non abordé centrality from comparison', () => {
			const modelA = createAnalysis({ centralite_islam_musulmans: 'Très central' });
			const modelB = createAnalysis({ centralite_islam_musulmans: 'Non abordé' });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.centralityDiff).toBe(0);
			expect(result.isComparable).toBe(false);
		});
	});

	describe('total discrepancy', () => {
		it('sums all dimension differences', () => {
			const modelA = createAnalysis({
				polarite: 'Positif', // score 4
				subjectivite_score: 2,
				centralite_islam_musulmans: 'Central' // score 4
			});
			const modelB = createAnalysis({
				polarite: 'Neutre', // score 3, diff = 1
				subjectivite_score: 5, // diff = 3
				centralite_islam_musulmans: 'Marginal' // score 2, diff = 2
			});
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.polarityDiff).toBe(1);
			expect(result.subjectivityDiff).toBe(3);
			expect(result.centralityDiff).toBe(2);
			expect(result.totalDiff).toBe(6); // 1 + 3 + 2
		});
	});

	describe('hasConflict flag', () => {
		it('is false when all diffs are less than 3', () => {
			const modelA = createAnalysis({
				polarite: 'Positif',
				subjectivite_score: 3,
				centralite_islam_musulmans: 'Central'
			});
			const modelB = createAnalysis({
				polarite: 'Neutre', // diff = 1
				subjectivite_score: 5, // diff = 2
				centralite_islam_musulmans: 'Secondaire' // diff = 1
			});
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.hasConflict).toBe(false);
		});

		it('is true when polarity diff is 3 or more', () => {
			const modelA = createAnalysis({ polarite: 'Très positif' }); // 5
			const modelB = createAnalysis({ polarite: 'Négatif' }); // 2
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.polarityDiff).toBe(3);
			expect(result.hasConflict).toBe(true);
		});

		it('is true when subjectivity diff is 3 or more', () => {
			const modelA = createAnalysis({ subjectivite_score: 1 });
			const modelB = createAnalysis({ subjectivite_score: 4 });
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.subjectivityDiff).toBe(3);
			expect(result.hasConflict).toBe(true);
		});

		it('is true when centrality diff is 3 or more', () => {
			const modelA = createAnalysis({ centralite_islam_musulmans: 'Très central' }); // 5
			const modelB = createAnalysis({ centralite_islam_musulmans: 'Marginal' }); // 2
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.centralityDiff).toBe(3);
			expect(result.hasConflict).toBe(true);
		});

		it('excludes the row when any categorical dimension is non-comparable', () => {
			const modelA = createAnalysis({
				polarite: 'Très positif',
				subjectivite_score: 1,
				centralite_islam_musulmans: 'Très central'
			});
			const modelB = createAnalysis({
				polarite: 'Très négatif', // diff = 4
				subjectivite_score: 5, // diff = 4
				centralite_islam_musulmans: 'Non abordé' // diff = 4
			});
			const result = calculateDiscrepancies(modelA, modelB);

			expect(result.hasConflict).toBe(false);
			expect(result.totalDiff).toBe(0);
			expect(result.isComparable).toBe(false);
		});
	});
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
	it('treats missing categorical values as non-comparable', () => {
		const modelA: SentimentAnalysis = {
			centralite_islam_musulmans: null,
			centralite_justification: '',
			subjectivite_score: null,
			subjectivite_justification: '',
			polarite: null,
			polarite_justification: ''
		};
		const modelB: SentimentAnalysis = {
			centralite_islam_musulmans: 'Central',
			centralite_justification: 'Test',
			subjectivite_score: 3,
			subjectivite_justification: 'Test',
			polarite: 'Neutre',
			polarite_justification: 'Test'
		};

		// Should not throw
		const result = calculateDiscrepancies(modelA, modelB);
		expect(result.isComparable).toBe(false);
		expect(result.totalDiff).toBe(0);
	});

	it('handles unknown polarity values', () => {
		const modelA: SentimentAnalysis = {
			centralite_islam_musulmans: 'Central',
			centralite_justification: 'Test',
			subjectivite_score: 3,
			subjectivite_justification: 'Test',
			polarite: 'Unknown Value' as unknown as SentimentAnalysis['polarite'],
			polarite_justification: 'Test'
		};
		const modelB: SentimentAnalysis = {
			centralite_islam_musulmans: 'Central',
			centralite_justification: 'Test',
			subjectivite_score: 3,
			subjectivite_justification: 'Test',
			polarite: 'Neutre',
			polarite_justification: 'Test'
		};

		const result = calculateDiscrepancies(modelA, modelB);
		// Unknown value defaults to 0, Neutre is 3, so diff = 3
		expect(result.polarityDiff).toBe(3);
	});
});
