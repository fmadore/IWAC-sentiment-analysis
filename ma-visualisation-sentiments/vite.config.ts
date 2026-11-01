import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { DEPLOY_PATH } from './deploy.config.js';
import { dataRelease } from './scripts/data-release.mjs';

// Production nests the app inside the deploy path so the built tree mirrors the
// URLs it serves (see deploy.config.js). Dev keeps the plain `build/` root and an
// empty base — `vite dev` serves from memory at `/`, and nesting there would only
// make local paths diverge from the ones `asset()` and `resolve()` compute.
const isProduction = process.env.NODE_ENV === 'production';
const outDir = isProduction ? `build${DEPLOY_PATH}` : 'build';

export default defineConfig(({ command }) => {
	const release = command === 'build' ? dataRelease() : '';
	return {
		define: { __IWAC_DATA_RELEASE__: JSON.stringify(release) },
		plugins: [
			tailwindcss(),
			sveltekit({
				preprocess: vitePreprocess(),
				compilerOptions: { runes: true },
				adapter: adapter({
					pages: outDir,
					assets: outDir,
					// Don't generate fallback - we use a custom 404.html in static/ for GitHub Pages SPA routing
					fallback: undefined,
					// GitHub Pages/Fastly compresses responses at the edge and does not
					// negotiate sibling .gz/.br files from the artifact.
					precompress: false,
					strict: true
				}),
				paths: { base: isProduction ? DEPLOY_PATH : '' }
			}),
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
