import { describe, expect, it } from 'vitest';
import {
	ariaSort,
	compareBy,
	compareValues,
	dateKey,
	nextSort,
	searchKey,
	titleKey
} from './sorting';

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

describe('compareBy on titles', () => {
	const titles = [
		'Zinder',
		'école coranique',
		'Abidjan',
		'Église',
		'abbé',
		'Édition 10',
		'Édition 9'
	];

	it('sorts accented French titles in place, not after Z, and ignores case', () => {
		const sorted = [...titles].sort(compareBy(titleKey, 'asc'));
		expect(sorted).toEqual([
			'abbé',
			'Abidjan',
			'école coranique',
			'Édition 9',
			'Édition 10',
			'Église',
			'Zinder'
		]);
	});

	it('reverses cleanly when descending', () => {
		const sorted = [...titles].sort(compareBy(titleKey, 'desc'));
		expect(sorted[0]).toBe('Zinder');
		expect(sorted.at(-1)).toBe('abbé');
	});

	it('puts a missing title last in both directions', () => {
		const items = ['', 'Beta', 'Alpha'];
		expect([...items].sort(compareBy(titleKey, 'asc'))).toEqual(['Alpha', 'Beta', '']);
		expect([...items].sort(compareBy(titleKey, 'desc'))).toEqual(['Beta', 'Alpha', '']);
	});
});

describe('dateKey', () => {
	it('reads full, month-only and ranged dates', () => {
		expect(dateKey('1998-04-12')).toBe(Date.UTC(1998, 3, 12));
		expect(dateKey('1998-04')).toBe(Date.UTC(1998, 3, 1));
		expect(dateKey('1998')).toBe(Date.UTC(1998, 0, 1));
		expect(dateKey('1998-04-01/1998-04-30')).toBe(Date.UTC(1998, 3, 1));
	});

	it('returns null when there is no date', () => {
		expect(dateKey(null)).toBeNull();
		expect(dateKey(undefined)).toBeNull();
		expect(dateKey('')).toBeNull();
		expect(dateKey('s.d.')).toBeNull();
	});

	it('sorts undated rows last whichever way the dates run', () => {
		const dates = [null, '2001-01-01', '1999-06', null, '2010'];
		expect([...dates].sort(compareBy(dateKey, 'asc'))).toEqual([
			'1999-06',
			'2001-01-01',
			'2010',
			null,
			null
		]);
		expect([...dates].sort(compareBy(dateKey, 'desc'))).toEqual([
			'2010',
			'2001-01-01',
			'1999-06',
			null,
			null
		]);
	});
});

describe('compareValues', () => {
	it('orders numbers and keeps ties stable', () => {
		expect(compareValues(1, 2, 'asc')).toBeLessThan(0);
		expect(compareValues(1, 2, 'desc')).toBeGreaterThan(0);
		expect(compareValues(3, 3, 'desc')).toBe(0);
	});

	it('treats NaN as missing', () => {
		expect(compareValues(Number.NaN, 1, 'asc')).toBe(1);
		expect(compareValues(Number.NaN, 1, 'desc')).toBe(1);
	});
});

describe('searchKey', () => {
	it('folds accents and case', () => {
		expect(searchKey('Église Saint-Étienne')).toBe('eglise saint-etienne');
		expect(searchKey('  ÉCOLE ')).toBe('ecole');
		expect(searchKey(null)).toBe('');
	});
});
