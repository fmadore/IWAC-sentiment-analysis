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

- **`npm run lint`** chains three things: `prettier --check .`, `eslint .`, and
  `scripts/check-store-cycles.mjs`. A formatting failure is not a real defect —
  run `npm run format` (or `npx prettier --write <files>`) and re-run. A
  store-cycle failure is: a module inside `stores/` imported the `./index`
  barrel.
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

Only the pure helpers are covered; nothing here touches the network or API keys.

```bash
python -m pytest data-preprocess/test_shared.py -q
python -m py_compile data-preprocess/<changed>.py
```

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
