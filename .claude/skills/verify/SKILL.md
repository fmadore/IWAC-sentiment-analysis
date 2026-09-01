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
`svelte.config.js` or `vite.config.ts`**, add:

```bash
npm run build
```

## Pass criteria

- **`npm run lint`** chains four things: `prettier --check .`, `eslint .`,
  `scripts/check-store-cycles.mjs` and `scripts/check-design-tokens.mjs`. A
  formatting failure is not a real defect — run `npm run format` (or
  `npx prettier --write <files>`) and re-run. The other two are: a module inside
  `stores/` imported the `./index` barrel, or a component shipped a raw hex, a
  raw px/rem font-size, a Tailwind colour utility, an undefined token, a
  `var()` fallback, or a watched class that nothing defines.
- **`npm run check`** must end with a summary reading literally
  `0 ERRORS 0 WARNINGS`. Warnings count. svelte-check exits 0 in some warning
  cases, so read the summary line rather than trusting the exit code.
- **`npm run test:run`** must report every file passed. If CI went red straight
  after a dependency merge, run this first — `runes: true` forces runes mode onto
  `node_modules`, so a bump shipping a legacy `export let` component breaks the
  build and the Pages deploy fails quietly.
- **`npm run build`** must complete *and* run both postbuild steps. Expect
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
