import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const panel = JSON.parse(readFileSync('static/data/iwac_arbiter_evaluations_v2.json', 'utf8'));
const panelId = String(panel.evaluations[0].article_id);

test('panel detail links survive a slow arbiter load', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	await page.route('**/iwac_arbiter_evaluations_v2.json', async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto(`?view=arbiter&dataset=luna&lang=en&arbiterArticleId=${panelId}`);
	await expect(page.getByRole('heading', { name: 'Panel arbiter', exact: true })).toBeVisible();
	await expect(page).toHaveURL(new RegExp(`arbiterArticleId=${panelId}`));
	release();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).not.toHaveURL(/pair=|compare=true/);
	await page.reload();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(new RegExp(`arbiterArticleId=${panelId}`));
});

test('panel article selection has a copyable URL, fresh-load identity and browser history', async ({
	page,
	context
}, testInfo) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('?view=arbiter&dataset=luna&lang=en&panelSort=title&panelPage=2');
	const row = page.locator('tbody tr[role="button"]').first();
	await row.click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page).toHaveURL(/arbiterArticleId=/);
	const title = await dialog.locator('h1').innerText();
	await dialog.getByRole('button', { name: 'Copy link to this analysis' }).click();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(new URL(copied).searchParams.get('panelPage')).toBe('2');
	const shared = await context.newPage();
	await shared.goto(copied);
	await expect(shared.getByRole('dialog').locator('h1')).toHaveText(title);
	await shared.close();
	await page.screenshot({ path: testInfo.outputPath('panel-detail-desktop.png') });
	await page.setViewportSize({ width: 390, height: 844 });
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		.toBe(true);
	await page.screenshot({ path: testInfo.outputPath('panel-detail-mobile.png') });
	await page.goBack();
	await expect(dialog).toHaveCount(0);
	await expect(page).toHaveURL(/panelPage=2/);
	await page.goForward();
	await expect(dialog.locator('h1')).toHaveText(title);
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
	await expect(page).not.toHaveURL(/arbiterArticleId=/);
});

test('archived arbiter details preserve their pair and dimension', async ({ page }) => {
	await page.goto('?view=arbiter&pair=gemini-mistral&lang=en&arbiterDimension=centrality');
	await page
		.locator('tbody')
		.getByRole('button', { name: /View article details/ })
		.first()
		.click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page).toHaveURL(/arbiterArticleId=/);
	const title = await dialog.locator('h1').innerText();
	await page.reload();
	await expect(dialog.locator('h1')).toHaveText(title);
	await expect(page).toHaveURL(/pair=gemini-mistral/);
	await expect(page).toHaveURL(/arbiterDimension=centrality/);
});

test('comparison details keep facets and survive loading without compare=true', async ({
	page
}) => {
	await page.goto(
		'?view=comparison&pair=luna-gemma&lang=en&countries=Togo&dimensions=polarity&excludeNA=false&comparisonSort=date'
	);
	await page
		.locator('.comparison-table-wrapper tbody')
		.getByRole('button', { name: /View comparison/ })
		.first()
		.click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(/comparisonArticleId=/);
	const url = new URL(page.url());
	url.searchParams.delete('compare');
	await page.goto(url.href);
	await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
	await expect(page).toHaveURL(/countries=Togo/);
	await expect(page).toHaveURL(/dimensions=polarity/);
	await page.keyboard.press('Escape');
	await expect(page).not.toHaveURL(/comparisonArticleId=/);
	await expect(page).toHaveURL(/comparisonSort=date/);
});

test('table pagination, sorting and detail background survive reload and history', async ({
	page
}) => {
	await page.goto(
		'?view=table&dataset=gemma&lang=en&countries=Togo&tablePage=3&tableSize=25&tableSort=date&tableOrder=desc'
	);
	const first = page.getByRole('button', { name: /View article details for/ }).first();
	const title = await first.getAttribute('aria-label');
	await first.click();
	await expect(page).toHaveURL(/articleId=/);
	await page.reload();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(first).toHaveAttribute('aria-label', title!);
	await expect(page).toHaveURL(/tablePage=3/);
	await page.getByRole('button', { name: 'Togo', exact: true }).click();
	await expect(page).not.toHaveURL(/tablePage=|countries=/);
	await page.goBack();
	await expect(page).toHaveURL(/tablePage=3/);
	await expect(first).toHaveAttribute('aria-label', title!);
});

for (const [view, query, selector, attribute, value] of [
	[
		'charts',
		'polarityChart=pie&polarityGrouping=journal&subjectivityChart=pie',
		'button:has-text("By newspaper")',
		'aria-pressed',
		'true'
	],
	[
		'trends',
		'polarityTrend=share&subjectivityTrend=share',
		'button:has-text("Share")',
		'aria-pressed',
		'true'
	],
	['seasonality', 'seasonalityChart=bar', 'button:has-text("Bars")', 'aria-pressed', 'true'],
	['ranking', 'rankingMeasure=centrality', 'button:has-text("Centrality")', 'aria-pressed', 'true'],
	[
		'extremes',
		'category=centrality_very_central&keywordType=spatial&topN=25',
		'button:has-text("Places")',
		'aria-pressed',
		'true'
	]
]) {
	test(`${view} controls are restored from a citable URL`, async ({ page }) => {
		await page.goto(`?view=${view}&dataset=luna&lang=en&${query}`);
		await expect(page.locator(selector).first()).toHaveAttribute(attribute, value);
		await page.reload();
		await expect(page.locator(selector).first()).toHaveAttribute(attribute, value);
		for (const [key, value] of new URLSearchParams(query))
			expect(new URL(page.url()).searchParams.get(key)).toBe(value);
	});
}

test('chart interactions round-trip and clearing them follows browser history', async ({
	page
}) => {
	const chartState = JSON.stringify({ 'polarity-trend': { hidden: [0], zoom: [20, 80] } });
	await page.goto('?view=trends&dataset=luna&lang=en&chartState=' + encodeURIComponent(chartState));
	await expect(page.locator('canvas').first()).toBeVisible();
	await page.reload();
	await expect(page.locator('canvas').first()).toBeVisible();
	expect(JSON.parse(new URL(page.url()).searchParams.get('chartState')!)).toEqual(
		JSON.parse(chartState)
	);
	await page.locator('button:has-text("Share")').first().click();
	await expect(page).toHaveURL(/polarityTrend=share/);
	await page.goBack();
	await expect(page).not.toHaveURL(/polarityTrend=/);
	expect(JSON.parse(new URL(page.url()).searchParams.get('chartState')!)).toEqual(
		JSON.parse(chartState)
	);
});

test('missing detail IDs remain explicit and recoverable', async ({ page }) => {
	for (const query of [
		'view=table&dataset=luna&articleId=99999999',
		'view=comparison&pair=luna-gemma&comparisonArticleId=99999999',
		'view=arbiter&dataset=luna&arbiterArticleId=99999999'
	]) {
		await page.goto('?' + query + '&lang=en');
		await expect(page.getByRole('alert')).toContainText('not available in the selected analysis');
		await expect(page).toHaveURL(/ArticleId=99999999|articleId=99999999/);
		await page.getByRole('button', { name: 'Return to the analysis' }).click();
		await expect(page.getByRole('alert')).toHaveCount(0);
		await expect(page).not.toHaveURL(/99999999/);
	}
});

test('canonical metadata retains the complete analysis state', async ({ page }) => {
	await page.goto(`?view=arbiter&dataset=luna&arbiterArticleId=${panelId}&lang=en`);
	await expect(page.getByRole('dialog')).toBeVisible();
	const canonical = page.locator('link[rel="canonical"]');
	await expect(canonical).toHaveAttribute('href', new RegExp(`arbiterArticleId=${panelId}`));
	await expect(canonical).toHaveAttribute('href', /dataset=luna/);
	await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
		'content',
		(await canonical.getAttribute('href')) ?? ''
	);
});

test('panel model reasoning reopens and loads from its URL', async ({ page }) => {
	await page.goto(`?view=arbiter&dataset=luna&arbiterArticleId=${panelId}&lang=en&reasoning=true`);
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('button', { name: 'Hide the models’ reasoning' })).toBeVisible();
	await expect(dialog.locator('blockquote.justification').first()).toBeVisible({ timeout: 15_000 });
	await page.reload();
	await expect(dialog.locator('blockquote.justification').first()).toBeVisible({ timeout: 15_000 });
	await dialog.getByRole('button', { name: 'Hide the models’ reasoning' }).click();
	await expect(page).not.toHaveURL(/reasoning=/);
	await page.goBack();
	await expect(dialog.getByRole('button', { name: 'Hide the models’ reasoning' })).toBeVisible();
});

test('methodology prompt is a shareable detail', async ({ page }) => {
	await page.goto('?view=charts&dataset=gemma&lang=en&prompt=true');
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.reload();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page
		.getByRole('dialog')
		.getByRole('button', { name: 'Close', exact: true })
		.first()
		.click();
	await expect(page).not.toHaveURL(/prompt=/);
});

test('map place, dimension and camera restore together', async ({ page }) => {
	await page.goto(
		'?view=map&dataset=luna&lang=en&placeId=269&mapDimension=centrality&mapCamera=-4,5.35,5'
	);
	await expect(page.locator('.place-popup h3')).toHaveText('Abidjan', { timeout: 15_000 });
	await expect(page.getByRole('tab', { name: 'Centrality', exact: true })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await page.reload();
	await expect(page.locator('.place-popup h3')).toHaveText('Abidjan', { timeout: 15_000 });
	await expect(page).toHaveURL(/mapCamera=-4%2C5.35%2C5/);
	await page.locator('.maplibregl-popup-close-button').click();
	await expect(page).not.toHaveURL(/placeId=/);
	await page.goBack();
	await expect(page.locator('.place-popup h3')).toHaveText('Abidjan');
});
