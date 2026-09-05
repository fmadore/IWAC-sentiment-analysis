import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { currentLanguage } from './index';
import { fmtDate, formatDate } from './utils';

describe('formatDate', () => {
	it('spells the month out in the requested language', () => {
		expect(formatDate('2011-10-19', 'en')).toBe('19 October 2011');
		expect(formatDate('2011-10-19', 'fr')).toBe('19 octobre 2011');
	});

	it('uses the British day-first order in English', () => {
		expect(formatDate('2025-03-01', 'en')).toBe('1 March 2025');
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
