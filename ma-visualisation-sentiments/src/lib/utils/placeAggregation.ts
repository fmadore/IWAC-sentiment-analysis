/**
 * Place aggregation for the map view.
 *
 * Shapes `Article[]` + the article→place edge list into one record per place.
 * Knows nothing about Svelte or the map library, so the arithmetic that decides
 * what every bubble says is testable on its own — same split as
 * `agreementData.ts` feeding `agreement.ts`.
 */

import type { Article, Place, PlacesPayload, PolarityValue } from '$lib/types/data';
import { POLARITY_ORDER } from '$lib/types/data';

/**
 * `Non applicable` sorts to 0 in POLARITY_ORDER because it belongs at the
 * bottom of the ordinal scale, but it means "no stance expressed", not
 * "maximally negative". Averaging it in would drag any place with a lot of
 * incidental coverage toward the negative pole — La Mecque, tagged by hundreds
 * of routine pilgrimage-logistics pieces, would read as hostile. It still
 * counts toward `count` and appears in the bucket breakdown.
 */
const UNSCORED_POLARITY = 'Non applicable';

/** A place plus the sentiment of the articles that mention it. */
export interface PlaceAggregate extends Place {
	/** Articles in the supplied selection that tag this place. */
	count: number;
	/**
	 * Mean polarity on the 1–5 `POLARITY_ORDER` scale over articles carrying a
	 * usable rating, or `null` when none do.
	 */
	meanPolarity: number | null;
	/** How many articles contributed to `meanPolarity`. */
	scored: number;
	/** Per-polarity-bucket counts, for the popup breakdown. */
	buckets: Record<string, number>;
}

interface Accumulator {
	count: number;
	sum: number;
	scored: number;
	buckets: Record<string, number>;
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

		const polarity = article.sentiment_analysis?.polarite ?? null;
		const score = polarity ? POLARITY_ORDER[polarity as PolarityValue] : undefined;
		const scorable = score !== undefined && polarity !== UNSCORED_POLARITY;

		// An article can tag both a place's canonical title and one of its
		// aliases; the export already dedupes, but a malformed payload must not
		// double-count.
		const seen = new Set<number>();

		for (const placeId of placeIds) {
			if (!byId.has(placeId) || seen.has(placeId)) continue;
			seen.add(placeId);

			let entry = totals.get(placeId);
			if (!entry) {
				entry = { count: 0, sum: 0, scored: 0, buckets: {} };
				totals.set(placeId, entry);
			}

			entry.count += 1;
			if (polarity) {
				entry.buckets[polarity] = (entry.buckets[polarity] ?? 0) + 1;
			}
			if (scorable) {
				entry.sum += score;
				entry.scored += 1;
			}
		}
	}

	const result: PlaceAggregate[] = [];
	for (const [placeId, entry] of totals) {
		result.push({
			...byId.get(placeId)!,
			count: entry.count,
			scored: entry.scored,
			meanPolarity: entry.scored > 0 ? entry.sum / entry.scored : null,
			buckets: entry.buckets
		});
	}

	return result.sort((a, b) => b.count - a.count);
}
