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
