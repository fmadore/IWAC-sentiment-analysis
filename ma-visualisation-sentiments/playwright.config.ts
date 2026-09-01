import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.PLAYWRIGHT_PORT ?? '4317';
const previewOrigin = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	// Pinned rather than left to default locally, so a local run matches CI. The
	// default is half the machine's cores -- 11 on a 22-core box -- all driving
	// the one `npm run preview` server. That is harmless on an idle machine and
	// breaks down on a busy one: with a vitest run in parallel, 11 workers failed
	// 2 of 4 suite runs while 2 workers failed 0 of 4. Busy is the normal case,
	// since e2e runs last in the verify sequence, right after a build.
	workers: 2,
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
