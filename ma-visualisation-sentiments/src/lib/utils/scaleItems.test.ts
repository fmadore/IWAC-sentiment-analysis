import { describe, expect, it } from 'vitest';
import { en } from '#lib/i18n/en.js';
import { SUBJECTIVITY_LABELS_V2 } from '#lib/domain/sentimentContract.js';
import { centralityScaleItems, polarityScaleItems, subjectivityScaleItems } from './scaleItems';

describe('scale items', () => {
	it('lists polarity most positive first, with the stored labels as badges', () => {
		const items = polarityScaleItems(en.arbiter);
		expect(items.map((item) => item.badge)).toEqual([
			'Très positif',
			'Positif',
			'Neutre',
			'Négatif',
			'Très négatif'
		]);
		expect(items[0]).toMatchObject({
			variant: 'polarity-very-positive',
			description: en.arbiter.polarityVeryPositive
		});
	});

	it('adds Non applicable only when asked', () => {
		const items = polarityScaleItems(
			{ ...en.arbiter, polarityNotApplicable: 'n/a' },
			{ includeNotApplicable: true }
		);
		expect(items.at(-1)).toMatchObject({ variant: 'polarity-na', description: 'n/a' });
	});

	it('shows subjectivity as a rank by default and lets v2 show its labels', () => {
		expect(subjectivityScaleItems(en.arbiter).map((item) => item.badge)).toEqual([
			'1',
			'2',
			'3',
			'4',
			'5'
		]);
		const v2 = subjectivityScaleItems(en.arbiter, {
			badge: (step) => SUBJECTIVITY_LABELS_V2[step.value]
		});
		expect(v2[0].badge).toBe('Très objectif');
		expect(v2[4].badge).toBe('Très subjectif');
	});

	it('lists centrality most central first', () => {
		expect(centralityScaleItems(en.arbiter).map((item) => item.variant)).toEqual([
			'centrality-very-central',
			'centrality-central',
			'centrality-secondary',
			'centrality-marginal',
			'centrality-not-addressed'
		]);
	});
});
