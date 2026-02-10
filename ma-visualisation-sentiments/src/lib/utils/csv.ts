/**
 * Shared CSV export utilities
 *
 * Consolidates duplicated CSV functions from ComparisonCSVExportButton
 * and ArbiterCSVExportButton.
 */

/**
 * Escape a field value for safe inclusion in a CSV file.
 */
export function escapeCSVField(field: string | null | undefined): string {
	if (field === null || field === undefined) return '';

	const str = String(field);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

/**
 * Format a date string for CSV export (ISO date format: YYYY-MM-DD).
 */
export function formatDateForCSV(dateStr: string | null | undefined): string {
	if (!dateStr) return '';

	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) {
			return dateStr;
		}
		return date.toISOString().split('T')[0];
	} catch {
		return dateStr || '';
	}
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCSVFile(csvContent: string, filename: string): void {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}
