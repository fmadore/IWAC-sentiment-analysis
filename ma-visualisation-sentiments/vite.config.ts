import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: [
			'@lucide/svelte/icons/x',
			'@lucide/svelte/icons/bar-chart-2',
			'@lucide/svelte/icons/trending-up',
			'@lucide/svelte/icons/minimize',
			'@lucide/svelte/icons/maximize',
			'@lucide/svelte/icons/table',
			'@lucide/svelte/icons/info'
		]
	}
});
