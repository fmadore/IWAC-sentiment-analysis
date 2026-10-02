# Citable analysis URLs

Use **Copy link to this analysis** in the page header, article detail header or
prompt dialog. The address bar also follows the current analytical state.
Opening a copied link in a fresh tab restores the view, its model context,
applicable facets, controls and selected detail. Back and Forward restore
complete snapshots, including removed filters and closed details.

## Coverage

| View or detail                                   | URL state                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every view                                       | `view`, `lang`, model or model pair; generation follows those stable IDs                                                                                                                                |
| Single-model views                               | `dataset`, `countries`, `journals`, `polarities`, `subjectivities`, `centralities`                                                                                                                      |
| Distributions                                    | `polarityChart`, `subjectivityChart` (bar/pie); `polarityGrouping`, `subjectivityGrouping` (global/journal)                                                                                             |
| Trends                                           | `polarityTrend`, `subjectivityTrend` (count/share); `historyMeasure`, `historyPeriod`, `historyFacet`, `historyCohort`, `historyMinCount`, `historyPage`                                                |
| Correlation                                      | Model and shared facets; no additional view controls                                                                                                                                                    |
| Centrality heatmap                               | Model and shared facets; `heatmapMinCount` (minimum rated articles per cell)                                                                                                                            |
| Volume                                           | `volumeChart` (area/line); `newspaperPeriod`, `newspaperOrder`, `newspaperPage`                                                                                                                         |
| Hijri seasonality                                | `seasonalityChart` (polar/bar)                                                                                                                                                                          |
| Newspaper ranking                                | `rankingMeasure`                                                                                                                                                                                        |
| Map                                              | `mapDimension`, `placeId`, `mapCamera` (longitude,latitude,zoom) and shared facets                                                                                                                      |
| Article table                                    | `tableSort`, `tableOrder`, `tablePage`, `tableSize`, `articleId`                                                                                                                                        |
| Comparison                                       | `pair`, `compare=true`, country/newspaper facets, `dimensions`, `excludeNA`, `diffMin`, `diffMax`, `breakdown`, `arbiterSummary`                                                                        |
| Comparison table and detail                      | `comparisonSort`, `comparisonOrder`, `comparisonLayout`, `comparisonPage`, `comparisonSize`, `comparisonArticleId`                                                                                      |
| Agreement                                        | `dataset` (generation), `pair`, country/newspaper facets, `scope`, `dimension`, `declined`, `dissent`, `agreementMetric`, `patternKind`, `patternLimit`, `labelPattern`, `patternArticles`, `articleId` |
| Panel arbiter                                    | `view=arbiter`, a generation-2 `dataset`, `panelSort`, `panelOrder`, `panelPage`, `panelSize`, `arbiterArticleId`                                                                                       |
| Archived pairwise arbiter                        | `view=arbiter`, generation-1 `pair`, `arbiterDimension`, `arbiterSort`, `arbiterOrder`, `arbiterLayout`, `arbiterPage`, `arbiterSize`, `arbiterArticleId`                                               |
| Extreme analysis                                 | `category`, `keywordType`, `topN` and shared facets                                                                                                                                                     |
| Panel explanations in article/comparison details | `reasoning=true` loads and expands the models' justifications                                                                                                                                           |
| Methodology prompt                               | `prompt=true`, with the current view and generation determining the prompt                                                                                                                              |
| Digitised article pages                          | `scanPage` (one-based); the article ID identifies the manifest                                                                                                                                          |
| Interactive charts                               | `chartState` holds per-chart legend selections and zoom windows                                                                                                                                         |

Only applicable controls and non-default view options are emitted. Country and
newspaper facets scope agreement/comparison; sentiment-label facets do not.
The cross-model historical charts and newspaper timeline also use only country
and newspaper facets, while their neighbouring single-model charts retain the
sentiment filters. Neither arbiter view uses the ordinary corpus facets. The panel arbiter has no
arbitrary model pair. A single-model picker is shown only for single-model views.

Chart zoom and legend selections describe the figure; they do not redefine the
population used for summary statistics or CSV exports. Browser size determines
responsive table/card layout without rewriting the shared URL.

## Examples

- Panel detail: `?view=arbiter&dataset=luna&arbiterArticleId=ARTICLE_ID&lang=en`
- Expanded panel reasoning: add `&reasoning=true` to that detail link.
- Archived detail: `?view=arbiter&pair=gemini-mistral&arbiterArticleId=ARTICLE_ID&lang=fr`
- Comparison detail: `?view=comparison&pair=luna-gemma&comparisonArticleId=ARTICLE_ID&lang=en`
- Filtered table page: `?view=table&dataset=qwen&countries=Togo&tableSort=date&tableOrder=desc&tablePage=3`
- Historical comparison: `?view=trends&dataset=luna&historyMeasure=central&historyFacet=country&historyMinCount=30`
- Pair overview: `?view=agreement&dataset=luna&scope=panel&agreementMetric=weighted`
- Newspaper timeline: `?view=volume&newspaperPeriod=decade&newspaperOrder=name`
- Place: `?view=map&dataset=luna&placeId=269&mapDimension=centrality&mapCamera=-4,5.35,5`

`ARTICLE_ID` denotes an Omeka article ID present in that analysis. Use the UI to
copy a complete link with the current settings.

## Compatibility and failure handling

- Generated links carry `urlVersion=2`. Facets use repeated parameters, with
  sorted, deduplicated literal values. A single newspaper name containing a
  comma, ampersand, plus sign or accented character survives the round trip.
- Links without `urlVersion=2` retain the older comma-separated facet syntax.
- Existing `articleId`, `comparisonArticleId`, dataset and model-pair links remain
  supported. Comparison views infer comparison mode even without `compare=true`.
- An explicit pair determines the generation on pair views. Conflicting
  dataset/pair combinations cannot mix generations in a statistic.
- Detail IDs remain in the URL while datasets, secondary models or arbiter
  evaluations load. Missing items show a recovery action, rather than silently
  dropping the identifier. Failed data requests retain the citation for retry.
- New filter/model actions reset table pagination. Restoring a history entry
  preserves its saved page. Unsupported options fall back to validated defaults.
- Canonical and Open Graph URLs use the same builder as copied links.

## Citation limits

These URLs reproduce the analytical **state against the data served by the
dashboard**. They do not select a historical build or immutable data revision.
For a publication, cite the corresponding versioned Zenodo deposit alongside
the dashboard URL and record the access date. The existing content-addressed
data assets prevent cache mixing; they are not an archival URL selector.

Transient presentation state (hover tooltips, navigation drawers, ordinary
methodology accordions, scroll position, scan-image pan/zoom and fullscreen)
does not change the analysis and is intentionally excluded.

## CSV provenance

Article, comparison and arbiter exports capture their rows, model
context, language and canonical URL at click time. Loading justifications does
not change that snapshot if controls change while the download is being prepared.
Seven appended columns record the export time, analysis URL, data release,
generation, model IDs, selection scope and language. Existing column
order is preserved. These identify the exported state; the citation limits above
still apply.

## Maintaining the contract

Add explicit controls to `src/lib/stores/view-options.svelte.ts` with a stable
name, applicable views, default and parser. Bind the UI directly to that store.
Use `CitableChart` for charts with interactive legends/zoom, and retain detail
identifiers independently of asynchronously loaded objects. Avoid a second URL
writer in a component. Regression coverage lives in `src/lib/stores/url/`,
`CitableChart.test.ts` and `e2e/citations.spec.ts`.
