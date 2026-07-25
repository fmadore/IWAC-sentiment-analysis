/**
 * Component smoke tests for the shared chart-data disclosure.
 *
 * The repo's tests have been store- and util-shaped; this is the first
 * component under test. ChartDataTable is a good first subject because it is
 * the accessibility surface for every chart — if it silently stops rendering a
 * real table, screen-reader users lose their only access to the numbers and
 * nothing else in the suite would notice.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';
import ChartDataTable from './ChartDataTable.svelte';

afterEach(cleanup);

const columns = ['Month', 'Articles', 'Index'];
const rows = [
	['Ramadan', '1,729', '1.70'],
	['Shawwal', '1,517', '1.49']
];

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
		expect(columnHeaders.map((h) => h.textContent?.trim())).toEqual(columns);
	});

	it('makes the first cell of each row a row header', async () => {
		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const rowHeaders = await screen.findAllByRole('rowheader');
		expect(rowHeaders.map((h) => h.textContent?.trim())).toEqual(['Ramadan', 'Shawwal']);
	});

	it('renders every data cell', async () => {
		renderTable();
		screen.getByRole('button').click();
		await Promise.resolve();

		const cells = await screen.findAllByRole('cell');
		expect(cells.map((c) => c.textContent?.trim())).toEqual(['1,729', '1.70', '1,517', '1.49']);
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
