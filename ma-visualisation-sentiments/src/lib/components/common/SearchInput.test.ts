/**
 * Escape that clears the text is spent: it must not also reach a window
 * listener (the filter drawer closes on Escape). Escape on an empty input
 * still propagates, so a second press closes whatever contains it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import SearchInput from './SearchInput.svelte';
import { currentLanguage } from '#lib/i18n/index.js';

let windowListener: ((event: KeyboardEvent) => void) | undefined;

afterEach(() => {
	cleanup();
	if (windowListener) window.removeEventListener('keydown', windowListener);
	windowListener = undefined;
	currentLanguage.set('fr');
});

function setup(value: string) {
	currentLanguage.set('en');
	const onclear = vi.fn();
	const onchange = vi.fn();
	const reachedWindow = vi.fn();
	windowListener = (event) => {
		if (event.key === 'Escape') reachedWindow();
	};
	window.addEventListener('keydown', windowListener);
	const result = render(SearchInput, { props: { value, onclear, onchange, placeholder: 'Find' } });
	const input = result.getByRole('textbox', { name: 'Find' }) as HTMLInputElement;
	return { input, onclear, onchange, reachedWindow };
}

describe('SearchInput Escape', () => {
	it('clears a non-empty input and stops Escape reaching the window', async () => {
		const { input, onclear, onchange, reachedWindow } = setup('dakar');
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(onclear).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith('');
		expect(input.value).toBe('');
		expect(reachedWindow).not.toHaveBeenCalled();
	});

	it('lets Escape through on an empty input', async () => {
		const { input, onclear, reachedWindow } = setup('');
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(onclear).not.toHaveBeenCalled();
		expect(reachedWindow).toHaveBeenCalledOnce();
	});

	it('lets a second Escape through once the first has cleared the text', async () => {
		const { input, reachedWindow } = setup('dakar');
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(reachedWindow).not.toHaveBeenCalled();
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(reachedWindow).toHaveBeenCalledOnce();
	});

	it('does not swallow other keys', async () => {
		const { input } = setup('dakar');
		const reached = vi.fn();
		const listener = () => reached();
		window.addEventListener('keydown', listener);
		await fireEvent.keyDown(input, { key: 'Enter' });
		window.removeEventListener('keydown', listener);
		expect(reached).toHaveBeenCalledOnce();
	});
});
