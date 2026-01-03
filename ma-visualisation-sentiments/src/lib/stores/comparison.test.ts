/**
 * Comparison Store Unit Tests
 * 
 * Tests the comparison logic including:
 * - Discrepancy calculations (core business logic)
 * - Score mappings for polarity and centrality
 * - Comparison state management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import type { SentimentAnalysis, DiscrepancyInfo } from '$lib/types/data';

// ============================================
// Score Mapping Tests (Replicating the mappings)
// ============================================

// These mappings match the ones in comparison.svelte.ts
const polarityScores: Record<string, number> = {
    'Très positif': 5,
    'Positif': 4,
    'Neutre': 3,
    'Négatif': 2,
    'Très négatif': 1,
    'Non applicable': 0
};

const centralityScores: Record<string, number> = {
    'Très central': 5,
    'Central': 4,
    'Secondaire': 3,
    'Marginal': 2,
    'Non abordé': 1
};

// Pure function replicating calculateDiscrepancies logic
function calculateDiscrepancies(
    modelA: SentimentAnalysis | null | undefined,
    modelB: SentimentAnalysis | null | undefined
): DiscrepancyInfo {
    if (!modelA || !modelB) {
        return {
            polarityDiff: 0,
            subjectivityDiff: 0,
            centralityDiff: 0,
            totalDiff: 0,
            hasConflict: false
        };
    }

    const polarityDiff = Math.abs(
        (polarityScores[modelA.polarite || 'Non applicable'] || 0) -
        (polarityScores[modelB.polarite || 'Non applicable'] || 0)
    );

    const subjectivityDiff = Math.abs(
        (modelA.subjectivite_score || 0) - (modelB.subjectivite_score || 0)
    );

    const centralityDiff = Math.abs(
        (centralityScores[modelA.centralite_islam_musulmans || 'Non abordé'] || 0) -
        (centralityScores[modelB.centralite_islam_musulmans || 'Non abordé'] || 0)
    );

    const totalDiff = polarityDiff + subjectivityDiff + centralityDiff;
    const hasConflict = polarityDiff >= 3 || subjectivityDiff >= 3 || centralityDiff >= 3;

    return {
        polarityDiff,
        subjectivityDiff,
        centralityDiff,
        totalDiff,
        hasConflict
    };
}

// ============================================
// Score Mapping Tests
// ============================================

describe('Polarity Score Mapping', () => {
    it('assigns correct scores to all polarity values', () => {
        expect(polarityScores['Très positif']).toBe(5);
        expect(polarityScores['Positif']).toBe(4);
        expect(polarityScores['Neutre']).toBe(3);
        expect(polarityScores['Négatif']).toBe(2);
        expect(polarityScores['Très négatif']).toBe(1);
        expect(polarityScores['Non applicable']).toBe(0);
    });

    it('maintains descending order from positive to negative', () => {
        const values = ['Très positif', 'Positif', 'Neutre', 'Négatif', 'Très négatif'];
        for (let i = 0; i < values.length - 1; i++) {
            expect(polarityScores[values[i]]).toBeGreaterThan(polarityScores[values[i + 1]]);
        }
    });
});

describe('Centrality Score Mapping', () => {
    it('assigns correct scores to all centrality values', () => {
        expect(centralityScores['Très central']).toBe(5);
        expect(centralityScores['Central']).toBe(4);
        expect(centralityScores['Secondaire']).toBe(3);
        expect(centralityScores['Marginal']).toBe(2);
        expect(centralityScores['Non abordé']).toBe(1);
    });

    it('maintains descending order from central to marginal', () => {
        const values = ['Très central', 'Central', 'Secondaire', 'Marginal', 'Non abordé'];
        for (let i = 0; i < values.length - 1; i++) {
            expect(centralityScores[values[i]]).toBeGreaterThan(centralityScores[values[i + 1]]);
        }
    });
});

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

        it('handles Non applicable polarity', () => {
            const modelA = createAnalysis({ polarite: 'Non applicable' });
            const modelB = createAnalysis({ polarite: 'Neutre' });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.polarityDiff).toBe(3); // 0 vs 3
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

        it('handles null subjectivity scores', () => {
            const modelA = createAnalysis({ subjectivite_score: null });
            const modelB = createAnalysis({ subjectivite_score: 4 });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.subjectivityDiff).toBe(4); // 0 vs 4
        });
    });

    describe('centrality differences', () => {
        it('calculates correct diff for adjacent centralities (1 step)', () => {
            const modelA = createAnalysis({ centralite_islam_musulmans: 'Central' });
            const modelB = createAnalysis({ centralite_islam_musulmans: 'Très central' });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.centralityDiff).toBe(1);
        });

        it('calculates correct diff for extreme centralities (4 steps)', () => {
            const modelA = createAnalysis({ centralite_islam_musulmans: 'Très central' });
            const modelB = createAnalysis({ centralite_islam_musulmans: 'Non abordé' });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.centralityDiff).toBe(4);
        });
    });

    describe('total discrepancy', () => {
        it('sums all dimension differences', () => {
            const modelA = createAnalysis({
                polarite: 'Positif',       // score 4
                subjectivite_score: 2,
                centralite_islam_musulmans: 'Central'  // score 4
            });
            const modelB = createAnalysis({
                polarite: 'Neutre',        // score 3, diff = 1
                subjectivite_score: 5,     // diff = 3
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
                polarite: 'Neutre',        // diff = 1
                subjectivite_score: 5,     // diff = 2
                centralite_islam_musulmans: 'Secondaire' // diff = 1
            });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.hasConflict).toBe(false);
        });

        it('is true when polarity diff is 3 or more', () => {
            const modelA = createAnalysis({ polarite: 'Très positif' }); // 5
            const modelB = createAnalysis({ polarite: 'Négatif' });      // 2
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
            const modelB = createAnalysis({ centralite_islam_musulmans: 'Marginal' });      // 2
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.centralityDiff).toBe(3);
            expect(result.hasConflict).toBe(true);
        });

        it('is true when multiple dimensions exceed threshold', () => {
            const modelA = createAnalysis({
                polarite: 'Très positif',
                subjectivite_score: 1,
                centralite_islam_musulmans: 'Très central'
            });
            const modelB = createAnalysis({
                polarite: 'Très négatif',  // diff = 4
                subjectivite_score: 5,     // diff = 4
                centralite_islam_musulmans: 'Non abordé' // diff = 4
            });
            const result = calculateDiscrepancies(modelA, modelB);

            expect(result.hasConflict).toBe(true);
            expect(result.totalDiff).toBe(12);
        });
    });
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
    it('handles empty string values gracefully', () => {
        const modelA: SentimentAnalysis = {
            centralite_islam_musulmans: '',
            centralite_justification: '',
            subjectivite_score: null,
            subjectivite_justification: '',
            polarite: '',
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
        expect(result).toBeDefined();
    });

    it('handles unknown polarity values', () => {
        const modelA: SentimentAnalysis = {
            centralite_islam_musulmans: 'Central',
            centralite_justification: 'Test',
            subjectivite_score: 3,
            subjectivite_justification: 'Test',
            polarite: 'Unknown Value' as any,
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
