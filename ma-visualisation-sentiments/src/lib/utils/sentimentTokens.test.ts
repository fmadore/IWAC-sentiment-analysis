import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
	CENTRALITY_SLUGS,
	POLARITY_SLUGS,
	isSentimentVariant,
	sentimentAttributes,
	sentimentVariant,
	variantAttributes,
	type SentimentVariant
} from './sentimentTokens';

describe('sentimentVariant', () => {
	it('maps every stored polarity value', () => {
		expect(sentimentVariant('polarity', 'Très positif')).toBe('polarity-very-positive');
		expect(sentimentVariant('polarity', 'Positif')).toBe('polarity-positive');
		expect(sentimentVariant('polarity', 'Neutre')).toBe('polarity-neutral');
		expect(sentimentVariant('polarity', 'Négatif')).toBe('polarity-negative');
		expect(sentimentVariant('polarity', 'Très négatif')).toBe('polarity-very-negative');
		expect(sentimentVariant('polarity', 'Non applicable')).toBe('polarity-na');
	});

	it('maps every stored centrality value', () => {
		expect(sentimentVariant('centrality', 'Très central')).toBe('centrality-very-central');
		expect(sentimentVariant('centrality', 'Central')).toBe('centrality-central');
		expect(sentimentVariant('centrality', 'Secondaire')).toBe('centrality-secondary');
		expect(sentimentVariant('centrality', 'Marginal')).toBe('centrality-marginal');
		expect(sentimentVariant('centrality', 'Non abordé')).toBe('centrality-not-addressed');
	});

	it('leaves no scale value unmapped', () => {
		// Guards against a value being added to a lookup but not reachable through
		// sentimentVariant — asserted against the declared slug rather than "not
		// the fallback", since 'Non applicable' and 'Non abordé' legitimately
		// resolve to the fallback variants.
		for (const [value, slug] of Object.entries(POLARITY_SLUGS)) {
			expect(sentimentVariant('polarity', value)).toBe(`polarity-${slug}`);
		}

		for (const [value, slug] of Object.entries(CENTRALITY_SLUGS)) {
			expect(sentimentVariant('centrality', value)).toBe(`centrality-${slug}`);
		}
	});

	describe('subjectivity', () => {
		it('accepts the score as a number', () => {
			expect(sentimentVariant('subjectivity', 3)).toBe('subjectivity-3');
		});

		it('accepts the score as a string (URL state hands it over that way)', () => {
			expect(sentimentVariant('subjectivity', '4')).toBe('subjectivity-4');
		});

		it('falls back to the midpoint for out-of-range scores', () => {
			expect(sentimentVariant('subjectivity', 0)).toBe('subjectivity-3');
			expect(sentimentVariant('subjectivity', 6)).toBe('subjectivity-3');
			expect(sentimentVariant('subjectivity', 'not a score')).toBe('subjectivity-3');
		});
	});

	describe('missing values', () => {
		it.each([null, undefined, ''] as const)('falls back for %o', (value) => {
			expect(sentimentVariant('polarity', value)).toBe('polarity-na');
			expect(sentimentVariant('centrality', value)).toBe('centrality-not-addressed');
			expect(sentimentVariant('subjectivity', value)).toBe('subjectivity-3');
		});
	});

	it('falls back for an unrecognised value rather than throwing', () => {
		// A model emitting an off-scale label must not blank out the UI.
		expect(sentimentVariant('polarity', 'Enthousiaste')).toBe('polarity-na');
		expect(sentimentVariant('centrality', 'Omniprésent')).toBe('centrality-not-addressed');
	});
});

describe('variantAttributes', () => {
	it('splits a variant into its family attribute', () => {
		expect(variantAttributes('polarity-very-positive')).toEqual({
			'data-polarity': 'very-positive'
		});
		expect(variantAttributes('subjectivity-2')).toEqual({ 'data-subjectivity': '2' });
	});

	it('keeps hyphenated slugs intact — only the family prefix is split off', () => {
		expect(variantAttributes('centrality-not-addressed')).toEqual({
			'data-centrality': 'not-addressed'
		});
	});

	it('emits exactly one attribute so families never collide on an element', () => {
		expect(Object.keys(variantAttributes('centrality-marginal'))).toHaveLength(1);
	});
});

describe('isSentimentVariant', () => {
	it.each([
		'polarity-neutral',
		'subjectivity-5',
		'centrality-secondary'
	] satisfies SentimentVariant[])('accepts %s', (variant) => {
		expect(isSentimentVariant(variant)).toBe(true);
	});

	it.each(['default', 'comparison', 'warning'])(
		"rejects FilterChip's utility variant %s",
		(variant) => {
			expect(isSentimentVariant(variant)).toBe(false);
		}
	);
});

describe('the app.css palette contract', () => {
	// This module names colours it does not own. If a variant here has no
	// matching rule in app.css, nothing errors — the badge just renders
	// transparent-on-transparent, which is exactly the sort of silent breakage
	// the consolidation is meant to make impossible. So assert the join.
	// Resolved from the Vitest root (the package dir) rather than import.meta.url,
	// which Vitest rewrites to a non-file scheme.
	const css = readFileSync(resolve('src/app.css'), 'utf8');

	const ALL_VARIANTS: SentimentVariant[] = [
		...Object.values(POLARITY_SLUGS).map((slug) => `polarity-${slug}` as SentimentVariant),
		...Object.values(CENTRALITY_SLUGS).map((slug) => `centrality-${slug}` as SentimentVariant),
		...([1, 2, 3, 4, 5] as const).map((n) => `subjectivity-${n}` as SentimentVariant)
	];

	it.each(ALL_VARIANTS)('app.css defines a palette for %s', (variant) => {
		const [attribute, value] = Object.entries(variantAttributes(variant))[0];
		const selector = `[${attribute}='${value}']`;
		const block = css.slice(css.indexOf(selector));

		expect(css, `missing selector ${selector}`).toContain(selector);

		// ...and that it resolves all three variables the components read.
		for (const property of ['--sentiment-fg', '--sentiment-bg', '--sentiment-border']) {
			expect(block.slice(0, block.indexOf('}')), `${selector} omits ${property}`).toContain(
				property
			);
		}
	});
});

describe('sentimentAttributes', () => {
	it('goes from a raw stored value straight to the DOM attribute', () => {
		expect(sentimentAttributes('polarity', 'Très négatif')).toEqual({
			'data-polarity': 'very-negative'
		});
	});

	it('carries the fallback through for a missing value', () => {
		expect(sentimentAttributes('centrality', null)).toEqual({
			'data-centrality': 'not-addressed'
		});
	});
});
