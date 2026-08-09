import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.PLAYWRIGHT_PORT ?? '4317';
const previewOrigin = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `${previewOrigin}/sentiment-analysis/`,
		trace: 'on-first-retry',
		serviceWorkers: 'block'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
		url: `${previewOrigin}/sentiment-analysis/`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
