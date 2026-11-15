---
name: verify
description: Run this repo's pre-commit verification — lint, type check, tests, and build — in the order that catches failures earliest, with the pass criteria that are not obvious from the script names. Use before committing anything that ships through CI, and whenever asked to check that a change is sound.
---

# Verifying a change

CI is the safety net, not the primary check loop. A red CI run for something
`npm run lint` catches locally costs a round-trip and pollutes the run history.

Everything below runs from `ma-visualisation-sentiments/`.

## Order

Run these in sequence and stop at the first failure — each is cheaper than the
next, and a type error usually explains a downstream test failure.

```bash
npm run lint && npm run check && npm run test:run
```

Then, **only if you touched `src/`, `static/`, `scripts/`, `deploy.config.js`,
or `vite.config.ts`**, add:

```bash
npm run build
```

## Pass criteria

- **`npm run lint`** chains five things: `prettier --check .`, `eslint .`,
  `scripts/check-store-cycles.mjs`, `scripts/check-design-tokens.mjs` and
  `scripts/check-i18n-keys.mjs`. A formatting failure is not a real defect —
  run `npm run format` (or `npx prettier --write <files>`) and re-run. The
  store check fails when a module inside `stores/` imports the `./index`
  barrel. The design check fails on a raw hex/`rgb()`/`hsl()` outside
  `tokens.css`, a CSS colour keyword such as `white` in a colour declaration, a
  px/rem/em `font-size`, a non-zero `letter-spacing` length, a non-zero ms/s
  `transition`/`animation` duration, a Tailwind colour or typography utility,
  an undefined token, a `var()` fallback, a watched class that nothing defines,
  or a `TEMPORARY_ALLOW` entry that no longer matches (delete it with the fix).
  The i18n check (run with `--strict`) fails on a catalogue key nothing in
  `src/` references and on an en/fr placeholder mismatch; a key reached by a
  computed name belongs in its `DYNAMIC_KEYS` list, not back in the source.
- **`npm run check`** runs `svelte-check --fail-on-warnings` and then
  `tsc -p tsconfig.node.json`, which type-checks the e2e specs and the tool
  configs svelte-check never sees. The svelte-check summary must read literally
  `0 ERRORS 0 WARNINGS`; with `--fail-on-warnings` a warning now also fails the
  exit code.
- **`npm run test:run`** must report every file passed. If CI went red straight
  after a dependency merge, run this first — `runes: true` forces runes mode onto
  `node_modules`, so a bump shipping a legacy `export let` component breaks the
  build and the Pages deploy fails quietly. Tests run in two Vitest projects:
  `node` by default, `dom` (jsdom) for the paths listed in `vitest.config.ts`
  (components, stores, i18n, a few utils). A new test elsewhere that needs a
  DOM fails with "document is not defined"; give it a
  `// @vitest-environment jsdom` first line or add its path there.
- **`npm run build`** must complete _and_ run both postbuild steps. Expect
  `[nest-build] Root ready: …` followed by `[stamp-sw] Stamped …`. Missing either
  line means the deploy artifact is malformed even though the build "passed".

## Deployment changes need the output inspected

The build output is nested on purpose (see `deploy.config.js`). After a build
that touched anything path-related, confirm the shape rather than assuming it:

```bash
ls build && ls build/sentiment-analysis | head
```

`build/` must contain `CNAME`, `404.html`, `index.html` and the deploy-path
directory; the app itself lives in the nested directory. Also confirm no
`__DEPLOY_PATH__` placeholder survived into the output — a stale `.gz`/`.br`
variant is the usual culprit, because compression runs before stamping.

## Python

The `Python / generated data` job runs **three** gates, and the formatter is the
one that gets missed — `pytest` passing says nothing about it. Run all three,
from the repo root, before pushing anything under `data-preprocess/`:

```bash
ruff check data-preprocess && ruff format --check data-preprocess && python -m pytest data-preprocess -q
```

`ruff` is in `requirements-dev.txt`, not `requirements.txt`, so a venv set up for
running the pipeline will not have it — `python -m pip install -r
data-preprocess/requirements-dev.txt` first. Use `ruff format data-preprocess`
(no `--check`) to fix; the diff is always cosmetic.

Note `pytest data-preprocess` runs the **whole** directory in CI, including
`test_generated_data.py`, which validates every checked-in JSON asset. Running
one test file locally is not the same check.

Nothing here touches the network or API keys.

## Known lint trap

`svelte/no-navigation-without-resolve` does **not** honour disable comments
written as template HTML comments. The repo's pattern is the per-file exemption
list in `eslint.config.js` — add the file there rather than fighting the rule
inline.

## Browser verification

Console and network output from a headless pane are reliable; rendering is not.
Automated browsers never composite, so canvas and WebGL surfaces (every ECharts
view, the MapLibre map) look broken there regardless of correctness. Judge
"does it render" in a real browser, and use the pane for errors, request status
and DOM structure.

### The e2e suite fails under load, not under parallelism

`npm run test:e2e` drives the whole `e2e/` suite against a single
`npm run preview` server, and `playwright.config.ts` pins `workers: 2` to match
CI. **Don't raise it locally.** The reason is narrower than "too much
parallelism", and the difference matters when you are reading a failure:

- Idle machine: no failures at 1, 2, 4 or 11 workers (24 suite runs).
- With a `vitest` run alongside: **11 workers failed 2 of 4 runs; 2 workers
  failed 0 of 4.**

So worker count only bites when the machine is already busy — which is the
normal case here, because e2e runs last, right after a build. The symptom does
not read as contention: `keeps the model-pair menu inside the page` fails its
390px-viewport geometry assertion, and `keeps comparison table cells in their
columns` fails on cell positions. Both look exactly like a mobile layout
regression, and after a dependency bump they look like one that bump caused.

Before bisecting a geometry failure, re-run the single spec on a quiet machine
(`npx playwright test -g "<title>"`). Local `retries` stays 0 on purpose, so
nothing is silently papered over — but a single red run is not yet evidence.
