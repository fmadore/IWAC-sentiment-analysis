import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		// Add gzip compression for static assets
		compression({
			algorithm: 'gzip',
			ext: '.gz',
			threshold: 1024, // Only compress files larger than 1KB
			compressionOptions: {
				level: 9 // Maximum compression
			},
			filter: /\.(js|mjs|json|css|html|svg)$/i, // Include JSON files
			verbose: true
		}),
		// Add brotli compression for even better compression
		compression({
			algorithm: 'brotliCompress',
			ext: '.br',
			threshold: 1024,
			compressionOptions: {
				level: 11 // Maximum brotli compression
			},
			filter: /\.(js|mjs|json|css|html|svg)$/i,
			verbose: true
		})
	],
	build: {
		// The main chunk is large due to ECharts and visualization components.
		// Gzipped size (~253 kB) is acceptable; Brotli reduces it further to ~200 kB.
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
});
