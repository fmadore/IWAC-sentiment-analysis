# Sentiment v2 migration — issue #129

Working document for the two-generation migration. **Delete it once #129 closes**
— the repo does not keep completed tracking docs.

**Status:** Phases A, B and C are implemented, verified and merged to `main`.
Phase D is partly done. **The one substantive thing left is the paid arbiter
run** — the script and the view are shipped, but nobody has spent yet, so
`iwac_arbiter_evaluations_v2.json` does not exist and the v2 arbiter view shows
its empty state by design.

|               |                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue         | [#129](https://github.com/fmadore/IWAC-sentiment-analysis/issues/129)                                                                                                                 |
| Pull requests | [#137](https://github.com/fmadore/IWAC-sentiment-analysis/pull/137) (A + B) · [#138](https://github.com/fmadore/IWAC-sentiment-analysis/pull/138) (C)                                 |
| Commits       | `3e7d3d6` data pipeline · `affa34b` generation derivation · `d796c3c` v2 showcase + v1 archive · `c1cd952` three-way arbiter · `9004905` arbiter view · `4f46892` dimension selection |

---

## Context

The Hugging Face `articles` subset carries a complete generation-2 campaign
(`gpt_5_6_luna_*`, `mistral_small_2603_*`, `deepseek_v4_flash_0731_*`) covering
12,305 of 12,356 articles — the 51 non-French/English articles are skipped by
design, because the prompt is French and a French-prompted model returns
confident but unusable output for them.

The v2 prompt differs from v1 (fingerprint `d14ace9ac192`): subjectivity is
answered as an ordinal **label** (`Très objectif` … `Très subjectif`, empty where
the model declined) instead of an integer 1–5, the self-checklist instruction is
gone, and boundary rules were added for Muslim actors in secular stories,
Arab-state cooperation and armed groups. A v1↔v2 difference therefore confounds
model change with prompt change; say so when reporting one.

## Decisions

- **v1 placement** — hidden archive. Pickers offer only the current generation;
  a footnote link in the methodology card switches to v1, and an archive banner
  then makes the state unmistakable with one click back. `?dataset=chatgpt` and
  `?pair=chatgpt-gemini` keep working unchanged.
- **v2 ids** — `luna`, `mistral-small`, `deepseek`; display names "GPT-5.6 Luna",
  "Mistral Small 4 (2603)", "DeepSeek v4 Flash". Defaults `luna` /
  `luna-mistral-small`.
- **Subjectivity** — Python maps label → rank 1–5 at generation time, declined →
  `null`. The frontend stays numeric, which preserves roughly fifteen numeric
  code paths (kappa weighting, correlation, map scales, filters, sorting, CSV).
- **Arbiter** — three-way simultaneous with `claude-opus-5`, replacing v1's
  pairwise Gemini 3 Pro runs. Selection is any dimension with a 3-way spread ≥ 3,
  with a `--limit N` cap and a `--dry-run` cost gate. (Phase C also added
  `--dimensions` and `--threshold`, which can only tighten this — see below.)

## Invariants worth guarding

1. **Generation is derived from the id, never stored.** `generationOf()` in
   `src/lib/domain/sentimentContract.ts` and `datasetState.generation` do the
   work; there is no generation URL parameter. This is why v1 and v2 ids must
   never collide, which an import-time invariant asserts.
2. **Never split a pair id on `-`.** A v2 model id contains a hyphen, so
   `mistral-small-deepseek` would split into a model that does not exist. Both
   languages read `pairs: [{id, models}]` from the contract, and both assert
   `id === models.join('-')` at load.
3. **`--generation` is required, deliberately without a default.** An unflagged
   re-run of `data-fetch.py` would rewrite the frozen v1 files from whatever
   revision is current. A v2 run does not write `iwac_articles_base.json` at all;
   it asserts the live article id set still matches it and fails loudly on drift.
4. **An unknown subjectivity label raises.** Returning `None` would ship a
   complete set of well-formed files full of nulls without erroring anywhere.

---

## Done — Phase A: contracts and Python generation

- `src/lib/data/sentiment-v2.json` is a sibling contract; the v1 JSON is untouched.
- `iwac_preprocess/contract.py` became a per-generation `SentimentContract`, but
  every module-level name still resolves to v1, so `shared.py`'s star import and
  the v1 scripts keep their exact behaviour.
- `source.py` is parameterised by contract; `load_iwac_full_text()` reads the
  private `-full` mirror for Phase C; revisions are tracked per repository.
- `data-fetch.py` and `extreme-analysis.py` take `--generation {v1,v2}`.
- `iwac_data_manifest_v2.json` is written separately; the v1 manifest is untouched.
- `calculate_three_way_spread()` added to `discrepancy.py`; the validator now
  checks both generations, and has `validate_arbiter_three_way()` waiting for the
  Phase C output file.
- Shared cross-language fixtures: `discrepancy-v2-fixtures.json` (pairwise plus
  a `threeWay` block) and `subjectivity-labels-v2-fixtures.json`.

Generated from HF revision `282adc34`: 100 new files, **zero modified**. Rank
counts reproduce the upstream label counts exactly, and each model carries
exactly 51 all-null rows.

## Done — Phase B: frontend

- Dual-generation registry in `sentimentContract.ts`, with import-time
  invariants for id collisions, pair membership, shared scales and shard counts.
- `datasetState.generation` derived; `availableInGeneration` /
  `pairsInGeneration` scope the pickers; mode toggling keeps the generation stable.
- Agreement, prefetch and `loadAllDatasets` scoped to the active generation — a
  six-rater kappa would measure the prompt rewrite as if it were disagreement
  between models. Comparison-mode journals no longer pinned to chatgpt+gemini.
- `validation.ts`: `requireV1` → `requireGeneration`, derived from the model id.
- `ArchiveNotice.svelte`, the archive link in `AnalysisInfo`, v2 model entries, a
  generation-aware prompt modal, and SEO copy naming the v2 models.
- `static/logo/DeepSeek_logo.svg` cropped to the whale glyph, `--brand-deepseek`,
  PWA shortcuts pointing at the v2 ids.
- `calculateThreeWaySpread()` in `derivations.ts` — the browser half of the
  arbiter selection metric, held to the Python implementation by the fixtures.

Verified in a real browser against the production build: the default lands on v2,
the v1 archive round-trip works, pickers scope correctly, agreement computes
68.6% over 12,305 articles, extremes and the DeepSeek logo render, and the
hyphenated v2 pair resolves.

---

## Done — Phase C: the three-way arbiter

Shipped as planned, in `data-preprocess/arbiter-evaluation-v2.py` (the v1 script
is untouched), `ArbiterV2View` / `ArbiterV2StatsCards` / `ArbiterV2Methodology` /
`ArbiterCoverage`, and the `arbiterV2` leaf store, selected by generation in
`ViewContent.svelte`. `arbiter_cache.py` was generalised to take a contract plus
extra payload, with the v1 fingerprint pinned by a regression test.

Two things landed differently from the plan:

- **`--dimensions` and `--threshold` were added** (commit `4f46892`), because the
  dry run showed the contract rule selects 1,449 articles of which **1,223 are
  triggered by subjectivity alone** — the dimension the models argue about most
  and where "who is right" is least well defined. Polarity, the dimension the
  research question turns on, triggers only 89. Both flags can only ever
  _tighten_ the rule: the validator recomputes eligibility from the contract, so
  a loosened selection would fail validation. `test_threshold_cannot_be_lowered_below_the_contract`
  pins this.
- **`--effort` rather than a token budget.** `output_config.effort` (default
  `medium`) is the depth _and_ cost lever on Opus 5; `max_tokens` only has to
  leave headroom for adaptive thinking. A `refusal` stop reason counts the
  article as failed rather than retrying or falling back to another model —
  the published metadata names one `arbiter_model`, and quietly mixing in a
  second would corrupt provenance.

**Still to do: the paid run itself.** It is user-gated by design. Land order is
`--dry-run` to price it, then `--dimensions polarity --yes` for the ~90 articles
the research question actually turns on.

## Todo — Phase D: polish

- [x] `scripts/social-preview.py` now reads its model list from the generation's
      contract instead of a hardcoded triple — it had already gone stale once.
      Keyed on `analysisModel`, not `displayName`, because in v1 `displayName` is
      the vendor slot ("ChatGPT") and only `analysisModel` names the model
      ("GPT-5 mini"). Card regenerated for v2; **the GitHub social-preview upload
      under Settings → General is still manual and has no REST API.**
- [x] `README.md` rewritten for the two-generation model (538 → 261 lines):
      generation table, id-derivation, the archive UX, the v1↔v2 prompt
      confound, the required `--generation` flag, `HF_TOKEN` /
      `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY`, and the unpublished-arbiter state.
- [x] `CITATION.cff` abstract and `package.json` description now describe both
      campaigns. **The version was deliberately not bumped** — publishing a
      release mints a permanent Zenodo DOI, so that is the maintainer's call.
- [ ] `CLAUDE.md` still describes only the v1 contract and the vendor-prefix
      mapping; it needs the two-generation model and the never-split-a-pair-id
      rule.
- [ ] Map every #129 checkbox to where it landed, then delete this file.

## Open risks

1. **DeepSeek declined subjectivity on 489 articles** it otherwise analysed, so
   subjectivity statistics involving it rest on a slightly smaller sample. Worth
   a methodology note.
2. **Arbiter selection is dominated by subjectivity.** The contract rule picks
   1,449 articles, 1,223 of them on subjectivity alone and only 89 on polarity.
   Paying for the unfiltered set would buy mostly verdicts on the dimension
   where "who is right" is least well defined — hence `--dimensions`. The cost
   of a given selection is still only knowable from `--dry-run`.
3. **HF revision drift.** If a future snapshot's article id set differs from the
   frozen base, the v2 fetch fails by design — the choice is then between pinning
   an older revision and a coordinated dual-generation refresh that breaks v1
   byte-stability.
4. Luna shares ChatGPT's logo and colour with the archived `chatgpt`. Acceptable
   because the two generations never render together.
