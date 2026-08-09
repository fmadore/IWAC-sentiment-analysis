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
