/**
 * Shared CSV export utilities, used by every export button and chart data table.
 *
 * The exports are research artefacts: they are opened in Excel as often as they
 * are read by code, so they have to survive both.
 */

export type CSVCell = string | number | null | undefined;

/** A leading character spreadsheet software reads as the start of a formula. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
/** A plain number — including a negative one — is data, not a formula. */
const PLAIN_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Escape one value for a CSV cell.
 *
 * A text cell opening with `=`, `+`, `-`, `@`, tab or carriage return is
 * prefixed with an apostrophe, so a spreadsheet shows it as text instead of
 * evaluating it (OWASP "CSV injection"). Model prose can open with a hyphenated
 * list, which would otherwise render as `#NAME?`. Plain numbers are exempt, so a
 * negative coefficient stays machine-readable.
 */
export function escapeCSVField(field: CSVCell): string {
	if (field === null || field === undefined) return '';

	let str = String(field);
	if (FORMULA_TRIGGER.test(str) && !PLAIN_NUMBER.test(str)) str = `'${str}`;
	if (/[",\n\r]/.test(str)) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

/** Assemble a header row and data rows into CSV text. */
export function toCSV(headers: readonly CSVCell[], rows: readonly (readonly CSVCell[])[]): string {
	return [headers, ...rows].map((row) => row.map(escapeCSVField).join(',')).join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 *
 * The UTF-8 byte-order mark is what makes Excel on Windows decode the file as
 * UTF-8; without it `Très négatif` and `Côte d'Ivoire` arrive mangled. The object
 * URL is revoked on a later task, because revoking it synchronously after
 * `click()` cancels the download in some browsers.
 */
export function downloadCSVFile(csvContent: string, filename: string): void {
	const blob = new Blob(['﻿', csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
