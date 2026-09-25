/**
 * Plain-collection helpers for transient computations.
 *
 * `svelte/prefer-svelte-reactivity` flags every built-in `Set` in `.svelte` and
 * `.svelte.ts` files, including one that is built and spread on the same line.
 * The fix it suggests, `SvelteSet`, pays for reactive bookkeeping a throwaway
 * de-duplication never uses, so the de-duplication lives here instead.
 */

/** The distinct values, in first-seen order. */
export function unique<T>(values: Iterable<T>): T[] {
	return [...new Set(values)];
}
