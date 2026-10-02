import { DATA_RELEASE } from '$lib/data/release';
import { generationOf } from '$lib/domain/sentimentContract';
import { buildURLSearchParams } from '$lib/stores/url/builder.svelte';
import { getCurrentState } from '$lib/stores/url/state.svelte';
import type { DatasetId } from '$lib/types/data';
import { toCSV, type CSVCell } from './csv';

/** Created synchronously at click time, before any lazy prose requests start. */
export interface CSVExportJob {
	prepare?: () => Promise<void>;
	buildCsv: () => string;
}

export interface ExportProvenance {
	readonly generation: string;
	readonly models: string;
	readonly release: string;
	readonly language: string;
	readonly selection: string;
	readonly analysisUrl: string;
	readonly exportedAt: string;
}

/**
 * Copy URL state into strings now: store arrays and view options remain mutable.
 * The selection declares whether an export contains filtered articles or the
 * whole arbiter run; the URL preserves the filters and analytical controls.
 */
export function captureExportProvenance(
	models: readonly DatasetId[],
	selection: 'filtered_articles' | 'filtered_comparisons' | 'arbiter_evaluations'
): ExportProvenance {
	const state = getCurrentState();
	const query = buildURLSearchParams(state).toString();
	const location =
		typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname;
	return Object.freeze({
		generation: models.length ? generationOf(models[0]) : '',
		models: models.join(';'),
		release: DATA_RELEASE || 'development',
		language: state.lang ?? 'fr',
		selection,
		analysisUrl: `${location}?${query}`,
		exportedAt: new Date().toISOString()
	});
}

/**
 * Append provenance columns rather than inserting comment/preamble rows: CSV
 * readers still receive exactly one header and one row per exported article.
 * Existing article columns retain their names and order.
 */
export function toResearchCSV(
	headers: readonly CSVCell[],
	rows: readonly (readonly CSVCell[])[],
	provenance: ExportProvenance
): string {
	const metadata = [
		provenance.generation,
		provenance.models,
		provenance.release,
		provenance.language,
		provenance.selection,
		provenance.analysisUrl,
		provenance.exportedAt
	];
	return toCSV(
		[
			...headers,
			'export_generation',
			'export_models',
			'export_data_release',
			'export_language',
			'export_selection',
			'export_analysis_url',
			'exported_at_utc'
		],
		rows.map((row) => [...row, ...metadata])
	);
}
