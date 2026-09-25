/**
 * A keyed, deduplicated, retryable data resource.
 *
 * The optional payloads — extreme analysis per model, the map, both arbiters —
 * each used to hand-roll their own load/dedup/cache, and each got the failure
 * cases slightly wrong in its own way: a failed extremes load stored `null`,
 * which also meant "not loaded yet", so the view spun forever; the arbiters
 * cached a transient 5xx as "never published" for the whole session and showed
 * a schema-invalid file as the same empty state as a missing one.
 *
 * One state machine per key keeps those cases apart:
 *
 *   idle → loading → ready    the payload arrived and validated
 *                  → absent   a 404: legitimately not published (cached)
 *                  → error    anything else, invalid data included
 *
 * `ensure` is what view-level orchestration calls, as often as it likes: it
 * starts a load only from `idle`, joins one in flight, and deliberately does
 * **not** retry an `error` — an unsolicited retry would silently replace the
 * error a reader is looking at. `retry` is the explicit action behind a Retry
 * button.
 *
 * The in-flight map is a plain `Map`: it is never rendered, and `ensure` runs
 * inside effects, where reading a reactive collection would make the effect
 * depend on the very writes it triggers. Status checks read through `untrack`
 * for the same reason; only the rendered state lives in a `SvelteMap`.
 */

import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export type ResourceState<T> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'ready'; data: T }
	| { status: 'absent' }
	| { status: 'error'; error: Error };

/** Returned by a loader for a payload that is legitimately not published. */
export const ABSENT: unique symbol = Symbol('absent');
export type Loaded<T> = T | typeof ABSENT;

export interface Resource<K, T> {
	/** Reactive state for one key; `idle` before anything was requested. */
	state(key: K): ResourceState<T>;
	/** The payload when ready, otherwise null. Reactive. */
	data(key: K): T | null;
	/** Load unless ready, absent, loading or failed. Safe to call repeatedly. */
	ensure(key: K, fetchFunction?: typeof fetch): Promise<void>;
	/** Load again after a failure (or for the first time). */
	retry(key: K, fetchFunction?: typeof fetch): Promise<void>;
}

const IDLE = Object.freeze({ status: 'idle' }) as ResourceState<never>;

export function createResource<K, T>(
	load: (key: K, fetchFunction: typeof fetch) => Promise<Loaded<T>>
): Resource<K, T> {
	const states = new SvelteMap<K, ResourceState<T>>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- internal plumbing read inside effects
	const inFlight = new Map<K, Promise<void>>();

	const statusOf = (key: K) => untrack(() => states.get(key)?.status ?? 'idle');

	function start(key: K, fetchFunction: typeof fetch): Promise<void> {
		const existing = inFlight.get(key);
		if (existing) return existing;

		states.set(key, { status: 'loading' });
		const run = Promise.resolve()
			.then(() => load(key, fetchFunction))
			.then(
				(result) => {
					states.set(
						key,
						result === ABSENT ? { status: 'absent' } : { status: 'ready', data: result }
					);
				},
				(error: unknown) => {
					const normalized = error instanceof Error ? error : new Error(String(error));
					console.error('Failed to load data:', normalized);
					states.set(key, { status: 'error', error: normalized });
				}
			)
			.finally(() => inFlight.delete(key));
		inFlight.set(key, run);
		return run;
	}

	return {
		state: (key) => states.get(key) ?? IDLE,
		data(key) {
			const state = states.get(key);
			return state?.status === 'ready' ? state.data : null;
		},
		ensure(key, fetchFunction = fetch) {
			const status = statusOf(key);
			if (status === 'idle' || status === 'loading') return start(key, fetchFunction);
			return Promise.resolve();
		},
		retry(key, fetchFunction = fetch) {
			const status = statusOf(key);
			if (status === 'ready' || status === 'absent') return Promise.resolve();
			return start(key, fetchFunction);
		}
	};
}
