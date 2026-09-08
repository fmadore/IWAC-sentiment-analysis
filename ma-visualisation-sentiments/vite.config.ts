import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { dataRelease } from './scripts/data-release.mjs';

export default defineConfig(({ command }) => {
	const release = command === 'build' ? dataRelease() : '';
	return {
		define: { __IWAC_DATA_RELEASE__: JSON.stringify(release) },
		plugins: [
			tailwindcss(),
			sveltekit(),
			{
				name: 'data-release-identity',
				generateBundle() {
					this.emitFile({
						type: 'asset',
						fileName: 'data-build.json',
						source: JSON.stringify({ release })
					});
				}
			}
		],
		build: {
			// Enforced more precisely by scripts/check-build-artifact.mjs.
			chunkSizeWarningLimit: 800
		},
		optimizeDeps: {
			exclude: [
				'@lucide/svelte/icons/x',
				'@lucide/svelte/icons/bar-chart-2',
				'@lucide/svelte/icons/trending-up',
				'@lucide/svelte/icons/minimize',
				'@lucide/svelte/icons/maximize',
				'@lucide/svelte/icons/table',
				'@lucide/svelte/icons/info',
				'@lucide/svelte/icons/scatter-chart',
				'@lucide/svelte/icons/area-chart',
				'@lucide/svelte/icons/activity',
				'@lucide/svelte/icons/menu'
			]
		}
	};
});
