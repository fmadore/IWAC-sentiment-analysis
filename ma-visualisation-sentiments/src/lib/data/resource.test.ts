import { describe, expect, it, vi } from 'vitest';
import { ABSENT, createResource, type Loaded } from './resource.svelte';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const noFetch = (() => {
	throw new Error('the loader is stubbed');
}) as unknown as typeof fetch;

describe('createResource', () => {
	it('starts idle and becomes ready with the payload', async () => {
		const resource = createResource<string, number>(async () => 42);
		expect(resource.state('a')).toEqual({ status: 'idle' });
		await resource.ensure('a', noFetch);
		expect(resource.state('a')).toEqual({ status: 'ready', data: 42 });
		expect(resource.data('a')).toBe(42);
	});

	it('joins a load in flight instead of starting a second one', async () => {
		const gate = deferred<number>();
		const load = vi.fn(() => gate.promise);
		const resource = createResource<string, number>(load);
		const first = resource.ensure('a', noFetch);
		const second = resource.ensure('a', noFetch);
		expect(resource.state('a').status).toBe('loading');
		gate.resolve(1);
		await Promise.all([first, second]);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('keeps a legitimately unpublished payload apart from a failure, and caches it', async () => {
		const load = vi.fn(async (): Promise<Loaded<number>> => ABSENT);
		const resource = createResource<string, number>(load);
		await resource.ensure('a', noFetch);
		await resource.ensure('a', noFetch);
		await resource.retry('a', noFetch);
		expect(resource.state('a')).toEqual({ status: 'absent' });
		expect(resource.data('a')).toBeNull();
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('reports a failure, never retries it unasked, and recovers on retry', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		let fail = true;
		const load = vi.fn(async () => {
			if (fail) throw new Error('503');
			return 7;
		});
		const resource = createResource<string, number>(load);

		await resource.ensure('a', noFetch);
		const failed = resource.state('a');
		expect(failed.status).toBe('error');
		expect(failed.status === 'error' && failed.error.message).toBe('503');

		await resource.ensure('a', noFetch);
		expect(load).toHaveBeenCalledTimes(1);

		fail = false;
		await resource.retry('a', noFetch);
		expect(resource.state('a')).toEqual({ status: 'ready', data: 7 });
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('lets a late response land only on its own key', async () => {
		const gates = { a: deferred<string>(), b: deferred<string>() };
		const resource = createResource<'a' | 'b', string>((key) => gates[key].promise);
		const a = resource.ensure('a', noFetch);
		const b = resource.ensure('b', noFetch);
		gates.b.resolve('B');
		await b;
		expect(resource.data('a')).toBeNull();
		gates.a.resolve('A');
		await a;
		expect(resource.data('a')).toBe('A');
		expect(resource.data('b')).toBe('B');
	});

	it('turns a synchronous loader throw into an error state', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const resource = createResource<string, number>(() => {
			throw new Error('bad key');
		});
		await resource.ensure('a', noFetch);
		expect(resource.state('a').status).toBe('error');
	});
});
