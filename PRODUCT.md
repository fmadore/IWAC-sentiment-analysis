# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are digital-humanities practitioners and social-sciences scholars. They use the product to investigate how AI models classify and interpret historical press coverage of Islam and Muslims in West Africa, compare those readings, and trace aggregate patterns back to the underlying articles and model justifications.

## Product Purpose

IWAC Sentiment Analysis is a public research dashboard for comparing multiple AI readings of the same historical press corpus. It makes model agreement, disagreement, methodological choices, and uncertainty inspectable rather than presenting a single model as ground truth.

Success means that scholars can explore patterns, interrogate disagreements, understand the limits of each statistic, and share or cite a reproducible analytical state without losing the corpus and methodology that produced it.

## Positioning

The product compares multiple models against the same curated Islam West Africa Collection corpus, using explicit sentiment dimensions and versioned annotation contracts. It exposes per-model distributions, pairwise and whole-panel agreement, article-level discrepancies, and blind third-party arbitration while preserving the earlier analysis generation instead of silently replacing it.

Its purpose is interpretive comparison, not automated truth assignment. Disagreement is treated as evidence about model-dependent readings and category boundaries, not automatically as error.

## Operating Context

- Researchers work in a browser, in French or English, moving between corpus-level visualizations and article-level evidence.
- They select an analysis generation and model or model pair, then scope the corpus by country, newspaper, sentiment dimensions, or discrepancy where methodologically valid.
- Thirteen views cover distributions, trends, cross-tabulation, publication volume, Hijri seasonality, centrality, newspaper rankings, mapped place mentions, article tables, model comparison, agreement, extreme cases, and arbiter verdicts.
- Filter and view state round-trips through the URL so a particular analytical state can be shared and revisited. Tables can be exported for further analysis.
- Source records remain connected to the Islam West Africa Collection archive; repository metadata and the Zenodo DOI support citation.

## Capabilities and Constraints

- The analytical corpus is the Islam West Africa Collection's historical press collection from Benin, Burkina Faso, Côte d'Ivoire, Niger, and Togo.
- Models annotate polarity, subjectivity, and the centrality of Islam and Muslims to each article.
- Two prompt/model generations are published side by side but never mixed in a statistic. Generation 2 is current; generation 1 remains available so published figures and URLs continue to resolve.
- The application is a static, public SvelteKit web app with no account or server-side session requirement. Its analytical payloads are versioned static JSON generated from checked-in contracts and preprocessing code.
- The interface and explanatory copy are bilingual French/English.
- Analytical state must remain shareable through stable URLs, and generated data must remain reproducible and citable.
- No model is ground truth. Discrepancies are not synonymous with errors, and arbiter results are conditional on the deliberately selected disagreement sample.
- Methodological caveats must remain visible wherever their omission could change interpretation, including prompt-generation differences, non-comparable labels, place mentions versus article aboutness, minimum sample rules, and conditional arbiter percentages.
- Protected OCR is a rights boundary. Private source text may support approved preprocessing, but protected OCR must not be exposed in the public application, dataset projection, generated artifacts, logs, or published explanations.
- Current and archived generation identifiers and deep links must remain stable.

## Brand Commitments

- Product name: **IWAC Sentiment Analysis**.
- The product is an analytical interface to the **Islam West Africa Collection (IWAC)**, curated by Frédérick Madore and hosted by ZMO.
- The voice is scholarly, precise, transparent about uncertainty, and careful not to turn an AI output into an authoritative reading.
- French and English are equal product languages rather than a primary language plus a partial translation.
- Existing identity and proof assets include `ma-visualisation-sentiments/static/social-preview.png`, the model logos under `ma-visualisation-sentiments/static/logo/`, `CITATION.cff`, and the Zenodo DOI `10.5281/zenodo.21806223`.

## Evidence on Hand

- The authoritative source archive is the Omeka S site at `https://islam.zmo.de`; public, shareable dataset material is projected through `fmadore/islam-west-africa-collection` on Hugging Face.
- Shipped analytical payloads live under `ma-visualisation-sentiments/static/data/`, with per-generation manifests recording contract versions, immutable source revisions, file sizes, and SHA-256 hashes.
- Annotation scales, model membership, pair membership, prompt generations, and data-file expectations are defined in `ma-visualisation-sentiments/src/lib/data/sentiment-v1.json` and `ma-visualisation-sentiments/src/lib/data/sentiment-v2.json`.
- `data-preprocess/` contains the reproducible extraction, normalization, validation, extreme-analysis, place-export, and arbiter workflows used to create the frontend payloads.
- `README.md`, `CLAUDE.md`, and the in-product methodology explain the analytical contract and its interpretation limits.
- `CITATION.cff` and the Zenodo DOI provide the citation record. The repository does not contain testimonials, customer claims, or impact benchmarks; future work must not fabricate them.

## Product Principles

1. **Expose disagreement instead of smoothing it away.** Let users see where models converge, where they diverge, and whether a difference is categorical conflict or a systematic offset.
2. **Put methodology ahead of certainty.** Every statistic must remain interpretable in light of its prompt, sample, exclusions, comparison scope, and known limitations.
3. **Make research states reproducible.** Preserve stable identifiers, deep links, versioned contracts, manifests, export paths, and citation metadata.
4. **Preserve historical interpretability.** Keep the archived analysis generation intact and prevent cross-generation comparisons from masquerading as model-only effects.
5. **Respect source rights and scholarly access.** Protect restricted OCR while keeping public metadata, derived analysis, provenance, and bilingual explanatory material available.

## Accessibility & Inclusion

- Core navigation, filters, tables, dialogs, and model-selection controls must remain operable by keyboard and expose meaningful accessible names and state.
- The document language and interface copy must follow the active French or English locale.
- Sentiment, discrepancy, and selection state must never be communicated by hue alone.
- Automated accessibility checks cover WCAG A/AA serious and critical violations, but semantic structure, focus behavior, touch targets, readable data alternatives, and responsive operation remain part of the product definition of done.
