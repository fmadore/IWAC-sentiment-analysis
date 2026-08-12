/**
 * Component smoke tests for the shared chart-data disclosure.
 *
 * The repo's tests have been store- and util-shaped; this is the first
 * component under test. ChartDataTable is a good first subject because it is
 * the accessibility surface for every chart — if it silently stops rendering a
 * real table, screen-reader users lose their only access to the numbers and
 * nothing else in the suite would notice.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';
import ChartDataTable from './ChartDataTable.svelte';
import { currentLanguage } from '$lib/i18n';
import * as csv from '$lib/utils/csv';

afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
	vi.restoreAllMocks();
});

const columns = [
	{ label: 'Month' },
	{ label: 'Articles', format: 'integer' as const },
	{ label: 'Index', format: 'decimal' as const, digits: 2 },
	{ label: 'Unanimity', format: 'percent' as const, digits: 1 }
];
const rows = [
	['Ramadan', 1729, 1.7, 0.581],
	['Shawwal', 1517, 1.49, null]
];

const columnLabels = columns.map((column) => column.label);

function renderTable(props: Partial<Record<string, unknown>> = {}) {
	return render(ChartDataTable, {
		props: {
			columns,
			rows,
			filenamePrefix: 'iwac-test',
			caption: 'Test caption',
			...props
		}
	});
}

describe('ChartDataTable', () => {
	it('renders nothing when there are no rows', () => {
		renderTable({ rows: [] });
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('starts collapsed so it never competes with the chart', () => {
		renderTable();
		const toggle = screen.getByRole('button');

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByRole('table')).toBeNull();
	});

	it('exposes a real table with headers once opened', async () => {
		const { component } = renderTable();
		void component;

		const toggle = screen.getByRole('button');
		toggle.click();
		await Promise.resolve();

		const table = await screen.findByRole('table');
		expect(table).toBeTruthy();

		// Column headers must be <th scope="col"> for a screen reader to
		// announce them while moving across a row.
		const columnHeaders = screen.getAllByRole('columnheader');
		expect(columnHeaders.map((h) => h.textContent?.trim())).toEqual(columnLabels);
	});

	it('makes the first cell of each row a row header', async () => {
		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const rowHeaders = await screen.findAllByRole('rowheader');
		expect(rowHeaders.map((h) => h.textContent?.trim())).toEqual(['Ramadan', 'Shawwal']);
	});

	it('renders nothing but the toggle while collapsed', () => {
		renderTable();
		expect(screen.queryByRole('table')).toBeNull();
	});

	it('formats each cell for the reader, per the column spec', async () => {
		currentLanguage.set('en');
		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const cells = await screen.findAllByRole('cell');
		// A missing value reads as an em dash rather than an empty cell.
		expect(cells.map((c) => c.textContent?.trim())).toEqual([
			'1,729',
			'1.70',
			'58.1%',
			'1,517',
			'1.49',
			'—'
		]);
	});

	it('follows the reader’s language on screen', async () => {
		currentLanguage.set('fr');
		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const cells = await screen.findAllByRole('cell');
		// Two different invisible characters, both supplied by Intl: U+202F (narrow
		// no-break space) groups French thousands, while U+00A0 (no-break space)
		// stands before the percent sign. Hard-coding one space for both, as an
		// earlier draft of the formatter did, gets the percentage wrong.
		expect(cells[0].textContent?.trim()).toBe('1 729');
		expect(cells[1].textContent?.trim()).toBe('1,70');
		expect(cells[2].textContent?.trim()).toBe('58,1 %');
	});

	/**
	 * The reason this component owns both renderings. The visible table follows
	 * the interface language; the export must not, or a French session would ship
	 * a file whose decimal separator is the delimiter of the format it is in.
	 */
	it('exports machine-readable numbers whatever the interface language', async () => {
		currentLanguage.set('fr');
		const download = vi.spyOn(csv, 'downloadCSVFile').mockImplementation(() => {});

		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const exportButton = screen
			.getAllByRole('button')
			.find((b) => b.classList.contains('disclosure-export'));
		exportButton?.click();

		const [content] = download.mock.calls[0];
		expect(content).toBe(
			['Month,Articles,Index,Unanimity', 'Ramadan,1729,1.70,58.1', 'Shawwal,1517,1.49,'].join('\n')
		);
		// No locale artefacts, and nothing in the payload needed quoting.
		expect(content).not.toContain(' ');
		expect(content).not.toContain(' ');
		expect(content).not.toContain('"');
	});

	it('carries an accessible caption naming the data', async () => {
		renderTable({ caption: 'Coverage by Hijri month' });
		screen.getByRole('button').click();
		await Promise.resolve();

		const table = await screen.findByRole('table');
		expect(table.querySelector('caption')?.textContent).toBe('Coverage by Hijri month');
	});

	it('toggles back closed', async () => {
		renderTable();
		const toggle = screen.getByRole('button');

		toggle.click();
		await Promise.resolve();
		expect(toggle.getAttribute('aria-expanded')).toBe('true');

		toggle.click();
		await Promise.resolve();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});
});
