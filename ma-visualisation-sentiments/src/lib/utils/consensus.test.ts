import { describe, it, expect } from 'vitest';
import type { Article } from '$lib/types/data';
import {
	barycentric,
	buildConsensusRows,
	buildLabelFlow,
	classifyDissent,
	countExcludedTitles,
	dimensionScale,
	isDeclined,
	ordinalValue,
	pearson,
	profileDissent,
	rankNewspaperDisagreement,
	usableValues,
	TRIANGLE_CORNERS,
	type ConsensusRow
} from './consensus';

type Analysis = Partial<NonNullable<Article['sentiment_analysis']>>;

function article(
	id: number,
	analysis: Analysis | null,
	extras: Partial<Article> = {},
	datasetId = 'luna'
): Article {
	return {
		'o:id': id,
		'o:title': `Article ${id}`,
		Newspaper: 'Sidwaya',
		Country: 'Burkina Faso',
		publication_date: '2010-01-01',
		dataset_id: datasetId,
		...extras,
		sentiment_analysis: analysis
			? {
					centralite_islam_musulmans: null,
					centralite_justification: null,
					subjectivite_score: null,
					subjectivite_justification: null,
					polarite: null,
					polarite_justification: null,
					...analysis
				}
			: null
	} as Article;
}

const MODELS = ['luna', 'mistral-small', 'deepseek'];

/** Three models' analyses of one article, as the datasets shape the store passes. */
function trio(
	id: number,
	analyses: (Analysis | null)[],
	extras: Partial<Article> = {}
): Record<string, Article[]> {
	return Object.fromEntries(
		MODELS.map((model, index) => [model, [article(id, analyses[index], extras, model)]])
	);
}

function merge(...datasets: Record<string, Article[]>[]): Record<string, Article[]> {
	const merged: Record<string, Article[]> = {};
	for (const dataset of datasets) {
		for (const [model, articles] of Object.entries(dataset)) {
			merged[model] = [...(merged[model] ?? []), ...articles];
		}
	}
	return merged;
}

describe('ordinalValue', () => {
	it('reads the contract ordinal for polarity and centrality', () => {
		const a = article(1, {
			polarite: 'Positif',
			centralite_islam_musulmans: 'Central',
			subjectivite_score: 4
		});
		expect(ordinalValue(a, 'polarity')).toBe(4);
		expect(ordinalValue(a, 'centrality')).toBe(4);
		expect(ordinalValue(a, 'subjectivity')).toBe(4);
	});

	it('places a declined rating below the bottom rung, which is the floor effect', () => {
		const declined = article(1, { polarite: 'Non applicable' });
		const worst = article(2, { polarite: 'Très négatif' });

		expect(ordinalValue(declined, 'polarity')).toBe(0);
		expect(ordinalValue(worst, 'polarity')).toBe(1);
	});

	it('returns null rather than a default when a label is missing', () => {
		expect(ordinalValue(article(1, {}), 'polarity')).toBeNull();
		expect(ordinalValue(article(1, null), 'centrality')).toBeNull();
		expect(ordinalValue(article(1, { subjectivite_score: null }), 'subjectivity')).toBeNull();
	});
});

describe('isDeclined', () => {
	it("counts 'Non applicable' as a refusal on both categorical dimensions", () => {
		expect(isDeclined(article(1, { polarite: 'Non applicable' }), 'polarity')).toBe(true);
		expect(
			isDeclined(article(1, { centralite_islam_musulmans: 'Non applicable' }), 'centrality')
		).toBe(true);
	});

	it("does NOT count 'Non abordé' as a refusal — it is centrality's bottom rung", () => {
		// The contract lists it as non-comparable for the pairwise discrepancy
		// score, which drops the whole row. Here it is a substantive judgement,
		// matching newspaperRanking.ts's CENTRALITY_INDEX.
		const a = article(1, { centralite_islam_musulmans: 'Non abordé' });
		expect(isDeclined(a, 'centrality')).toBe(false);
		expect(ordinalValue(a, 'centrality')).toBe(1);
	});

	it('counts a missing subjectivity score as declined', () => {
		expect(isDeclined(article(1, { subjectivite_score: null }), 'subjectivity')).toBe(true);
		expect(isDeclined(article(1, { subjectivite_score: 3 }), 'subjectivity')).toBe(false);
	});
});

describe('buildConsensusRows', () => {
	it('joins the models on article id and keeps ordinals in model order', () => {
		const rows = buildConsensusRows(
			trio(1, [
				{ polarite: 'Positif', subjectivite_score: 2, centralite_islam_musulmans: 'Central' },
				{ polarite: 'Neutre', subjectivite_score: 3, centralite_islam_musulmans: 'Central' },
				{ polarite: 'Négatif', subjectivite_score: 4, centralite_islam_musulmans: 'Marginal' }
			]),
			MODELS
		);

		expect(rows).toHaveLength(1);
		expect(rows[0].values.polarity).toEqual([4, 3, 2]);
		expect(rows[0].values.subjectivity).toEqual([2, 3, 4]);
		expect(rows[0].values.centrality).toEqual([4, 4, 2]);
		expect(rows[0].newspaper).toBe('Sidwaya');
		expect(rows[0].year).toBe(2010);
	});

	it('nulls only the dimension a model left unlabelled, not the whole row', () => {
		const rows = buildConsensusRows(
			trio(1, [
				{ polarite: 'Positif', subjectivite_score: 2 },
				{ polarite: 'Neutre', subjectivite_score: null },
				{ polarite: 'Négatif', subjectivite_score: 4 }
			]),
			MODELS
		);

		expect(rows[0].values.polarity).toEqual([4, 3, 2]);
		expect(rows[0].values.subjectivity).toBeNull();
		expect(rows[0].declined.subjectivity).toBe(true);
	});

	it('drops an article any model is missing entirely', () => {
		const datasets = trio(1, [
			{ polarite: 'Positif' },
			{ polarite: 'Positif' },
			{ polarite: 'Positif' }
		]);
		datasets['deepseek'] = [];

		expect(buildConsensusRows(datasets, MODELS)).toEqual([]);
	});

	it('flags a dimension where any model declined', () => {
		const rows = buildConsensusRows(
			trio(1, [{ polarite: 'Non applicable' }, { polarite: 'Positif' }, { polarite: 'Positif' }]),
			MODELS
		);

		expect(rows[0].declined.polarity).toBe(true);
		expect(rows[0].values.polarity).toEqual([0, 4, 4]);
	});
});

describe('classifyDissent', () => {
	it('reports unanimity with zero spread', () => {
		expect(classifyDissent([3, 3, 3])).toEqual({
			kind: 'unanimous',
			dissenter: null,
			direction: 0,
			spread: 0
		});
	});

	it('names the model that broke ranks and which way it went', () => {
		expect(classifyDissent([3, 5, 3])).toMatchObject({
			kind: 'majority',
			dissenter: 1,
			direction: 1,
			spread: 2
		});
		expect(classifyDissent([4, 4, 1])).toMatchObject({
			kind: 'majority',
			dissenter: 2,
			direction: -1,
			spread: 3
		});
	});

	it('names no dissenter when all three differ', () => {
		expect(classifyDissent([1, 3, 5])).toEqual({
			kind: 'split',
			dissenter: null,
			direction: 0,
			spread: 4
		});
	});

	it('refuses to name a dissenter in a 2-2 split', () => {
		// With four raters, "who broke ranks" has no answer. Returning one anyway
		// is how a dissent profile starts lying.
		expect(classifyDissent([2, 2, 5, 5]).kind).toBe('split');
		expect(classifyDissent([2, 2, 2, 5]).kind).toBe('majority');
	});
});

describe('usableValues', () => {
	const rows: ConsensusRow[] = [
		{
			id: '1',
			newspaper: 'A',
			country: 'Benin',
			year: 2000,
			values: { polarity: [0, 4, 4], subjectivity: [1, 1, 1], centrality: [2, 2, 2] },
			declined: { polarity: true, subjectivity: false, centrality: false }
		},
		{
			id: '2',
			newspaper: 'A',
			country: 'Benin',
			year: 2001,
			values: { polarity: [3, 3, 4], subjectivity: null, centrality: [2, 3, 4] },
			declined: { polarity: false, subjectivity: true, centrality: false }
		}
	];

	it('excludes declined rows by default and restores them on request', () => {
		expect(usableValues(rows, 'polarity', false)).toHaveLength(1);
		expect(usableValues(rows, 'polarity', true)).toHaveLength(2);
	});

	it('never yields a row a model left unlabelled, even when declined are included', () => {
		expect(usableValues(rows, 'subjectivity', true)).toHaveLength(1);
	});
});

describe('profileDissent', () => {
	it('decomposes the corpus into the five mutually exclusive outcomes', () => {
		const rows = buildConsensusRows(
			merge(
				trio(1, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				trio(2, [{ polarite: 'Positif' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				trio(3, [{ polarite: 'Neutre' }, { polarite: 'Négatif' }, { polarite: 'Neutre' }]),
				trio(4, [{ polarite: 'Positif' }, { polarite: 'Neutre' }, { polarite: 'Négatif' }])
			),
			MODELS
		);

		const profile = profileDissent(rows, 'polarity', 3, false);

		expect(profile.n).toBe(4);
		expect(profile.unanimous).toBe(1);
		expect(profile.split).toBe(1);
		expect(profile.dissent[0]).toEqual({ up: 1, down: 0, total: 1 });
		expect(profile.dissent[1]).toEqual({ up: 0, down: 1, total: 1 });
		expect(profile.dissent[2]).toEqual({ up: 0, down: 0, total: 0 });
	});

	it('reports how many rows the declined exclusion cost', () => {
		const rows = buildConsensusRows(
			merge(
				trio(1, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				trio(2, [{ polarite: 'Non applicable' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }])
			),
			MODELS
		);

		expect(profileDissent(rows, 'polarity', 3, false).declinedExcluded).toBe(1);
		expect(profileDissent(rows, 'polarity', 3, true).declinedExcluded).toBe(0);
		expect(profileDissent(rows, 'polarity', 3, true).n).toBe(2);
	});
});

describe('rankNewspaperDisagreement', () => {
	/** n identical rows for one title, so the mean is exact and the CI is zero-ish. */
	function title(newspaper: string, count: number, analyses: Analysis[], startId = 0) {
		const datasets = Array.from({ length: count }, (_, index) =>
			trio(startId + index, analyses, { Newspaper: newspaper })
		);
		return merge(...datasets);
	}

	it('ranks ascending by mean spread and keeps titles below the threshold out', () => {
		const rows = buildConsensusRows(
			merge(
				title('Calm', 4, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				title(
					'Contested',
					4,
					[{ polarite: 'Très positif' }, { polarite: 'Neutre' }, { polarite: 'Très négatif' }],
					100
				),
				title(
					'Thin',
					2,
					[{ polarite: 'Positif' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }],
					200
				)
			),
			MODELS
		);

		const ranked = rankNewspaperDisagreement(rows, 'polarity', 3, { minArticles: 4 });

		expect(ranked.map((entry) => entry.newspaper)).toEqual(['Calm', 'Contested']);
		expect(ranked[0].mean).toBe(0);
		expect(ranked[1].mean).toBe(4);
		expect(ranked[1].unanimity).toBe(0);
		expect(ranked[0].unanimity).toBe(1);
		expect(countExcludedTitles(rows, 'polarity', { minArticles: 4 })).toBe(1);
	});

	it('reports the declined share over every labelled row, not just the surviving ones', () => {
		const rows = buildConsensusRows(
			merge(
				title('Mixed', 2, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				title(
					'Mixed',
					2,
					[{ polarite: 'Non applicable' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }],
					100
				)
			),
			MODELS
		);

		const [entry] = rankNewspaperDisagreement(rows, 'polarity', 3, { minArticles: 2 });

		// 2 of the 4 labelled rows were declined; only the 2 rated ones set the mean.
		expect(entry.n).toBe(2);
		expect(entry.declinedShare).toBe(0.5);
		expect(entry.mean).toBe(0);
	});

	it('lets the declined toggle change the ranking, which is the whole point of it', () => {
		const rows = buildConsensusRows(
			merge(
				title('Ehuzu', 2, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				title(
					'Ehuzu',
					2,
					[{ polarite: 'Non applicable' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }],
					100
				)
			),
			MODELS
		);

		const excluded = rankNewspaperDisagreement(rows, 'polarity', 3, { minArticles: 2 })[0];
		const included = rankNewspaperDisagreement(rows, 'polarity', 3, {
			minArticles: 2,
			includeDeclined: true
		})[0];

		expect(excluded.mean).toBe(0);
		// 'Non applicable' at ordinal 0 against 'Neutre' at 3 is a 3-point gap on
		// half the rows — the floor effect the toggle exists to expose.
		expect(included.mean).toBe(1.5);
	});

	it('carries the median year so the era confound is visible rather than argued', () => {
		const datasets = merge(
			trio(1, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }], {
				Newspaper: 'Old',
				publication_date: '1978-04-02'
			}),
			trio(2, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }], {
				Newspaper: 'Old',
				publication_date: '1982-01-01'
			}),
			trio(3, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }], {
				Newspaper: 'Old',
				publication_date: '1990-01-01'
			})
		);

		const [entry] = rankNewspaperDisagreement(buildConsensusRows(datasets, MODELS), 'polarity', 3, {
			minArticles: 3
		});

		expect(entry.medianYear).toBe(1982);
	});

	it('widens the interval as the spread within a title varies', () => {
		const varied = merge(
			trio(1, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
			trio(2, [{ polarite: 'Très positif' }, { polarite: 'Neutre' }, { polarite: 'Très négatif' }]),
			trio(3, [{ polarite: 'Neutre' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
			trio(4, [{ polarite: 'Très positif' }, { polarite: 'Neutre' }, { polarite: 'Très négatif' }])
		);

		const [entry] = rankNewspaperDisagreement(buildConsensusRows(varied, MODELS), 'polarity', 3, {
			minArticles: 4
		});

		expect(entry.mean).toBe(2);
		expect(entry.confidence).toBeGreaterThan(0);
	});
});

describe('barycentric', () => {
	it('puts a title at a corner when one model does all the dissenting', () => {
		expect(barycentric([1, 0, 0])).toEqual(TRIANGLE_CORNERS[0]);
		expect(barycentric([0, 1, 0])).toEqual(TRIANGLE_CORNERS[1]);
		expect(barycentric([0, 0, 1])).toEqual(TRIANGLE_CORNERS[2]);
	});

	it('puts an evenly shared title at the centroid, whatever the shares sum to', () => {
		const [x, y] = barycentric([0.2, 0.2, 0.2]) as [number, number];
		expect(x).toBeCloseTo(0.5, 10);
		expect(y).toBeCloseTo(Math.sqrt(3) / 6, 10);
	});

	it('has nowhere to put a title with no splits at all', () => {
		expect(barycentric([0, 0, 0])).toBeNull();
	});
});

describe('pearson', () => {
	it('is +1 for a perfect rise and -1 for a perfect fall', () => {
		expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
		expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
	});

	it('is NaN rather than 0 when a series never varies', () => {
		// Zero would read as "measured, and unrelated"; this is "not measurable".
		expect(pearson([1, 1, 1], [1, 2, 3])).toBeNaN();
		expect(pearson([1], [1])).toBeNaN();
	});
});

describe('dimensionScale', () => {
	it('drops the declined rung when declined ratings are excluded', () => {
		expect(dimensionScale('polarity', true).labels[0]).toBe('Non applicable');
		expect(dimensionScale('polarity', false).labels[0]).toBe('Très négatif');
	});

	it("keeps centrality's 'Non abordé' in both modes", () => {
		expect(dimensionScale('centrality', false).labels).toContain('Non abordé');
		expect(dimensionScale('centrality', false).labels).not.toContain('Non applicable');
	});

	it('lists ascending, so ordinal position and scale position agree', () => {
		const { ordinals } = dimensionScale('polarity', true);
		expect(ordinals).toEqual([...ordinals].sort((a, b) => a - b));
	});
});

describe('buildLabelFlow', () => {
	it('emits one node per used band per column and links consecutive models', () => {
		const rows = buildConsensusRows(
			merge(
				trio(1, [{ polarite: 'Positif' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }]),
				trio(2, [{ polarite: 'Positif' }, { polarite: 'Neutre' }, { polarite: 'Neutre' }])
			),
			MODELS
		);

		const { nodes, links } = buildLabelFlow(rows, 'polarity', 3, false);

		// Positif in column 0; Neutre in columns 1 and 2.
		expect(nodes.map((node) => node.name).sort()).toEqual(
			['0 · Positif', '1 · Neutre', '2 · Neutre'].sort()
		);
		expect(links).toHaveLength(2);
		expect(links.find((link) => link.source === '0 · Positif')?.value).toBe(2);
	});

	it('survives category names containing spaces', () => {
		// A name-joined link key would split 'Très positif' in half and produce
		// links pointing at nodes that do not exist.
		const rows = buildConsensusRows(
			trio(1, [
				{ polarite: 'Très positif' },
				{ polarite: 'Très négatif' },
				{ polarite: 'Très positif' }
			]),
			MODELS
		);

		const { nodes, links } = buildLabelFlow(rows, 'polarity', 3, false);
		const names = new Set(nodes.map((node) => node.name));

		expect(links).toHaveLength(2);
		for (const link of links) {
			expect(names.has(link.source)).toBe(true);
			expect(names.has(link.target)).toBe(true);
		}
	});

	it('has nothing to draw when no row survives', () => {
		expect(buildLabelFlow([], 'polarity', 3, false)).toEqual({ nodes: [], links: [] });
	});
});
