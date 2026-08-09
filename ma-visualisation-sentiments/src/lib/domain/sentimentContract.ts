import contract from '$lib/data/sentiment-v1.json';

/** Stable v1 research contract. The JSON is also consumed by Python. */
export const SENTIMENT_CONTRACT = contract;

export type DatasetId = keyof typeof contract.models;
export const DATASET_IDS = Object.freeze(Object.keys(contract.models) as DatasetId[]);

export const MODEL_PAIR_IDS = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral'] as const;
export type ModelPair = (typeof MODEL_PAIR_IDS)[number];

export type PolarityValue = keyof typeof contract.scales.polarity.scores;
export type CentralityValue = keyof typeof contract.scales.centrality.scores;
export type SubjectivityScore = 1 | 2 | 3 | 4 | 5;

export const POLARITY_ORDER = contract.scales.polarity.scores as Record<PolarityValue, number>;
export const CENTRALITY_ORDER = contract.scales.centrality.scores as Record<
	CentralityValue,
	number
>;

export const POLARITY_VALUES = Object.freeze(Object.keys(POLARITY_ORDER) as PolarityValue[]);
export const CENTRALITY_VALUES = Object.freeze(Object.keys(CENTRALITY_ORDER) as CentralityValue[]);
export const POLARITY_NON_COMPARABLE = new Set<PolarityValue>(
	contract.scales.polarity.nonComparable as PolarityValue[]
);
export const CENTRALITY_NON_COMPARABLE = new Set<CentralityValue>(
	contract.scales.centrality.nonComparable as CentralityValue[]
);

export const SIGNIFICANT_CONFLICT_THRESHOLD = contract.discrepancy.significantDimensionGap;
export const TOTAL_DISCREPANCY_MAXIMUM = contract.discrepancy.maximumTotal;
export const JUSTIFICATION_SHARD_COUNT = contract.delivery.justificationShards;

export function justificationShard(articleId: string | number): number {
	const numeric = Number(articleId);
	if (Number.isSafeInteger(numeric)) return Math.abs(numeric) % JUSTIFICATION_SHARD_COUNT;
	let hash = 2166136261;
	for (const byte of new TextEncoder().encode(String(articleId))) {
		hash ^= byte;
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash % JUSTIFICATION_SHARD_COUNT;
}

export function isDatasetId(value: unknown): value is DatasetId {
	return typeof value === 'string' && DATASET_IDS.includes(value as DatasetId);
}

export function isModelPair(value: unknown): value is ModelPair {
	return typeof value === 'string' && MODEL_PAIR_IDS.includes(value as ModelPair);
}

export function isPolarityValue(value: unknown): value is PolarityValue {
	return typeof value === 'string' && POLARITY_VALUES.includes(value as PolarityValue);
}

export function isCentralityValue(value: unknown): value is CentralityValue {
	return typeof value === 'string' && CENTRALITY_VALUES.includes(value as CentralityValue);
}

export function isSubjectivityScore(value: unknown): value is SubjectivityScore {
	return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

// Keep the hand-authored literal tuple honest. The tuple gives TypeScript an
// exhaustive union; the JSON gives Python and runtime code one shared source.
if (
	MODEL_PAIR_IDS.length !== contract.pairs.length ||
	MODEL_PAIR_IDS.some((pair) => !contract.pairs.includes(pair))
) {
	throw new Error('The TypeScript v1 pair union does not match sentiment-v1.json');
}
