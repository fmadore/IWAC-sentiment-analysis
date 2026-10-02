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
		// 19 July 622 in the proleptic Gregorian calendar used here.
		expect(gregorianToHijri(622, 7, 19)).toEqual({ year: 1, month: 1, day: 1 });
		expect(gregorianToHijri(622, 7, 18)).toBeNull();
	});

	it('converts a known modern date', () => {
		// Civil tabular calendar, matching ICU islamic-civil; this does not
		// establish the date of a local observation.
		expect(gregorianToHijri(2024, 3, 11)).toEqual({ year: 1445, month: 9, day: 1 });
	});

	it('advances the Hijri day in step with the Gregorian day', () => {
		const first = gregorianToHijri(2024, 3, 11)!;
		const second = gregorianToHijri(2024, 3, 12)!;
		expect(second.day).toBe(first.day + 1);
		expect(second.month).toBe(first.month);
	});

	it('rolls over the month boundary', () => {
		// Tabular Ramadan 1445 runs 30 days, so 10 April 2024 opens Shawwal.
		expect(gregorianToHijri(2024, 4, 9)).toEqual({ year: 1445, month: 9, day: 30 });
		expect(gregorianToHijri(2024, 4, 10)).toEqual({ year: 1445, month: 10, day: 1 });
	});

	it.each([
		[2024, 1, 1, { year: 1445, month: 6, day: 19 }],
		[2024, 2, 29, { year: 1445, month: 8, day: 19 }],
		[2024, 3, 1, { year: 1445, month: 8, day: 20 }],
		[2024, 3, 10, { year: 1445, month: 8, day: 29 }],
		[2024, 7, 7, { year: 1445, month: 12, day: 30 }],
		[2024, 7, 8, { year: 1446, month: 1, day: 1 }],
		[2000, 2, 29, { year: 1420, month: 11, day: 24 }],
		[1900, 3, 1, { year: 1317, month: 10, day: 28 }]
	])('matches civil-calendar reference date %i-%i-%i', (year, month, day, expected) => {
		// Fixed fixtures independently checked with ICU's islamic-civil calendar.
		expect(gregorianToHijri(year, month, day)).toEqual(expected);
	});

	it.each([
		[2023, 2, 29],
		[1900, 2, 29],
		[2024, 2, 30],
		[2024, 4, 31],
		[2024.5, 1, 1],
		[2024, 1.5, 1],
		[2024, 1, 1.5],
		[0, 1, 1],
		[10000, 1, 1],
		[Infinity, 1, 1]
	])('rejects an invalid Gregorian date %s-%s-%s', (year, month, day) => {
		expect(gregorianToHijri(year, month, day)).toBeNull();
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
		expect(publicationDateToHijri('2024-03-11')).toEqual({ year: 1445, month: 9, day: 1 });
	});

	it('returns null for the partial and placeholder dates the corpus contains', () => {
		// The corpus carries a handful of these; they must not become month 1.
		expect(publicationDateToHijri('2024')).toBeNull();
		expect(publicationDateToHijri('N/A')).toBeNull();
		expect(publicationDateToHijri('')).toBeNull();
		expect(publicationDateToHijri(undefined)).toBeNull();
	});

	it('returns null for a malformed date of the right length', () => {
		for (const date of [
			'20xx-03-11',
			'2024-3-011',
			'2024-03-11-extra',
			'2024-03-11T00:00:00Z',
			'2024-03-1e1',
			'2024-04-31',
			'2023-02-29'
		]) {
			expect(publicationDateToHijri(date)).toBeNull();
		}
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
