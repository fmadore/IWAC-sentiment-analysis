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
} from '#lib/types/data.js';
import { ARBITER_BLIND_LABELS } from '#lib/types/data.js';
import {
	CENTRALITY_NON_COMPARABLE,
	CENTRALITY_ORDER,
	POLARITY_NON_COMPARABLE,
	POLARITY_ORDER,
	POLARITY_VALENCE_BANDS,
	isCentralityValue,
	isPolarityValue,
	modelDisplayName
} from '#lib/domain/sentimentContract.js';
import { calculatePanelSpread, hasPolarityValenceFlip } from '#lib/stores/derivations.js';
import { getJournalName } from '#lib/utils/format.js';
import { buildPanelJoin } from '#lib/utils/panelJoin.js';
import { cohensKappa, proportion, type Proportion } from '#lib/utils/stats.js';

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
		return { label, modelId, name: names?.[modelId] ?? modelDisplayName(modelId, 'short') };
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

// ============================================
// Agreement with the arbiter's own rating
// ============================================

/**
 * A rating's position on its ordinal scale, or null when it has none.
 *
 * Non-comparable verdicts (`Non applicable`, and `Non abordé` on centrality)
 * are labels a model returned but not positions on the 1–5 scale, so they can
 * match exactly yet cannot be "one step" from anything. The sets come from the
 * contract, as in the discrepancy and agreement rules.
 */
export function ordinalRank(
	value: string | number | null | undefined,
	dimension: ArbiterV2Dimension
): number | null {
	if (value === null || value === undefined || value === '') return null;
	switch (dimension) {
		case 'polarity':
			return isPolarityValue(value) && !POLARITY_NON_COMPARABLE.has(value)
				? POLARITY_ORDER[value]
				: null;
		case 'centrality':
			return isCentralityValue(value) && !CENTRALITY_NON_COMPARABLE.has(value)
				? CENTRALITY_ORDER[value]
				: null;
		case 'subjectivity': {
			const rank = Number(value);
			return Number.isInteger(rank) && rank >= 1 && rank <= 5 ? rank : null;
		}
	}
}

/** One model's agreement with the arbiter on one dimension. */
export interface ArbiterDimensionMatch {
	dimension: ArbiterV2Dimension;
	/** Same label as the arbiter, over every article where the model has a rating. */
	exact: Proportion;
	/**
	 * At most one step apart, over articles where both ratings sit on the 1–5
	 * scale — its own denominator, smaller than `exact.n` when a non-comparable
	 * verdict is involved.
	 */
	withinOne: Proportion;
}

export interface ArbiterModelMatch {
	modelId: DatasetId;
	/** False until this model's dataset has loaded: no rate is shown for it yet. */
	loaded: boolean;
	dimensions: Record<ArbiterV2Dimension, ArbiterDimensionMatch>;
}

interface MatchTally {
	n: number;
	exact: number;
	comparable: number;
	withinOne: number;
}

/**
 * How often each model's rating equals the arbiter's own rating, per dimension.
 *
 * This is the headline of the panel arbiter view, deliberately in place of the
 * "preferred overall" tally. The verdict names one analysis only when one
 * stands out; when several equal the judge's rating it says so, and the
 * overall winner then turns on small differences — mostly subjectivity, where
 * the analyses differ most from one another inside the frame. The match rate
 * uses every article and asks the question the arbiter was told to answer
 * ("compare the analyses with your own rating").
 *
 * Works on the joined rows, so it applies to any model the rows carry —
 * including a recused one, whose rating the arbiter never saw. A missing
 * rating (`null`) is skipped, never counted as a mismatch: Qwen's declined
 * rows shrink its n instead of lowering its rate.
 */
export function arbiterMatchRates(
	rows: readonly ArbiterV2Row[],
	modelIds: readonly DatasetId[]
): ArbiterModelMatch[] {
	return modelIds.map((modelId) => {
		const loaded = rows.length > 0 && rows.every((row) => modelId in row.analyses);
		const counts = {} as Record<ArbiterV2Dimension, MatchTally>;
		for (const dimension of ARBITER_V2_DIMENSIONS) {
			counts[dimension] = { n: 0, exact: 0, comparable: 0, withinOne: 0 };
		}

		if (loaded) {
			for (const row of rows) {
				const analysis = row.analyses[modelId];
				for (const dimension of ARBITER_V2_DIMENSIONS) {
					const value = analysisValue(analysis, dimension);
					const score = row.evaluation.arbiter[dimension]?.score;
					if (value === null || value === undefined || !score) continue;
					const tally = counts[dimension];
					tally.n++;
					if (matchesArbiterScore(value, score, dimension)) tally.exact++;
					const own = ordinalRank(value, dimension);
					const judge = ordinalRank(score, dimension);
					if (own !== null && judge !== null) {
						tally.comparable++;
						if (Math.abs(own - judge) <= 1) tally.withinOne++;
					}
				}
			}
		}

		const dimensions = {} as Record<ArbiterV2Dimension, ArbiterDimensionMatch>;
		for (const dimension of ARBITER_V2_DIMENSIONS) {
			const tally = counts[dimension];
			dimensions[dimension] = {
				dimension,
				exact: proportion(tally.exact, tally.n),
				withinOne: proportion(tally.withinOne, tally.comparable)
			};
		}

		return { modelId, loaded, dimensions };
	});
}

// ============================================
// What the frame mostly contains
// ============================================

export interface LoneDissent {
	modelId: DatasetId;
	/** Articles where this model is the only one on its side of the neutral line. */
	total: number;
	/** …as the sole negative reader. */
	negative: number;
	/** …as the sole positive reader. */
	positive: number;
}

export interface LoneDissenterSummary {
	/** Rows compared — every reviewed article once the listed models have loaded, else 0. */
	compared: number;
	/** One entry per model, most frequent lone dissenter first. */
	models: LoneDissent[];
}

/**
 * Which model stands alone across the valence line, and how often.
 *
 * Mirrors `flip_dissenters` in the Python selection: a reversal needs one
 * model at or above the positive band and one at or below the negative band,
 * and a model is its *lone* dissenter when it is the only one on its side, so
 * removing it would remove the reversal. A row can have two (one alone on
 * each side) or none. Computed over the panel the judge read, because that is
 * the panel whose reversals selected the frame.
 *
 * Returns `compared: 0` until every listed model's ratings have loaded, so the
 * sentence it feeds never reports a half-loaded panel.
 */
export function loneDissenters(
	rows: readonly ArbiterV2Row[],
	modelIds: readonly DatasetId[]
): LoneDissenterSummary {
	const tallies = modelIds.map((modelId): LoneDissent => ({
		modelId,
		total: 0,
		negative: 0,
		positive: 0
	}));
	const ready = rows.length > 0 && rows.every((row) => modelIds.every((id) => id in row.analyses));
	if (!ready) return { compared: 0, models: tallies };

	const { positiveMinimum, negativeMaximum } = POLARITY_VALENCE_BANDS;
	for (const row of rows) {
		const positive: number[] = [];
		const negative: number[] = [];
		modelIds.forEach((modelId, index) => {
			const rank = ordinalRank(row.analyses[modelId]?.polarite ?? null, 'polarity');
			if (rank === null) return;
			if (rank >= positiveMinimum) positive.push(index);
			else if (rank <= negativeMaximum) negative.push(index);
		});
		if (positive.length === 0 || negative.length === 0) continue;
		if (positive.length === 1) {
			tallies[positive[0]].total++;
			tallies[positive[0]].positive++;
		}
		if (negative.length === 1) {
			tallies[negative[0]].total++;
			tallies[negative[0]].negative++;
		}
	}
	return {
		compared: rows.length,
		models: [...tallies].sort((a, b) => b.total - a.total)
	};
}

/** Which side of the neutral line a polarity rank sits on, or null for the middle and non-ratings. */
function valenceSide(
	analysis: SentimentAnalysis | null | undefined
): 'positive' | 'negative' | null {
	const rank = ordinalRank(analysis?.polarite ?? null, 'polarity');
	if (rank === null) return null;
	if (rank >= POLARITY_VALENCE_BANDS.positiveMinimum) return 'positive';
	if (rank <= POLARITY_VALENCE_BANDS.negativeMaximum) return 'negative';
	return null;
}

/**
 * Reviewed articles split strictly one against the rest with `dissenterId` as
 * the one: that model on one side of the neutral line and every other model of
 * `modelIds` giving one and the same polarity label on the other. A narrower
 * count than its `loneDissenters` total, which only asks that the dissenter be
 * alone on its side.
 *
 * Null until every listed model's ratings have loaded, like `loneDissenters`.
 */
export function strictLoneSplits(
	rows: readonly ArbiterV2Row[],
	modelIds: readonly DatasetId[],
	dissenterId: DatasetId
): number | null {
	const ready = rows.length > 0 && rows.every((row) => modelIds.every((id) => id in row.analyses));
	if (!ready || !modelIds.includes(dissenterId)) return null;
	const others = modelIds.filter((id) => id !== dissenterId);
	let count = 0;
	for (const row of rows) {
		const side = valenceSide(row.analyses[dissenterId]);
		if (side === null || others.length === 0) continue;
		const label = row.analyses[others[0]]?.polarite ?? null;
		const otherSide = valenceSide(row.analyses[others[0]]);
		if (label === null || otherSide === null || otherSide === side) continue;
		if (others.every((id) => row.analyses[id]?.polarite === label)) count++;
	}
	return count;
}

/**
 * Valence flips across the corpus that exist only because of models the
 * arbiter recused: the article is comparable over the whole `generationIds`
 * panel and flips over it, but does not flip over `judgedIds`. Mirrors
 * `classify_frame`'s recused-only rows in the Python selection, which the
 * published run structurally could not reach.
 *
 * Null until every listed model's dataset has loaded.
 */
export function recusedOnlyFlips(
	datasets: Record<string, Article[] | undefined>,
	generationIds: readonly DatasetId[],
	judgedIds: readonly DatasetId[]
): number | null {
	const join = buildPanelJoin(datasets, generationIds);
	if (!join) return null;
	const judgedIndexes = judgedIds.map((id) => generationIds.indexOf(id));
	let count = 0;
	for (let row = 0; row < join.articles.length; row++) {
		const analyses = join.analyses.map((column) => column[row]);
		if (!calculatePanelSpread(analyses).isComparable) continue;
		if (!hasPolarityValenceFlip(analyses)) continue;
		if (hasPolarityValenceFlip(judgedIndexes.map((index) => analyses[index]))) continue;
		count++;
	}
	return count;
}

/**
 * How often every model of `modelIds` gives an article the same label, over
 * the corpus: the articles every listed model rated, and for polarity only
 * those where no model answered `Non applicable` (a verdict that the task
 * does not apply, not a position on the scale). Every centrality label counts,
 * `Non abordé` included, because it is the bottom of that scale.
 *
 * The arbiter card uses it to say why the judge was spent on polarity rather
 * than centrality. Null until every listed model's dataset has loaded.
 */
export function panelUnanimity(
	datasets: Record<string, Article[] | undefined>,
	modelIds: readonly DatasetId[],
	dimension: 'polarity' | 'centrality'
): Proportion | null {
	const join = buildPanelJoin(datasets, modelIds);
	if (!join) return null;
	let rated = 0;
	let unanimous = 0;
	for (let row = 0; row < join.articles.length; row++) {
		const analyses = join.analyses.map((column) => column[row]);
		const labels: (string | null)[] = analyses.map((analysis) =>
			dimension === 'polarity'
				? (analysis?.polarite ?? null)
				: (analysis?.centralite_islam_musulmans ?? null)
		);
		if (labels.some((label) => label === null)) continue;
		if (
			dimension === 'polarity' &&
			analyses.some(
				(analysis) => analysis?.polarite && POLARITY_NON_COMPARABLE.has(analysis.polarite)
			)
		)
			continue;
		rated++;
		if (labels.every((label) => label === labels[0])) unanimous++;
	}
	return proportion(unanimous, rated);
}

/**
 * How many reviewed articles the judge itself rated as rather or very
 * subjective (4–5) — read from the verdicts alone, so it needs no dataset.
 */
export function judgeSubjectiveCount(data: ArbiterV2EvaluationData | null): Proportion {
	let rated = 0;
	let subjective = 0;
	for (const evaluation of data?.evaluations ?? []) {
		const rank = ordinalRank(evaluation.arbiter.subjectivity?.score ?? null, 'subjectivity');
		if (rank === null) continue;
		rated++;
		if (rank >= 4) subjective++;
	}
	return proportion(subjective, rated);
}

// ============================================
// Two judges compared on their own ratings
// ============================================

export interface JudgeDimensionAgreement {
	dimension: ArbiterV2Dimension;
	/** Articles both judges rated on this dimension. */
	shared: number;
	/** Same label from both judges, over `shared`. */
	exact: Proportion;
	/** At most one step apart, over articles where both ratings sit on the scale. */
	withinOne: Proportion;
	/** Cohen's κ over `shared`, on labels; null when undefined. */
	kappa: number | null;
}

export interface JudgeComparison {
	/** Articles present in both files. */
	sharedArticles: number;
	dimensions: JudgeDimensionAgreement[];
}

/**
 * Agreement between two panel arbiters on their OWN ratings.
 *
 * Never on `preferred` or `overall_winner`: each judge reads a different panel
 * under its own blind permutation, so label "b" names a different model in
 * each file and a preference cannot be carried across. The own ratings are
 * the only thing both judges were asked in the same terms. Mirrors
 * `judge_comparison.judge_agreement` in the Python, extended to all three
 * dimensions.
 */
export function compareJudges(
	first: ArbiterV2EvaluationData | null,
	second: ArbiterV2EvaluationData | null
): JudgeComparison {
	if (!first || !second) return { sharedArticles: 0, dimensions: [] };
	const secondById = new Map(
		second.evaluations.map((evaluation) => [String(evaluation.article_id), evaluation.arbiter])
	);
	const shared = first.evaluations.filter((evaluation) =>
		secondById.has(String(evaluation.article_id))
	);

	const dimensions = ARBITER_V2_DIMENSIONS.map((dimension): JudgeDimensionAgreement => {
		const pairs: Array<[string, string]> = [];
		let comparable = 0;
		let withinOne = 0;
		for (const evaluation of shared) {
			const a = evaluation.arbiter[dimension]?.score;
			const b = secondById.get(String(evaluation.article_id))?.[dimension]?.score;
			if (!a || !b) continue;
			// Subjectivity is a rank serialised as a string; compare it as a number.
			pairs.push(dimension === 'subjectivity' ? [String(Number(a)), String(Number(b))] : [a, b]);
			const rankA = ordinalRank(a, dimension);
			const rankB = ordinalRank(b, dimension);
			if (rankA !== null && rankB !== null) {
				comparable++;
				if (Math.abs(rankA - rankB) <= 1) withinOne++;
			}
		}
		const exact = pairs.filter(([a, b]) => a === b).length;
		return {
			dimension,
			shared: pairs.length,
			exact: proportion(exact, pairs.length),
			withinOne: proportion(withinOne, comparable),
			kappa: cohensKappa(pairs)
		};
	});

	return { sharedArticles: shared.length, dimensions };
}
