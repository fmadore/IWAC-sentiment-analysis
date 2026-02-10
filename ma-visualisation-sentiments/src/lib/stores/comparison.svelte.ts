/**
 * Comparison State Module
 * 
 * Manages model comparison state and derived data using Svelte 5 runes.
 * Provides both modern $state-based API and legacy store compatibility.
 */

import { writable, derived, get } from 'svelte/store';
import type { Article, ComparisonData, SentimentAnalysis, DiscrepancyInfo, ModelPair } from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { getJournalName } from '$lib/utils';
import { comparisonMode, comparisonPair, availableDatasets } from './datasets.svelte';
import { discrepancyFilters, countryFilters, journalFilters } from './filters.svelte';
import { isLoadingComparison } from './ui.svelte';
import { datasetArticles, loadSpecificDataset } from './articles.svelte';

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedComparison = $state<ComparisonData | null>(null);

// ============================================
// Legacy Stores
// ============================================

/**
 * @deprecated Use comparisonState.selected instead
 */
export const selectedComparison = writable<ComparisonData | null>(null);

// Sync legacy store to runes state
selectedComparison.subscribe(value => { _selectedComparison = value; });

// ============================================
// Score Mappings
// ============================================

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

// ============================================
// Helper Functions
// ============================================

/** Calculate discrepancies between two sentiment analyses */
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
// Derived Stores
// ============================================

/** Comparison data between two models */
export const comparisonData = derived(
    [datasetArticles, comparisonMode, comparisonPair],
    ([$datasets, $isComparison, $pair]) => {
        if (!$isComparison) {
            return [];
        }

        const [modelAId, modelBId] = getModelsFromPair($pair);

        if (!$datasets[modelAId] || !$datasets[modelBId]) {
            return [];
        }

        const modelBMap = new Map($datasets[modelBId].map((article) => [article['o:id'], article]));
        const comparisons: ComparisonData[] = [];

        $datasets[modelAId].forEach((modelAArticle) => {
            const modelBArticle = modelBMap.get(modelAArticle['o:id']);

            if (modelBArticle) {
                const discrepancies = calculateDiscrepancies(
                    modelAArticle.sentiment_analysis,
                    modelBArticle.sentiment_analysis
                );

                comparisons.push({
                    article: modelAArticle,
                    modelA: modelAArticle.sentiment_analysis || null,
                    modelB: modelBArticle.sentiment_analysis || null,
                    modelAId,
                    modelBId,
                    discrepancies
                });
            }
        });

        return comparisons;
    }
);

/** Filtered comparisons based on discrepancy filters */
export const filteredComparisons = derived(
    [comparisonData, discrepancyFilters, countryFilters, journalFilters],
    ([$comparisons, $filters, $countries, $journals]) => {
        return $comparisons
            .map((comparison) => {
                const originalDisc = comparison.discrepancies;
                let filteredDiscrepancy = {
                    polarityDiff: $filters.dimensions.includes('polarity') ? originalDisc.polarityDiff : 0,
                    subjectivityDiff: $filters.dimensions.includes('subjectivity')
                        ? originalDisc.subjectivityDiff
                        : 0,
                    centralityDiff: $filters.dimensions.includes('centrality') ? originalDisc.centralityDiff : 0,
                    totalDiff: 0,
                    hasConflict: false
                };

                if ($filters.dimensions.length === 0) {
                    filteredDiscrepancy = originalDisc;
                } else {
                    filteredDiscrepancy.totalDiff =
                        filteredDiscrepancy.polarityDiff +
                        filteredDiscrepancy.subjectivityDiff +
                        filteredDiscrepancy.centralityDiff;

                    filteredDiscrepancy.hasConflict =
                        filteredDiscrepancy.polarityDiff >= 3 ||
                        filteredDiscrepancy.subjectivityDiff >= 3 ||
                        filteredDiscrepancy.centralityDiff >= 3;
                }

                return {
                    ...comparison,
                    discrepancies: filteredDiscrepancy
                };
            })
            .filter((comparison) => {
                if ($countries.length > 0 && !$countries.includes(comparison.article.Country || '')) {
                    return false;
                }

                const journalName = getJournalName(comparison.article);
                if ($journals.length > 0 && !$journals.includes(journalName)) {
                    return false;
                }

                if ($filters.excludeNonApplicable) {
                    const modelACentrality = comparison.modelA?.centralite_islam_musulmans;
                    const modelBCentrality = comparison.modelB?.centralite_islam_musulmans;

                    if (
                        modelACentrality === 'Non applicable' ||
                        modelACentrality === 'Non abordé' ||
                        modelBCentrality === 'Non applicable' ||
                        modelBCentrality === 'Non abordé'
                    ) {
                        return false;
                    }
                }

                const disc = comparison.discrepancies;

                if (disc.totalDiff < $filters.minDifference || disc.totalDiff > $filters.maxDifference) {
                    return false;
                }

                if ($filters.dimensions.length === 0) {
                    return true;
                }

                return disc.totalDiff > 0;
            });
    }
);

/** Comparison statistics */
export const comparisonStatistics = derived(
    [comparisonData, filteredComparisons, countryFilters, journalFilters],
    ([$allComparisons, $filteredComparisons, $countries, $journals]) => {
        let totalArticles = $allComparisons.length;

        if ($countries.length > 0 || $journals.length > 0) {
            totalArticles = $allComparisons.filter((comparison) => {
                if ($countries.length > 0 && !$countries.includes(comparison.article.Country || '')) {
                    return false;
                }

                const journalName = getJournalName(comparison.article);
                if ($journals.length > 0 && !$journals.includes(journalName)) {
                    return false;
                }

                return true;
            }).length;
        }

        if ($filteredComparisons.length === 0) {
            return {
                totalArticles,
                totalDiscrepancies: 0,
                averageDiscrepancy: 0,
                polarityConflicts: 0,
                subjectivityConflicts: 0,
                centralityConflicts: 0,
                highConflictArticles: 0
            };
        }

        const stats = $filteredComparisons.reduce(
            (acc, comp) => {
                const disc = comp.discrepancies;

                acc.totalDiscrepancies += disc.totalDiff > 0 ? 1 : 0;
                acc.totalDiffSum += disc.totalDiff;
                acc.polarityConflicts += disc.polarityDiff > 0 ? 1 : 0;
                acc.subjectivityConflicts += disc.subjectivityDiff > 0 ? 1 : 0;
                acc.centralityConflicts += disc.centralityDiff > 0 ? 1 : 0;
                acc.highConflictArticles += disc.hasConflict ? 1 : 0;

                return acc;
            },
            {
                totalDiscrepancies: 0,
                totalDiffSum: 0,
                polarityConflicts: 0,
                subjectivityConflicts: 0,
                centralityConflicts: 0,
                highConflictArticles: 0
            }
        );

        return {
            totalArticles,
            totalDiscrepancies: stats.totalDiscrepancies,
            averageDiscrepancy: stats.totalDiffSum / $filteredComparisons.length,
            polarityConflicts: stats.polarityConflicts,
            subjectivityConflicts: stats.subjectivityConflicts,
            centralityConflicts: stats.centralityConflicts,
            highConflictArticles: stats.highConflictArticles
        };
    }
);

// ============================================
// Data Loading
// ============================================

/** Load datasets needed for comparison mode */
export const loadComparisonDatasets = async (fetchFunction: typeof fetch): Promise<void> => {
    const currentDatasets = get(datasetArticles);
    const currentPair = get(comparisonPair);

    const [modelAId, modelBId] = getModelsFromPair(currentPair);
    const datasetsToLoad: string[] = [];

    if (!currentDatasets[modelAId] || currentDatasets[modelAId].length === 0) {
        datasetsToLoad.push(modelAId);
    }
    if (!currentDatasets[modelBId] || currentDatasets[modelBId].length === 0) {
        datasetsToLoad.push(modelBId);
    }

    if (datasetsToLoad.length > 0) {
        console.log(`Loading missing comparison datasets for ${currentPair}: ${datasetsToLoad.join(', ')}`);

        isLoadingComparison.set(true);

        try {
            // Use showLoading: false since we manage our own loading state (isLoadingComparison)
            await Promise.all(datasetsToLoad.map((datasetId) => loadSpecificDataset(datasetId, fetchFunction, { showLoading: false })));
            console.log('Comparison datasets loaded successfully');
        } finally {
            isLoadingComparison.set(false);
        }
    } else {
        console.log('All comparison datasets already loaded (likely from background prefetching)');
    }
};

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Comparison state object with reactive getters and setters.
 * Use this API for new code.
 * 
 * @example
 * // Read state
 * const data = comparisonState.data;
 * 
 * // Write state
 * comparisonState.selected = comparison;
 * 
 * // Get statistics
 * const stats = comparisonState.statistics;
 */
export const comparisonState = {
    // Selected comparison
    get selected() {
        return _selectedComparison;
    },
    set selected(value: ComparisonData | null) {
        _selectedComparison = value;
        selectedComparison.set(value);
    },
    
    // Comparison data (from derived store)
    get data() {
        return get(comparisonData);
    },
    
    // Filtered comparisons (from derived store)
    get filtered() {
        return get(filteredComparisons);
    },
    
    // Statistics (from derived store)
    get statistics() {
        return get(comparisonStatistics);
    }
};
