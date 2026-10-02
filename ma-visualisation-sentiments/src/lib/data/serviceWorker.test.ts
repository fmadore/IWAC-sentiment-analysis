// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const origin = 'https://example.org';
const base = '/sentiment-analysis';
const release = '1234567890abcdef12345678';
const dataPath = `${base}/data/releases/${release}/iwac_arbiter_evaluations_v2.json`;
const source = readFileSync(new URL('../../../static/sw.js', import.meta.url), 'utf8')
	.replaceAll('__BUILD_VERSION__', 'current')
	.replaceAll('__DATA_RELEASE__', release);

type WorkerEvent = {
	request?: Request;
	waitUntil: (promise: Promise<unknown>) => void;
	respondWith: (promise: Promise<Response>) => void;
};

/** Execute the shipped worker and its real event handlers with isolated caches. */
function worker(network: (request: Request | string) => Promise<Response>) {
	const stores = new Map<string, Map<string, Response>>();
	const key = (request: Request | string) =>
		new URL(typeof request === 'string' ? request : request.url, origin).href;
	const open = async (name: string) => {
		if (!stores.has(name)) stores.set(name, new Map());
		const entries = stores.get(name)!;
		return {
			match: async (request: Request | string) => entries.get(key(request))?.clone(),
			put: async (request: Request | string, response: Response) => {
				entries.set(key(request), response.clone());
			},
			keys: async () => [...entries.keys()].map((url) => new Request(url)),
			delete: async (request: Request | string) => entries.delete(key(request))
		};
	};
	const listeners = new Map<string, (event: WorkerEvent) => void>();
	const skipWaiting = vi.fn(async () => {});
	const claim = vi.fn(async () => {});
	const fetch = vi.fn(network);
	runInContext(
		source,
		createContext({
			URL,
			Response,
			console: { log: vi.fn() },
			fetch,
			caches: {
				open,
				keys: async () => [...stores.keys()],
				delete: async (name: string) => stores.delete(name)
			},
			self: {
				location: new URL(`${base}/sw.js`, origin),
				skipWaiting,
				clients: { claim },
				addEventListener: (name: string, listener: (event: WorkerEvent) => void) =>
					listeners.set(name, listener)
			}
		})
	);

	async function dispatch(name: string, request?: Request) {
		const pending: Promise<unknown>[] = [];
		let response: Promise<Response> | undefined;
		listeners.get(name)!({
			request,
			waitUntil: (promise) => pending.push(promise),
			respondWith: (promise) => (response = promise)
		});
		const result = await response;
		// Cache puts can be queued while respondWith resolves.
		await Promise.all(pending);
		return result;
	}
	return {
		stores,
		open,
		fetch,
		skipWaiting,
		claim,
		dispatch,
		request: async (path = dataPath) => (await dispatch('fetch', new Request(origin + path)))!
	};
}

describe('published service worker', () => {
	it.each([404, 429, 500, 503])(
		'preserves HTTP %i for an uncached release file',
		async (status) => {
			const app = worker(async () => new Response('upstream error', { status }));
			const response = await app.request();
			expect(response.status).toBe(status);
			expect(await response.text()).toBe('upstream error');
			expect(await (await app.open('iwac-data-v4')).keys()).toEqual([]);
		}
	);

	it('keeps offline misses retryable and caches a later successful response', async () => {
		const app = worker(async () => {
			throw new TypeError('Failed to fetch');
		});
		expect((await app.request()).status).toBe(503);
		app.fetch.mockResolvedValue(new Response('{"evaluations":[]}'));
		expect((await app.request()).status).toBe(200);
		app.fetch.mockRejectedValue(new TypeError('offline again'));
		expect(await (await app.request()).json()).toEqual({ evaluations: [] });
		expect(app.fetch).toHaveBeenCalledTimes(2);
	});

	it('preserves errors in the network-first path too', async () => {
		const app = worker(async () => new Response('down', { status: 503 }));
		expect((await app.request(`${base}/data/release.json`)).status).toBe(503);
		app.fetch.mockRejectedValue(new TypeError('offline'));
		expect((await app.request(`${base}/data/release.json`)).status).toBe(503);
	});

	it('does not substitute data from another cache or release', async () => {
		const app = worker(async () => {
			throw new TypeError('offline');
		});
		await (await app.open('other-dashboard')).put(dataPath, new Response('foreign'));
		await (
			await app.open('iwac-data-v4')
		).put(dataPath.replace(release, 'previous'), new Response('previous release'));
		expect((await app.request()).status).toBe(503);
	});

	it('installs its shell and base, then retires only its own superseded caches', async () => {
		const app = worker(async () => new Response('current'));
		await app.open('other-dashboard');
		await app.open('iwac-static-previous');
		await app.open('iwac-runtime-previous');
		await app.open('iwac-data-v3');
		const data = await app.open('iwac-data-v4');
		await data.put(dataPath.replace(release, 'previous'), new Response('old'));
		await data.put(`${base}/data/iwac_articles_base.json`, new Response('flat'));
		await app.dispatch('install');
		expect(app.skipWaiting).toHaveBeenCalledOnce();
		expect((await (await app.open('iwac-static-current')).match(`${base}/`))?.status).toBe(200);
		await app.dispatch('activate');
		expect(app.claim).toHaveBeenCalledOnce();
		expect([...app.stores.keys()].sort()).toEqual([
			'iwac-data-v4',
			'iwac-static-current',
			'other-dashboard'
		]);
		expect((await data.keys()).map((request) => new URL(request.url).pathname)).toEqual([
			`${base}/data/releases/${release}/iwac_articles_base.json`
		]);
	});
});
