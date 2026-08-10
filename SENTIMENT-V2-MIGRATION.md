# Sentiment v2 migration — issue #129

Working document for the two-generation migration. **Delete it once #129 closes**
— the repo does not keep completed tracking docs.

**Status:** Phases A and B are implemented, verified and merged into this branch.
Phases C and D remain.

|              |                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Issue        | [#129](https://github.com/fmadore/IWAC-sentiment-analysis/issues/129)                          |
| Pull request | [#137](https://github.com/fmadore/IWAC-sentiment-analysis/pull/137)                            |
| Commits      | `3e7d3d6` data pipeline · `affa34b` generation derivation · `d796c3c` v2 showcase + v1 archive |

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
  with a `--limit N` cap and a `--dry-run` cost gate.

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

## Todo — Phase C: the three-way arbiter

Until this lands, the arbiter view under v2 shows an honest "no arbiter data
available" state and `ArbiterMethodology` still names Gemini 3 Pro.

### `data-preprocess/arbiter-evaluation-v2.py` (leave the v1 script alone)

- **Selection** — public-repo dataset plus `CONTRACT_V2` through
  `calculate_three_way_spread`; eligible rows are those with a significant
  spread. `--limit N` keeps the top N by `total_spread`, tie-broken by article id
  so the choice is deterministic. `--dry-run` prints the eligible and selected
  counts plus a cost estimate and exits without an API call.
- **Article text from the private mirror.** The public projection masks `OCR`
  per row, so roughly two fifths of the articles v1 arbitrated were judged on an
  empty string. v2 reads `load_iwac_full_text()` (needs `HF_TOKEN`) and records
  **both** revisions — public scores and private text — in the metadata and the
  cache fingerprint. Only verdicts and justifications are published; no OCR is
  serialised.
- **Blind assignment** — one global random permutation of the three ids onto
  labels a/b/c, persisted as `blind_permutation` and reused on incremental runs.
  This is the analogue of v1's `model_a_is_first`, which must round-trip.
- **Anthropic** — add `anthropic` to `requirements.txt`, checking the current
  version on PyPI at implementation time. Use
  `client.messages.parse(model="claude-opus-5", …, output_format=ArbiterResponseV2)`.
  Pass **no temperature**: sampling parameters are rejected on Opus 5. Thinking
  is on by default and counts against `max_tokens`, so leave headroom
  (16000 is safe non-streaming). A refusal `stop_reason` is a failure, not a
  retry; a Pydantic `ValidationError` is deterministic and must not be retried
  either. Re-check the structured-output API against the `claude-api` skill.
- **Prompt** — a French system instruction generalising v1's to three anonymised
  analyses (A/B/C), with subjectivity presented under the v2 label names. The
  user prompt is title + text truncated to 15000 characters + the three analyses
  in permuted order. Store both verbatim in `src/lib/data/prompts.ts`.
- **Cache** — generalise `arbiter_cache.py` to take a contract plus extra payload.
  Key the v2 payload's analyses by **canonical model id** so the fingerprint is
  permutation-independent. Pin the v1 fingerprint with a regression test so the
  refactor cannot shift it. `--prune-cache-only`, incremental saves and
  confirm-before-spend all mirror v1.

### Output `static/data/iwac_arbiter_evaluations_v2.json`

The filename matches the existing `iwac_arbiter_evaluations_` prefix in `sw.js`,
so no service-worker change is needed. Metadata carries the contract, cache and
prompt versions, the arbiter model, `mode: "three-way"`, the model list, the
blind permutation, the selection rule and both source revisions. Each evaluation
carries the article id, cache fingerprint, spread block and the arbiter's
per-dimension verdicts with `preferred: "a" | "b" | "c" | "multiple" | "none"`.

### Dashboard view

Build **new components plus a new leaf store**, selected by generation in
`ViewContent.svelte` — not branches inside `ArbiterView`, whose A/B
`model_a_is_first` logic is deeply pairwise and has to stay stable for the
archive. Stats cards should look models up **by dataset id**, not by the
display-name string match the v1 cards use.

The paid run is user-gated: land the script and its dry-run output, and let the
maintainer trigger the real run.

## Todo — Phase D: polish

- Update the model list in `scripts/social-preview.py`, re-run it (needs Pillow)
  and commit the PNG; the GitHub social-preview upload is manual.
- Document the two-generation model, the frozen-base invariant, the required
  `--generation` flag, `HF_TOKEN` / `ANTHROPIC_API_KEY` and the archive UX in
  `README.md` and `CLAUDE.md`.
- Map every #129 checkbox to where it landed.

## Open risks

1. **DeepSeek declined subjectivity on 489 articles** it otherwise analysed, so
   subjectivity statistics involving it rest on a slightly smaller sample. Worth
   a methodology note.
2. **Arbiter cost is unknown until the dry-run.** For scale, the
   `mistral-small` ↔ `deepseek` _pairwise_ comparison shows 926 significant
   conflicts; the three-way spread count will differ.
3. **HF revision drift.** If a future snapshot's article id set differs from the
   frozen base, the v2 fetch fails by design — the choice is then between pinning
   an older revision and a coordinated dual-generation refresh that breaks v1
   byte-stability.
4. Luna shares ChatGPT's logo and colour with the archived `chatgpt`. Acceptable
   because the two generations never render together.
