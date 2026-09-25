<script lang="ts">
	import { articleState, datasetState, loadJustifications } from '$lib/stores';
	import { getJournalName } from '$lib/utils/format';
	import { t, currentLanguage } from '$lib/i18n';
	import { translateSentimentValue, translateSubjectivityScore } from '$lib/i18n/utils';
	import { toCSV } from '$lib/utils/csv';
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

		const rows = articles.map((article) => {
			const analysis = article.sentiment_analysis;
			return [
				article['o:title'],
				article.Country,
				getJournalName(article),
				// Exactly as stored: month-only and ranged dates are real in the corpus.
				article.publication_date,
				translateSentimentValue(analysis?.polarite, $currentLanguage),
				translateSubjectivityScore(analysis?.subjectivite_score, $currentLanguage),
				translateSentimentValue(analysis?.centralite_islam_musulmans, $currentLanguage),
				analysis?.polarite_justification,
				analysis?.subjectivite_justification,
				analysis?.centralite_justification,
				article['o:id']
			];
		});

		return toCSV(headers, rows);
	}

	const articleCount = $derived(articleState.filtered.length);
</script>

<CsvDownloadButton
	count={articleCount}
	filenamePrefix="iwac-articles"
	variant="articles"
	prepare={() => loadJustifications(datasetState.selected)}
	buildCsv={() => convertToCSV(articleState.filtered)}
/>
