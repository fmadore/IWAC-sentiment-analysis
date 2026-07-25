import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
	// `hot` is no longer a valid plugin option and printed a warning on every
	// run; HMR is off under Vitest regardless.
	plugins: [svelte()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts']
	},
	resolve: {
		// Svelte 5 ships separate client and server entry points. Without the
		// browser condition, `render()` from @testing-library/svelte resolves the
		// server build and fails with "mount(...) is not available on the server",
		// so no component can be tested at all.
		conditions: ['browser'],
		alias: {
			$lib: resolve('./src/lib'),
			'$app/paths': resolve('./src/mocks/app-paths.ts'),
			'$app/environment': resolve('./src/mocks/app-environment.ts'),
			'$app/navigation': resolve('./src/mocks/app-navigation.ts'),
			'$app/stores': resolve('./src/mocks/app-stores.ts')
		}
	}
});
