import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import JournalFilter from './JournalFilter.svelte';

const state = vi.hoisted(() => ({
	articleState: { journals: Array.from({ length: 16 }, (_, index) => `Le Journal ${index + 1}`) },
	filterState: { journals: [] as string[] }
}));
vi.mock('$lib/stores', () => state);
afterEach(cleanup);

it('makes all matching journals selectable while searching a collapsed filter', async () => {
	const { container, getByRole } = render(JournalFilter);
	expect(container.querySelectorAll('.filter-chip')).toHaveLength(8);
	await fireEvent.input(getByRole('textbox'), { target: { value: 'le' } });
	expect(container.querySelectorAll('.filter-chip')).toHaveLength(16);
	await fireEvent.click(getByRole('button', { name: 'Le Journal 16' }));
	expect(state.filterState.journals).toEqual(['Le Journal 16']);
	await fireEvent.input(getByRole('textbox'), { target: { value: '' } });
	expect(container.querySelectorAll('.filter-chip')).toHaveLength(8);
});
