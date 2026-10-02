<script lang="ts">
	import { comparisonState, datasetState, loadJustifications } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage, type Language } from '$lib/i18n';
	import type { Translations } from '$lib/i18n/types';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { getModelsFromPair, type ComparisonData } from '$lib/types/data';
	import {
		captureExportProvenance,
		toResearchCSV,
		type CSVExportJob,
		type ExportProvenance
	} from '$lib/utils/exportSnapshot';
	import { getModelDisplayName } from '$lib/utils/format';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	function convertToCSV(
		comparisons: ComparisonData[],
		labels: Translations,
		language: Language,
		provenance: ExportProvenance
	): string {
		if (comparisons.length === 0) return '';

		// Get model names from first comparison (they're all the same pair)
		const firstComp = comparisons[0];
		const modelAName = getModelDisplayName(firstComp.modelAId, datasetState.available);
		const modelBName = getModelDisplayName(firstComp.modelBId, datasetState.available);

		const headers = [
			labels.table.articleTitle,
			labels.filters.country,
			labels.filters.journal,
			labels.table.date,
			modelAName + ' - ' + labels.table.polarity,
			modelAName + ' - ' + labels.table.subjectivity,
			modelAName + ' - ' + labels.table.centrality,
			modelAName + ' - ' + labels.export.polarityJustification,
			modelAName + ' - ' + labels.export.subjectivityJustification,
			modelAName + ' - ' + labels.export.centralityJustification,
			modelBName + ' - ' + labels.table.polarity,
			modelBName + ' - ' + labels.table.subjectivity,
			modelBName + ' - ' + labels.table.centrality,
			modelBName + ' - ' + labels.export.polarityJustification,
			modelBName + ' - ' + labels.export.subjectivityJustification,
			modelBName + ' - ' + labels.export.centralityJustification,
			labels.comparison.polarity + ' ' + labels.comparison.pointsDifference,
			labels.comparison.subjectivity + ' ' + labels.comparison.pointsDifference,
			labels.comparison.centrality + ' ' + labels.comparison.pointsDifference,
			labels.comparison.totalDiscrepancy,
			labels.export.articleId
		];

		const modelColumns = (analysis: ComparisonData['modelA']) => [
			translateSentimentValue(analysis?.polarite, language),
			translateSubjectivityScore(analysis?.subjectivite_score, language),
			translateSentimentValue(analysis?.centralite_islam_musulmans, language),
			analysis?.polarite_justification,
			analysis?.subjectivite_justification,
			analysis?.centralite_justification
		];

		const rows = comparisons.map((comparison) => [
			comparison.article['o:title'],
			comparison.article.Country,
			getJournalName(comparison.article),
			// Exactly as stored: month-only and ranged dates are real in the corpus.
			comparison.article.publication_date,
			...modelColumns(comparison.modelA),
			...modelColumns(comparison.modelB),
			comparison.discrepancies.polarityDiff,
			comparison.discrepancies.subjectivityDiff,
			comparison.discrepancies.centralityDiff,
			comparison.discrepancies.totalDiff,
			comparison.article['o:id']
		]);

		return toResearchCSV(headers, rows, provenance);
	}

	const comparisonCount = $derived(comparisonState.filtered.length);

	function createExport(): CSVExportJob {
		const models = getModelsFromPair(datasetState.pair);
		const comparisons = [...comparisonState.filtered];
		const ids = comparisons.map((comparison) => comparison.article['o:id']);
		const language = $currentLanguage;
		const labels = $t;
		const provenance = captureExportProvenance(models, 'filtered_comparisons');
		return {
			prepare: async () => {
				await Promise.all(models.map((id) => loadJustifications(id, fetch, ids)));
			},
			buildCsv: () => convertToCSV(comparisons, labels, language, provenance)
		};
	}
</script>

<CsvDownloadButton
	count={comparisonCount}
	filenamePrefix="iwac-comparison"
	variant="comparison"
	{createExport}
/>
