/**
 * The archived pairwise arbiter section's header is a disclosure: a button
 * inside the heading, holding phrasing content only. It used to nest a <div>,
 * an <h4> and a <p> inside the button, which is invalid and drops the heading
 * from the outline.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import ArbiterSection from './ArbiterSection.svelte';
import { fr } from '#lib/i18n/fr.js';

vi.mock('#lib/stores/index.js', () => ({
	getArbiterForArticle: () => undefined,
	arbiterModelAIsFirst: { current: true },
	getActualModelName: (model: string) => model,
	arbiterLoadState: { current: { status: 'ready' } },
	datasetState: { pair: 'chatgpt-gemini', available: [] }
}));

afterEach(cleanup);

describe('ArbiterSection header', () => {
	it('puts the toggle button inside a level-4 heading', () => {
		render(ArbiterSection, { props: { articleId: 1 } });
		const heading = screen.getByRole('heading', { level: 4, name: new RegExp(fr.arbiter.title) });
		const button = within(heading).getByRole('button');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.querySelector('h1, h2, h3, h4, h5, h6, div, p')).toBeNull();
		expect(button.textContent).toContain(fr.arbiter.subtitle);
	});

	it('reports and toggles its expanded state', async () => {
		render(ArbiterSection, { props: { articleId: 1, initiallyOpen: false } });
		const button = within(screen.getByRole('heading', { level: 4 })).getByRole('button');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText(fr.arbiter.noArbiterData)).toBeNull();

		await fireEvent.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText(fr.arbiter.noArbiterData)).toBeTruthy();
	});
});
