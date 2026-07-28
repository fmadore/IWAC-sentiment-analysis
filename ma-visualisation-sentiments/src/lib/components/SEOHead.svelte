<!--
  SEOHead Component

  Emits per-view <head> metadata (title, description, keywords, Open Graph,
  Twitter card, canonical URL). All copy comes from the i18n catalog's
  `meta` namespace — no parallel hand-rolled translations here.
-->
<script lang="ts">
	import { t, currentLanguage } from '$lib/i18n';

	let { view = 'charts', comparisonMode = false }: { view?: string; comparisonMode?: boolean } =
		$props();

	const author = {
		name: 'Frédérick Madore',
		url: 'https://www.frederickmadore.com/'
	};
	const baseUrl = 'https://iwac.frederickmadore.com/sentiment-analysis/';
	const ogImage = `${baseUrl}icons/icon-512x512.png`;

	type ViewMeta = { title: string; description: string; keywords: string };

	const metaContent = $derived.by(() => {
		const m = $t.meta;
		const lang = $currentLanguage;
		const url = `${baseUrl}?view=${view}${comparisonMode ? '&compare=true' : ''}&lang=${lang}`;
		const locale = lang === 'en' ? 'en_US' : 'fr_FR';

		if (comparisonMode) {
			return {
				title: `${m.comparisonTitle} - ${m.siteTitle}`,
				description: m.comparisonDescription,
				keywords: m.comparisonKeywords,
				url,
				locale
			};
		}

		const views = m.views as Record<string, ViewMeta>;
		const viewMeta = views[view] ?? m.views.default;
		return {
			title: `${viewMeta.title} - ${m.siteTitle}`,
			description: `${m.viewDescriptionPrefix}${viewMeta.description}${m.viewDescriptionSuffix}`,
			keywords: `${viewMeta.keywords}, ${m.baseKeywords}`,
			url,
			locale
		};
	});
</script>

<svelte:head>
	<title>{metaContent.title}</title>
	<meta name="description" content={metaContent.description} />
	<meta name="keywords" content={metaContent.keywords} />
	<meta name="author" content={author.name} />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="IWAC Sentiment Analysis" />
	<meta property="og:title" content={metaContent.title} />
	<meta property="og:description" content={metaContent.description} />
	<meta property="og:url" content={metaContent.url} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="512" />
	<meta property="og:image:height" content="512" />
	<meta property="og:locale" content={metaContent.locale} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={metaContent.title} />
	<meta name="twitter:description" content={metaContent.description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- Canonical URL -->
	<link rel="canonical" href={metaContent.url} />
	<link rel="author" href={author.url} />
</svelte:head>
