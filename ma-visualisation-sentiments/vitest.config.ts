import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

/**
 * Test files that need a DOM. Everything else runs in plain Node.
 *
 * Most suites test pure functions, and building a jsdom window for each of
 * them was 60% of the run's tracked time. The DOM is opted into by location
 * instead: components render, and stores and the URL layer touch `window`,
 * `localStorage` or `history`. A single file elsewhere that needs one can ask
 * for it with a `// @vitest-environment jsdom` docblock on its first line; a
 * file that forgets fails loudly with "document is not defined", never
 * silently.
 */
const DOM_TESTS = [
	'src/lib/components/**/*.{test,spec}.{js,ts}',
	'src/lib/stores/**/*.{test,spec}.{js,ts}',
	'src/lib/data/resource.test.ts',
	'src/lib/i18n/**/*.{test,spec}.{js,ts}',
	'src/lib/utils/safeStorage.test.ts',
	'src/lib/utils/csv.test.ts',
	'src/routes/**/*.{test,spec}.{js,ts}'
];

export default defineConfig({
	// `hot` is no longer a valid plugin option and printed a warning on every
	// run; HMR is off under Vitest regardless.
	plugins: [svelte()],
	test: {
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		projects: [
			{
				extends: true,
				test: {
					name: 'node',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: DOM_TESTS
				}
			},
			{
				extends: true,
				test: {
					name: 'dom',
					environment: 'jsdom',
					include: DOM_TESTS
				}
			}
		]
	},
	resolve: {
		// Svelte 5 ships separate client and server entry points. Without the
		// browser condition, `render()` from @testing-library/svelte resolves the
		// server build and fails with "mount(...) is not available on the server",
		// so no component can be tested at all. It applies to both projects: a
		// pure module that imports `svelte` must resolve the same build either way.
		conditions: ['browser'],
		// `#lib` needs no alias: it is a package.json subpath import, which Vite
		// resolves natively.
		alias: {
			'$app/paths': resolve('./src/mocks/app-paths.ts'),
			'$app/env': resolve('./src/mocks/app-env.ts'),
			'$app/navigation': resolve('./src/mocks/app-navigation.ts'),
			'$app/state': resolve('./src/mocks/app-state.ts')
		}
	}
});
