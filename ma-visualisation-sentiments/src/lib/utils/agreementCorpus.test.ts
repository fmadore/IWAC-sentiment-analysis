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
import {
	applicabilityAgreement,
	leaveOneOut,
	panelReliability,
	summarizeAgreement
} from './agreementMetrics';
import type { LabelPair } from './agreement';
import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
import type { Article, DatasetId } from '#lib/types/data.js';
import { buildPanelJoin, allRows } from './panelJoin';
import { buildApplicabilityColumns, buildLabelColumns, unitsAt } from './agreementData';
import { krippendorffAlpha } from './krippendorff';

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
		// 12,348 since the 2026-10-27 refresh: article 78587 was deleted upstream.
		// It was one of the articles no model annotates, so no pinned figure
		// below moved. Both generations read the same article base, so the
		// archived v1 score files shrank with it. (12,349 since 2026-08-25, when
		// seven deletions did move every figure a little.)
		expect(ids).toHaveLength(12348);
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

// Independently calculated from the shipped v2 scores: the ordinal-only sample
// differs from the nominal matrix, while archived results remain untouched.
it('pins the v2 applicable-polarity method and both sample sizes', () => {
	const currentPairs = pairs(loadScores('mistral-small'), loadScores('deepseek'), polarity);
	const current = summarizeAgreement(currentPairs, 'polarity', 'v2');
	expect(current.matrix.n).toBe(12298);
	expect(current.weightedKappa.n).toBe(11595);
	expect(current.weightedKappa.kappa).toBeCloseTo(0.453219678064523, 10);
	const legacy = summarizeAgreement(pairs(chatgpt, gemini, polarity), 'polarity', 'v1');
	expect(legacy.weightedKappa).toEqual(
		cohensKappa(pairs(chatgpt, gemini, polarity), DIMENSION_CATEGORIES.polarity, 'quadratic')
	);
});

// ---------------------------------------------------------------------------
// Panel reliability over the shipped v2 panel: Krippendorff's alpha, Fleiss'
// kappa on complete cases, leave-one-model-out and applicability agreement.
// Built through the same panel join the store uses.
// ---------------------------------------------------------------------------

function corpusDatasets(models: readonly DatasetId[]): Record<string, Article[]> {
	return Object.fromEntries(
		models.map((model) => {
			const scores = loadScores(model);
			return [
				model,
				ids.map(
					(id) =>
						({
							'o:id': Number(id),
							dataset_id: model,
							sentiment_analysis: scores[id]
								? {
										polarite: scores[id]?.polarite ?? null,
										centralite_islam_musulmans: scores[id]?.centralite_islam_musulmans ?? null,
										subjectivite_score: scores[id]?.subjectivite_score ?? null,
										polarite_justification: null,
										centralite_justification: null,
										subjectivite_justification: null
									}
								: null
						}) as Article
				)
			];
		})
	);
}

describe('v2 panel reliability over the shipped corpus', () => {
	const models = datasetIdsOf('v2');
	const join = buildPanelJoin(corpusDatasets(models), models);
	if (!join) throw new Error('panel join failed');
	const rows = allRows(join);
	const columns = buildLabelColumns(join);

	const reliability = (dimension: 'polarity' | 'centrality' | 'subjectivity') =>
		panelReliability(columns[dimension], rows, dimension, 'v2');

	it('joins the panel positionally: every dataset shares the base order', () => {
		expect(join.aligned).toBe(true);
		expect(join.articles).toHaveLength(12348);
	});

	// Independently reproduced by an external audit (ordinal α 0.566 / 0.847 /
	// 0.512; Fleiss 0.451 / 0.629 / 0.279). Nominal polarity alpha keeps the
	// "Non applicable" verdict as a category, as the nominal kappas do: 0.452.
	// Dropping it, as the audit did, gives 0.446.
	it('pins ordinal and nominal alpha beside complete-case Fleiss', () => {
		const polarity = reliability('polarity');
		const centrality = reliability('centrality');
		const subjectivity = reliability('subjectivity');
		expect(polarity.ordinalAlpha.alpha).toBeCloseTo(0.566, 3);
		expect(centrality.ordinalAlpha.alpha).toBeCloseTo(0.847, 3);
		expect(subjectivity.ordinalAlpha.alpha).toBeCloseTo(0.512, 3);
		expect(polarity.nominalAlpha.alpha).toBeCloseTo(0.452, 3);
		expect(centrality.nominalAlpha.alpha).toBeCloseTo(0.629, 3);
		expect(subjectivity.nominalAlpha.alpha).toBeCloseTo(0.283, 3);
		expect(polarity.fleiss.kappa).toBeCloseTo(0.451, 3);
		expect(centrality.fleiss.kappa).toBeCloseTo(0.629, 3);
		expect(subjectivity.fleiss.kappa).toBeCloseTo(0.279, 3);
		// Alpha keeps articles Fleiss drops; ordinal polarity runs on ranks 1-5.
		expect(polarity.fleiss.n).toBe(12098);
		expect(polarity.nominalAlpha.units).toBe(12298);
		expect(polarity.ordinalAlpha.units).toBe(12051);
		expect(
			krippendorffAlpha(
				unitsAt(columns.polarity, rows),
				['Très négatif', 'Négatif', 'Neutre', 'Positif', 'Très positif'],
				'nominal'
			).alpha
		).toBeCloseTo(0.446, 3);
	});

	it('pins leave-one-model-out Fleiss on polarity', () => {
		const loo = Object.fromEntries(
			leaveOneOut(columns.polarity, models, rows, 'polarity', 'v2').map((row) => [
				row.leftOut,
				row.reliability.fleiss
			])
		);
		expect(loo.qwen.kappa).toBeCloseTo(0.436, 3);
		expect(loo.haiku.kappa).toBeCloseTo(0.427, 3);
		expect(loo['mistral-small'].kappa).toBeCloseTo(0.527, 3);
		// Leaving Qwen out restores the rows only it declined.
		expect(loo.qwen.n).toBeGreaterThan(reliability('polarity').fleiss.n);
	});

	it('measures applicability agreement with missing ratings kept apart', () => {
		const result = applicabilityAgreement(buildApplicabilityColumns(join), models, rows, 'v2');
		expect(result.rated).toBe(12298);
		expect(result.mixed).toBe(686);
		expect(result.allAddressed + result.allNotAddressed + result.mixed).toBe(result.rated);
		expect(result.alpha.alpha).toBeCloseTo(0.642, 3);
		expect(result.perModel.find((entry) => entry.modelId === 'qwen')?.missing).toBe(250);
	});
});
