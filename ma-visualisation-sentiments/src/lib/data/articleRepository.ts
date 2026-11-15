import { dataUrl } from '#lib/data/release.js';
import { ABSENT, type Loaded } from '#lib/data/resource.svelte.js';
import type { Article, DatasetId, SentimentAnalysis } from '#lib/types/data.js';
import {
	parseBaseArticles,
	parseSentimentFile,
	type BaseArticleRecord,
	type JustificationFile,
	type SentimentFile,
	type SentimentScores
} from './validation';
/**
 * A base record as `parseBaseArticles` validated it, plus the Article fields a
 * caller may already carry.
 */
type ArticleSource = Partial<Article> & {
	'o:id': BaseArticleRecord['o:id'];
	'dcterms:date'?: BaseArticleRecord['dcterms:date'];
};

/**
 * Build an Article from a validated base record (exported for tests).
 *
 * The published base names its fields `Newspaper` and `dcterms:date`; the
 * Article shape calls them `journal_source` and `publication_date`. An
 * already-mapped value wins when present, because the store tests feed
 * Article-shaped rows through here; the base itself never carries them.
 */
export function mapArticleProperties(item: ArticleSource, datasetId: DatasetId): Article {
	// Spread first so the computed fallbacks below win over null/empty raw values
	return {
		...item,
		journal_source: item.journal_source || item.Newspaper || 'N/A',
		publication_date: item.publication_date || item['dcterms:date'] || null,
		hijri_year: item.hijri_year ?? null,
		hijri_month: item.hijri_month ?? null,
		hijri_day: item.hijri_day ?? null,
		sentiment_analysis: item.sentiment_analysis ?? null,
		dataset_id: datasetId
	};
}

/**
 * Article base metadata is stored once in iwac_articles_base.json — the
 * per-model files carry only each model's sentiment analyses, keyed by
 * article id (the three old combined files repeated identical metadata).
 * The base file is fetched once and shared across all dataset loads.
 *
 * The per-model data is itself split in two. `iwac_sentiment_<model>.json`
 * holds only the three SCORES every chart, filter and aggregate reads (~59KB
 * gzipped); `iwac_justifications_<model>_<shard>.json` (32 shards) holds the
 * free-text prose that only the detail views and CSV exports show (86-92% of
 * the old combined payload). Prose loads on demand, one shard per article
 * detail or every shard for an export — see loadJustifications in
 * articles.svelte.ts.
 */
/**
 * Expand a score-only record into a full SentimentAnalysis with the
 * justification keys present but empty.
 *
 * Seeding the keys rather than leaving them absent keeps the shape stable for
 * every consumer (`article.sentiment_analysis.polarite_justification` reads
 * `null`, not `undefined`, before the prose arrives) and gives
 * loadJustifications plain property writes to make afterwards.
 */
function expandScores(scores: SentimentScores | null | undefined): SentimentAnalysis | null {
	if (!scores) return null;
	return {
		centralite_islam_musulmans: scores.centralite_islam_musulmans ?? null,
		centralite_justification: null,
		subjectivite_score: scores.subjectivite_score ?? null,
		subjectivite_justification: null,
		polarite: scores.polarite ?? null,
		polarite_justification: null
	};
}

let baseArticlesPromise: Promise<BaseArticleRecord[]> | null = null;

export const fetchJSON = async (
	filePath: string,
	fetchFunction: typeof fetch
): Promise<unknown> => {
	const resolvedPath = dataUrl(filePath);
	const response = await fetchFunction(resolvedPath);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
	}
	return response.json();
};

/**
 * Fetch a data file that may legitimately be unpublished, such as an arbiter
 * run. Only a 404 means "not published" (`ABSENT`); every other failure throws,
 * so a transient 5xx is never mistaken for — and cached as — an absent file.
 */
export const fetchOptionalJSON = async (
	filePath: string,
	fetchFunction: typeof fetch
): Promise<Loaded<unknown>> => {
	const response = await fetchFunction(dataUrl(filePath));
	if (response.status === 404) return ABSENT;
	if (!response.ok) {
		throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
	}
	return response.json();
};

const loadArticleBase = (fetchFunction: typeof fetch): Promise<BaseArticleRecord[]> => {
	if (!baseArticlesPromise) {
		baseArticlesPromise = fetchJSON('/data/iwac_articles_base.json', fetchFunction).then((data) => {
			return parseBaseArticles(data);
		});
		// Allow a retry on transient failure instead of caching the rejection
		baseArticlesPromise.catch(() => {
			baseArticlesPromise = null;
		});
	}
	return baseArticlesPromise;
};

/** Join base metadata with a model's score map (exported for tests) */
export function joinArticles(
	baseRecords: BaseArticleRecord[],
	sentiments: SentimentFile['sentiments'],
	datasetId: DatasetId
): Article[] {
	return baseRecords.map((record) =>
		mapArticleProperties(
			{ ...record, sentiment_analysis: expandScores(sentiments[String(record['o:id'])]) },
			datasetId
		)
	);
}

/**
 * Merge a model's justification prose into articles already in the store
 * (exported for tests).
 *
 * Writes the three prose fields onto the EXISTING `sentiment_analysis` objects
 * rather than rebuilding the array, so no re-filter or chart redraw follows,
 * and any reference already captured elsewhere (the open detail modal, a
 * selected comparison row) sees the prose rather than a stale copy. The store
 * holds the corpora as raw state, so the caller announces the write; views
 * read prose through `justificationsOf` (articles.svelte.ts).
 */
export function applyJustifications(
	articles: Article[],
	justifications: JustificationFile['justifications']
): void {
	for (const article of articles) {
		const analysis = article.sentiment_analysis;
		if (!analysis) continue;

		const prose = justifications[String(article['o:id'])];
		if (!prose) continue;

		analysis.centralite_justification = prose.centralite_justification ?? null;
		analysis.subjectivite_justification = prose.subjectivite_justification ?? null;
		analysis.polarite_justification = prose.polarite_justification ?? null;
	}
}

/** Load articles for a dataset: shared base metadata + per-model sentiments */
export const loadDatasetArticles = async (
	filePath: string,
	datasetId: DatasetId,
	fetchFunction: typeof fetch
): Promise<Article[]> => {
	const [baseRecords, rawSentimentData] = await Promise.all([
		loadArticleBase(fetchFunction),
		fetchJSON(filePath, fetchFunction)
	]);
	const sentimentData = parseSentimentFile(rawSentimentData, datasetId);
	const baseIds = new Set(baseRecords.map((record) => String(record['o:id'])));
	const sentimentIds = Object.keys(sentimentData.sentiments);
	if (
		sentimentIds.length !== baseIds.size ||
		sentimentIds.some((articleId) => !baseIds.has(articleId))
	) {
		throw new Error(
			`Sentiment/base ID coverage mismatch for ${datasetId}: ${sentimentIds.length} vs ${baseIds.size}`
		);
	}
	return joinArticles(baseRecords, sentimentData.sentiments, datasetId);
};
