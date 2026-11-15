import { describe, expect, it } from 'vitest';
import { VIEW_GROUPS, VIEW_IDS, VIEW_META } from '#lib/types/data.js';
import { NAV_ITEMS, NAV_SECTIONS } from './navItems';

describe('navigation sections', () => {
	it('lists every view exactly once', () => {
		const listed = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.id));
		expect([...listed].sort()).toEqual([...VIEW_IDS].sort());
		expect(new Set(listed).size).toBe(listed.length);
		expect(NAV_ITEMS).toHaveLength(VIEW_IDS.length);
	});

	it('places each view under its VIEW_META group, in group order', () => {
		expect(NAV_SECTIONS.map((section) => section.group)).toEqual([...VIEW_GROUPS]);
		for (const section of NAV_SECTIONS) {
			expect(section.items.length).toBeGreaterThan(0);
			for (const item of section.items) expect(VIEW_META[item.id].group).toBe(section.group);
		}
	});
});
