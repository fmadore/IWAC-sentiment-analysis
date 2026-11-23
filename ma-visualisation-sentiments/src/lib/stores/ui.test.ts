import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uiState } from './ui.svelte';

describe('uiState.showView', () => {
	let scrollTo: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		uiState.activeView = 'charts';
		scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
	});

	afterEach(() => {
		scrollTo.mockRestore();
	});

	it('switches the view and starts the new one at the top, without animating', () => {
		uiState.showView('table');
		expect(uiState.activeView).toBe('table');
		expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, left: 0, behavior: 'instant' });
	});

	it('leaves the page where it is when the view does not change', () => {
		uiState.showView('charts');
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it('leaves scrolling to the browser when a history entry sets the view', () => {
		uiState.activeView = 'map';
		expect(scrollTo).not.toHaveBeenCalled();
	});
});
