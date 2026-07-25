/**
 * Vitest Test Setup
 * Global setup for all tests
 */
import '@testing-library/svelte/vitest';

/**
 * jsdom implements neither `matchMedia` nor `ResizeObserver`.
 *
 * Every chart component reads `innerWidth` from `svelte/reactivity/window` for
 * its responsive branch, and that module touches `matchMedia` on construction
 * — so without this stub, importing any chart throws before a single
 * assertion runs. `ResizeObserver` is the same story for anything that
 * measures itself.
 *
 * Both are deliberately inert: component tests here cover structure and
 * behaviour, not layout, and a stub that reports a fixed desktop viewport is
 * more predictable than one that pretends to respond.
 */
if (typeof window !== 'undefined') {
	if (!window.matchMedia) {
		window.matchMedia = ((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false
		})) as unknown as typeof window.matchMedia;
	}

	if (!window.ResizeObserver) {
		window.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		} as unknown as typeof window.ResizeObserver;
	}
}
