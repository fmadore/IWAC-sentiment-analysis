/**
 * ShareBar is the accessible representation of every proportion bar in the
 * arbiter views: the bar is decorative, the list carries the values.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import ShareBar from './ShareBar.svelte';
import { currentLanguage } from '#lib/i18n/index.js';

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
});

const segments = [
	{ key: 'a', label: 'Alpha', count: 60, color: '#123456' },
	{ key: 'b', label: 'Beta', count: 5, color: '#654321' },
	{ key: 'tie', label: 'Égalité', count: 35, pattern: 'hatch' as const }
];

describe('ShareBar', () => {
	it('names every segment with its count and share in a labelled list', () => {
		render(ShareBar, { props: { segments, label: 'Verdicts' } });
		const list = screen.getByRole('list', { name: 'Verdicts' });
		const items = screen.getAllByRole('listitem');
		expect(items).toHaveLength(3);
		expect(list.textContent).toContain('Alpha');
		expect(items[0].textContent).toContain('60');
		expect(items[0].textContent).toContain('60,0');
	});

	it('hides the bar from assistive technology and labels only wide segments inline', () => {
		const { container } = render(ShareBar, { props: { segments, label: 'Verdicts' } });
		const bar = container.querySelector('.bar')!;
		expect(bar.getAttribute('aria-hidden')).toBe('true');
		const inline = [...bar.querySelectorAll('.direct-label')].map((node) => node.textContent);
		// Beta's 5% segment is too narrow for its own label; the legend still names it.
		expect(inline).toEqual(['60', '35']);
		expect(bar.querySelector('[data-pattern="hatch"]')).not.toBeNull();
	});

	it('keeps the list for assistive technology when the legend is hidden', () => {
		const { container } = render(ShareBar, {
			props: { segments, label: 'Verdicts', legend: 'hidden' }
		});
		expect(container.querySelector('.legend')?.getAttribute('data-visibility')).toBe('hidden');
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
	});

	it('uses an explicit denominator when given', () => {
		render(ShareBar, {
			props: { segments: [{ key: 'a', label: 'Alpha', count: 1 }], total: 4, label: 'x' }
		});
		expect(screen.getByRole('listitem').textContent).toContain('25,0');
	});
});
