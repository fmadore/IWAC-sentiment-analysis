<script lang="ts">
	import { articleState, datasetState, loadJustifications } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage, type Language } from '$lib/i18n';
	import type { Translations } from '$lib/i18n/types';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import {
		captureExportProvenance,
		toResearchCSV,
		type CSVExportJob,
		type ExportProvenance
	} from '$lib/utils/exportSnapshot';
	import type { Article } from '$lib/types/data';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	function convertToCSV(
		articles: Article[],
		labels: Translations,
		language: Language,
		provenance: ExportProvenance
	): string {
		if (articles.length === 0) return '';

		const headers = [
			labels.table.articleTitle,
			labels.filters.country,
			labels.filters.journal,
			labels.table.date,
			labels.table.polarity,
			labels.table.subjectivity,
			labels.table.centrality,
			labels.export.polarityJustification,
			labels.export.subjectivityJustification,
			labels.export.centralityJustification,
			labels.export.articleId
		];

		const rows = articles.map((article) => {
			const analysis = article.sentiment_analysis;
			return [
				article['o:title'],
				article.Country,
				getJournalName(article),
				// Exactly as stored: month-only and ranged dates are real in the corpus.
				article.publication_date,
				translateSentimentValue(analysis?.polarite, language),
				translateSubjectivityScore(analysis?.subjectivite_score, language),
				translateSentimentValue(analysis?.centralite_islam_musulmans, language),
				analysis?.polarite_justification,
				analysis?.subjectivite_justification,
				analysis?.centralite_justification,
				article['o:id']
			];
		});

		return toResearchCSV(headers, rows, provenance);
	}

	const articleCount = $derived(articleState.filtered.length);

	function createExport(): CSVExportJob {
		const dataset = datasetState.selected;
		// Keep the row set fixed; raw article objects receive their prose in place.
		const articles = [...articleState.filtered];
		const ids = articles.map((article) => article['o:id']);
		const language = $currentLanguage;
		const labels = $t;
		const provenance = captureExportProvenance([dataset], 'filtered_articles');
		return {
			prepare: () => loadJustifications(dataset, fetch, ids),
			buildCsv: () => convertToCSV(articles, labels, language, provenance)
		};
	}
</script>

<CsvDownloadButton
	count={articleCount}
	filenamePrefix="iwac-articles"
	variant="articles"
	{createExport}
/>
