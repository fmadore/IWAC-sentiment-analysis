/**
 * Corpus regression test.
 *
 * Pins the headline agreement figures against the actual shipped data rather
 * than fixtures. Two jobs:
 *
 *   1. Catch a silent change in the statistics code — a fixture can be made to
 *      agree with a subtly wrong implementation; the whole real corpus is much
 *      harder to fool. These values were independently reproduced in Python.
 *   2. Flag it loudly when regenerating the data moves a published number, so
 *      figures cited from the dashboard don't drift without anyone noticing.
 *
 * Reads only the score files (~1.6MB each), not the justification prose.
 *
 * NOTE on the ordinal scale: 'Non applicable' / 'Non abordé' sit at the BOTTOM
 * of their scales, matching the score maps the rest of the app already uses
 * (stores/derivations.ts). Weighted kappa reads ordinal positions, so that
 * placement is part of what these numbers mean — moving it changes them.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cohensKappa, buildConfusionMatrix, fleissKappa } from './agreement';
import { DIMENSION_CATEGORIES } from './agreementData';
import type { LabelPair } from './agreement';

// Vitest runs with the project root as cwd; import.meta.url is a Vite-served
// URL here, not a file: one, so resolve from the root instead.
const DATA_DIR = resolve(process.cwd(), 'static/data');

type Scores = Record<
	string,
	{
		polarite?: string | null;
		subjectivite_score?: number | null;
		centralite_islam_musulmans?: string | null;
	} | null
>;

function loadScores(model: string): Scores {
	return JSON.parse(readFileSync(`${DATA_DIR}/iwac_sentiment_${model}.json`, 'utf8')).sentiments;
}

const chatgpt = loadScores('chatgpt');
const gemini = loadScores('gemini');
const mistral = loadScores('mistral');
const ids = Object.keys(chatgpt);

function pairs(a: Scores, b: Scores, read: (s: NonNullable<Scores[string]>) => string | null) {
	const out: LabelPair[] = [];
	for (const id of ids) {
		const sa = a[id];
		const sb = b[id];
		if (!sa || !sb) continue;
		const la = read(sa);
		const lb = read(sb);
		if (la === null || lb === null) continue;
		out.push({ a: la, b: lb });
	}
	return out;
}

const polarity = (s: NonNullable<Scores[string]>) => s.polarite ?? null;
const centrality = (s: NonNullable<Scores[string]>) => s.centralite_islam_musulmans ?? null;

describe('agreement statistics over the shipped corpus', () => {
	it('has the expected corpus size', () => {
		// 12,349 since the 2026-08-25 refresh: seven articles were deleted
		// upstream, which is why every pinned figure below moved a little at the
		// same time. Both generations read the same article base, so the archived
		// v1 score files shrank with it.
		expect(ids).toHaveLength(12349);
	});

	it('reproduces the ChatGPT/Gemini polarity figures', () => {
		const p = pairs(chatgpt, gemini, polarity);
		const cats = DIMENSION_CATEGORIES.polarity;

		expect(cohensKappa(p, cats).observedAgreement).toBeCloseTo(0.71, 2);
		expect(cohensKappa(p, cats, 'none').kappa).toBeCloseTo(0.529, 3);
		expect(cohensKappa(p, cats, 'quadratic').kappa).toBeCloseTo(0.7, 3);
	});

	it('reproduces the ChatGPT/Mistral centrality figures', () => {
		const p = pairs(chatgpt, mistral, centrality);
		const cats = DIMENSION_CATEGORIES.centrality;

		expect(cohensKappa(p, cats).observedAgreement).toBeCloseTo(0.397, 3);
		expect(cohensKappa(p, cats, 'none').kappa).toBeCloseTo(0.252, 3);
		expect(cohensKappa(p, cats, 'quadratic').kappa).toBeCloseTo(0.732, 3);
	});

	it('separates the systematic offset the scalar discrepancy score hides', () => {
		// The whole reason this view exists: near-total categorical disagreement
		// on centrality, but almost all of it exactly one ordinal step.
		const matrix = buildConfusionMatrix(
			pairs(chatgpt, mistral, centrality),
			DIMENSION_CATEGORIES.centrality
		);

		expect(matrix.exactAgreement).toBeLessThan(0.45);
		expect(matrix.adjacentAgreement).toBeGreaterThan(0.95);

		// 'Très central' (ChatGPT) landing on 'Central' (Mistral) is the single
		// largest cell in the entire matrix.
		const cats = DIMENSION_CATEGORIES.centrality;
		const offsetCell = matrix.cells.find(
			(c) =>
				c.rowIndex === cats.indexOf('Très central') && c.columnIndex === cats.indexOf('Central')
		);
		expect(offsetCell?.count).toBe(5834);

		const largest = matrix.cells.reduce((max, c) => (c.count > max.count ? c : max));
		expect(largest.count).toBe(offsetCell?.count);
	});

	it('computes panel-wide polarity agreement over every article', () => {
		const items = ids
			.map((id) => [chatgpt[id]?.polarite, gemini[id]?.polarite, mistral[id]?.polarite])
			.filter((labels): labels is string[] => labels.every((l) => typeof l === 'string'));

		const result = fleissKappa(items, DIMENSION_CATEGORIES.polarity);

		expect(result.raters).toBe(3);
		expect(result.n).toBe(12279);
		// All three models picking the identical label, before chance correction.
		const unanimous = items.filter((l) => l[0] === l[1] && l[1] === l[2]).length;
		expect(unanimous / items.length).toBeCloseTo(0.543, 3);
	});
});
