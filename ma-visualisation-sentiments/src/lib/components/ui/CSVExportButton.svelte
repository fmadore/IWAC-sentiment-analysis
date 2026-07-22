<script lang="ts">
	import { articleState } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { escapeCSVField, formatDateForCSV } from '$lib/utils/csv';
	import type { Article } from '$lib/types/data';
	import CsvDownloadButton from './CsvDownloadButton.svelte';

	function convertToCSV(articles: Article[]): string {
		if (articles.length === 0) return '';

		const headers = [
			$t.table.articleTitle,
			$t.filters.country,
			$t.filters.journal,
			$t.table.date,
			$t.table.polarity,
			$t.table.subjectivity,
			$t.table.centrality,
			$t.export.polarityJustification,
			$t.export.subjectivityJustification,
			$t.export.centralityJustification,
			$t.export.articleId
		];

		const csvRows = [
			headers.map((header) => escapeCSVField(header)).join(','),
			...articles.map((article) => {
				const row = [
					escapeCSVField(article['o:title']),
					escapeCSVField(article.Country),
					escapeCSVField(getJournalName(article)),
					escapeCSVField(formatDateForCSV(article.publication_date)),
					escapeCSVField(
						translateSentimentValue(article.sentiment_analysis?.polarite, $currentLanguage)
					),
					escapeCSVField(
						translateSubjectivityScore(
							article.sentiment_analysis?.subjectivite_score,
							$currentLanguage
						)
					),
					escapeCSVField(
						translateSentimentValue(
							article.sentiment_analysis?.centralite_islam_musulmans,
							$currentLanguage
						)
					),
					escapeCSVField(article.sentiment_analysis?.polarite_justification),
					escapeCSVField(article.sentiment_analysis?.subjectivite_justification),
					escapeCSVField(article.sentiment_analysis?.centralite_justification),
					escapeCSVField(article['o:id']?.toString())
				];
				return row.join(',');
			})
		];

		return csvRows.join('\n');
	}

	const articleCount = $derived(articleState.filtered.length);
</script>

<CsvDownloadButton
	count={articleCount}
	filenamePrefix="iwac-articles"
	variant="articles"
	buildCsv={() => convertToCSV(articleState.filtered)}
/>
