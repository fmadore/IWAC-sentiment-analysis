import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.ts']
    },
    resolve: {
        alias: {
            $lib: resolve('./src/lib'),
            '$app/paths': resolve('./src/mocks/app-paths.ts'),
            '$app/environment': resolve('./src/mocks/app-environment.ts'),
            '$app/navigation': resolve('./src/mocks/app-navigation.ts'),
            '$app/stores': resolve('./src/mocks/app-stores.ts')
        }
    }
});
