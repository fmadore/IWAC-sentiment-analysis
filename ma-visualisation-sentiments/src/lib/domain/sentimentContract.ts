import contractV1 from '$lib/data/sentiment-v1.json';
import contractV2 from '$lib/data/sentiment-v2.json';

/**
 * Two analysis generations are published side by side. v2 is the showcased
 * analysis; v1 stays reachable as an archive so its URLs, figures and
 * citations keep resolving. A generation is never chosen explicitly — it is
 * derived from the selected dataset or pair id, which is why the ids of the
 * two generations must not overlap (asserted below).
 */
export const GENERATION_IDS = ['v1', 'v2'] as const;
export type GenerationId = (typeof GENERATION_IDS)[number];

/** The generation shown by default. */
export const CURRENT_GENERATION: GenerationId = 'v2';
/** The archived generation, reachable but deliberately not prominent. */
export const ARCHIVED_GENERATION: GenerationId = 'v1';

/** Stable v1 research contract. The JSON is also consumed by Python. */
export const SENTIMENT_CONTRACT = contractV1;
/** Generation-2 research contract. The JSON is also consumed by Python. */
export const SENTIMENT_CONTRACT_V2 = contractV2;

export const SENTIMENT_CONTRACTS = { v1: contractV1, v2: contractV2 } as const;

export type DatasetIdV1 = keyof typeof contractV1.models;
export type DatasetIdV2 = keyof typeof contractV2.models;
export type DatasetId = DatasetIdV1 | DatasetIdV2;

export const DATASET_IDS_V1 = Object.freeze(Object.keys(contractV1.models) as DatasetIdV1[]);
export const DATASET_IDS_V2 = Object.freeze(Object.keys(contractV2.models) as DatasetIdV2[]);
export const DATASET_IDS = Object.freeze([...DATASET_IDS_V1, ...DATASET_IDS_V2] as DatasetId[]);

export const MODEL_PAIR_IDS_V1 = ['chatgpt-gemini', 'chatgpt-mistral', 'gemini-mistral'] as const;
export const MODEL_PAIR_IDS_V2 = [
	'luna-mistral-small',
	'luna-deepseek',
	'mistral-small-deepseek'
] as const;
export type ModelPairV1 = (typeof MODEL_PAIR_IDS_V1)[number];
export type ModelPairV2 = (typeof MODEL_PAIR_IDS_V2)[number];
export type ModelPair = ModelPairV1 | ModelPairV2;
export const MODEL_PAIR_IDS = Object.freeze([
	...MODEL_PAIR_IDS_V1,
	...MODEL_PAIR_IDS_V2
] as ModelPair[]);

/**
 * Pair id → its two model ids.
 *
 * Read this map; never split a pair id on `-`. A v2 model id contains a hyphen
 * (`mistral-small`), so `mistral-small-deepseek` would split into a model that
 * does not exist. The v2 contract carries the members explicitly for exactly
 * this reason, and the invariant below keeps the two representations honest.
 */
const PAIR_MODELS = Object.freeze({
	'chatgpt-gemini': ['chatgpt', 'gemini'],
	'chatgpt-mistral': ['chatgpt', 'mistral'],
	'gemini-mistral': ['gemini', 'mistral'],
	...Object.fromEntries(contractV2.pairs.map((pair) => [pair.id, pair.models]))
} as Record<ModelPair, [DatasetId, DatasetId]>);

export type PolarityValue = keyof typeof contractV1.scales.polarity.scores;
export type CentralityValue = keyof typeof contractV1.scales.centrality.scores;
export type SubjectivityScore = 1 | 2 | 3 | 4 | 5;

export const POLARITY_ORDER = contractV1.scales.polarity.scores as Record<PolarityValue, number>;
export const CENTRALITY_ORDER = contractV1.scales.centrality.scores as Record<
	CentralityValue,
	number
>;

export const POLARITY_VALUES = Object.freeze(Object.keys(POLARITY_ORDER) as PolarityValue[]);
export const CENTRALITY_VALUES = Object.freeze(Object.keys(CENTRALITY_ORDER) as CentralityValue[]);
export const POLARITY_NON_COMPARABLE = new Set<PolarityValue>(
	contractV1.scales.polarity.nonComparable as PolarityValue[]
);
export const CENTRALITY_NON_COMPARABLE = new Set<CentralityValue>(
	contractV1.scales.centrality.nonComparable as CentralityValue[]
);

/**
 * v2 stores subjectivity as an ordinal label upstream; the pipeline maps it to
 * the shared 1-5 rank so every numeric code path (kappa weighting, correlation,
 * map scales, filters) keeps working. Only the *display* text differs, and this
 * is where the v2 wording comes from.
 */
export const SUBJECTIVITY_LABELS_V2 = Object.freeze(
	Object.fromEntries(
		Object.entries(contractV2.scales.subjectivity.scores).map(([label, rank]) => [rank, label])
	) as Record<SubjectivityScore, string>
);

export const SIGNIFICANT_CONFLICT_THRESHOLD = contractV1.discrepancy.significantDimensionGap;
export const TOTAL_DISCREPANCY_MAXIMUM = contractV1.discrepancy.maximumTotal;
export const SIGNIFICANT_SPREAD_THRESHOLD = contractV2.discrepancy.threeWaySpread.significantSpread;
export const JUSTIFICATION_SHARD_COUNT = contractV1.delivery.justificationShards;

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

/** Which generation a dataset or pair id belongs to. */
export function generationOf(id: DatasetId | ModelPair): GenerationId {
	if (DATASET_IDS_V2.includes(id as DatasetIdV2)) return 'v2';
	if ((MODEL_PAIR_IDS_V2 as readonly string[]).includes(id)) return 'v2';
	return 'v1';
}

/** The dataset ids belonging to one generation, in contract order. */
export function datasetIdsOf(generation: GenerationId): readonly DatasetId[] {
	return generation === 'v2' ? DATASET_IDS_V2 : DATASET_IDS_V1;
}

/** The pair ids belonging to one generation, in contract order. */
export function pairIdsOf(generation: GenerationId): readonly ModelPair[] {
	return generation === 'v2' ? MODEL_PAIR_IDS_V2 : MODEL_PAIR_IDS_V1;
}

/** The two models a pair compares. */
export function getPairModels(pair: ModelPair): [DatasetId, DatasetId] {
	return PAIR_MODELS[pair];
}

/** The default dataset and pair for a generation. */
export function defaultDatasetOf(generation: GenerationId): DatasetId {
	return datasetIdsOf(generation)[0];
}

export function defaultPairOf(generation: GenerationId): ModelPair {
	return pairIdsOf(generation)[0];
}

/** The display name a contract gives a model id. */
export function modelDisplayName(id: DatasetId): string {
	const models = SENTIMENT_CONTRACTS[generationOf(id)].models as Record<
		string,
		{ displayName: string }
	>;
	return models[id]?.displayName ?? id;
}

/** The exact model that produced an analysis, for methodology and citations. */
export function analysisModelName(id: DatasetId): string {
	const models = SENTIMENT_CONTRACTS[generationOf(id)].models as Record<
		string,
		{ analysisModel: string }
	>;
	return models[id]?.analysisModel ?? id;
}

// --- Import-time invariants --------------------------------------------------
// The hand-authored literal tuples give TypeScript exhaustive unions; the JSON
// gives Python and runtime code one shared source. These checks fail the build
// the moment the two disagree, which is cheaper than discovering it in data.

if (
	MODEL_PAIR_IDS_V1.length !== contractV1.pairs.length ||
	MODEL_PAIR_IDS_V1.some((pair) => !contractV1.pairs.includes(pair))
) {
	throw new Error('The TypeScript v1 pair union does not match sentiment-v1.json');
}

if (
	MODEL_PAIR_IDS_V2.length !== contractV2.pairs.length ||
	MODEL_PAIR_IDS_V2.some((pair) => !contractV2.pairs.some((entry) => entry.id === pair))
) {
	throw new Error('The TypeScript v2 pair union does not match sentiment-v2.json');
}

for (const [pair, models] of Object.entries(PAIR_MODELS)) {
	if (models.join('-') !== pair) {
		throw new Error(`Pair ${pair} does not match its members ${models.join(', ')}`);
	}
	if (!models.every((model) => DATASET_IDS.includes(model))) {
		throw new Error(`Pair ${pair} names a model that no contract declares`);
	}
	if (new Set(models.map(generationOf)).size !== 1) {
		throw new Error(`Pair ${pair} mixes analysis generations`);
	}
}

// Ids must not collide, because the generation is derived from them.
if (new Set(DATASET_IDS).size !== DATASET_IDS.length) {
	throw new Error('Dataset ids collide across analysis generations');
}
if (new Set(MODEL_PAIR_IDS).size !== MODEL_PAIR_IDS.length) {
	throw new Error('Model pair ids collide across analysis generations');
}

// The generations share the polarity and centrality scales; the shared ordering
// constants above are read from v1 and applied to both.
if (
	JSON.stringify(contractV2.scales.polarity) !== JSON.stringify(contractV1.scales.polarity) ||
	JSON.stringify(contractV2.scales.centrality) !== JSON.stringify(contractV1.scales.centrality)
) {
	throw new Error('The v2 polarity/centrality scales have diverged from v1');
}

if (contractV2.delivery.justificationShards !== contractV1.delivery.justificationShards) {
	throw new Error('Both generations must use the same justification shard count');
}
