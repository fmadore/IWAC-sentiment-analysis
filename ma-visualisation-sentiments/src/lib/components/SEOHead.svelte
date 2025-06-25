<script lang="ts">
  import { page } from '$app/stores';
  import { currentLanguage } from '$lib/i18n';
  
  // Props using runes mode
  let { view = 'charts', comparisonMode = false }: { view?: string; comparisonMode?: boolean } = $props();
  
  // Dynamic meta content based on language and view
  let metaContent = $derived(getMetaContent($currentLanguage, view, comparisonMode));
  
  function getMetaContent(lang: string, currentView: string, isComparison: boolean) {
    const baseUrl = 'https://fmadore.github.io/IWAC-sentiment-analysis/';
    
    if (lang === 'en') {
      return {
        title: isComparison 
          ? 'AI Model Comparison - IWAC Sentiment Analysis'
          : `${getViewTitle(currentView)} - IWAC Sentiment Analysis`,
        description: isComparison
          ? 'Compare sentiment analysis results between ChatGPT and Gemini models on the Islam West Africa Collection. Analyze differences in AI interpretation of media coverage.'
          : `Explore ${getViewDescription(currentView)} from sentiment analysis of the Islam West Africa Collection. Interactive visualization of media coverage analysis using advanced AI models.`,
        keywords: isComparison
          ? 'AI comparison, ChatGPT vs Gemini, model comparison, sentiment analysis, IWAC, AI evaluation'
          : `${getViewKeywords(currentView)}, sentiment analysis, IWAC, Islam West Africa, data visualization`,
        url: `${baseUrl}?view=${currentView}${isComparison ? '&compare=true' : ''}&lang=en`
      };
    } else {
      return {
        title: isComparison
          ? 'Comparaison de modèles IA - Analyse de sentiments IWAC'
          : `${getViewTitleFr(currentView)} - Analyse de sentiments IWAC`,
        description: isComparison
          ? 'Comparez les résultats d\'analyse de sentiments entre les modèles ChatGPT et Gemini sur la Collection Islam Afrique de l\'Ouest. Analysez les différences d\'interprétation IA.'
          : `Explorez ${getViewDescriptionFr(currentView)} de l'analyse de sentiments de la Collection Islam Afrique de l'Ouest. Visualisation interactive de l'analyse de couverture médiatique utilisant des modèles IA avancés.`,
        keywords: isComparison
          ? 'comparaison IA, ChatGPT vs Gemini, comparaison de modèles, analyse de sentiments, IWAC, évaluation IA'
          : `${getViewKeywordsFr(currentView)}, analyse de sentiments, IWAC, Islam Afrique de l'Ouest, visualisation de données`,
        url: `${baseUrl}?view=${currentView}${isComparison ? '&compare=true' : ''}&lang=fr`
      };
    }
  }
  
  function getViewTitle(view: string): string {
    switch (view) {
      case 'charts': return 'Charts & Distributions';
      case 'trends': return 'Temporal Trends';
      case 'correlation': return 'Sentiment Distribution';
      case 'volume': return 'Article Volume Analysis';
      case 'heatmap': return 'Centrality Heatmap';
      case 'table': return 'Article Explorer';
      case 'comparison': return 'Model Comparison';
      default: return 'Data Visualization';
    }
  }
  
  function getViewTitleFr(view: string): string {
    switch (view) {
      case 'charts': return 'Graphiques et distributions';
      case 'trends': return 'Tendances temporelles';
      case 'correlation': return 'Distribution des sentiments';
      case 'volume': return 'Analyse du volume d\'articles';
      case 'heatmap': return 'Carte de chaleur de centralité';
      case 'table': return 'Explorateur d\'articles';
      case 'comparison': return 'Comparaison de modèles';
      default: return 'Visualisation de données';
    }
  }
  
  function getViewDescription(view: string): string {
    switch (view) {
      case 'charts': return 'sentiment distribution charts and polarity analysis';
      case 'trends': return 'temporal evolution of sentiment trends over time';
      case 'correlation': return 'cross-dimensional sentiment distribution analysis';
      case 'volume': return 'article publication volume and geographic distribution';
      case 'heatmap': return 'Islam centrality heatmap by country and year';
      case 'table': return 'detailed article exploration with filtering capabilities';
      case 'comparison': return 'AI model comparison and discrepancy analysis';
      default: return 'interactive data visualization';
    }
  }
  
  function getViewDescriptionFr(view: string): string {
    switch (view) {
      case 'charts': return 'les graphiques de distribution des sentiments et l\'analyse de polarité';
      case 'trends': return 'l\'évolution temporelle des tendances de sentiment';
      case 'correlation': return 'l\'analyse de distribution croisée des sentiments';
      case 'volume': return 'le volume de publication d\'articles et la distribution géographique';
      case 'heatmap': return 'la carte de chaleur de centralité de l\'islam par pays et année';
      case 'table': return 'l\'exploration détaillée d\'articles avec capacités de filtrage';
      case 'comparison': return 'la comparaison de modèles IA et l\'analyse des divergences';
      default: return 'la visualisation interactive de données';
    }
  }
  
  function getViewKeywords(view: string): string {
    switch (view) {
      case 'charts': return 'charts, polarity, sentiment distribution, bar charts, pie charts';
      case 'trends': return 'trends, temporal analysis, time series, evolution';
      case 'correlation': return 'correlation, cross-analysis, distribution, relationships';
      case 'volume': return 'volume, geographic distribution, publication trends';
      case 'heatmap': return 'heatmap, centrality, geographic analysis, visualization';
      case 'table': return 'table, article explorer, filtering, search';
      case 'comparison': return 'comparison, AI models, discrepancy, evaluation';
      default: return 'visualization, analysis, research';
    }
  }
  
  function getViewKeywordsFr(view: string): string {
    switch (view) {
      case 'charts': return 'graphiques, polarité, distribution des sentiments, graphiques en barres, camemberts';
      case 'trends': return 'tendances, analyse temporelle, séries chronologiques, évolution';
      case 'correlation': return 'corrélation, analyse croisée, distribution, relations';
      case 'volume': return 'volume, distribution géographique, tendances de publication';
      case 'heatmap': return 'carte de chaleur, centralité, analyse géographique, visualisation';
      case 'table': return 'tableau, explorateur d\'articles, filtrage, recherche';
      case 'comparison': return 'comparaison, modèles IA, divergences, évaluation';
      default: return 'visualisation, analyse, recherche';
    }
  }
</script>

<svelte:head>
  <title>{metaContent.title}</title>
  <meta name="description" content={metaContent.description} />
  <meta name="keywords" content={metaContent.keywords} />
  
  <!-- Open Graph -->
  <meta property="og:title" content={metaContent.title} />
  <meta property="og:description" content={metaContent.description} />
  <meta property="og:url" content={metaContent.url} />
  
  <!-- Twitter Card -->
  <meta name="twitter:title" content={metaContent.title} />
  <meta name="twitter:description" content={metaContent.description} />
  
  <!-- Canonical URL -->
  <link rel="canonical" href={metaContent.url} />
</svelte:head> 