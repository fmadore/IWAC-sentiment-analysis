/**
 * The panel arbiter's headline figures, pinned to the shipped files.
 *
 * The match rates replaced the "preferred overall" tally as the headline, and
 * the sentences under the stat grid are computed from the same functions. The
 * counts below were reproduced independently in Python from
 * `static/data/iwac_arbiter_evaluations_v2.json` and the score files; a change
 * in either the code or the published data has to move them on purpose.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	ARBITER_PANEL_IDS,
	ARBITER_RECUSED_IDS,
	datasetIdsOf
} from '#lib/domain/sentimentContract.js';
import { parseArbiterV2EvaluationData } from '#lib/data/validation.js';
import { computeArbiterV2Statistics } from '#lib/stores/arbiterV2.svelte.js';
import type {
	ArbiterV2Evaluation,
	ArbiterV2EvaluationData,
	Article,
	DatasetId
} from '#lib/types/data.js';
import {
	arbiterMatchRates,
	buildArbiterV2Rows,
	compareJudges,
	judgeSubjectiveCount,
	loneDissenters,
	ordinalRank,
	panelUnanimity,
	recusedOnlyFlips,
	strictLoneSplits,
	type ArbiterV2Row
} from './arbiterV2';

const DATA_DIR = resolve(process.cwd(), 'static/data');

function loadJson(name: string): unknown {
	return JSON.parse(readFileSync(`${DATA_DIR}/${name}`, 'utf8'));
}

const published = parseArbiterV2EvaluationData(loadJson('iwac_arbiter_evaluations_v2.json'));

const datasets: Record<string, Article[]> = Object.fromEntries(
	datasetIdsOf('v2').map((modelId) => {
		const { sentiments } = loadJson(`iwac_sentiment_${modelId}.json`) as {
			sentiments: Record<string, Article['sentiment_analysis'] | null>;
		};
		return [
			modelId,
			Object.entries(sentiments).map(
				([id, scores]) => ({ 'o:id': id, sentiment_analysis: scores ?? null }) as unknown as Article
			)
		];
	})
);

const rows = buildArbiterV2Rows(published, datasets, datasetIdsOf('v2'));

describe('match rates against the arbiter’s own rating (published run)', () => {
	const rates = arbiterMatchRates(rows, published.metadata.models);
	const byModel = Object.fromEntries(rates.map((rate) => [rate.modelId, rate]));

	it('is computed over the five models the judge read, in contract order', () => {
		expect(rates.map((rate) => rate.modelId)).toEqual([...ARBITER_PANEL_IDS]);
		expect(rates.every((rate) => rate.loaded)).toBe(true);
	});

	it.each([
		// model, polarity exact, centrality exact, subjectivity exact
		['luna', 175, 287, 222],
		['mistral-small', 40, 256, 175],
		['deepseek', 190, 282, 221],
		['gemma', 206, 274, 200],
		['qwen', 201, 273, 239]
	] as const)('%s', (modelId, polarity, centrality, subjectivity) => {
		const rate = byModel[modelId];
		expect(rate.dimensions.polarity.exact).toMatchObject({ successes: polarity, n: 301 });
		expect(rate.dimensions.centrality.exact).toMatchObject({ successes: centrality, n: 301 });
		expect(rate.dimensions.subjectivity.exact).toMatchObject({ successes: subjectivity, n: 301 });
	});

	it('pins within-one-step agreement on its own denominator', () => {
		const withinOne = (modelId: string) =>
			(['polarity', 'centrality', 'subjectivity'] as const).map(
				(dimension) => byModel[modelId].dimensions[dimension].withinOne.successes
			);
		expect(withinOne('luna')).toEqual([267, 300, 281]);
		expect(withinOne('mistral-small')).toEqual([132, 296, 255]);
		expect(withinOne('deepseek')).toEqual([273, 301, 274]);
		expect(withinOne('gemma')).toEqual([293, 301, 275]);
		expect(withinOne('qwen')).toEqual([288, 301, 278]);
	});

	it('attaches a Wilson interval that brackets the share', () => {
		const { exact } = byModel.gemma.dimensions.polarity;
		expect(exact.share).toBeCloseTo(206 / 301, 10);
		expect(exact.low).toBeLessThan(exact.share!);
		expect(exact.high).toBeGreaterThan(exact.share!);
		expect(exact.low).toBeCloseTo(0.6298, 3);
		// Reproduced with the closed-form Wilson score interval in Python.
		expect(exact.high).toBeCloseTo(0.7343, 3);
	});

	it('shows the recused model as a comparison the judge never saw', () => {
		// The generation minus the judge's panel: Haiku, unlettered.
		const recused = datasetIdsOf('v2').filter(
			(id) => !(published.metadata.models as readonly DatasetId[]).includes(id)
		);
		expect(recused).toEqual([...ARBITER_RECUSED_IDS]);
		const [haiku] = arbiterMatchRates(rows, recused);
		expect(haiku.dimensions.polarity.exact).toMatchObject({ successes: 188, n: 301 });
	});

	it('separates models the overall-winner tally ranks far apart', () => {
		// The audit finding the headline change rests on: Gemma matches the
		// judge's polarity most often and is named overall winner second least.
		const stats = computeArbiterV2Statistics(published);
		const wins = Object.fromEntries(
			stats.models.map((model) => [model.modelId, model.overallWins])
		);
		expect(wins).toEqual({ luna: 27, 'mistral-small': 5, deepseek: 46, gemma: 23, qwen: 127 });
		// 228 single winners, 72 'multiple' and one 'none' (article 2713).
		expect(stats.overallMultiple).toBe(72);
	});
});

describe('what the frame mostly contains (published run)', () => {
	it('names the lone dissenter across the valence line', () => {
		const summary = loneDissenters(rows, published.metadata.models);
		expect(summary.compared).toBe(301);
		expect(summary.models[0]).toEqual({
			modelId: 'mistral-small',
			total: 189,
			negative: 162,
			positive: 27
		});
		// No other model is alone in more than 35.
		expect(summary.models[1].total).toBe(35);
	});

	it('counts the articles the judge itself rated as subjective', () => {
		expect(judgeSubjectiveCount(published)).toMatchObject({ successes: 247, n: 301 });
	});

	it('counts the strict one-against-the-rest splits of the main dissenter', () => {
		// "A strict one-against-four split … is rarer: 56 articles."
		expect(strictLoneSplits(rows, published.metadata.models, 'mistral-small')).toBe(56);
	});

	it('measures the panel’s unanimity on centrality and polarity', () => {
		// "the same centrality rating on 63.7% of articles, against 33.0% for polarity"
		const centrality = panelUnanimity(datasets, published.metadata.models, 'centrality');
		const polarity = panelUnanimity(datasets, published.metadata.models, 'polarity');
		expect(centrality).toMatchObject({ successes: 7711, n: 12098 });
		expect(polarity).toMatchObject({ successes: 3768, n: 11405 });
		expect(((100 * centrality!.successes) / centrality!.n).toFixed(1)).toBe('63.7');
		expect(((100 * polarity!.successes) / polarity!.n).toFixed(1)).toBe('33.0');
	});

	it('counts the reversals only the recused model creates', () => {
		// "the 45 reversals of direction that exist only because of it": the
		// six-model flips (346) less the published five-model frame (301).
		expect(recusedOnlyFlips(datasets, datasetIdsOf('v2'), published.metadata.models)).toBe(45);
	});
});

// ---------------------------------------------------------------------------
// Fixture-level behaviour
// ---------------------------------------------------------------------------

function row(analyses: ArbiterV2Row['analyses'], scores: [string, string, string]): ArbiterV2Row {
	const [polarity, subjectivity, centrality] = scores;
	const dimension = (score: string) => ({
		score,
		justification: '',
		preferred: 'multiple' as const,
		verdict_explanation: ''
	});
	return {
		articleId: '1',
		article: null,
		title: '',
		journal: '',
		country: '',
		date: null,
		analyses,
		winner: null,
		evaluation: {
			article_id: '1',
			cache_fingerprint: 'x',
			spread: {
				polarity_spread: 0,
				subjectivity_spread: 0,
				centrality_spread: 0,
				total_spread: 0,
				has_significant_spread: false
			},
			arbiter: {
				article_id: '1',
				polarity: dimension(polarity),
				subjectivity: dimension(subjectivity),
				centrality: dimension(centrality),
				overall_winner: 'multiple',
				overall_explanation: '',
				confidence_level: 'high',
				timestamp: ''
			}
		}
	};
}

const analysis = (polarite: string | null, subjectivite_score: number | null, centralite: string) =>
	({
		polarite,
		subjectivite_score,
		centralite_islam_musulmans: centralite
	}) as unknown as Article['sentiment_analysis'];

describe('arbiterMatchRates', () => {
	it('skips a missing rating instead of counting it as a mismatch', () => {
		const rates = arbiterMatchRates(
			[
				row({ qwen: analysis(null, null, 'Central') }, ['Positif', '4', 'Central']),
				row({ qwen: null }, ['Positif', '4', 'Central']),
				row({ qwen: analysis('Positif', 4, 'Central') }, ['Positif', '4', 'Central'])
			],
			['qwen']
		);
		expect(rates[0].dimensions.polarity.exact).toMatchObject({ successes: 1, n: 1 });
		expect(rates[0].dimensions.centrality.exact).toMatchObject({ successes: 2, n: 2 });
	});

	it('keeps non-comparable verdicts out of the within-one denominator only', () => {
		const rates = arbiterMatchRates(
			[
				row({ luna: analysis('Non applicable', 3, 'Non abordé') }, [
					'Non applicable',
					'3',
					'Marginal'
				])
			],
			['luna']
		);
		expect(rates[0].dimensions.polarity.exact).toMatchObject({ successes: 1, n: 1 });
		expect(rates[0].dimensions.polarity.withinOne).toMatchObject({ successes: 0, n: 0 });
		expect(rates[0].dimensions.centrality.withinOne).toMatchObject({ successes: 0, n: 0 });
	});

	it('reports nothing for a model whose dataset has not loaded', () => {
		const [rate] = arbiterMatchRates([row({}, ['Positif', '4', 'Central'])], ['gemma']);
		expect(rate.loaded).toBe(false);
		expect(rate.dimensions.polarity.exact.n).toBe(0);
	});
});

describe('loneDissenters', () => {
	it('waits for the whole panel', () => {
		expect(
			loneDissenters(
				[row({ luna: analysis('Positif', 3, 'Central') }, ['Positif', '3', 'Central'])],
				['luna', 'gemma']
			).compared
		).toBe(0);
	});

	it('counts a model alone on each side, and none when several share a side', () => {
		const summary = loneDissenters(
			[
				row(
					{
						luna: analysis('Positif', 3, 'Central'),
						gemma: analysis('Positif', 3, 'Central'),
						qwen: analysis('Négatif', 3, 'Central')
					},
					['Positif', '3', 'Central']
				),
				row(
					{
						luna: analysis('Très positif', 3, 'Central'),
						gemma: analysis('Neutre', 3, 'Central'),
						qwen: analysis('Très négatif', 3, 'Central')
					},
					['Positif', '3', 'Central']
				)
			],
			['luna', 'gemma', 'qwen']
		);
		const byModel = Object.fromEntries(summary.models.map((m) => [m.modelId, m]));
		expect(byModel.qwen).toMatchObject({ total: 2, negative: 2, positive: 0 });
		expect(byModel.luna).toMatchObject({ total: 1, positive: 1 });
		expect(byModel.gemma.total).toBe(0);
	});
});

describe('ordinalRank', () => {
	it('places only on-scale values', () => {
		expect(ordinalRank('Très négatif', 'polarity')).toBe(1);
		expect(ordinalRank('Non applicable', 'polarity')).toBeNull();
		expect(ordinalRank('Non abordé', 'centrality')).toBeNull();
		expect(ordinalRank('4', 'subjectivity')).toBe(4);
		expect(ordinalRank(null, 'subjectivity')).toBeNull();
	});
});

describe('compareJudges', () => {
	function file(scores: Record<string, [string, string, string]>): ArbiterV2EvaluationData {
		return {
			...published,
			evaluations: Object.entries(scores).map(([id, [p, s, c]]) => {
				const r = row({}, [p, s, c]).evaluation;
				return {
					...r,
					article_id: id,
					arbiter: { ...r.arbiter, article_id: id }
				} satisfies ArbiterV2Evaluation;
			})
		};
	}

	it('compares only the articles both judges rated, on their own scores', () => {
		const first = file({
			'1': ['Positif', '4', 'Central'],
			'2': ['Neutre', '2', 'Très central'],
			'3': ['Négatif', '5', 'Central']
		});
		const second = file({
			'1': ['Positif', '4', 'Central'],
			'2': ['Positif', '3', 'Marginal'],
			'9': ['Négatif', '5', 'Central']
		});
		const comparison = compareJudges(first, second);
		expect(comparison.sharedArticles).toBe(2);
		const [polarity, subjectivity, centrality] = comparison.dimensions;
		expect(polarity.exact).toMatchObject({ successes: 1, n: 2 });
		expect(polarity.withinOne).toMatchObject({ successes: 2, n: 2 });
		expect(subjectivity.withinOne).toMatchObject({ successes: 2, n: 2 });
		expect(centrality.withinOne).toMatchObject({ successes: 1, n: 2 });
		expect(polarity.kappa).not.toBeNull();
	});

	it('is empty without a second file', () => {
		expect(compareJudges(published, null)).toEqual({ sharedArticles: 0, dimensions: [] });
	});
});
