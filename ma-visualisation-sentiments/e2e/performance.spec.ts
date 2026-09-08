import { expect, test, type Response } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('.svelte-kit/output/client/.vite/manifest.json', 'utf8'));
const chartChunk = manifest['src/lib/components/views/ChartViews.svelte'].file;
const mapChunk = manifest['src/lib/components/viz/SentimentMap.svelte'].file;

// Count actual production requests, including dynamic/transitive modules.
// Gzip normalizes preview (uncompressed) and hosted transfer measurements.
for (const [view, jsBudgetKiB] of [
	['charts', 450],
	['table', 180],
	['map', 600]
] as const) {
	test(`cold ${view} load stays within its complete JavaScript budget`, async ({
		page
	}, testInfo) => {
		const requests = new Map<string, Promise<{ gzip: number; bytes: number }>>();
		const recordResponse = (response: Response) => {
			const url = response.url();
			if (response.ok() && /\.(js|json|geojson)(?:\?|$)/.test(url)) {
				requests.set(
					url,
					response.body().then((body) => ({ gzip: gzipSync(body).length, bytes: body.length }))
				);
			}
		};
		page.on('response', recordResponse);
		await page.goto(`?view=${view}&dataset=luna&lang=en`);
		await expect(page.locator(view === 'table' ? 'tbody tr' : 'canvas').first()).toBeVisible();
		await page.waitForLoadState('networkidle');
		// Include all scheduled score prefetches, rather than racing the last
		// idle callback and reporting a different data total on each run.
		await expect
			.poll(
				() => [...requests.keys()].filter((url) => /iwac_sentiment_[^/]+\.json$/.test(url)).length
			)
			.toBe(5);
		page.off('response', recordResponse);
		const measured = await Promise.all(
			[...requests].map(async ([url, bytes]) => ({ url, ...(await bytes) }))
		);
		const js = measured.filter(({ url }) => url.endsWith('.js'));
		const data = measured.filter(({ url }) => !url.endsWith('.js'));
		const sum = (rows: typeof measured, key: 'gzip' | 'bytes') =>
			rows.reduce((n, row) => n + row[key], 0);
		const report = {
			view,
			jsGzipKiB: sum(js, 'gzip') / 1024,
			dataGzipKiB: sum(data, 'gzip') / 1024,
			dataRawKiB: sum(data, 'bytes') / 1024,
			requests: measured
		};
		console.log(JSON.stringify({ ...report, requests: measured.length }));
		await testInfo.attach('cold-load.json', {
			body: JSON.stringify(report, null, 2),
			contentType: 'application/json'
		});
		expect(report.jsGzipKiB).toBeLessThan(jsBudgetKiB);
		expect(report.dataRawKiB).toBeLessThan((view === 'map' ? 14 : 13) * 1024);
		expect(js.some(({ url }) => url.endsWith(chartChunk))).toBe(view === 'charts');
		expect(js.some(({ url }) => url.endsWith(mapChunk))).toBe(view === 'map');
	});
}
