<script lang="ts">
	import { articleState, datasetState, loadJustifications } from '#lib/stores/index.js';
	import { getJournalName } from '#lib/utils/format.js';
	import { t, currentLanguage, type Language } from '#lib/i18n/index.js';
	import type { Translations } from '#lib/i18n/types.js';
	import { translateSentimentValue, translateSubjectivityScore } from '#lib/i18n/utils.js';
	import {
		captureExportProvenance,
		toResearchCSV,
		type CSVExportJob,
		type ExportProvenance
	} from '#lib/utils/exportSnapshot.js';
	import type { Article } from '#lib/types/data.js';
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import { searchByTitle } from '#lib/utils/sorting.js';
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

	// The rows the table lists: the filters, then its title search.
	const searched = $derived(searchByTitle(articleState.filtered, viewOptionsState.tableSearch));
	const isSearched = $derived(searched !== articleState.filtered);
	const articleCount = $derived(searched.length);

	function createExport(): CSVExportJob {
		const dataset = datasetState.selected;
		// Captured synchronously: the row set, model, language and URL stay as
		// they were at the click; raw article objects receive their prose in place.
		const articles = [...searched];
		const ids = articles.map((article) => article['o:id']);
		const language = $currentLanguage;
		const labels = $t;
		const provenance = captureExportProvenance(
			[dataset],
			isSearched ? 'searched_articles' : 'filtered_articles'
		);
		return {
			prepare: () => loadJustifications(dataset, fetch, ids),
			buildCsv: () => convertToCSV(articles, labels, language, provenance)
		};
	}
</script>

<CsvDownloadButton
	count={articleCount}
	filenamePrefix={isSearched ? 'iwac-articles-search' : 'iwac-articles'}
	variant="articles"
	{createExport}
/>
