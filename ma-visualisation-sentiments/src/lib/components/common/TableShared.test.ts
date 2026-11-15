/**
 * The leaf components every article table shares: the control set, the page
 * bar's accessible names, the row/card detail button, the confidence badge
 * and the stat card's tooltip. Rendered in French, the default language.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { currentLanguage } from '#lib/i18n/index.js';
import { fr } from '#lib/i18n/fr.js';
import { en } from '#lib/i18n/en.js';
import type { PaginationState } from '#lib/utils/pagination.svelte.js';
import TableControls from './TableControls.svelte';
import PaginationControls from './PaginationControls.svelte';
import RowDetailButton from './RowDetailButton.svelte';
import ArticleCard from './ArticleCard.svelte';
import ConfidenceBadge from './ConfidenceBadge.svelte';
import StatCard from './StatCard.svelte';

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
});

function pagination(overrides: Partial<PaginationState> = {}): PaginationState {
	return {
		currentPage: 2,
		itemsPerPage: 25,
		itemsPerPageOptions: [10, 25, 50],
		totalPages: 4,
		startIndex: 25,
		endIndex: 50,
		visiblePages: [1, 2, 3, 4],
		goToPage: vi.fn(),
		previousPage: vi.fn(),
		nextPage: vi.fn(),
		changeItemsPerPage: vi.fn(),
		...overrides
	};
}

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe('TableControls', () => {
	it('exposes the layout toggle as pressed-state buttons and can disable the table option', async () => {
		const onLayoutChange = vi.fn();
		render(TableControls, {
			props: {
				pagination: pagination(),
				total: 90,
				selectId: 'test-items',
				layout: 'cards',
				onLayoutChange,
				tableDisabled: true
			}
		});
		const group = screen.getByRole('group', { name: fr.table.layout });
		const table = screen.getByRole('button', { name: fr.common.tableView });
		const cards = screen.getByRole('button', { name: fr.common.cardView });
		expect(group.contains(table)).toBe(true);
		expect(table.getAttribute('aria-pressed')).toBe('false');
		expect((table as HTMLButtonElement).disabled).toBe(true);
		expect(cards.getAttribute('aria-pressed')).toBe('true');
		await fireEvent.click(cards);
		expect(onLayoutChange).toHaveBeenCalledWith('cards');
	});

	it('labels its own items-per-page select under the id it is given', () => {
		render(TableControls, {
			props: { pagination: pagination(), total: 90, selectId: 'unique-select' }
		});
		const select = screen.getByLabelText(new RegExp(fr.table.itemsPerPage));
		expect(select.getAttribute('id')).toBe('unique-select');
		expect(screen.queryByRole('group')).toBeNull();
	});
});

describe('PaginationControls', () => {
	it('names the arrow buttons in words, in the reader’s language', () => {
		currentLanguage.set('en');
		render(PaginationControls, { props: { pagination: pagination(), showLabels: false } });
		expect(screen.getByRole('navigation', { name: en.table.pagination })).toBeTruthy();
		expect(screen.getByRole('button', { name: en.table.previousPage })).toBeTruthy();
		expect(screen.getByRole('button', { name: en.table.nextPage })).toBeTruthy();
	});

	it('writes the page status from the catalogue, not a French literal', () => {
		currentLanguage.set('en');
		render(PaginationControls, {
			props: { pagination: pagination(), showPageNumbers: false }
		});
		expect(screen.getByText('Page 2 of 4')).toBeTruthy();
	});
});

describe('RowDetailButton and ArticleCard', () => {
	it('is a real button with the full title as its name', async () => {
		const onclick = vi.fn();
		render(RowDetailButton, {
			props: { label: 'Voir les détails : Église', onclick, children: text('Église') }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Voir les détails : Église' }));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('gives the card no role of its own and opens once from its title button', async () => {
		const onselect = vi.fn();
		const { container } = render(ArticleCard, {
			props: { title: 'Titre', label: 'Ouvrir Titre', meta: 'Journal • 1998', onselect }
		});
		const card = container.querySelector('li.article-card');
		expect(card?.hasAttribute('role')).toBe(false);
		expect(card?.hasAttribute('tabindex')).toBe(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Titre' }));
		expect(onselect).toHaveBeenCalledTimes(1);
	});
});

describe('ConfidenceBadge', () => {
	it('translates the three levels', () => {
		render(ConfidenceBadge, { props: { level: 'high' } });
		expect(screen.getByText(fr.arbiter.confidenceHigh)).toBeTruthy();
	});

	it('shows an unknown level as stored, never as “low”', () => {
		render(ConfidenceBadge, { props: { level: 'certain' } });
		expect(screen.getByText('certain')).toBeTruthy();
		expect(screen.queryByText(fr.arbiter.confidenceLow)).toBeNull();
	});
});

describe('StatCard', () => {
	it('puts its explanation behind the shared InfoTooltip button', () => {
		render(StatCard, {
			props: { label: 'Articles', value: '12', tooltip: 'Une explication.' }
		});
		const trigger = screen.getByRole('button', { name: 'Articles: Une explication.' });
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(screen.getByText('Une explication.')).toBeTruthy();
	});

	it('renders a second note line', () => {
		render(StatCard, { props: { label: 'A', value: 1, detail: 'détail', note: 'note' } });
		expect(screen.getByText('détail')).toBeTruthy();
		expect(screen.getByText('note')).toBeTruthy();
	});
});
