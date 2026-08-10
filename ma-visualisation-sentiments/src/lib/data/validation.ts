import type {
	ArbiterBlindLabel,
	ArbiterEvaluationData,
	ArbiterV2EvaluationData,
	PlacesPayload,
	SentimentAnalysis,
	SubjectivityScore
} from '$lib/types/data';
import { ARBITER_BLIND_LABELS } from '$lib/types/data';
import {
	datasetIdsOf,
	generationOf,
	isCentralityValue,
	isDatasetId,
	isModelPair,
	isPolarityValue,
	isSubjectivityScore,
	SENTIMENT_CONTRACT,
	SENTIMENT_CONTRACT_V2,
	SENTIMENT_CONTRACTS,
	type DatasetId,
	type ModelPair
} from '$lib/domain/sentimentContract';

export type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): UnknownRecord {
	if (!isRecord(value)) throw new Error(`${label} must be an object`);
	return value;
}

function requireString(value: unknown, label: string): string {
	if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a string`);
	return value;
}

function isNullableString(value: unknown): value is string | null | undefined {
	return value == null || typeof value === 'string';
}

export interface BaseArticleRecord extends UnknownRecord {
	'o:id': string | number;
	'o:title'?: string | null;
	Newspaper?: string | null;
	Country?: string | null;
	'dcterms:date'?: string | null;
	hijri_year?: number | null;
	hijri_month?: number | null;
	hijri_day?: number | null;
}

export type SentimentScores = Pick<
	SentimentAnalysis,
	'centralite_islam_musulmans' | 'subjectivite_score' | 'polarite'
>;

export type SentimentJustifications = Pick<
	SentimentAnalysis,
	'centralite_justification' | 'subjectivite_justification' | 'polarite_justification'
>;

export interface SentimentFile {
	schema_version: string;
	analysis_version: string;
	model: DatasetId;
	sentiments: Record<string, SentimentScores | null>;
}

export interface JustificationFile {
	schema_version: string;
	analysis_version: string;
	model: DatasetId;
	justifications: Record<string, SentimentJustifications | null>;
}

/**
 * Assert a payload declares the contract of the generation its model belongs to.
 *
 * The generation is never passed in by a caller — it is derived from the model
 * id, so a v2 file served under a v1 model's name (or the reverse) is rejected
 * rather than silently mixed.
 */
function requireGeneration(root: UnknownRecord, label: string, model: DatasetId): void {
	const contract = SENTIMENT_CONTRACTS[generationOf(model)];
	if (root.schema_version !== contract.schemaVersion) {
		throw new Error(`${label} schema_version must be ${contract.schemaVersion}`);
	}
	if (root.analysis_version !== contract.analysisVersion) {
		throw new Error(`${label} analysis_version must be ${contract.analysisVersion}`);
	}
}

export function parseBaseArticles(data: unknown): BaseArticleRecord[] {
	if (!Array.isArray(data)) throw new Error('Article base must be an array');
	const ids = new Set<string>();
	return data.map((value, index) => {
		const row = requireRecord(value, `Article base row ${index}`);
		if (typeof row['o:id'] !== 'string' && typeof row['o:id'] !== 'number') {
			throw new Error(`Article base row ${index} has no valid o:id`);
		}
		const id = String(row['o:id']);
		if (ids.has(id)) throw new Error(`Article base contains duplicate o:id ${id}`);
		ids.add(id);
		for (const field of ['o:title', 'Newspaper', 'Country', 'dcterms:date'] as const) {
			if (!isNullableString(row[field]))
				throw new Error(`Article ${id}.${field} must be text or null`);
		}
		const hijriMonth = row.hijri_month;
		if (
			hijriMonth != null &&
			(!Number.isInteger(hijriMonth) || Number(hijriMonth) < 1 || Number(hijriMonth) > 12)
		) {
			throw new Error(`Article ${id}.hijri_month must be 1-12 or null`);
		}
		return row as BaseArticleRecord;
	});
}

function parseScores(value: unknown, id: string): SentimentScores | null {
	if (value === null) return null;
	const row = requireRecord(value, `Sentiment ${id}`);
	if (row.polarite !== null && !isPolarityValue(row.polarite)) {
		throw new Error(`Sentiment ${id}.polarite has an unknown value`);
	}
	if (
		row.centralite_islam_musulmans !== null &&
		!isCentralityValue(row.centralite_islam_musulmans)
	) {
		throw new Error(`Sentiment ${id}.centralite_islam_musulmans has an unknown value`);
	}
	if (row.subjectivite_score !== null && !isSubjectivityScore(row.subjectivite_score)) {
		throw new Error(`Sentiment ${id}.subjectivite_score must be 1-5 or null`);
	}
	return row as SentimentScores;
}

export function parseSentimentFile(data: unknown, expectedModel: DatasetId): SentimentFile {
	const root = requireRecord(data, 'Sentiment file');
	if (!isDatasetId(root.model) || root.model !== expectedModel) {
		throw new Error(`Sentiment file model must be ${expectedModel}`);
	}
	requireGeneration(root, 'Sentiment file', expectedModel);
	const raw = requireRecord(root.sentiments, 'Sentiment file sentiments');
	const sentiments = Object.fromEntries(
		Object.entries(raw).map(([id, value]) => [id, parseScores(value, id)])
	);
	return { ...root, model: expectedModel, sentiments } as SentimentFile;
}

function parseProse(value: unknown, id: string): SentimentJustifications | null {
	if (value === null) return null;
	const row = requireRecord(value, `Justification ${id}`);
	for (const field of [
		'centralite_justification',
		'subjectivite_justification',
		'polarite_justification'
	] as const) {
		if (!isNullableString(row[field]))
			throw new Error(`Justification ${id}.${field} must be text or null`);
	}
	return row as SentimentJustifications;
}

export function parseJustificationFile(
	data: unknown,
	expectedModel: DatasetId,
	expectedShard?: number
): JustificationFile {
	const root = requireRecord(data, 'Justification file');
	if (!isDatasetId(root.model) || root.model !== expectedModel) {
		throw new Error(`Justification file model must be ${expectedModel}`);
	}
	requireGeneration(root, 'Justification file', expectedModel);
	if (
		expectedShard !== undefined &&
		(root.shard !== expectedShard ||
			root.shard_count !== SENTIMENT_CONTRACT.delivery.justificationShards)
	) {
		throw new Error(`Justification file shard metadata must match shard ${expectedShard}`);
	}
	const raw = requireRecord(root.justifications, 'Justification file justifications');
	const justifications = Object.fromEntries(
		Object.entries(raw).map(([id, value]) => [id, parseProse(value, id)])
	);
	return { ...root, model: expectedModel, justifications } as JustificationFile;
}

export function parsePlacesPayload(data: unknown): PlacesPayload {
	const root = requireRecord(data, 'Places file');
	if (!Array.isArray(root.places)) throw new Error('Places file.places must be an array');
	const edges = requireRecord(root.articles, 'Places file.articles');
	const placeIds = new Set<number>();
	const places = root.places.map((value, index) => {
		const place = requireRecord(value, `Place ${index}`);
		if (
			!Number.isInteger(place.id) ||
			typeof place.title !== 'string' ||
			typeof place.lat !== 'number' ||
			typeof place.lng !== 'number'
		) {
			throw new Error(`Place ${index} is malformed`);
		}
		placeIds.add(Number(place.id));
		return place as unknown as PlacesPayload['places'][number];
	});
	for (const [articleId, placeList] of Object.entries(edges)) {
		if (
			!Array.isArray(placeList) ||
			placeList.some((id) => !Number.isInteger(id) || !placeIds.has(Number(id)))
		) {
			throw new Error(`Places edge list for article ${articleId} contains an unknown place`);
		}
	}
	return { places, articles: edges as Record<string, number[]> };
}

export function parseArbiterEvaluationData(
	data: unknown,
	expectedPair: ModelPair
): ArbiterEvaluationData {
	const root = requireRecord(data, 'Arbiter file');
	const metadata = requireRecord(root.metadata, 'Arbiter metadata');
	if (!isModelPair(metadata.pair) || metadata.pair !== expectedPair) {
		throw new Error(`Arbiter file pair must be ${expectedPair}`);
	}
	if (
		metadata.contract_schema_version !== SENTIMENT_CONTRACT.schemaVersion ||
		metadata.analysis_version !== SENTIMENT_CONTRACT.analysisVersion ||
		metadata.cache_schema_version !== SENTIMENT_CONTRACT.arbiter.cacheSchemaVersion ||
		metadata.prompt_version !== SENTIMENT_CONTRACT.arbiter.promptVersion
	) {
		throw new Error('Arbiter file must match the v1 sentiment contract');
	}
	if (!Array.isArray(root.evaluations)) throw new Error('Arbiter evaluations must be an array');
	const ids = new Set<string>();
	for (const [index, value] of root.evaluations.entries()) {
		const evaluation = requireRecord(value, `Arbiter evaluation ${index}`);
		const id = requireString(evaluation.article_id, `Arbiter evaluation ${index}.article_id`);
		if (ids.has(id)) throw new Error(`Duplicate arbiter evaluation ${id}`);
		ids.add(id);
		requireString(evaluation.cache_fingerprint, `Arbiter evaluation ${id}.cache_fingerprint`);
		requireRecord(evaluation.arbiter, `Arbiter evaluation ${id}.arbiter`);
		requireRecord(evaluation.discrepancies, `Arbiter evaluation ${id}.discrepancies`);
	}
	if (metadata.successful_evaluations !== root.evaluations.length) {
		throw new Error('Arbiter metadata successful_evaluations does not match the payload');
	}
	return root as unknown as ArbiterEvaluationData;
}

/**
 * Parse the generation-2 three-way arbiter file.
 *
 * The load-bearing check is the blind permutation: it must be a bijection from
 * the three labels onto the contract's three models. Every verdict in the file
 * is expressed in labels, so a permutation that is missing a label, repeats a
 * model, or names a model from another generation would silently attribute
 * verdicts to the wrong model rather than fail.
 */
export function parseArbiterV2EvaluationData(data: unknown): ArbiterV2EvaluationData {
	const root = requireRecord(data, 'Three-way arbiter file');
	const metadata = requireRecord(root.metadata, 'Three-way arbiter metadata');

	if (metadata.mode !== SENTIMENT_CONTRACT_V2.arbiter.mode) {
		throw new Error(`Three-way arbiter file mode must be ${SENTIMENT_CONTRACT_V2.arbiter.mode}`);
	}
	if (
		metadata.contract_schema_version !== SENTIMENT_CONTRACT_V2.schemaVersion ||
		metadata.analysis_version !== SENTIMENT_CONTRACT_V2.analysisVersion ||
		metadata.cache_schema_version !== SENTIMENT_CONTRACT_V2.arbiter.cacheSchemaVersion ||
		metadata.prompt_version !== SENTIMENT_CONTRACT_V2.arbiter.promptVersion
	) {
		throw new Error('Three-way arbiter file must match the v2 sentiment contract');
	}

	const expectedModels = datasetIdsOf('v2');
	const models = metadata.models;
	if (
		!Array.isArray(models) ||
		models.length !== expectedModels.length ||
		models.some((model, index) => model !== expectedModels[index])
	) {
		throw new Error('Three-way arbiter metadata does not list the v2 models in contract order');
	}

	const permutation = requireRecord(
		metadata.blind_permutation,
		'Three-way arbiter blind_permutation'
	);
	const assigned = ARBITER_BLIND_LABELS.map((label: ArbiterBlindLabel) => permutation[label]);
	if (
		assigned.some((model) => !isDatasetId(model) || !expectedModels.includes(model)) ||
		new Set(assigned).size !== expectedModels.length
	) {
		throw new Error('Three-way arbiter blind_permutation must be a bijection over the v2 models');
	}

	if (!Array.isArray(root.evaluations)) {
		throw new Error('Three-way arbiter evaluations must be an array');
	}
	const ids = new Set<string>();
	for (const [index, value] of root.evaluations.entries()) {
		const evaluation = requireRecord(value, `Three-way arbiter evaluation ${index}`);
		const id = requireString(
			evaluation.article_id,
			`Three-way arbiter evaluation ${index}.article_id`
		);
		if (ids.has(id)) throw new Error(`Duplicate three-way arbiter evaluation ${id}`);
		ids.add(id);
		requireString(
			evaluation.cache_fingerprint,
			`Three-way arbiter evaluation ${id}.cache_fingerprint`
		);
		requireRecord(evaluation.arbiter, `Three-way arbiter evaluation ${id}.arbiter`);
		requireRecord(evaluation.spread, `Three-way arbiter evaluation ${id}.spread`);
	}
	if (metadata.successful_evaluations !== root.evaluations.length) {
		throw new Error('Three-way arbiter metadata successful_evaluations does not match the payload');
	}

	return root as unknown as ArbiterV2EvaluationData;
}

export function normalizeSubjectivityScore(value: unknown): SubjectivityScore | null {
	const numberValue = typeof value === 'string' ? Number(value) : value;
	return isSubjectivityScore(numberValue) ? numberValue : null;
}
