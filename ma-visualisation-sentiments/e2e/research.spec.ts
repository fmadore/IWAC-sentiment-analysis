import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

test('returning to a loaded pair ignores a late response for another pair', async ({ page }) => {
	await page.addInitScript(() =>
		Object.defineProperty(navigator, 'connection', {
			value: { saveData: true },
			configurable: true
		})
	);
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	await page.route('**/iwac_sentiment_qwen.json', async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto('?view=comparison&compare=true&pair=luna-mistral-small&lang=en');
	await expect(page.locator('.comparison-table-wrapper tbody tr').first()).toBeVisible();
	await page.locator('.model-pair-picker .picker-button').click();
	await page.getByRole('option', { name: /GPT-5.6 Luna.*Qwen/ }).click();
	await expect(page).toHaveURL(/pair=luna-qwen/);
	await page.goBack();
	await expect(page).toHaveURL(/pair=luna-mistral-small/);
	await expect(page.locator('.comparison-table-wrapper tbody tr').first()).toBeVisible();
	const lateResponse = page.waitForResponse('**/iwac_sentiment_qwen.json');
	release();
	await lateResponse;
	await expect(page).toHaveURL(/pair=luna-mistral-small/);
	await expect(page.locator('.comparison-table-wrapper tbody tr').first()).toBeVisible();
});

test('article modal contains focus, returns it, and follows browser history', async ({ page }) => {
	await page.goto('?view=table&dataset=luna&lang=en');
	const trigger = page.getByRole('button', { name: /View article details for/ }).first();
	await trigger.click();
	const modal = page.getByRole('dialog');
	await expect(modal).toBeVisible();
	await expect(page).toHaveURL(/articleId=/);
	await expect.poll(() => modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
	await page.keyboard.press('Shift+Tab');
	await expect.poll(() => modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
	await page.goBack();
	await expect(modal).toHaveCount(0);
	await expect(trigger).toBeFocused();
	await page.goForward();
	await expect(modal).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(modal).toHaveCount(0);
});

test('mobile navigation returns keyboard focus to its trigger', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('?view=charts&dataset=luna&lang=fr');
	const opener = page.locator('.nav-toggle');
	await opener.click();
	await expect(opener).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(opener).toHaveAttribute('aria-expanded', 'false');
	await expect(opener).toBeFocused();
});

test('failed view chunks show a localized recovery action', async ({ page }) => {
	const manifest = JSON.parse(
		readFileSync('.svelte-kit/output/client/.vite/manifest.json', 'utf8')
	);
	const chunk = manifest['src/lib/components/data-display/ArticleTable.svelte'].file;
	await page.route(`**/${chunk}`, (route) => route.abort());
	await page.goto('?view=table&dataset=luna&lang=en');
	await expect(page.getByRole('alert')).toContainText('This view could not be loaded');
	await expect(page.getByRole('button', { name: 'Reload this view' })).toBeVisible();
});

test('panel member failure is explicit and retry restores the full analysis', async ({ page }) => {
	let fail = true;
	await page.route('**/iwac_sentiment_gemma.json', (route) =>
		fail ? route.abort() : route.continue()
	);
	await page.goto('?view=agreement&dataset=luna&scope=panel&lang=en');
	const alert = page.getByRole('alert');
	await expect(alert).toContainText('Gemma');
	fail = false;
	await alert.getByRole('button', { name: 'Retry' }).click();
	await expect(page.getByRole('tab', { name: 'Polarity', exact: true })).toBeVisible();
	await expect(alert).toHaveCount(0);
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	expect(
		results.violations
			.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
			.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))
	).toEqual([]);
});

test('Back and Forward restore views and removed filters', async ({ page }) => {
	await page.goto('?view=charts&dataset=luna&lang=en');
	await expect(page.locator('canvas').first()).toBeVisible();
	const benin = page.getByRole('button', { name: 'Benin', exact: true });
	await benin.click();
	await expect(page).toHaveURL(/countries=B/);
	await page.getByRole('button', { name: 'Trends', exact: true }).click();
	await expect(page.locator('h1')).toHaveText('Trends');
	await page.goBack();
	await expect(page.locator('h1')).toHaveText('Charts');
	await page.goBack();
	await expect(page).not.toHaveURL(/countries=/);
	await expect(benin).toHaveAttribute('aria-pressed', 'false');
	await page.goForward();
	await expect(benin).toHaveAttribute('aria-pressed', 'true');
});

test('shared analytical choices survive a fresh load', async ({ page }) => {
	await page.goto(
		'?view=comparison&compare=true&pair=luna-mistral-small&lang=en&dimensions=polarity&excludeNA=false&diffMin=2&diffMax=5'
	);
	await expect(
		page.getByRole('switch', { name: 'Exclude non-applicable articles' })
	).not.toBeChecked();
	await expect(
		page.getByRole('button', { name: 'Sentiment polarity', exact: true }).last()
	).toHaveAttribute('aria-pressed', 'true');
	await page.reload();
	await expect(page).toHaveURL(/dimensions=polarity/);
	await expect(
		page.getByRole('switch', { name: 'Exclude non-applicable articles' })
	).not.toBeChecked();
	await page.goto(
		'?view=agreement&dataset=luna&pair=luna-mistral-small&lang=en&scope=panel&dimension=centrality&declined=true'
	);
	await expect(page.getByRole('tab', { name: /centrality/i })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await expect(page).toHaveURL(/scope=panel/);
	await page.reload();
	await expect(page.getByRole('tab', { name: /centrality/i })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await expect(page).toHaveURL(/declined=true/);
});

test('a failed secondary model is retryable instead of an empty comparison', async ({ page }) => {
	let fail = true;
	await page.route('**/iwac_sentiment_mistral-small.json', (route) =>
		fail ? route.abort() : route.continue()
	);
	await page.goto('?view=comparison&compare=true&pair=luna-mistral-small&lang=en');
	const alert = page.getByRole('alert');
	await expect(alert).toContainText('Mistral Small 4');
	fail = false;
	await alert.getByRole('button', { name: 'Retry' }).click();
	await expect(page.locator('.comparison-table-wrapper tbody tr').first()).toBeVisible();
	await expect(alert).toHaveCount(0);
});

test('default charts expose values and a compact global grouping', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('?view=charts&dataset=luna&lang=en');
	await expect(
		page.getByRole('button', { name: 'Overall distribution', exact: true }).first()
	).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('canvas').first()).toBeVisible();
	// The shared component exposes a native disclosure, independent of canvas.
	await page.locator('.disclosure-toggle').first().click();
	await expect(page.locator('table').first()).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('French comparison keeps table semantics and localized actions', async ({ page }) => {
	await page.goto('?view=comparison&compare=true&pair=luna-mistral-small&lang=fr');
	const row = page.locator('.comparison-table-wrapper tbody tr').first();
	await expect(row).toBeVisible();
	await expect(row).not.toHaveAttribute('role', 'button');
	await expect(row.getByRole('button', { name: /Voir la comparaison/ })).toBeVisible();
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	expect(
		results.violations
			.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
			.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))
	).toEqual([]);
});

test('tooltip fits mobile and dismisses with Escape', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('?view=comparison&compare=true&pair=luna-mistral-small&lang=fr');
	const trigger = page.getByRole('button', {
		name: 'Choisissez les dimensions qui comptent dans le score d’écart :',
		exact: true
	});
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const id = await trigger.getAttribute('aria-controls');
	const panel = page.locator(`[id="${id}"]`);
	await expect
		.poll(() =>
			panel.evaluate((el) => {
				const r = el.getBoundingClientRect();
				return r.left >= 0 && r.right <= innerWidth && r.top >= 0;
			})
		)
		.toBe(true);
	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test.describe('immutable data cache', () => {
	test.use({ serviceWorkers: 'allow' });
	test('offline lookup never substitutes a different release', async ({ page, context }) => {
		await page.goto('?view=charts&dataset=luna&lang=en');
		await expect(page.locator('canvas').first()).toBeVisible();
		await page.evaluate(async () => {
			await navigator.serviceWorker.ready;
		});
		await page.reload();
		await expect(page.locator('canvas').first()).toBeVisible();
		const known = await page.evaluate(() =>
			performance
				.getEntriesByType('resource')
				.map((e) => e.name)
				.find((url) => url.includes('/releases/') && url.endsWith('iwac_sentiment_luna.json'))
		);
		expect(known).toBeTruthy();
		await context.setOffline(true);
		const result = await page.evaluate(async (url) => {
			const cached = await fetch(url!);
			const other = await fetch(url!.replace(/\/releases\/[^/]+\//, '/releases/nonexistent/'));
			return { cached: cached.status, other: other.status };
		}, known);
		expect(result).toEqual({ cached: 200, other: 404 });
	});
});

test('a browser that blocks site storage still gets a working dashboard', async ({ page }) => {
	// "Block all cookies" makes merely touching either storage area throw.
	await page.addInitScript(() => {
		for (const name of ['localStorage', 'sessionStorage'] as const) {
			Object.defineProperty(window, name, {
				configurable: true,
				get() {
					throw new DOMException('The operation is insecure.', 'SecurityError');
				}
			});
		}
	});
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));

	// No `lang=`, so start-up consults the (blocked) remembered language.
	await page.goto('?view=charts&dataset=luna');
	await expect(
		page.getByRole('heading', { level: 1, name: /^(Charts|Graphiques)$/ })
	).toBeVisible();
	await expect(page.locator('canvas').first()).toBeVisible();

	await page.getByRole('button', { name: /^(Change language|Changer de langue)$/ }).click();
	await page.getByRole('option', { name: 'Français' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Graphiques' })).toBeVisible();
	expect(errors).toEqual([]);
});
