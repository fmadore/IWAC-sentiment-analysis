/**
 * Tabular (civil) Islamic calendar conversion.
 *
 * Why the corpus needs this: every other temporal view buckets by Gregorian
 * year or month, and by those measures IWAC coverage looks almost flat across
 * the year (840-1,289 articles per Gregorian month). On the Islamic lunar
 * calendar the same corpus nearly doubles during Ramadan and the hajj months.
 * Because the Hijri year drifts ~11 days against the Gregorian one, that
 * pattern is invisible to any Gregorian bucketing — it smears across every
 * month over a 60-year corpus.
 *
 * Uses the TABULAR (arithmetic) calendar with the civil ("Friday") epoch —
 * 1 Muharram 1 AH = 16 July 622 Julian — not observational sighting. For a
 * corpus-scale seasonality question that is the right tool: it is
 * deterministic, needs no ephemeris, and its one-to-two day divergence from
 * announced local dates is far below the resolution of a month-level
 * aggregate over 12,000 articles. It must NOT be used to date an individual
 * observance: tabular 1 Ramadan 1445 falls on 10 March 2024, while most
 * countries announced the 11th.
 */

/** Hijri month numbers, 1-12. */
export type HijriMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Transliterated month names, in calendar order (index 0 = Muharram). */
export const HIJRI_MONTH_KEYS = [
	'muharram',
	'safar',
	'rabiI',
	'rabiII',
	'jumadaI',
	'jumadaII',
	'rajab',
	'shaban',
	'ramadan',
	'shawwal',
	'dhuAlQadah',
	'dhuAlHijjah'
] as const;

export type HijriMonthKey = (typeof HIJRI_MONTH_KEYS)[number];

/**
 * Months that carry a major observance, for annotating the chart.
 *
 * Ramadan (fasting), Shawwal (opens with Eid al-Fitr) and Dhu al-Hijjah (hajj
 * and Eid al-Adha) are the three the corpus actually spikes in.
 */
export const OBSERVANCE_MONTHS: Record<string, HijriMonthKey[]> = {
	ramadan: ['ramadan'],
	eidAlFitr: ['shawwal'],
	hajj: ['dhuAlHijjah']
};

/**
 * Gregorian date → Julian Day Number (Fliegel & Van Flandern).
 * Proleptic Gregorian, which is fine: the corpus starts in 1961.
 */
function toJulianDayNumber(year: number, month: number, day: number): number {
	const a = Math.floor((month - 14) / 12);
	return (
		Math.floor((1461 * (year + 4800 + a)) / 4) +
		Math.floor((367 * (month - 2 - 12 * a)) / 12) -
		Math.floor((3 * Math.floor((year + 4900 + a) / 100)) / 4) +
		day -
		32075
	);
}

export interface HijriDate {
	year: number;
	/** 1 = Muharram … 12 = Dhu al-Hijjah */
	month: HijriMonth;
	day: number;
}

/**
 * Convert a Gregorian date to the tabular Islamic calendar.
 * Returns null for a date outside the calendar's valid range.
 */
export function gregorianToHijri(year: number, month: number, day: number): HijriDate | null {
	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;

	const jd = toJulianDayNumber(year, month, day);

	// Days elapsed since the Islamic epoch (1 Muharram 1 AH = JD 1948440 in the
	// civil variant), offset into the 30-year cycle arithmetic below.
	let l = jd - 1948440 + 10632;
	if (l < 1) return null;

	const n = Math.floor((l - 1) / 10631);
	l = l - 10631 * n + 354;

	const j =
		Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
		Math.floor(l / 5670) * Math.floor((43 * l) / 15238);

	l =
		l -
		Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
		Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
		29;

	const hijriMonth = Math.floor((24 * l) / 709);
	const hijriDay = l - Math.floor((709 * hijriMonth) / 24);
	const hijriYear = 30 * n + j - 30;

	if (hijriMonth < 1 || hijriMonth > 12) return null;

	return { year: hijriYear, month: hijriMonth as HijriMonth, day: hijriDay };
}

/**
 * Parse a `YYYY-MM-DD` publication date into its Hijri equivalent.
 * Returns null for the year-only and 'N/A' values the corpus also contains.
 */
export function publicationDateToHijri(publicationDate: string | undefined): HijriDate | null {
	if (!publicationDate || publicationDate.length < 10) return null;

	const [yearPart, monthPart, dayPart] = publicationDate.split('-');
	const year = Number(yearPart);
	const month = Number(monthPart);
	const day = Number(dayPart);

	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

	return gregorianToHijri(year, month, day);
}
