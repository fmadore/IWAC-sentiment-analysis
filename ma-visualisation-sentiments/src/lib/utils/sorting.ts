/** Shared column-sort rules for the sortable tables. */

export type SortOrder = 'asc' | 'desc';

/**
 * The sort after a header click: the sorted column flips direction; any other
 * column becomes the sorted one, starting at its own default direction (text
 * columns read best A→Z, magnitudes largest first).
 */
export function nextSort<K extends string>(
	current: { column: K; order: SortOrder },
	column: K,
	defaultOrder: SortOrder = 'asc'
): { column: K; order: SortOrder } {
	if (current.column === column) {
		return { column, order: current.order === 'asc' ? 'desc' : 'asc' };
	}
	return { column, order: defaultOrder };
}

/** The `aria-sort` value for a column header. */
export function ariaSort(active: boolean, order: SortOrder): 'ascending' | 'descending' | 'none' {
	if (!active) return 'none';
	return order === 'asc' ? 'ascending' : 'descending';
}

/**
 * One collator for every text column. The corpus is French: a plain `<`
 * comparison sorts by code point, so « École » landed after « Zinder » and
 * capitals before lower case, and two tables lowercased while two did not.
 * `sensitivity: 'base'` ignores case and accents; `numeric` reads « 10 » after
 * « 9 ».
 */
const COLLATOR = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/** A value a column sorts on; `null`/`undefined`/`''` mean "no value". */
export type SortValue = string | number | null | undefined;

function isMissing(value: SortValue): value is null | undefined | '' {
	return value === null || value === undefined || value === '' || Number.isNaN(value);
}

/**
 * Compare two sort values. Missing values sort last in BOTH directions: an
 * undated article belongs at the foot of the list whichever way the dates run,
 * not at the top of a descending sort as the epoch-zero fallback put it.
 */
export function compareValues(a: SortValue, b: SortValue, order: SortOrder): number {
	const aMissing = isMissing(a);
	const bMissing = isMissing(b);
	if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
	const base =
		typeof a === 'string' && typeof b === 'string'
			? COLLATOR.compare(a, b)
			: (a as number) < (b as number)
				? -1
				: (a as number) > (b as number)
					? 1
					: 0;
	return order === 'asc' || base === 0 ? base : -base;
}

/** A comparator for `Array.prototype.sort` from a key accessor. */
export function compareBy<T>(key: (item: T) => SortValue, order: SortOrder) {
	return (a: T, b: T): number => compareValues(key(a), key(b), order);
}

/** The sort key of a title: trimmed, `null` when there is none. */
export function titleKey(title: string | null | undefined): string | null {
	const trimmed = title?.trim();
	return trimmed ? trimmed : null;
}

/**
 * The sort key of a publication date, or `null` when there is none.
 *
 * Month-only (`1998-04`) and ranged (`1998-04-01/1998-04-30`) dates are real in
 * the corpus. `new Date()` reads the first and returns NaN for the second, so
 * the leading year, month and day are read directly instead; a ranged date
 * sorts on its start.
 */
export function dateKey(date: string | null | undefined): number | null {
	const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(date?.trim() ?? '');
	if (!match) return null;
	const [, year, month, day] = match;
	return Date.UTC(Number(year), month ? Number(month) - 1 : 0, day ? Number(day) : 1);
}

/**
 * Text folded for matching a search: no accents, no case. « Église » and
 * « eglise » are the same query against a French corpus.
 */
export function searchKey(text: string | null | undefined): string {
	return (text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
}

/**
 * The rows the article table lists for a title search (`tableSearch`), and so
 * the rows its CSV export carries. An empty query returns the input as is.
 */
export function searchByTitle<T extends { 'o:title'?: string | null }>(
	rows: readonly T[],
	query: string
): readonly T[] {
	const key = searchKey(query);
	if (!key) return rows;
	return rows.filter((row) => searchKey(row['o:title']).includes(key));
}
