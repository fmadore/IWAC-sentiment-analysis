/**
 * Arbiter State Module
 * 
 * Manages arbiter (Gemini 3 Pro) evaluation state.
 * Uses writable/derived stores for proper Svelte reactivity.
 */

import { writable, derived, get } from 'svelte/store';
import type { ArbiterEvaluationData, ArbiterAnalysis, ModelPair } from '$lib/types/data';
import { getModelsFromPair } from '$lib/types/data';
import { base } from '$app/paths';
import { comparisonPair, comparisonMode, availableDatasets } from './datasets.svelte';
import { isLoadingArbiter } from './ui.svelte';

// ============================================
// Arbiter Stores
// ============================================

/** Arbiter evaluation data */
export const arbiterEvaluations = writable<ArbiterEvaluationData | null>(null);

/** Currently loaded arbiter pair */
export const currentArbiterPair = writable<ModelPair | null>(null);

/** Track if reactivity is set up */
let arbiterReactivitySetUp = false;

// ============================================
// Derived Stores
// ============================================

/** Check if model A is first in the pair */
export const arbiterModelAIsFirst = derived(
    arbiterEvaluations,
    ($arbiterEvaluations) => $arbiterEvaluations?.metadata?.model_a_is_first ?? true
);

/** Get arbiter analysis for a specific article (as a derived store returning a function) */
export const getArbiterForArticle = derived(
    arbiterEvaluations,
    ($arbiterEvaluations) => {
        return (articleId: string | number): ArbiterAnalysis | null => {
            if (!$arbiterEvaluations || !$arbiterEvaluations.evaluations) {
                return null;
            }

            const evaluation = $arbiterEvaluations.evaluations.find(
                (e) => String(e.article_id) === String(articleId)
            );

            return evaluation ? evaluation.arbiter : null;
        };
    }
);

// ============================================
// Statistics Interface
// ============================================

export interface ArbiterStatistics {
    totalEvaluated: number;
    modelAPreferred: number;
    modelBPreferred: number;
    bothEqual: number;
    neitherAccurate: number;
    modelAPercentage: number;
    modelBPercentage: number;
    bothPercentage: number;
    neitherPercentage: number;
    modelAName: string;
    modelBName: string;
    hasData: boolean;
}

/** Arbiter statistics */
export const arbiterStatistics = derived(
    [arbiterEvaluations, comparisonPair, availableDatasets],
    ([$arbiterEvaluations, $pair, $datasets]): ArbiterStatistics => {
        const [modelAId, modelBId] = getModelsFromPair($pair);
        const modelAName = $datasets.find((d) => d.id === modelAId)?.name || modelAId;
        const modelBName = $datasets.find((d) => d.id === modelBId)?.name || modelBId;

        if (
            !$arbiterEvaluations ||
            !$arbiterEvaluations.evaluations ||
            $arbiterEvaluations.evaluations.length === 0
        ) {
            return {
                totalEvaluated: 0,
                modelAPreferred: 0,
                modelBPreferred: 0,
                bothEqual: 0,
                neitherAccurate: 0,
                modelAPercentage: 0,
                modelBPercentage: 0,
                bothPercentage: 0,
                neitherPercentage: 0,
                modelAName,
                modelBName,
                hasData: false
            };
        }

        const counts = {
            model_a: 0,
            model_b: 0,
            both: 0,
            neither: 0
        };

        for (const evaluation of $arbiterEvaluations.evaluations) {
            const arbiter = evaluation.arbiter;

            for (const dimension of ['polarity', 'subjectivity', 'centrality'] as const) {
                const preferredModel = arbiter[dimension]?.preferred_model as
                    | 'model_a'
                    | 'model_b'
                    | 'both'
                    | 'neither';
                if (preferredModel in counts) {
                    counts[preferredModel]++;
                }
            }
        }

        const totalVerdicts = counts.model_a + counts.model_b + counts.both + counts.neither;

        return {
            totalEvaluated: $arbiterEvaluations.evaluations.length,
            modelAPreferred: counts.model_a,
            modelBPreferred: counts.model_b,
            bothEqual: counts.both,
            neitherAccurate: counts.neither,
            modelAPercentage: totalVerdicts > 0 ? (counts.model_a / totalVerdicts) * 100 : 0,
            modelBPercentage: totalVerdicts > 0 ? (counts.model_b / totalVerdicts) * 100 : 0,
            bothPercentage: totalVerdicts > 0 ? (counts.both / totalVerdicts) * 100 : 0,
            neitherPercentage: totalVerdicts > 0 ? (counts.neither / totalVerdicts) * 100 : 0,
            modelAName,
            modelBName,
            hasData: true
        };
    }
);

// ============================================
// Helper Functions
// ============================================

/** Decode preferred model (kept for API compatibility) */
export const decodePreferredModel = (
    preferredModel: 'model_a' | 'model_b' | 'both' | 'neither',
    _unused?: boolean
): 'model_a' | 'model_b' | 'both' | 'neither' => {
    return preferredModel;
};

// ============================================
// Data Loading
// ============================================

/** Load arbiter evaluations for a specific model pair */
export const loadArbiterEvaluations = async (
    fetchFunction: typeof fetch,
    pair?: ModelPair
): Promise<void> => {
    isLoadingArbiter.set(true);

    let targetPair: ModelPair = pair || get(comparisonPair);

    try {
        const pairSpecificPath = `${base}/data/iwac_arbiter_evaluations_${targetPair}.json`;
        let response = await fetchFunction(pairSpecificPath);

        // Fallback to legacy file for chatgpt-gemini
        if (!response.ok && targetPair === 'chatgpt-gemini') {
            const legacyPath = `${base}/data/iwac_arbiter_evaluations.json`;
            response = await fetchFunction(legacyPath);
        }

        if (!response.ok) {
            console.log(`[Arbiter] Evaluations not found for pair ${targetPair} (this is optional data)`);
            arbiterEvaluations.set(null);
            currentArbiterPair.set(targetPair);
            return;
        }

        const data = (await response.json()) as ArbiterEvaluationData;
        arbiterEvaluations.set(data);
        currentArbiterPair.set(targetPair);
        console.log(`[Arbiter] Loaded ${data.evaluations?.length || 0} evaluations for ${targetPair}`);
    } catch (error) {
        console.log('[Arbiter] Evaluations not available:', error);
        arbiterEvaluations.set(null);
        currentArbiterPair.set(targetPair);
    } finally {
        isLoadingArbiter.set(false);
    }
};

/** Setup reactive arbiter data reloading when comparison pair changes */
export const setupArbiterPairReactivity = (fetchFunction: typeof fetch): (() => void) => {
    if (arbiterReactivitySetUp) {
        console.log('[Arbiter] Reactivity already set up, skipping');
        return () => { };
    }

    arbiterReactivitySetUp = true;
    console.log('[Arbiter] Setting up pair change reactivity');

    const unsubscribe = comparisonPair.subscribe(async (newPair) => {
        const loadedPair = get(currentArbiterPair);
        const isInComparisonMode = get(comparisonMode);

        if (isInComparisonMode && loadedPair !== null && loadedPair !== newPair) {
            console.log(`[Arbiter] Pair changed from ${loadedPair} to ${newPair}, reloading data...`);
            await loadArbiterEvaluations(fetchFunction, newPair);
        }
    });

    return () => {
        unsubscribe();
        arbiterReactivitySetUp = false;
    };
};

// ============================================
// Modern State Accessors (for gradual migration)
// ============================================

export const arbiterState = {
    get arbiterEvaluations() {
        return get(arbiterEvaluations);
    },
    get currentArbiterPair() {
        return get(currentArbiterPair);
    },
    get modelAIsFirst() {
        return get(arbiterModelAIsFirst);
    },
    get statistics() {
        return get(arbiterStatistics);
    },
    getForArticle(articleId: string | number): ArbiterAnalysis | null {
        return get(getArbiterForArticle)(articleId);
    }
};
