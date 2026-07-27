/**
 * Place aggregation for the map view.
 *
 * Shapes `Article[]` + the article→place edge list into one record per place.
 * Knows nothing about Svelte or the map library, so the arithmetic that decides
 * what every bubble says is testable on its own — same split as
 * `agreementData.ts` feeding `agreement.ts`.
 *
 * All three dimensions are computed in the same pass. The map colours by only
 * one at a time, but re-walking 40k edges every time the reader flips the
 * dimension picker would be pure waste — the second and third means are nearly
 * free once an article's places have been looked up.
 */

import type {
	Article,
	CentralityValue,
	Place,
	PlacesPayload,
	PolarityValue
} from '$lib/types/data';
import { CENTRALITY_ORDER, POLARITY_ORDER } from '$lib/types/data';
import type { AgreementDimension } from './agreementData';
import { AGREEMENT_DIMENSIONS } from './agreementData';

/**
 * The dimensions a bubble can be coloured by — the app's three, unchanged.
 *
 * All three are reported on the same 1–5 ordinal scale, which is what lets one
 * legend layout and one set of `step` thresholds in mapScales serve all of them.
 */
export type MapDimension = AgreementDimension;
export const MAP_DIMENSIONS = AGREEMENT_DIMENSIONS;

/** Mean of one dimension over the articles that carry a usable value for it. */
export interface DimensionStat {
	/** Mean on the 1–5 scale, or null when nothing was scorable. */
	mean: number | null;
	/** How many articles contributed to `mean`. */
	scored: number;
	/** Per-label counts, including labels excluded from the mean. */
	buckets: Record<string, number>;
}

/** A place plus the sentiment of the articles that mention it. */
export interface PlaceAggregate extends Place {
	/** Articles in the supplied selection that tag this place. */
	count: number;
	/** One stat block per dimension; the map shows whichever is selected. */
	stats: Record<MapDimension, DimensionStat>;
}

/**
 * Score an article on one dimension.
 *
 * Returns null when the article carries no usable value — which is NOT the same
 * as a low score, and is why the caller counts `scored` separately from `count`.
 *
 * POLARITY: `Non applicable` sorts to 0 in POLARITY_ORDER because it belongs at
 * the bottom of the ordinal scale, but it means "no stance expressed", not
 * "maximally negative". Averaging it in would drag any place with a lot of
 * incidental coverage toward the negative pole — La Mecque, tagged by hundreds
 * of routine pilgrimage-logistics pieces, would read as hostile. Excluded from
 * the mean, still counted in `count` and in `buckets`.
 *
 * CENTRALITY: `Non abordé` is deliberately NOT excluded. It scores 1 in
 * CENTRALITY_ORDER and genuinely is the bottom of that scale — an article that
 * does not address Islam at all is maximally non-central, which is a real
 * reading, not a missing value.
 */
function scoreArticle(article: Article, dimension: MapDimension): number | null {
	const analysis = article.sentiment_analysis;
	if (!analysis) return null;

	switch (dimension) {
		case 'polarity': {
			const label = analysis.polarite;
			if (!label || label === 'Non applicable') return null;
			return POLARITY_ORDER[label as PolarityValue] ?? null;
		}
		case 'centrality': {
			const label = analysis.centralite_islam_musulmans;
			if (!label) return null;
			return CENTRALITY_ORDER[label as CentralityValue] ?? null;
		}
		case 'subjectivity': {
			const score = analysis.subjectivite_score;
			if (score == null) return null;
			const numeric = Number(score);
			return Number.isFinite(numeric) ? numeric : null;
		}
	}
}

/** The label an article carries for a dimension, for the bucket breakdown. */
function bucketLabel(article: Article, dimension: MapDimension): string | null {
	const analysis = article.sentiment_analysis;
	if (!analysis) return null;

	switch (dimension) {
		case 'polarity':
			return analysis.polarite ?? null;
		case 'centrality':
			return analysis.centralite_islam_musulmans ?? null;
		case 'subjectivity':
			return analysis.subjectivite_score == null ? null : String(analysis.subjectivite_score);
	}
}

interface Accumulator {
	count: number;
	sums: Record<MapDimension, number>;
	scored: Record<MapDimension, number>;
	buckets: Record<MapDimension, Record<string, number>>;
}

function emptyAccumulator(): Accumulator {
	return {
		count: 0,
		sums: { polarity: 0, subjectivity: 0, centrality: 0 },
		scored: { polarity: 0, subjectivity: 0, centrality: 0 },
		buckets: { polarity: {}, subjectivity: {}, centrality: {} }
	};
}

/**
 * Aggregate articles by the places they tag.
 *
 * Places with no article in `articles` are omitted rather than returned at
 * zero — the map should not draw a point for something the current filters
 * exclude. Result is sorted largest-first because MapLibre paints in source
 * order, so small bubbles must come last to land on top of big ones.
 */
export function aggregatePlaces(articles: Article[], payload: PlacesPayload): PlaceAggregate[] {
	const byId = new Map<number, Place>(payload.places.map((place) => [place.id, place]));
	const totals = new Map<number, Accumulator>();

	for (const article of articles) {
		const placeIds = payload.articles[String(article['o:id'])];
		if (!placeIds) continue;

		// Score once per article, not once per (article, place) pair.
		const scores = {} as Record<MapDimension, number | null>;
		const labels = {} as Record<MapDimension, string | null>;
		for (const dimension of MAP_DIMENSIONS) {
			scores[dimension] = scoreArticle(article, dimension);
			labels[dimension] = bucketLabel(article, dimension);
		}

		// An article can tag both a place's canonical title and one of its
		// aliases; the export already dedupes, but a malformed payload must not
		// double-count.
		const seen = new Set<number>();

		for (const placeId of placeIds) {
			if (!byId.has(placeId) || seen.has(placeId)) continue;
			seen.add(placeId);

			let entry = totals.get(placeId);
			if (!entry) {
				entry = emptyAccumulator();
				totals.set(placeId, entry);
			}

			entry.count += 1;
			for (const dimension of MAP_DIMENSIONS) {
				const label = labels[dimension];
				if (label !== null) {
					entry.buckets[dimension][label] = (entry.buckets[dimension][label] ?? 0) + 1;
				}
				const score = scores[dimension];
				if (score !== null) {
					entry.sums[dimension] += score;
					entry.scored[dimension] += 1;
				}
			}
		}
	}

	const result: PlaceAggregate[] = [];
	for (const [placeId, entry] of totals) {
		const stats = {} as Record<MapDimension, DimensionStat>;
		for (const dimension of MAP_DIMENSIONS) {
			const scored = entry.scored[dimension];
			stats[dimension] = {
				mean: scored > 0 ? entry.sums[dimension] / scored : null,
				scored,
				buckets: entry.buckets[dimension]
			};
		}

		result.push({ ...byId.get(placeId)!, count: entry.count, stats });
	}

	return result.sort((a, b) => b.count - a.count);
}
