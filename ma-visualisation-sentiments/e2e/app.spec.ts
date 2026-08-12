import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('opens the default visualisation and preserves a deep-linked view', async ({ page }) => {
	await page.goto('?view=charts&dataset=chatgpt&lang=en');
	await expect(page.getByRole('heading', { level: 1, name: 'Charts' })).toBeVisible();
	await expect(page.locator('[role="alert"]')).toHaveCount(0);

	await page.goto('?view=comparison&compare=true&pair=chatgpt-gemini&diffMax=11&lang=en');
	await expect(page.getByRole('heading', { level: 1, name: 'Comparison' })).toBeVisible();
	await expect(page).toHaveURL(/pair=chatgpt-gemini/);
});

test('keeps comparison table cells in their columns', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('?view=comparison&compare=true&pair=luna-mistral-small&diffMax=11&lang=en');

	const firstRow = page.locator('.comparison-table-wrapper tbody tr').first();
	await expect(firstRow).toBeVisible();
	await expect(firstRow).toHaveCSS('display', 'table-row');

	const cells = firstRow.locator(':scope > td');
	await expect(cells).toHaveCount(8);
	const positions = await cells.evaluateAll((elements) =>
		elements.map((element) => {
			const box = element.getBoundingClientRect();
			return { left: box.left, top: box.top };
		})
	);

	expect(
		Math.max(...positions.map(({ top }) => top)) - Math.min(...positions.map(({ top }) => top))
	).toBeLessThan(2);
	expect(
		positions.every((position, index) => index === 0 || position.left > positions[index - 1].left)
	).toBe(true);
});

test('keeps the model-pair menu inside the page', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('?view=agreement&compare=true&pair=luna-mistral-small&lang=en');

	const picker = page.locator('.model-pair-picker .picker-button');
	await expect(picker).toBeVisible();
	await picker.click();

	const menu = page.locator('.model-pair-picker .dropdown-menu');
	await expect(menu).toBeVisible();
	const menuFitsPage = () =>
		menu.evaluate((element) => {
			const box = element.getBoundingClientRect();
			const root = document.documentElement;
			return (
				box.left >= 0 && box.right <= root.clientWidth && root.scrollWidth === root.clientWidth
			);
		});

	await expect.poll(menuFitsPage).toBe(true);

	await page.setViewportSize({ width: 390, height: 844 });
	await expect.poll(menuFitsPage).toBe(true);
});

test('shows a retryable error instead of pretending a failed corpus is empty', async ({ page }) => {
	await page.route('**/data/iwac_articles_base.json', (route) => route.abort());
	await page.goto('?view=charts&lang=en');
	const alert = page.getByRole('alert');
	await expect(alert).toContainText('could not be loaded');
	await expect(alert.getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('representative page has no serious axe violations', async ({ page }) => {
	await page.goto('?view=charts&dataset=gemini&lang=en');
	await expect(page.getByRole('heading', { level: 1, name: 'Charts' })).toBeVisible();
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	const serious = results.violations.filter((violation) =>
		['serious', 'critical'].includes(violation.impact ?? '')
	);
	expect(serious).toEqual([]);
});
