import { describe, it, expect } from 'vitest';
import {
	gregorianToHijri,
	publicationDateToHijri,
	HIJRI_MONTH_KEYS,
	OBSERVANCE_MONTHS
} from './hijri';

describe('gregorianToHijri', () => {
	it('places the Islamic epoch on 1 Muharram 1 AH', () => {
		// Civil ("Friday") epoch: 1 Muharram 1 AH = 16 July 622 Julian =
		// 17 July 622 in the proleptic Gregorian calendar used here.
		expect(gregorianToHijri(622, 7, 17)).toEqual({ year: 1, month: 1, day: 1 });
		expect(gregorianToHijri(622, 7, 16)).toEqual({ year: 0, month: 12, day: 29 });
	});

	it('converts a known modern date', () => {
		// Tabular 1 Ramadan 1445 = 10 March 2024. Announced observance in most
		// countries began a day later — the expected tabular-vs-sighting offset,
		// and the reason this module is documented as month-level only.
		expect(gregorianToHijri(2024, 3, 10)).toEqual({ year: 1445, month: 9, day: 1 });
	});

	it('advances the Hijri day in step with the Gregorian day', () => {
		const first = gregorianToHijri(2024, 3, 11)!;
		const second = gregorianToHijri(2024, 3, 12)!;
		expect(second.day).toBe(first.day + 1);
		expect(second.month).toBe(first.month);
	});

	it('rolls over the month boundary', () => {
		// Tabular Ramadan 1445 runs 30 days, so 9 April 2024 opens Shawwal.
		expect(gregorianToHijri(2024, 4, 8)).toEqual({ year: 1445, month: 9, day: 30 });
		expect(gregorianToHijri(2024, 4, 9)).toEqual({ year: 1445, month: 10, day: 1 });
	});

	it('produces a Hijri year ~11 days shorter, so it drifts against the Gregorian one', () => {
		// The whole reason this conversion exists: the same Gregorian date lands
		// in a different Hijri month a few years later.
		const a = gregorianToHijri(2015, 6, 18)!;
		const b = gregorianToHijri(2020, 6, 18)!;
		expect(a.month).not.toBe(b.month);
	});

	it('always yields a month within 1-12 across a long span', () => {
		for (let year = 1960; year <= 2026; year++) {
			for (let month = 1; month <= 12; month++) {
				const result = gregorianToHijri(year, month, 15);
				expect(result).not.toBeNull();
				expect(result!.month).toBeGreaterThanOrEqual(1);
				expect(result!.month).toBeLessThanOrEqual(12);
				expect(result!.day).toBeGreaterThanOrEqual(1);
				expect(result!.day).toBeLessThanOrEqual(30);
			}
		}
	});

	it('rejects out-of-range input rather than returning nonsense', () => {
		expect(gregorianToHijri(2024, 13, 1)).toBeNull();
		expect(gregorianToHijri(2024, 0, 1)).toBeNull();
		expect(gregorianToHijri(2024, 1, 0)).toBeNull();
		expect(gregorianToHijri(NaN, 1, 1)).toBeNull();
	});
});

describe('publicationDateToHijri', () => {
	it('parses a full YYYY-MM-DD publication date', () => {
		expect(publicationDateToHijri('2024-03-11')).toEqual({ year: 1445, month: 9, day: 2 });
	});

	it('returns null for the partial and placeholder dates the corpus contains', () => {
		// The corpus carries a handful of these; they must not become month 1.
		expect(publicationDateToHijri('2024')).toBeNull();
		expect(publicationDateToHijri('N/A')).toBeNull();
		expect(publicationDateToHijri('')).toBeNull();
		expect(publicationDateToHijri(undefined)).toBeNull();
	});

	it('returns null for a malformed date of the right length', () => {
		expect(publicationDateToHijri('20xx-03-11')).toBeNull();
	});
});

describe('month metadata', () => {
	it('lists twelve months in calendar order', () => {
		expect(HIJRI_MONTH_KEYS).toHaveLength(12);
		expect(HIJRI_MONTH_KEYS[0]).toBe('muharram');
		expect(HIJRI_MONTH_KEYS[8]).toBe('ramadan');
		expect(HIJRI_MONTH_KEYS[11]).toBe('dhuAlHijjah');
	});

	it('maps each observance onto a real month key', () => {
		Object.values(OBSERVANCE_MONTHS)
			.flat()
			.forEach((key) => expect(HIJRI_MONTH_KEYS).toContain(key));
	});
});
