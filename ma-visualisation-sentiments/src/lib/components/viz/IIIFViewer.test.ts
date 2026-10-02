import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import IIIFViewer from './IIIFViewer.svelte';
import { viewOptionsState } from '$lib/stores/view-options.svelte';
import { currentLanguage } from '$lib/i18n';

const { openSeadragon } = vi.hoisted(() => ({ openSeadragon: vi.fn() }));
vi.mock('openseadragon', () => ({ default: openSeadragon }));

const manifestA = 'https://example.org/a/manifest';
const manifestB = 'https://example.org/b/manifest';

function manifest(...ids: string[]) {
	return {
		items: ids.map((id) => ({ items: [{ items: [{ body: { service: [{ id }] } }] }] }))
	};
}

function response(body: unknown) {
	return { ok: true, json: async () => body } as Response;
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => (resolve = done));
	return { promise, resolve };
}

function mockViewer() {
	return { destroy: vi.fn(), open: vi.fn(), viewport: { goHome: vi.fn() } };
}

beforeEach(() => {
	viewOptionsState.scanPage = 1;
	currentLanguage.set('en');
	openSeadragon.mockReset().mockImplementation(mockViewer);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	viewOptionsState.scanPage = 1;
});

describe('IIIF manifest lifecycle', () => {
	it('replaces the scans and destroys the old viewer when the manifest prop changes', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(response(manifest('https://example.org/a/1')))
			.mockResolvedValueOnce(response(manifest('https://example.org/b/1')));
		vi.stubGlobal('fetch', fetchMock);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledTimes(1));
		const firstViewer = openSeadragon.mock.results[0].value;

		await component.rerender({ manifestUrl: manifestB });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledTimes(2));
		expect(firstViewer.destroy).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
		expect(fetchMock.mock.calls[1][0]).toBe(manifestB);
		expect(openSeadragon.mock.calls[1][0].tileSources).toBe('https://example.org/b/1/info.json');
		expect(openSeadragon.mock.calls[1][0].element.isConnected).toBe(true);

		component.unmount();
		expect(openSeadragon.mock.results[1].value.destroy).toHaveBeenCalledTimes(1);
	});

	it('ignores an earlier manifest body that finishes after its replacement', async () => {
		const oldBody = deferred<unknown>();
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce({ ok: true, json: () => oldBody.promise })
				.mockResolvedValueOnce(response(manifest('https://example.org/b/1')))
		);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await vi.dynamicImportSettled();
		await component.rerender({ manifestUrl: manifestB });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledTimes(1));
		oldBody.resolve(manifest('https://example.org/a/1'));
		await oldBody.promise;
		await tick();
		expect(openSeadragon).toHaveBeenCalledTimes(1);
		expect(openSeadragon.mock.calls[0][0].tileSources).toBe('https://example.org/b/1/info.json');
	});

	it('aborts pending requests and never creates a viewer after unmount', async () => {
		const pending = deferred<Response>();
		const fetchMock = vi.fn().mockReturnValue(pending.promise);
		vi.stubGlobal('fetch', fetchMock);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
		component.unmount();
		expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);

		pending.resolve(response(manifest('https://example.org/a/1')));
		await pending.promise;
		await tick();
		expect(openSeadragon).not.toHaveBeenCalled();
	});

	it.each(['error', 'empty'])('clears the previous %s state on a new manifest', async (state) => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					state === 'error' ? { ok: false, status: 503 } : response(manifest())
				)
				.mockResolvedValueOnce(response(manifest('https://example.org/b/1')))
		);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await waitFor(() => {
			if (state === 'error') expect(component.getByText('HTTP 503')).toBeTruthy();
			else expect(component.container.querySelector('.iiif-viewer-wrapper')).toBeNull();
		});
		await component.rerender({ manifestUrl: manifestB });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledOnce());
		expect(component.queryByText('HTTP 503')).toBeNull();
		expect(component.container.querySelector('.osd-container')).not.toBeNull();
	});

	it('restores the shared scan page, supports navigation and clamps it for a shorter article', async () => {
		viewOptionsState.scanPage = 2;
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockResolvedValueOnce(
					response(manifest('https://example.org/a/1', 'https://example.org/a/2'))
				)
				.mockResolvedValueOnce(response(manifest('https://example.org/b/1')))
		);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledOnce());
		expect(openSeadragon.mock.calls[0][0].tileSources).toBe('https://example.org/a/2/info.json');
		expect(component.getByText('2 / 2')).toBeTruthy();
		await fireEvent.click(component.getByRole('button', { name: 'Previous' }));
		expect(viewOptionsState.scanPage).toBe(1);
		expect(openSeadragon.mock.results[0].value.open).toHaveBeenLastCalledWith(
			'https://example.org/a/1/info.json'
		);

		viewOptionsState.scanPage = 9;
		await component.rerender({ manifestUrl: manifestB });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledTimes(2));
		expect(openSeadragon.mock.calls[1][0].tileSources).toBe('https://example.org/b/1/info.json');
	});

	it('cancels an expansion resize when its viewer is disposed', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(response(manifest('https://example.org/a/1')))
		);
		let resize!: FrameRequestCallback;
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((callback: FrameRequestCallback) => {
				resize = callback;
				return 42;
			})
		);
		const cancelFrame = vi.fn();
		vi.stubGlobal('cancelAnimationFrame', cancelFrame);
		const component = render(IIIFViewer, { manifestUrl: manifestA });
		await waitFor(() => expect(openSeadragon).toHaveBeenCalledOnce());
		await fireEvent.click(component.getByRole('button'));
		component.unmount();
		expect(cancelFrame).toHaveBeenCalledWith(42);
		resize(0);
		expect(openSeadragon.mock.results[0].value.viewport.goHome).not.toHaveBeenCalled();
	});
});
