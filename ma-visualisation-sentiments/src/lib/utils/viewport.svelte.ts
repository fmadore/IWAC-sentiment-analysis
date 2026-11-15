import { innerWidth } from 'svelte/reactivity/window';

/**
 * The app's breakpoints, in JavaScript. `tokens.css` removes Tailwind's `md`
 * and `2xl`, leaving 640 / 1024 / 1280; components used to test `< 768` in
 * script, a fourth threshold the stylesheet does not have, so tables and
 * charts changed layout at widths no CSS rule agreed with.
 *
 * Read these inside a `$derived` or a template: they are reactive through
 * `svelte/reactivity/window`. The server and the first paint have no width,
 * so every helper falls back to the desktop answer.
 */
export const BREAKPOINT_SM = 640;
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

const DESKTOP_FALLBACK = BREAKPOINT_LG;

function width(): number {
	return innerWidth.current ?? DESKTOP_FALLBACK;
}

/** Phone layout: below the 640px breakpoint. */
export function isCompact(): boolean {
	return width() < BREAKPOINT_SM;
}

/** Below the 1024px breakpoint, where the rails become drawers. */
export function isBelowLarge(): boolean {
	return width() < BREAKPOINT_LG;
}

/**
 * Compact chart layout, asked of the chart's own container rather than the
 * window. Charts sit beside a 20rem filter rail and a sidebar, so at a 1024px
 * window the plot is ~580px wide: the viewport over-reports it. Bind the
 * chart's wrapper with `bind:clientWidth` and pass the value here.
 *
 * Before the first measurement (server render, first paint, jsdom, where
 * `clientWidth` reads 0) it falls back to the viewport answer, which itself
 * falls back to desktop.
 */
export function isCompactWidth(containerWidth: number | undefined | null): boolean {
	if (!containerWidth) return isCompact();
	return containerWidth < BREAKPOINT_SM;
}
