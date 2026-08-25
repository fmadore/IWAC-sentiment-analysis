/**
 * Panel consensus: where all the models of one generation disagree, and about
 * which newspapers.
 *
 * Everything here takes the rater count from its arguments rather than assuming
 * three, because the generation-2 panel grew from three models to five. The one
 * genuine exception is the ternary projection at the foot of this file, which
 * is three-corner geometry and says so.
 *
 * Every other model-vs-model surface in this app is pairwise-locked. A pairwise
 * view can show that A ≠ B; it can never show that B stands apart from the
 * other two, which is the question that separates a model's calibration
 * signature from ordinary noise. On the v1 data Mistral is the sole dissenter
 * on centrality for more than half the corpus and grades down 94% of the time;
 * on v2 that particular effect is gone and the roles have rotated. Neither
 * statement is expressible pairwise.
 *
 * Relationship to the two modules this sits between:
 *
 *  - `agreementData.ts` shapes Articles into rater items for kappa. This module
 *    does the same join but keeps the *ordinal* values, because spread and
 *    direction both need arithmetic that category labels cannot do.
 *  - `derivations.ts`'s `calculateThreeWaySpread` measures the same quantity per
 *    article, but as the arbiter's selection metric it drops a row wholesale
 *    when any model reports a non-comparable value on any dimension. That is
 *    right for "is this article worth paying an arbiter for" and wrong here: a
 *    per-title mean needs each dimension to stand or fall on its own, and it
 *    needs the declined ratings available rather than silently folded in.
 *
 * Declined ratings, and why 'Non abordé' is not one. `Non applicable` means the
 * model refused the task; with the contract's ordinal at 0 it sits a full step
 * below the bottom rung, so one model declining scores as maximal disagreement
 * against two that rated. That inflates exactly the titles whose articles are
 * marginally about Islam — on v2, r(polarity spread, declined share) = +0.64,
 * and Ehuzu's polarity spread falls from 1.37 to 0.70 once those rows go. So
 * they are excluded by default and the share is always reported.
 *
 * `Non abordé` is treated as a real rung, not a refusal: on the centrality
 * scale "Islam is not addressed" is a substantive judgement, and this is the
 * same resolution `newspaperRanking.ts` reached for the same tension — its
 * POLARITY_INDEX drops 'Non applicable' while CENTRALITY_INDEX keeps
 * 'Non abordé' as position 1.
 */

import type { Article } from '$lib/types/data';
import { getJournalName } from '$lib/utils/format';
import { CENTRALITY_ORDER, POLARITY_ORDER } from '$lib/domain/sentimentContract';
import type { AgreementDimension } from './agreementData';

export type { AgreementDimension };

/**
 * The ordinal value of each label, per dimension. Read from the contract for
 * polarity and centrality; subjectivity is already a 1-5 rank in our files
 * (v2 maps its upstream label to that rank at generation time).
 */
const DIMENSION_ORDER: Record<AgreementDimension, Record<string, number> | null> = {
	polarity: POLARITY_ORDER,
	centrality: CENTRALITY_ORDER,
	subjectivity: null
};

/**
 * The label that means "I decline to rate", per dimension. Deliberately NOT the
 * contract's `nonComparable` sets: those also list 'Non abordé' for centrality,
 * which is correct for the row-dropping discrepancy score and wrong here (see
 * the module comment).
 */
const DECLINED_LABEL: Record<AgreementDimension, string | null> = {
	polarity: 'Non applicable',
	centrality: 'Non applicable',
	subjectivity: null
};

/** One article's ordinal value from every model, plus the facets we group by. */
export interface ConsensusRow {
	id: string;
	newspaper: string;
	country: string;
	/** Publication year, or null when the date is missing or unparseable. */
	year: number | null;
	/**
	 * Per dimension, one ordinal per model in `modelIds` order — or null when at
	 * least one model produced no label at all, which makes the row unusable for
	 * that dimension regardless of the declined-ratings setting.
	 */
	values: Record<AgreementDimension, number[] | null>;
	/** Per dimension, whether any model declined to rate. */
	declined: Record<AgreementDimension, boolean>;
}

/** Ordinal value of one article on one dimension, or null when unlabelled. */
export function ordinalValue(article: Article, dimension: AgreementDimension): number | null {
	const analysis = article.sentiment_analysis;
	if (!analysis) return null;

	if (dimension === 'subjectivity') {
		const score = analysis.subjectivite_score;
		return typeof score === 'number' && score >= 1 && score <= 5 ? score : null;
	}

	const label = dimension === 'polarity' ? analysis.polarite : analysis.centralite_islam_musulmans;
	if (!label) return null;

	const order = DIMENSION_ORDER[dimension];
	const value = order?.[label];
	return typeof value === 'number' ? value : null;
}

/** Whether an article's label on a dimension is a refusal rather than a rating. */
export function isDeclined(article: Article, dimension: AgreementDimension): boolean {
	const analysis = article.sentiment_analysis;
	if (!analysis) return false;

	if (dimension === 'subjectivity') return analysis.subjectivite_score == null;

	const declined = DECLINED_LABEL[dimension];
	if (declined === null) return false;

	const label = dimension === 'polarity' ? analysis.polarite : analysis.centralite_islam_musulmans;
	return label === declined;
}

const YEAR = /^(\d{4})/;

function parseYear(article: Article): number | null {
	const raw = article.publication_date;
	if (typeof raw !== 'string') return null;
	const match = YEAR.exec(raw);
	return match ? Number(match[1]) : null;
}

/**
 * Join every model of one generation on article id.
 *
 * `modelIds` must belong to a single generation — the two panels annotated the
 * corpus under different prompts, so pooling them would measure the prompt
 * rewrite as if it were disagreement between models. The caller scopes this;
 * see `stores/agreement.svelte.ts`.
 *
 * Articles any model left entirely unanalysed contribute nothing to the
 * dimensions they are missing, so each dimension carries its own honest n
 * rather than one total that quietly includes half-missing rows.
 */
export function buildConsensusRows(
	datasets: Record<string, Article[]>,
	modelIds: readonly string[]
): ConsensusRow[] {
	const [first, ...rest] = modelIds;
	const firstArticles = datasets[first] ?? [];
	if (firstArticles.length === 0 || rest.length === 0) return [];

	const restMaps = rest.map(
		(id) => new Map((datasets[id] ?? []).map((article) => [String(article['o:id']), article]))
	);

	const rows: ConsensusRow[] = [];

	for (const article of firstArticles) {
		const id = String(article['o:id']);

		const others: Article[] = [];
		let complete = true;
		for (const map of restMaps) {
			const other = map.get(id);
			if (!other) {
				complete = false;
				break;
			}
			others.push(other);
		}
		if (!complete) continue;

		const all = [article, ...others];
		const values = {} as Record<AgreementDimension, number[] | null>;
		const declined = {} as Record<AgreementDimension, boolean>;

		for (const dimension of ['polarity', 'subjectivity', 'centrality'] as AgreementDimension[]) {
			const ordinals = all.map((entry) => ordinalValue(entry, dimension));
			values[dimension] = ordinals.some((value) => value === null) ? null : (ordinals as number[]);
			declined[dimension] = all.some((entry) => isDeclined(entry, dimension));
		}

		rows.push({
			id,
			newspaper: getJournalName(article),
			country: article.Country || '',
			year: parseYear(article),
			values,
			declined
		});
	}

	return rows;
}

/** How the models split on one article. */
export type DissentKind = 'unanimous' | 'majority' | 'split';

export interface DissentOutcome {
	kind: DissentKind;
	/** Index into `modelIds` of the model that broke ranks; null unless `majority`. */
	dissenter: number | null;
	/** +1 when the dissenter graded above the pair, -1 below; 0 otherwise. */
	direction: 1 | -1 | 0;
	/** max − min across the models. */
	spread: number;
}

/**
 * Classify one article's ordinals, for any number of raters.
 *
 * `majority` requires exactly one model to hold a value alone while all the
 * others share one — with three raters that is the familiar 2-1 split, with
 * five it is 4-1. Anything else is `split`, which keeps the "who breaks ranks"
 * reading honest instead of naming a dissenter that a 3-2 split does not have.
 *
 * That makes `split` mean different things at different panel sizes, and the UI
 * copy has to follow: with three raters it is exactly "all three differ", while
 * with five it also absorbs 3-2 and 2-2-1. Hence the labels are "one against
 * the rest" and "divided several ways" rather than "two against one" and "all
 * three differ" — the same two buckets, named for what they actually hold.
 */
export function classifyDissent(values: number[]): DissentOutcome {
	const spread = Math.max(...values) - Math.min(...values);

	if (spread === 0) return { kind: 'unanimous', dissenter: null, direction: 0, spread };

	const counts = new Map<number, number>();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

	if (counts.size === 2) {
		const entries = [...counts.entries()];
		const lone = entries.find(([, count]) => count === 1);
		const majority = entries.find(([, count]) => count === values.length - 1);

		if (lone && majority) {
			return {
				kind: 'majority',
				dissenter: values.indexOf(lone[0]),
				direction: lone[0] > majority[0] ? 1 : -1,
				spread
			};
		}
	}

	return { kind: 'split', dissenter: null, direction: 0, spread };
}

/** Rows usable for one dimension under the current declined-ratings setting. */
export function usableValues(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	includeDeclined: boolean
): { row: ConsensusRow; values: number[] }[] {
	const usable: { row: ConsensusRow; values: number[] }[] = [];

	for (const row of rows) {
		const values = row.values[dimension];
		if (values === null) continue;
		if (!includeDeclined && row.declined[dimension]) continue;
		usable.push({ row, values });
	}

	return usable;
}

export interface DissentProfile {
	dimension: AgreementDimension;
	n: number;
	unanimous: number;
	split: number;
	/** Per model index: how often it alone broke ranks, and in which direction. */
	dissent: { up: number; down: number; total: number }[];
	/** Rows dropped because a model declined; 0 when declined ratings are included. */
	declinedExcluded: number;
}

/** The corpus-wide "who breaks ranks" decomposition for one dimension. */
export function profileDissent(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	modelCount: number,
	includeDeclined: boolean
): DissentProfile {
	const usable = usableValues(rows, dimension, includeDeclined);
	const dissent = Array.from({ length: modelCount }, () => ({ up: 0, down: 0, total: 0 }));

	let unanimous = 0;
	let split = 0;

	for (const { values } of usable) {
		const outcome = classifyDissent(values);
		if (outcome.kind === 'unanimous') {
			unanimous++;
		} else if (outcome.kind === 'split') {
			split++;
		} else if (outcome.dissenter !== null) {
			const entry = dissent[outcome.dissenter];
			if (entry) {
				entry.total++;
				if (outcome.direction === 1) entry.up++;
				else entry.down++;
			}
		}
	}

	const declinedExcluded = includeDeclined
		? 0
		: rows.filter((row) => row.values[dimension] !== null && row.declined[dimension]).length;

	return { dimension, n: usable.length, unanimous, split, dissent, declinedExcluded };
}

export interface NewspaperDisagreement {
	newspaper: string;
	country: string;
	/** Mean three-way spread across this title's usable articles. */
	mean: number;
	/** Half-width of the 95% confidence interval; 0 when n < 2. */
	confidence: number;
	standardDeviation: number;
	n: number;
	/** Share of this title's articles where the models were unanimous, 0-1. */
	unanimity: number;
	/** Share where at least one model declined to rate, 0-1, before exclusion. */
	declinedShare: number;
	/** Median publication year — the era confound, made visible rather than argued. */
	medianYear: number | null;
	/** Per model index, the share of this title's articles where it alone dissented. */
	dissentShare: number[];
	/** Share where no two models agreed, so there is no majority to dissent from. */
	splitShare: number;
	/** Mean of the per-article consensus (the models' mean ordinal). */
	consensusMean: number;
}

/**
 * Mean three-way spread per newspaper, with a 95% confidence interval.
 *
 * The deliberate mirror of `rankNewspapers`: same threshold, same normal
 * approximation, same "n titles omitted" honesty — but the axis is cross-model
 * spread rather than mean sentiment, so the two read side by side. On the v1
 * data La Voie is unremarkable in sentiment and an outlier in disagreement,
 * which is the whole point of drawing both.
 *
 * Small titles look more disagreed (v1 r(spread, log n) = −0.21), which is why
 * the threshold and the intervals are not optional decoration.
 *
 * Sorted ascending by mean, the order a horizontal dot plot wants.
 */
export function rankNewspaperDisagreement(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	modelCount: number,
	options: { includeDeclined?: boolean; minArticles?: number } = {}
): NewspaperDisagreement[] {
	const { includeDeclined = false, minArticles = 30 } = options;

	interface Group {
		country: string;
		spreads: number[];
		consensus: number[];
		years: number[];
		unanimous: number;
		split: number;
		declined: number;
		/** Counts every row with a label, declined or not — the share's denominator. */
		labelled: number;
		dissent: number[];
	}

	const groups = new Map<string, Group>();

	const groupFor = (row: ConsensusRow): Group => {
		let group = groups.get(row.newspaper);
		if (!group) {
			group = {
				country: row.country,
				spreads: [],
				consensus: [],
				years: [],
				unanimous: 0,
				split: 0,
				declined: 0,
				labelled: 0,
				dissent: new Array<number>(modelCount).fill(0)
			};
			groups.set(row.newspaper, group);
		}
		return group;
	};

	// The declined share is a property of the title, so it is counted over every
	// labelled row — including the ones the current setting then excludes.
	for (const row of rows) {
		if (!row.newspaper || row.values[dimension] === null) continue;
		const group = groupFor(row);
		group.labelled++;
		if (row.declined[dimension]) group.declined++;
	}

	for (const { row, values } of usableValues(rows, dimension, includeDeclined)) {
		if (!row.newspaper) continue;

		const group = groupFor(row);
		const outcome = classifyDissent(values);

		group.spreads.push(outcome.spread);
		group.consensus.push(values.reduce((sum, value) => sum + value, 0) / values.length);
		if (row.year !== null) group.years.push(row.year);
		if (outcome.kind === 'unanimous') group.unanimous++;
		if (outcome.kind === 'split') group.split++;
		if (outcome.kind === 'majority' && outcome.dissenter !== null) {
			group.dissent[outcome.dissenter]++;
		}
	}

	const ranked: NewspaperDisagreement[] = [];

	for (const [newspaper, group] of groups) {
		const n = group.spreads.length;
		if (n < minArticles) continue;

		const mean = group.spreads.reduce((sum, value) => sum + value, 0) / n;
		const variance =
			n > 1 ? group.spreads.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
		const standardDeviation = Math.sqrt(variance);

		ranked.push({
			newspaper,
			country: group.country,
			mean,
			standardDeviation,
			confidence: n > 1 ? 1.96 * (standardDeviation / Math.sqrt(n)) : 0,
			n,
			unanimity: group.unanimous / n,
			declinedShare: group.labelled > 0 ? group.declined / group.labelled : 0,
			medianYear: median(group.years),
			dissentShare: group.dissent.map((count) => count / n),
			splitShare: group.split / n,
			consensusMean: group.consensus.reduce((sum, value) => sum + value, 0) / n
		});
	}

	return ranked.sort((a, b) => a.mean - b.mean);
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Titles a threshold hid, for an honest "n omitted" note. */
export function countExcludedTitles(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	options: { includeDeclined?: boolean; minArticles?: number } = {}
): number {
	const { includeDeclined = false, minArticles = 30 } = options;
	const counts = new Map<string, number>();

	for (const { row } of usableValues(rows, dimension, includeDeclined)) {
		if (!row.newspaper) continue;
		counts.set(row.newspaper, (counts.get(row.newspaper) ?? 0) + 1);
	}

	let excluded = 0;
	for (const count of counts.values()) {
		if (count < minArticles) excluded++;
	}
	return excluded;
}

/**
 * Pearson correlation, or NaN when either series has no variance.
 *
 * Used for one claim only: whether per-title disagreement tracks per-title
 * sentiment. It does not (v1 polarity r = −0.06), and saying so is the finding
 * — models are not simply arguing about the titles with the strongest views.
 */
export function pearson(xs: number[], ys: number[]): number {
	const n = Math.min(xs.length, ys.length);
	if (n < 2) return Number.NaN;

	const meanX = xs.slice(0, n).reduce((sum, value) => sum + value, 0) / n;
	const meanY = ys.slice(0, n).reduce((sum, value) => sum + value, 0) / n;

	let covariance = 0;
	let varianceX = 0;
	let varianceY = 0;

	for (let index = 0; index < n; index++) {
		const dx = xs[index] - meanX;
		const dy = ys[index] - meanY;
		covariance += dx * dy;
		varianceX += dx * dx;
		varianceY += dy * dy;
	}

	const denominator = Math.sqrt(varianceX * varianceY);
	return denominator === 0 ? Number.NaN : covariance / denominator;
}

/**
 * Barycentric projection of a title's dissent shares onto an equilateral
 * triangle whose corners are the models.
 *
 * **Three raters only, and not generalisable.** A simplex over n models needs
 * n corners, so four would want a tetrahedron and five a shape with no honest
 * 2-D projection at all. `barycentric` therefore returns null for any share
 * vector that is not exactly `TRIANGLE_CORNERS.length` long, and the caller
 * (`DissentProfileChart`) does not offer the mode unless the generation on
 * screen has exactly three models. The five-model panel reads the same
 * decomposition off the stacked bars, which have no such limit.
 *
 * A title sits at a corner when one model does all the breaking of ranks there,
 * and at the centre when the three share it evenly. Titles with no majority
 * splits at all have nothing to project and are dropped by the caller.
 *
 * Returns unit coordinates: corner 0 at (0,0), corner 1 at (1,0), corner 2 at
 * (0.5, √3/2). The caller maps those to pixels, which is the only way to keep
 * the triangle equilateral inside a responsive chart.
 */
export const TRIANGLE_CORNERS: readonly [number, number][] = [
	[0, 0],
	[1, 0],
	[0.5, Math.sqrt(3) / 2]
];

export function barycentric(shares: number[]): [number, number] | null {
	const total = shares.reduce((sum, share) => sum + share, 0);
	if (total <= 0 || shares.length !== TRIANGLE_CORNERS.length) return null;

	let x = 0;
	let y = 0;
	shares.forEach((share, index) => {
		const weight = share / total;
		x += weight * TRIANGLE_CORNERS[index][0];
		y += weight * TRIANGLE_CORNERS[index][1];
	});

	return [x, y];
}

/**
 * A dimension's scale, ascending, as this module measures it.
 *
 * Derived from the contract rather than restated, and deliberately NOT the same
 * list as `DIMENSION_CATEGORIES` in `agreementData.ts`: that one omits
 * 'Non applicable' from centrality because Cohen's kappa needs a closed label
 * set, whereas here the declined rung is exactly what the toggle governs.
 * Dropping it when declined ratings are excluded keeps the scale and the data
 * in step, so a Sankey never renders a band that can have no ribbons.
 */
export function dimensionScale(
	dimension: AgreementDimension,
	includeDeclined: boolean
): { labels: string[]; ordinals: number[] } {
	if (dimension === 'subjectivity') {
		return { labels: ['1', '2', '3', '4', '5'], ordinals: [1, 2, 3, 4, 5] };
	}

	const order = DIMENSION_ORDER[dimension];
	const declined = DECLINED_LABEL[dimension];

	const entries = Object.entries(order ?? {})
		.filter(([label]) => includeDeclined || label !== declined)
		.sort((a, b) => a[1] - b[1]);

	return { labels: entries.map(([label]) => label), ordinals: entries.map(([, value]) => value) };
}

export interface FlowNode {
	name: string;
	/** Index into `modelIds` — which column this node sits in. */
	depth: number;
	/** The ordinal this node represents. */
	value: number;
	category: string;
}

export interface FlowLink {
	source: string;
	target: string;
	value: number;
}

/**
 * Label flow between consecutive models, for a Sankey.
 *
 * The three-way generalisation of the pairwise agreement matrix: a systematic
 * deflation shows up as a mass of ribbons all sliding down one band, and the
 * routes a matrix cannot show — articles where the first and last model agree
 * *through* a disagreeing middle one — become visible as ribbons that leave a
 * band and come back.
 *
 * Node names are prefixed with the column index because the same category
 * appears in every column and Sankey nodes are keyed by name.
 */
export function buildLabelFlow(
	rows: ConsensusRow[],
	dimension: AgreementDimension,
	modelCount: number,
	includeDeclined: boolean
): { nodes: FlowNode[]; links: FlowLink[] } {
	const usable = usableValues(rows, dimension, includeDeclined);
	if (usable.length === 0) return { nodes: [], links: [] };

	const { labels, ordinals } = dimensionScale(dimension, includeDeclined);
	const positionOf = new Map(ordinals.map((ordinal, index) => [ordinal, index]));

	const nodeName = (depth: number, position: number) => `${depth} · ${labels[position]}`;

	const used = new Set<string>();
	const linkTotals = new Map<string, number>();

	for (const { values } of usable) {
		const positions = values.map((value) => positionOf.get(value));
		if (positions.some((position) => position === undefined)) continue;
		const path = positions as number[];

		path.forEach((position, depth) => used.add(`${depth}|${position}`));

		for (let depth = 0; depth < modelCount - 1; depth++) {
			// Keyed on scale positions, never on node names: several category names
			// contain a space, so a name-joined key could not be split back apart.
			const key = `${depth}|${path[depth]}|${path[depth + 1]}`;
			linkTotals.set(key, (linkTotals.get(key) ?? 0) + 1);
		}
	}

	const nodes: FlowNode[] = [...used].map((key) => {
		const [depth, position] = key.split('|').map(Number);
		return {
			name: nodeName(depth, position),
			depth,
			value: ordinals[position],
			category: labels[position]
		};
	});
	nodes.sort((a, b) => a.depth - b.depth || b.value - a.value);

	const links: FlowLink[] = [...linkTotals.entries()].map(([key, value]) => {
		const [depth, source, target] = key.split('|').map(Number);
		return { source: nodeName(depth, source), target: nodeName(depth + 1, target), value };
	});

	return { nodes, links };
}
