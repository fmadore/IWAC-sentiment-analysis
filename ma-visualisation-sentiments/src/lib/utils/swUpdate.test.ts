import { describe, it, expect } from 'vitest';
import { createControllerChangeTracker } from './swUpdate';

describe('createControllerChangeTracker', () => {
	describe('first visit (page starts uncontrolled)', () => {
		it('does not reload when the first worker claims the page', () => {
			// The page is already running the assets it just downloaded. Reloading
			// here is what aborted the extremes view's 5MB fetch.
			const tracker = createControllerChangeTracker(false);
			expect(tracker.onControllerChange()).toBe(false);
		});

		it('DOES reload on a later update in the same session', () => {
			// The bug in the first attempt at this fix: the flag was captured once,
			// so after skipping the first claim it skipped every real update too.
			const tracker = createControllerChangeTracker(false);

			expect(tracker.onControllerChange()).toBe(false); // first claim
			expect(tracker.onControllerChange()).toBe(true); // genuine update
		});
	});

	describe('return visit (page starts controlled)', () => {
		it('reloads on the first update', () => {
			const tracker = createControllerChangeTracker(true);
			expect(tracker.onControllerChange()).toBe(true);
		});
	});

	describe('reload loop guard', () => {
		it('only ever asks to reload once', () => {
			const tracker = createControllerChangeTracker(true);

			expect(tracker.onControllerChange()).toBe(true);
			expect(tracker.onControllerChange()).toBe(false);
			expect(tracker.onControllerChange()).toBe(false);
		});

		it('guards the first-visit path too', () => {
			const tracker = createControllerChangeTracker(false);

			expect(tracker.onControllerChange()).toBe(false); // first claim
			expect(tracker.onControllerChange()).toBe(true); // update
			expect(tracker.onControllerChange()).toBe(false); // already reloading
		});
	});

	it('keeps trackers independent', () => {
		const first = createControllerChangeTracker(false);
		const second = createControllerChangeTracker(true);

		expect(first.onControllerChange()).toBe(false);
		expect(second.onControllerChange()).toBe(true);
	});
});
