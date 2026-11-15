/**
 * One join of every model of a generation, shared by every panel statistic.
 *
 * Every dataset is built by `joinArticles` over the same base records
 * (`data/articleRepository.ts`), and `loadDatasetArticles` refuses a score file
 * whose ids do not match the base exactly. So all loaded datasets — both
 * generations — are the same length, in the same order: row i of one model is
 * row i of every other. The agreement view used to rebuild an id → article Map
 * for every pair and dimension (some seventy per recompute); this replaces them
 * with one positional join and integer row indices.
 *
 * Alignment is verified, not assumed: `buildPanelJoin` checks every id at every
 * position, and falls back to an id-keyed join over the first model's rows if
 * any dataset is out of step (a test fixture, or a future loader that stops
 * guaranteeing it). The fallback is correct, just slower.
 *
 * `modelIds` must belong to one generation; callers scope that, as the
 * pooled-statistics rule in CLAUDE.md requires.
 */

import type { Article, SentimentAnalysis } from '#lib/types/data.js';
import { getJournalName } from './format';

export interface PanelJoin {
	/** The models joined, in the order given (contract order in the stores). */
	modelIds: readonly string[];
	/** One base article per row: the first model's copy of the record. */
	articles: Article[];
	/** analyses[m][i] — model m's analysis of row i, or null. */
	analyses: (SentimentAnalysis | null)[][];
	/** Article id → row index. */
	indexById: Map<string, number>;
	/** Whether the inputs were positionally aligned (the fast path). */
	aligned: boolean;
}

/** Whether every dataset carries the same ids in the same order. */
export function datasetsAligned(columns: readonly Article[][]): boolean {
	const [first, ...rest] = columns;
	if (!first) return true;
	for (const column of rest) {
		if (column.length !== first.length) return false;
		for (let i = 0; i < first.length; i++) {
			if (column[i]['o:id'] !== first[i]['o:id']) return false;
		}
	}
	return true;
}

/**
 * Join the given models row by row. Returns null when any model has no
 * articles, since every panel statistic needs the whole panel.
 */
export function buildPanelJoin(
	datasets: Partial<Record<string, Article[]>>,
	modelIds: readonly string[]
): PanelJoin | null {
	if (modelIds.length === 0) return null;
	const columns = modelIds.map((id) => datasets[id]);
	if (columns.some((column) => !column?.length)) return null;
	const present = columns as Article[][];
	const articles = present[0];

	if (datasetsAligned(present)) {
		const indexById = new Map<string, number>();
		for (let i = 0; i < articles.length; i++) indexById.set(String(articles[i]['o:id']), i);
		return {
			modelIds,
			articles,
			analyses: present.map((column) => column.map((article) => article.sentiment_analysis)),
			indexById,
			aligned: true
		};
	}

	// Fallback: an inner join on the first model's rows. An article some model
	// lacks entirely is dropped, as every per-pair join used to drop it; an
	// article it has with a null analysis is kept, with a null cell.
	const maps = present
		.slice(1)
		.map((column) => new Map(column.map((article) => [String(article['o:id']), article])));
	const joinedArticles: Article[] = [];
	const analyses: (SentimentAnalysis | null)[][] = present.map(() => []);
	const joinedIndex = new Map<string, number>();
	for (const article of articles) {
		const id = String(article['o:id']);
		const others = maps.map((map) => map.get(id));
		if (others.some((other) => other === undefined)) continue;
		joinedIndex.set(id, joinedArticles.length);
		joinedArticles.push(article);
		analyses[0].push(article.sentiment_analysis);
		others.forEach((other, m) => analyses[m + 1].push((other as Article).sentiment_analysis));
	}
	return {
		modelIds,
		articles: joinedArticles,
		analyses,
		indexById: joinedIndex,
		aligned: false
	};
}

/**
 * Remember the last join and return it again while the inputs are the same
 * arrays. A `$derived` over the whole datasets record re-runs whenever any
 * dataset arrives — including the other generation's background prefetch — and
 * returning the identical object stops that from invalidating every statistic
 * downstream.
 */
export function createPanelJoinCache() {
	let lastColumns: (Article[] | undefined)[] = [];
	let lastIds: readonly string[] = [];
	let last: PanelJoin | null = null;
	return (
		datasets: Partial<Record<string, Article[]>>,
		modelIds: readonly string[]
	): PanelJoin | null => {
		const columns = modelIds.map((id) => datasets[id]);
		const same =
			modelIds.length === lastIds.length &&
			modelIds.every((id, m) => id === lastIds[m] && columns[m] === lastColumns[m]);
		if (same) return last;
		lastColumns = columns;
		lastIds = modelIds;
		last = buildPanelJoin(datasets, modelIds);
		return last;
	};
}

/** Every row index, for an unfiltered slice. */
export function allRows(join: PanelJoin): number[] {
	return Array.from({ length: join.articles.length }, (_, i) => i);
}

/**
 * Row indices passing the corpus-slice facets (country, newspaper) — the only
 * facets the agreement statistics honour; see `stores/agreement.svelte.ts`.
 */
export function filterPanelRows(
	join: PanelJoin,
	countries: readonly string[],
	journals: readonly string[]
): number[] {
	if (countries.length === 0 && journals.length === 0) return allRows(join);
	const countrySet = countries.length > 0 ? new Set(countries) : null;
	const journalSet = journals.length > 0 ? new Set(journals) : null;
	const rows: number[] = [];
	join.articles.forEach((article, i) => {
		if (countrySet && !countrySet.has(article.Country || '')) return;
		if (journalSet && !journalSet.has(getJournalName(article))) return;
		rows.push(i);
	});
	return rows;
}
