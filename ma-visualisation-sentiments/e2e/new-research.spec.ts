import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
	const errors: string[] = [];
	pageErrors.set(page, errors);
	page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
	expect(pageErrors.get(page) ?? []).toEqual([]);
});

async function expectAccessible(page: Page, selector?: string) {
	const scan = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
	if (selector) scan.include(selector);
	const result = await scan.analyze();
	expect(
		result.violations
			.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
			.map((violation) => ({
				id: violation.id,
				nodes: violation.nodes.map((node) => node.target)
			}))
	).toEqual([]);
}

test('the panel overview restores its metric and opens the selected pair', async ({ page }) => {
	await page.goto('?view=agreement&dataset=luna&scope=panel&lang=en&agreementMetric=kappa');
	const metric = page.getByLabel('Agreement measure', { exact: true });
	await expect(metric).toHaveValue('kappa');
	await metric.selectOption('weighted');
	await expect(page).toHaveURL(/agreementMetric=weighted/);
	await page.reload();
	await expect(metric).toHaveValue('weighted');
	const matrix = page.getByRole('table', { name: /^Agreement across model pairs/ }).first();
	await matrix.getByRole('button').first().click();
	await expect(page).toHaveURL(/scope=pair/);
	expect(new URL(page.url()).searchParams.get('pair')).toBe('luna-mistral-small');
	await expect(page.locator('.model-pair-picker')).toBeVisible();
});

test('full label patterns link to a reloadable article annotation', async ({ page }) => {
	await page.goto('?view=agreement&dataset=luna&scope=panel&dimension=polarity&lang=en');
	const kind = page.getByLabel('Pattern group', { exact: true });
	await kind.selectOption('lone');
	await expect(page).toHaveURL(/patternKind=lone/);
	await page.getByLabel('Patterns shown', { exact: true }).selectOption('25');
	await page
		.getByRole('button', { name: /^Show articles for pattern / })
		.first()
		.click();
	await expect(page).toHaveURL(/labelPattern=/);
	const selectedPattern = new URL(page.url()).searchParams.get('labelPattern');
	expect(selectedPattern).toMatch(/^[0-5](?:-[0-5]){4}$/);
	const articles = page.getByRole('region', {
		name: 'Articles with the selected pattern',
		exact: true
	});
	await articles
		.getByRole('button', { name: /^Open annotation for / })
		.first()
		.click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(/articleId=/);
	await page.reload();
	await expect(page.getByRole('dialog')).toBeVisible();
	expect(new URL(page.url()).searchParams.get('labelPattern')).toBe(selectedPattern);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(kind).toHaveValue('lone');
	await expect(page.getByLabel('Patterns shown', { exact: true })).toHaveValue('25');
	// Both new agreement sections are ready, including expanded pattern articles.
	await expectAccessible(page);
});

test('historical comparison controls survive a shared URL and reload', async ({ page }) => {
	await page.goto(
		'?view=trends&dataset=luna&lang=en&historyMeasure=subjective&historyPeriod=year&historyFacet=country&historyCohort=available&historyMinCount=10'
	);
	const history = page.getByRole('region', {
		name: 'Historical trends across models',
		exact: true
	});
	const controls = [
		['Measure', 'subjective'],
		['Period', 'year'],
		['Panels', 'country'],
		['Article cohort', 'available'],
		['Minimum articles per point', '10']
	] as const;
	for (const [label, value] of controls)
		await expect(history.getByLabel(label, { exact: true })).toHaveValue(value);
	await page.reload();
	for (const [label, value] of controls)
		await expect(history.getByLabel(label, { exact: true })).toHaveValue(value);
	await history.getByLabel('Article cohort', { exact: true }).selectOption('common');
	await expect(page).not.toHaveURL(/historyCohort=available/);
	await page.goBack();
	await expect(history.getByLabel('Article cohort', { exact: true })).toHaveValue('available');
	await expect(history.locator('canvas').first()).toBeVisible();
	await expectAccessible(page, 'section[aria-labelledby="historical-trends-title"]');
});

test('newspaper coverage exposes a keyboard-operated filter and restores its options', async ({
	page
}) => {
	await page.goto('?view=volume&dataset=luna&lang=en&newspaperPeriod=decade&newspaperOrder=name');
	const timeline = page.getByRole('region', { name: 'Newspaper coverage over time', exact: true });
	await expect(timeline.getByLabel('Period', { exact: true })).toHaveValue('decade');
	await expect(timeline.getByLabel('Newspaper order', { exact: true })).toHaveValue('name');
	const journal = timeline.locator('.journal-buttons').getByRole('button').first();
	const title = (await journal.innerText()).replace(/ \([^)]*\)$/, '');
	await journal.focus();
	await page.keyboard.press('Enter');
	await expect.poll(() => new URL(page.url()).searchParams.getAll('journals')).toEqual([title]);
	await page.reload();
	await expect(timeline.getByLabel('Period', { exact: true })).toHaveValue('decade');
	await expect(timeline.getByLabel('Newspaper order', { exact: true })).toHaveValue('name');
	await expect(timeline.locator('.journal-buttons').getByRole('button')).toHaveCount(1);
	await expectAccessible(page, 'section[aria-label="Newspaper coverage over time"]');
});
