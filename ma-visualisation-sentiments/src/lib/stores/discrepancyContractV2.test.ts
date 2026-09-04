/**
 * The generation-2 half of the cross-language contract.
 *
 * `data-preprocess/test_contract.py` reads the same fixture file, so a rule
 * that drifts between the Python pipeline and the browser fails on both sides
 * rather than silently producing two different answers for one article.
 */
import { describe, expect, it } from 'vitest';
import fixtures from '$lib/data/discrepancy-v2-fixtures.json';
import subjectivityFixtures from '$lib/data/subjectivity-labels-v2-fixtures.json';
import type { SentimentAnalysis } from '$lib/types/data';
import {
	calculateDiscrepancies,
	calculateThreeWaySpread,
	hasPolarityValenceFlip,
	isArbiterEligible
} from './derivations';
import {
	SUBJECTIVITY_LABELS_V2,
	TOTAL_DISCREPANCY_MAXIMUM,
	isSubjectivityScore
} from '$lib/domain/sentimentContract';

type FixtureAnalysis = (typeof fixtures)['pairwise'][number]['analysisA'];

const fullAnalysis = (value: FixtureAnalysis): SentimentAnalysis => ({
	polarite: value.polarite as SentimentAnalysis['polarite'],
	centralite_islam_musulmans:
		value.centralite_islam_musulmans as SentimentAnalysis['centralite_islam_musulmans'],
	subjectivite_score: value.subjectivite_score as SentimentAnalysis['subjectivite_score'],
	polarite_justification: null,
	subjectivite_justification: null,
	centralite_justification: null
});

describe('shared v2 pairwise discrepancy contract', () => {
	for (const fixture of fixtures.pairwise) {
		it(fixture.name, () => {
			expect(
				calculateDiscrepancies(fullAnalysis(fixture.analysisA), fullAnalysis(fixture.analysisB))
			).toEqual({
				polarityDiff: fixture.expected.polarity,
				subjectivityDiff: fixture.expected.subjectivity,
				centralityDiff: fixture.expected.centrality,
				totalDiff: fixture.expected.total,
				hasConflict: fixture.expected.conflict,
				isComparable: fixture.expected.comparable
			});
		});
	}
});

describe('shared three-way spread contract', () => {
	for (const fixture of fixtures.threeWay) {
		it(fixture.name, () => {
			expect(calculateThreeWaySpread(fixture.analyses.map(fullAnalysis))).toEqual({
				polaritySpread: fixture.expected.polarity,
				subjectivitySpread: fixture.expected.subjectivity,
				centralitySpread: fixture.expected.centrality,
				totalSpread: fixture.expected.total,
				hasSignificantSpread: fixture.expected.significant,
				isComparable: fixture.expected.comparable
			});
		});
	}

	it('documents the maximum comparable total', () => {
		expect(Math.max(...fixtures.threeWay.map((fixture) => fixture.expected.total))).toBe(
			TOTAL_DISCREPANCY_MAXIMUM
		);
	});

	it('measures the full range rather than the widest pair', () => {
		// Three models one step apart: every pairwise gap is 1 or 2, the spread is 2.
		const ladder = ['Très positif', 'Positif', 'Neutre'].map((polarite) =>
			fullAnalysis({
				polarite,
				subjectivite_score: 2,
				centralite_islam_musulmans: 'Central'
			} as FixtureAnalysis)
		);
		expect(calculateThreeWaySpread(ladder).polaritySpread).toBe(2);
	});

	it('excludes a row when a model is missing entirely', () => {
		expect(calculateThreeWaySpread([null, null, null]).isComparable).toBe(false);
	});
});

describe('shared arbiter eligibility contract', () => {
	for (const fixture of fixtures.valenceFlip) {
		it(fixture.name, () => {
			const analyses = fixture.analyses.map(fullAnalysis);
			expect(hasPolarityValenceFlip(analyses)).toBe(fixture.expected.flip);
			expect(isArbiterEligible(analyses)).toBe(fixture.expected.arbiterEligible);
			expect(calculateThreeWaySpread(analyses).hasSignificantSpread).toBe(
				fixture.expected.significantSpread
			);
		});
	}

	it('contains the dashboard rule without being it', () => {
		// Positif against Négatif is two ranks: worth arbitrating, and still not
		// a significant discrepancy. Widening one must never move the other.
		const flipOnly = ['Positif', 'Négatif', 'Neutre', 'Neutre', 'Neutre'].map((polarite) =>
			fullAnalysis({ polarite, centralite_islam_musulmans: 'Central', subjectivite_score: 3 })
		);
		expect(calculateThreeWaySpread(flipOnly).hasSignificantSpread).toBe(false);
		expect(isArbiterEligible(flipOnly)).toBe(true);
	});

	it('excludes a row the panel cannot be compared on', () => {
		expect(hasPolarityValenceFlip([null, null, null])).toBe(false);
		expect(isArbiterEligible([null, null, null])).toBe(false);
	});
});

describe('v2 subjectivity labels', () => {
	it('covers the published 1-5 scale exactly once', () => {
		const ranks = subjectivityFixtures.labels.map((entry) => entry.rank);
		expect([...ranks].sort()).toEqual([1, 2, 3, 4, 5]);
		expect(ranks.every(isSubjectivityScore)).toBe(true);
	});

	it('renders each rank with the label the models were asked for', () => {
		for (const entry of subjectivityFixtures.labels) {
			expect(SUBJECTIVITY_LABELS_V2[entry.rank as 1 | 2 | 3 | 4 | 5]).toBe(entry.label);
		}
	});
});
