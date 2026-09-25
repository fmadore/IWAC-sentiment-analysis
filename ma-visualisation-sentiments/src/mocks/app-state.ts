/**
 * Mock for the `$app/state` SvelteKit module, used in the test environment.
 */
export const page = {
	url: new URL('http://localhost:5173'),
	params: {},
	route: { id: null },
	status: 200,
	error: null,
	data: {},
	state: {},
	form: null
};

export const navigating = { from: null, to: null, type: null, willUnload: null, delta: null };
export const updated = { current: false, check: async () => false };
