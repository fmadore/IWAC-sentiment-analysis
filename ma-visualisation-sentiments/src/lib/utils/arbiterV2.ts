/**
 * Pure helpers behind the generation-2 panel arbiter views.
 *
 * Everything that turns the published arbiter file into something a reader can
 * check against the article lives here, framework-free, so the store only
 * wires it into runes and the tests exercise the exact functions the views
 * ship. The one invariant that matters: a verdict is expressed in the run's
 * anonymised labels, and `metadata.blind_permutation` is the only thing that
 * may resolve a label back to a model.
 */

import type {
	ArbiterBlindLabel,
	ArbiterV2Evaluation,
	ArbiterV2EvaluationData,
	ArbiterV2Preference,
	Article,
	DatasetId,
	SentimentAnalysis
} from '$lib/types/data';
import { ARBITER_BLIND_LABELS } from '$lib/types/data';
import { modelDisplayName } from '$lib/domain/sentimentContract';
import { getJournalName } from '$lib/utils/format';

/** The three dimensions every evaluation scores, in display order. */
export const ARBITER_V2_DIMENSIONS = ['polarity', 'subjectivity', 'centrality'] as const;
export type ArbiterV2Dimension = (typeof ARBITER_V2_DIMENSIONS)[number];

/** One entry of the blind legend: which model an anonymised label stood for. */
export interface ArbiterV2LegendEntry {
	label: ArbiterBlindLabel;
	modelId: DatasetId;
	name: string;
}

/**
 * One arbitrated article joined to the corpus: the article's own metadata,
 * every panel model's ratings, and the verdict.
 *
 * `analyses` holds one key per panel model *whose dataset has loaded*; a key
 * that is absent means the scores are still on their way, whereas an explicit
 * `null` means that model left the article unannotated. The two are kept
 * apart so a panel that is half-loaded renders as "loading", never as "this
 * model declined".
 */
export interface ArbiterV2Row {
	articleId: string;
	/** Base metadata, read from whichever panel dataset has loaded first. */
	article: Article | null;
	title: string;
	journal: string;
	country: string;
	date: string | null;
	analyses: Partial<Record<DatasetId, SentimentAnalysis | null>>;
	evaluation: ArbiterV2Evaluation;
	/** The overall winner as a model id, or null when the verdict names several or none. */
	winner: DatasetId | null;
}

/** The model an anonymised preference names, or null for `multiple` / `none`. */
export function resolvePreference(
	data: ArbiterV2EvaluationData | null,
	preference: ArbiterV2Preference
): DatasetId | null {
	if (!data || preference === 'multiple' || preference === 'none') return null;
	return data.metadata.blind_permutation[preference] ?? null;
}

/** The label a model was shown under, or null when the file names no such model. */
export function labelForModel(
	data: ArbiterV2EvaluationData | null,
	modelId: DatasetId
): ArbiterBlindLabel | null {
	if (!data) return null;
	const permutation = data.metadata.blind_permutation;
	return ARBITER_BLIND_LABELS.find((label) => permutation[label] === modelId) ?? null;
}

/**
 * The legend a reader needs beside the arbiter's prose: the judge writes
 * "C, E et B", and only this mapping says which models those were. In label
 * order, so it reads as the prompt did.
 */
export function blindLegend(data: ArbiterV2EvaluationData | null): ArbiterV2LegendEntry[] {
	if (!data) return [];
	const { blind_permutation: permutation, model_names: names } = data.metadata;
	return ARBITER_BLIND_LABELS.filter((label) => permutation[label] !== undefined).map((label) => {
		const modelId = permutation[label];
		return { label, modelId, name: names?.[modelId] ?? modelDisplayName(modelId) };
	});
}

/**
 * Join every evaluation to the loaded corpus.
 *
 * The join is by article id against each panel model's dataset. Article
 * metadata is shared across models, so it is read from the first dataset that
 * has it; a row whose id is in no loaded dataset still appears, with an empty
 * title, rather than vanishing — a verdict without its article is a defect to
 * show, not to hide.
 */
export function buildArbiterV2Rows(
	data: ArbiterV2EvaluationData | null,
	datasets: Record<string, Article[]>,
	modelIds: readonly DatasetId[]
): ArbiterV2Row[] {
	if (!data) return [];

	const indexes = modelIds.map((modelId) => {
		const articles = datasets[modelId];
		if (!articles?.length) return null;
		return new Map(articles.map((article) => [String(article['o:id']), article]));
	});

	return data.evaluations.map((evaluation) => {
		const articleId = String(evaluation.article_id);
		let article: Article | null = null;
		const analyses: ArbiterV2Row['analyses'] = {};

		// A plain loop rather than forEach: TypeScript does not see assignments
		// made inside a callback, and would narrow `article` to null below.
		for (const [index, modelId] of modelIds.entries()) {
			const index_ = indexes[index];
			if (index_ === null) continue;
			const found = index_.get(articleId);
			if (found) {
				article ??= found;
				analyses[modelId] = found.sentiment_analysis ?? null;
			} else {
				analyses[modelId] = null;
			}
		}

		return {
			articleId,
			article,
			title: article?.['o:title'] || '',
			journal: article ? getJournalName(article) : '',
			country: article?.Country || '',
			date: article?.publication_date ?? null,
			analyses,
			evaluation,
			winner: resolvePreference(data, evaluation.arbiter.overall_winner)
		};
	});
}

/** A model's stored value on one dimension, as the badge components take it. */
export function analysisValue(
	analysis: SentimentAnalysis | null | undefined,
	dimension: ArbiterV2Dimension
): string | number | null {
	if (!analysis) return null;
	switch (dimension) {
		case 'polarity':
			return analysis.polarite;
		case 'subjectivity':
			return analysis.subjectivite_score;
		case 'centrality':
			return analysis.centralite_islam_musulmans;
	}
}

/** A model's justification prose on one dimension, or null until it has loaded. */
export function analysisJustification(
	analysis: SentimentAnalysis | null | undefined,
	dimension: ArbiterV2Dimension
): string | null {
	if (!analysis) return null;
	switch (dimension) {
		case 'polarity':
			return analysis.polarite_justification;
		case 'subjectivity':
			return analysis.subjectivite_justification;
		case 'centrality':
			return analysis.centralite_justification;
	}
}

/**
 * Whether a model's rating is the arbiter's own rating on that dimension.
 *
 * This is the comparison the arbiter was asked to make ("compare the analyses
 * against your own rating"), so it is the one cue that makes a verdict of
 * "several are equally close" legible: the reader sees which of the five
 * landed where the judge did. Subjectivity is stored as a rank on both sides,
 * but as a string in the verdict, hence the numeric comparison.
 */
export function matchesArbiterScore(
	value: string | number | null,
	arbiterScore: string,
	dimension: ArbiterV2Dimension
): boolean {
	if (value === null || value === undefined) return false;
	if (dimension === 'subjectivity') return Number(value) === Number(arbiterScore);
	return String(value) === arbiterScore;
}
