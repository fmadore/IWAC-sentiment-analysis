/**
 * The join behind the panel arbiter's article list.
 *
 * The label → model resolution is the one place a verdict can be silently
 * attributed to the wrong model, so the fixtures use a permutation that is not
 * contract order: every assertion below would still pass under an identity
 * permutation if the code merely read labels positionally, and the test would
 * then be asserting nothing.
 */
import { describe, expect, it } from 'vitest';
import {
	analysisJustification,
	analysisValue,
	blindLegend,
	buildArbiterV2Rows,
	labelForModel,
	matchesArbiterScore,
	resolvePreference
} from './arbiterV2';
import { SENTIMENT_CONTRACT_V2, datasetIdsOf } from '$lib/domain/sentimentContract';
import { ARBITER_BLIND_LABELS } from '$lib/types/data';
import type {
	ArbiterBlindLabel,
	ArbiterV2Evaluation,
	ArbiterV2EvaluationData,
	Article,
	DatasetId,
	SentimentAnalysis
} from '$lib/types/data';

const MODELS = datasetIdsOf('v2') as DatasetId[];

/** Rotated by two, so label "a" is the third model in contract order. */
const PERMUTATION = Object.fromEntries(
	ARBITER_BLIND_LABELS.map((label, index) => [label, MODELS[(index + 2) % MODELS.length]])
) as Record<ArbiterBlindLabel, DatasetId>;

function evaluation(articleId: string, overall: ArbiterV2Evaluation['arbiter']['overall_winner']) {
	const verdict = (score: string) => ({
		score,
		justification: 'j',
		preferred: 'multiple' as const,
		verdict_explanation: 'e'
	});
	return {
		article_id: articleId,
		cache_fingerprint: `fp-${articleId}`,
		spread: {
			polarity_spread: 2,
			subjectivity_spread: 0,
			centrality_spread: 0,
			total_spread: 2,
			has_significant_spread: false
		},
		arbiter: {
			article_id: articleId,
			polarity: verdict('Neutre'),
			subjectivity: verdict('4'),
			centrality: verdict('Central'),
			overall_winner: overall,
			overall_explanation: 'x',
			confidence_level: 'high' as const,
			timestamp: '2026-09-04T00:00:00'
		}
	} satisfies ArbiterV2Evaluation;
}

function payload(evaluations: ArbiterV2Evaluation[]): ArbiterV2EvaluationData {
	return {
		metadata: {
			generated: '2026-09-04T00:00:00',
			arbiter_model: SENTIMENT_CONTRACT_V2.arbiter.arbiterModel,
			mode: SENTIMENT_CONTRACT_V2.arbiter.mode,
			blind_evaluation: true,
			models: MODELS,
			model_names: Object.fromEntries(MODELS.map((id) => [id, `Name ${id}`])),
			blind_permutation: PERMUTATION,
			selection: {
				rule: 'spread',
				arbiter_rule: 'valence',
				threshold: 3,
				limit: null,
				eligible_articles: evaluations.length,
				selected_articles: evaluations.length
			},
			total_articles: evaluations.length,
			successful_evaluations: evaluations.length,
			failed_evaluations: 0,
			contract_schema_version: SENTIMENT_CONTRACT_V2.schemaVersion,
			analysis_version: 'v2',
			cache_schema_version: SENTIMENT_CONTRACT_V2.arbiter.cacheSchemaVersion,
			prompt_version: SENTIMENT_CONTRACT_V2.arbiter.promptVersion,
			source: {
				scores: { repository: 'public', revision: 'r1' },
				text: { repository: 'private', revision: 'r2' }
			}
		},
		evaluations
	};
}

function analysis(polarite: SentimentAnalysis['polarite'], subjectivity = 3): SentimentAnalysis {
	return {
		polarite,
		polarite_justification: `because ${polarite}`,
		subjectivite_score: subjectivity as SentimentAnalysis['subjectivite_score'],
		subjectivite_justification: null,
		centralite_islam_musulmans: 'Central',
		centralite_justification: null
	};
}

function article(id: number, datasetId: DatasetId, sentiment: SentimentAnalysis | null): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		Newspaper: 'Le Pays',
		Country: 'Burkina Faso',
		publication_date: '2018-12-07',
		sentiment_analysis: sentiment,
		dataset_id: datasetId
	};
}

describe('resolvePreference / labelForModel / blindLegend', () => {
	const data = payload([]);

	it('resolves a label through the permutation, not by position', () => {
		expect(resolvePreference(data, 'a')).toBe(MODELS[2]);
		expect(resolvePreference(data, ARBITER_BLIND_LABELS[MODELS.length - 1])).toBe(MODELS[1]);
	});

	it('resolves the two non-model verdicts to null', () => {
		expect(resolvePreference(data, 'multiple')).toBeNull();
		expect(resolvePreference(data, 'none')).toBeNull();
		expect(resolvePreference(null, 'a')).toBeNull();
	});

	it('inverts the permutation for a model', () => {
		expect(labelForModel(data, MODELS[2])).toBe('a');
		expect(labelForModel(null, MODELS[0])).toBeNull();
	});

	it('lists the legend in label order with the file’s own names', () => {
		const legend = blindLegend(data);
		expect(legend.map((entry) => entry.label)).toEqual([...ARBITER_BLIND_LABELS]);
		expect(legend[0]).toEqual({ label: 'a', modelId: MODELS[2], name: `Name ${MODELS[2]}` });
		expect(blindLegend(null)).toEqual([]);
	});
});

describe('buildArbiterV2Rows', () => {
	const data = payload([evaluation('10', 'a'), evaluation('20', 'multiple')]);

	it('returns nothing without a file', () => {
		expect(buildArbiterV2Rows(null, {}, MODELS)).toEqual([]);
	});

	it('keeps every verdict even before any dataset has loaded', () => {
		const rows = buildArbiterV2Rows(data, {}, MODELS);
		expect(rows.map((row) => row.articleId)).toEqual(['10', '20']);
		expect(rows[0].article).toBeNull();
		expect(rows[0].title).toBe('');
		expect(rows[0].analyses).toEqual({});
	});

	it('joins metadata from the first loaded dataset and ratings from each', () => {
		const [first, second] = MODELS;
		const datasets = {
			[first]: [article(10, first, analysis('Positif')), article(20, first, null)],
			[second]: [article(10, second, analysis('Négatif'))]
		};
		const rows = buildArbiterV2Rows(data, datasets, MODELS);

		expect(rows[0].title).toBe('Article 10');
		expect(rows[0].journal).toBe('Le Pays');
		expect(rows[0].country).toBe('Burkina Faso');
		expect(rows[0].date).toBe('2018-12-07');
		expect(rows[0].analyses[first]?.polarite).toBe('Positif');
		expect(rows[0].analyses[second]?.polarite).toBe('Négatif');
		// Datasets that have not loaded leave no key at all …
		expect(MODELS[2] in rows[0].analyses).toBe(false);
		// … which is distinct from a model that left the article unannotated,
		expect(rows[1].analyses[first]).toBeNull();
		// … and from an article the loaded dataset simply does not contain.
		expect(rows[1].analyses[second]).toBeNull();
	});

	it('resolves the overall winner to a model id, or null for multiple/none', () => {
		const rows = buildArbiterV2Rows(data, {}, MODELS);
		expect(rows[0].winner).toBe(MODELS[2]);
		expect(rows[1].winner).toBeNull();
	});

	it('does not confuse a numeric o:id with its string form', () => {
		const [first] = MODELS;
		const rows = buildArbiterV2Rows(data, { [first]: [article(10, first, null)] }, MODELS);
		expect(rows[0].article?.['o:id']).toBe(10);
	});
});

describe('analysisValue / analysisJustification / matchesArbiterScore', () => {
	const rated = analysis('Positif', 4);

	it('reads each dimension’s stored value', () => {
		expect(analysisValue(rated, 'polarity')).toBe('Positif');
		expect(analysisValue(rated, 'subjectivity')).toBe(4);
		expect(analysisValue(rated, 'centrality')).toBe('Central');
		expect(analysisValue(null, 'polarity')).toBeNull();
	});

	it('reads the prose, null until it has loaded', () => {
		expect(analysisJustification(rated, 'polarity')).toBe('because Positif');
		expect(analysisJustification(rated, 'subjectivity')).toBeNull();
		expect(analysisJustification(undefined, 'centrality')).toBeNull();
	});

	it('compares subjectivity as a rank and the other dimensions as labels', () => {
		expect(matchesArbiterScore(4, '4', 'subjectivity')).toBe(true);
		expect(matchesArbiterScore(3, '4', 'subjectivity')).toBe(false);
		expect(matchesArbiterScore('Positif', 'Positif', 'polarity')).toBe(true);
		expect(matchesArbiterScore('Neutre', 'Positif', 'polarity')).toBe(false);
		expect(matchesArbiterScore(null, 'Positif', 'polarity')).toBe(false);
	});
});
