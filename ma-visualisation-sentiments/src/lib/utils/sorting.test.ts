import { describe, expect, it } from 'vitest';
import { ariaSort, nextSort } from './sorting';

describe('nextSort', () => {
	it('flips the direction of the column already sorted', () => {
		expect(nextSort({ column: 'date', order: 'asc' }, 'date')).toEqual({
			column: 'date',
			order: 'desc'
		});
		expect(nextSort({ column: 'date', order: 'desc' }, 'date', 'desc')).toEqual({
			column: 'date',
			order: 'asc'
		});
	});

	it('starts a newly sorted column at its own default, whatever the previous order', () => {
		expect(nextSort({ column: 'title', order: 'desc' }, 'spread', 'desc')).toEqual({
			column: 'spread',
			order: 'desc'
		});
		expect(nextSort({ column: 'spread', order: 'desc' }, 'title')).toEqual({
			column: 'title',
			order: 'asc'
		});
	});
});

describe('ariaSort', () => {
	it('announces direction only on the sorted column', () => {
		expect(ariaSort(true, 'asc')).toBe('ascending');
		expect(ariaSort(true, 'desc')).toBe('descending');
		expect(ariaSort(false, 'desc')).toBe('none');
	});
});
