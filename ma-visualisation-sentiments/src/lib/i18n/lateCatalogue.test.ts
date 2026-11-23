/**
 * The English catalogue is fetched on demand, and `currentLanguage` switches
 * before it lands. A label reader that subscribed to the language alone ran once
 * against the French fallback and never again, so after the first switch to
 * English the sentiment labels stayed French (#215).
 *
 * The test setup loads the English catalogue up front, which hides exactly this,
 * so each test here starts from a fresh module graph in which `./en.js` resolves
 * only when the test releases it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let releaseCatalogue: () => void;

beforeEach(() => {
	vi.resetModules();
	const gate = new Promise<void>((resolve) => (releaseCatalogue = resolve));
	vi.doMock('./en.js', async (importOriginal) => {
		const actual = await importOriginal<typeof import('./en.js')>();
		await gate;
		return actual;
	});
});

afterEach(() => {
	vi.doUnmock('./en.js');
	vi.resetModules();
});

/** The latest value a store has pushed to a live subscriber, as a component sees it. */
function follow<T>(store: { subscribe: (run: (value: T) => void) => () => void }) {
	let latest!: T;
	const unsubscribe = store.subscribe((value) => (latest = value));
	return { read: () => latest, unsubscribe };
}

describe('label stores when the catalogue lands after the language switch', () => {
	it('show the French fallback while loading, then English once it arrives', async () => {
		const { derived } = await import('svelte/store');
		const i18n = await import('./index');
		const utils = await import('./utils');

		// Each reader computes its label once per emission, as a component's
		// `$derived` does; reading the function lazily would hide the bug.
		const polarity = follow(derived(utils.sentimentLabel, (label) => label('Très positif')));
		const centrality = follow(derived(utils.sentimentLabel, (label) => label('Non abordé')));
		const subjectivity = follow(derived(utils.subjectivityLabel, (label) => label(null)));
		const scale = follow(derived(utils.scaleLabels, (labels) => labels('polarity')[0]));
		const noDate = follow(derived(utils.fmtDate, (format) => format(null)));
		const date = follow(derived(utils.fmtDate, (format) => format('2011-10-19')));

		i18n.currentLanguage.set('en');
		// The catalogue is still in flight: the French fallback, as the issue saw.
		expect(polarity.read()).toBe('Très positif');

		releaseCatalogue();
		await i18n.loadCatalogue('en');

		expect(polarity.read()).toBe('Very positive');
		expect(centrality.read()).toBe('Not addressed');
		expect(subjectivity.read()).toBe('Not annotated');
		expect(scale.read()).toBe('Very positive');
		expect(noDate.read()).toBe('No data available');
		expect(date.read()).toBe('19 October 2011');

		for (const reader of [polarity, centrality, subjectivity, scale, noDate, date]) {
			reader.unsubscribe();
		}
	});

	it('updates a mounted SentimentBadge when the catalogue arrives', async () => {
		const { render, cleanup } = await import('@testing-library/svelte');
		const { flushSync } = await import('svelte');
		const i18n = await import('./index');
		const { default: SentimentBadge } =
			await import('#lib/components/common/SentimentBadge.svelte');

		try {
			const { container } = render(SentimentBadge, {
				props: { type: 'polarity', value: 'Très positif' }
			});
			i18n.currentLanguage.set('en');
			flushSync();
			expect(container.textContent?.trim()).toBe('Très positif');

			releaseCatalogue();
			await i18n.loadCatalogue('en');
			flushSync();
			expect(container.textContent?.trim()).toBe('Very positive');
		} finally {
			cleanup();
		}
	});
});
