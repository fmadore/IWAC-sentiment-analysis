import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { DEPLOY_PATH } from './deploy.config.js';

// Production nests the app inside the deploy path so the built tree mirrors the
// URLs it serves (see deploy.config.js). Dev keeps the plain `build/` root and an
// empty base — `vite dev` serves from memory at `/`, and nesting there would only
// make local paths diverge from the ones components compute from `base`.
const isProduction = process.env.NODE_ENV === 'production';
const outDir = isProduction ? `build${DEPLOY_PATH}` : 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	compilerOptions: {
		runes: true
	},

	kit: {
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
		paths: {
			base: isProduction ? DEPLOY_PATH : ''
		},
		alias: {
			$lib: 'src/lib',
			'$lib/*': 'src/lib/*'
		}
	}
};

export default config;
