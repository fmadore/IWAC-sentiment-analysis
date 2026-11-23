import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { NOT_ANNOTATED } from '#lib/domain/sentimentContract.js';
import { currentLanguage } from './index';
import {
	fmtDate,
	formatDate,
	getSentimentLabels,
	translateSentimentValue,
	translateSubjectivityScore
} from './utils';

describe('the "not annotated" bucket', () => {
	it('translates the filter value like a stored one', () => {
		expect(translateSentimentValue(NOT_ANNOTATED, 'en')).toBe('Not annotated');
		expect(translateSentimentValue(NOT_ANNOTATED, 'fr')).toBe('Non annoté');
	});

	it('names a null subjectivity as not annotated, never as not applicable', () => {
		expect(translateSubjectivityScore(null, 'en')).toBe('Not annotated');
		expect(getSentimentLabels('subjectivity', 'en').at(-1)).toBe('Not annotated');
		expect(translateSubjectivityScore(3, 'en')).toBe('Mixed');
	});
});

describe('formatDate', () => {
	afterEach(() => vi.restoreAllMocks());

	it('spells the month out in the requested language', () => {
		expect(formatDate('2011-10-19', 'en')).toBe('19 October 2011');
		expect(formatDate('2011-10-19', 'fr')).toBe('19 octobre 2011');
	});

	it('uses the British day-first order in English', () => {
		expect(formatDate('2025-03-01', 'en')).toBe('1 March 2025');
	});

	it.each([
		['America/Los_Angeles', '31 December 2024'],
		['Pacific/Kiritimati', '1 January 2025']
	])('preserves publication dates in %s', (timeZone, timestampDate) => {
		// Supply the host's default timezone without depending on the machine
		// running this suite. Explicit formatter options still take precedence.
		const toLocaleDateString = Date.prototype.toLocaleDateString;
		vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (
			this: Date,
			locales,
			options
		) {
			return toLocaleDateString.call(this, locales, {
				...options,
				timeZone: options?.timeZone ?? timeZone
			});
		});

		expect(formatDate('2025-01-01', 'en')).toBe('1 January 2025');
		expect(formatDate('2024-03-01', 'fr')).toBe('1 mars 2024');
		expect(formatDate('2024-02-29', 'en')).toBe('29 February 2024');
		// A timestamp describes an instant and still follows the host timezone.
		expect(formatDate('2025-01-01T00:30:00Z', 'en')).toBe(timestampDate);
	});

	it.each(['UTC', 'America/New_York', 'Pacific/Kiritimati'])(
		'keeps a month-precision date to its month, with no invented day, in %s',
		(timeZone) => {
			const toLocaleDateString = Date.prototype.toLocaleDateString;
			vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (
				this: Date,
				locales,
				options
			) {
				return toLocaleDateString.call(this, locales, {
					...options,
					timeZone: options?.timeZone ?? timeZone
				});
			});

			expect(formatDate('1997-10', 'en')).toBe('October 1997');
			expect(formatDate('1997-10', 'fr')).toBe('octobre 1997');
			// West of UTC this used to read 31 December 1993.
			expect(formatDate('1994-01', 'en')).toBe('January 1994');
		}
	);

	it('returns a bare year and an ISO range exactly as they came', () => {
		expect(formatDate('1997', 'en')).toBe('1997');
		expect(formatDate('1997', 'fr')).toBe('1997');
		expect(formatDate('1993-02/1993-03', 'en')).toBe('1993-02/1993-03');
		expect(formatDate('1993-02-01/1993-03-15', 'fr')).toBe('1993-02-01/1993-03-15');
	});

	it('returns an impossible month as it came', () => {
		expect(formatDate('1997-13', 'en')).toBe('1997-13');
	});

	it('returns an unparseable value as it came, and a missing one as the localised placeholder', () => {
		expect(formatDate('19/10/2011', 'en')).toBe('19/10/2011');
		expect(formatDate(null, 'en')).not.toBe('');
		expect(formatDate(null, 'en')).not.toBe(formatDate(null, 'fr'));
	});
});

describe('fmtDate', () => {
	it('follows the language store, so a switch re-renders every date', () => {
		const initial = get(currentLanguage);
		try {
			currentLanguage.set('en');
			expect(get(fmtDate)('2011-10-19')).toBe('19 October 2011');
			currentLanguage.set('fr');
			expect(get(fmtDate)('2011-10-19')).toBe('19 octobre 2011');
		} finally {
			currentLanguage.set(initial);
		}
	});
});
