import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// This compact suite also runs on Firefox and WebKit in the scheduled workflow.
test('table deep links, modal keyboard focus and history work across browsers', async ({
	page
}) => {
	await page.goto('?view=table&dataset=luna&countries=Togo&lang=en');
	const trigger = page.getByRole('button', { name: /View article details for/ }).first();
	await trigger.click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page).toHaveURL(/articleId=/);
	await page.reload();
	await expect(dialog).toBeVisible();
	await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
	await trigger.click();
	await page.goBack();
	await expect(dialog).toHaveCount(0);
	await expect(page).toHaveURL(/countries=Togo/);
});

test('a filtered CSV downloads with selected ratings and UTF-8 text', async ({ page }) => {
	await page.goto('?view=table&dataset=luna&countries=Togo&polarities=Très%20négatif&lang=en');
	const button = page.locator('.csv-export-btn[data-variant="articles"]');
	await expect(button).toBeEnabled();
	const pendingDownload = page.waitForEvent('download');
	await button.click();
	const download = await pendingDownload;
	expect(download.suggestedFilename()).toMatch(/^iwac-articles-.*\.csv$/);
	const path = await download.path();
	expect(path).toBeTruthy();
	const content = readFileSync(path!, 'utf8');
	expect(content.startsWith('\uFEFF')).toBe(true);
	expect(content).toContain('Togo');
	expect(content).toContain('Very negative');
	expect(content.split('\n').length).toBeGreaterThan(1);
	await expect(button).toBeEnabled();
});

test.describe('controlled-browser recovery', () => {
	test.use({ serviceWorkers: 'allow' });

	test('an uncached arbiter while offline remains retryable after reconnecting', async ({
		page,
		context,
		browserName
	}) => {
		// The premise is a worker that is offline but still answers from its own
		// cache, and two ports cannot emulate it. Firefox's offline mode does not
		// reach the worker's own fetch(), so the "uncached" file arrives from the
		// live server. WebKit on Windows fails requests before the worker sees
		// them, so even cached chunks break and the view, not the data, errors.
		test.skip(browserName === 'firefox', 'offline emulation bypasses service-worker fetches');
		test.skip(
			browserName === 'webkit' && process.platform === 'win32',
			'offline emulation pre-empts the service worker on this port'
		);
		// Reload under the active worker so the arbiter's JS is cached too. A fresh
		// table page then clears the in-memory resource without clearing its assets.
		await page.goto('?view=arbiter&dataset=luna&lang=en');
		await page.evaluate(async () => {
			await navigator.serviceWorker.ready;
		});
		await page.reload();
		await expect(page.getByRole('table').first()).toBeVisible();
		await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
		await page.goto('?view=table&dataset=luna&lang=en');
		await expect(page.locator('tbody tr').first()).toBeVisible();
		const removed = await page.evaluate(async () => {
			const cache = await caches.open('iwac-data-v4');
			const requests = (await cache.keys()).filter((request) =>
				request.url.endsWith('/iwac_arbiter_evaluations_v2.json')
			);
			await Promise.all(requests.map((request) => cache.delete(request)));
			return requests.length;
		});
		expect(removed).toBe(1);
		await context.setOffline(true);
		await page.getByRole('button', { name: 'Arbiter', exact: true }).first().click();
		// The data error specifically: the view's own load error says "could not be
		// loaded" too, but offers no Retry, and the test would time out on the click.
		const alert = page.getByRole('alert');
		await expect(alert).toContainText('corpus data could not be loaded');
		await context.setOffline(false);
		await alert.getByRole('button', { name: 'Retry' }).click();
		await expect(alert).toHaveCount(0);
		await expect(page.getByRole('table').first()).toBeVisible();
	});
});
