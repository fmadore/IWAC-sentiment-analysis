/**
 * Service-worker controller-change bookkeeping.
 *
 * `controllerchange` fires for two situations that need opposite responses, and
 * the event carries nothing that distinguishes them — by the time it fires,
 * `navigator.serviceWorker.controller` is the new worker either way. The only
 * way to tell them apart is to remember whether this page was already
 * controlled.
 *
 *   • FIRST CLAIM — the page had no controller, the first-ever worker installed
 *     and called clients.claim(). The page is already running the assets it
 *     just downloaded; reloading achieves nothing and aborts every request in
 *     flight. (This is what made the extremes view's 5MB fetch fail on a first
 *     visit: the reload landed mid-download.)
 *
 *   • UPDATE — a worker that was already controlling this page got replaced.
 *     The page is running superseded assets, so it must reload.
 *
 * Extracted from PWAManager and kept pure so both branches are unit-tested:
 * a first attempt at this fix captured the flag once at registration time,
 * which correctly skipped the first claim but then also skipped every genuine
 * update for the rest of the session.
 */
export interface ControllerChangeTracker {
	/** Call on each `controllerchange`; true means the page should reload. */
	onControllerChange(): boolean;
}

export function createControllerChangeTracker(
	initiallyControlled: boolean
): ControllerChangeTracker {
	let hasController = initiallyControlled;
	let reloading = false;

	return {
		onControllerChange(): boolean {
			if (!hasController) {
				// First claim: adopt the worker, don't reload.
				hasController = true;
				return false;
			}

			// Guard against a reload loop if the event fires again while the
			// browser is already tearing the page down.
			if (reloading) return false;

			reloading = true;
			return true;
		}
	};
}
