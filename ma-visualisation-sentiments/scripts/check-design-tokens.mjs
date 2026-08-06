// Guards the design-system conventions that CLAUDE.md states but nothing
// enforced. Run via `npm run lint`, alongside check-store-cycles.mjs.
//
// The design system in app.css is good; the problem was that four styling
// systems reached the same properties with equal authority and no rule said
// which won, so components drifted — worst in the newest views. A rule nobody
// can violate does not need to be remembered, which is what this file is for.
//
// Four checks, each closing a failure that actually shipped:
//
//   1. undefined-token   — a var(--x) nobody defines. `--elevation-overlay` and
//                          `--text-faint` both shipped this way. CSS treats the
//                          whole declaration as invalid and moves on, so the
//                          element silently inherits and no tool complains.
//   2. var-fallback      — `var(--x, <fallback>)`. The fallback is what turned
//                          check 1 into silence for months. If a token is
//                          missing, fail loudly instead.
//   3. raw-color         — a hex/rgb()/hsl() literal in a component. Colour is
//                          the token layer's job. (chartTheme.ts is exempt:
//                          ECharts cannot parse oklch, and that duplication has
//                          its own guard in chartTheme.palette.test.ts.)
//   4. tailwind-color    — a Tailwind colour utility in markup. This is the one
//                          the written rule missed: "never hardcode colours"
//                          read as being only about hex, so `text-white/60` and
//                          `text-amber-400` walked straight past it. Tailwind
//                          may set layout and nothing else.
//
// Deliberately a plain node script rather than stylelint: it matches the
// existing check-store-cycles.mjs idiom, needs no new dependency, and this
// project is actively removing dependencies rather than adding them.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

/**
 * Files exempt from the raw-colour rule, with the reason. Anything added here
 * needs a reason that survives being read aloud.
 */
const RAW_COLOR_EXEMPT = new Map([
	[
		'lib/utils/chartTheme.ts',
		'ECharts cannot parse oklch(); guarded by chartTheme.palette.test.ts'
	],
	['lib/utils/oklch.ts', 'the oklch->hex converter itself'],
	// zrender and MapLibre share chartTheme's constraint but take their colours
	// as literal strings at call sites rather than from the palette object.
	['lib/utils/chartFormatters.ts', 'rgba() passed straight to zrender, which has no oklch parser'],
	['lib/components/viz/SentimentMap.svelte', 'MapLibre GL style spec: no modern colour spaces'],
	['lib/components/viz/AgreementMatrix.svelte', 'rgba() in an ECharts option object'],
	['lib/components/viz/CentralityHeatmap.svelte', 'rgba() in an ECharts option object'],
	// Third-party brand marks, deliberately off the OKLCH ramps. The CSS side
	// reads --brand-* from app.css; this is the TS-side registry for chart and
	// logo use, where custom properties cannot reach.
	['lib/stores/datasets.svelte.ts', 'third-party model brand identity registry']
]);

/** Tailwind utilities that carry design meaning rather than layout. */
const TAILWIND_COLOR = new RegExp(
	[
		// text-white, bg-white/60, border-black, …
		String.raw`\b(?:text|bg|border|ring|divide|placeholder|from|via|to)-(?:white|black)(?:\/\d+)?\b`,
		// text-amber-400, bg-red-500/20, …
		String.raw`\b(?:text|bg|border|ring|divide|placeholder|from|via|to)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b`
	].join('|'),
	'g'
);

const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
const VAR_REFERENCE = /var\(\s*(--[\w-]+)\s*(,)?/g;
// A token counts as defined by a CSS declaration (`--x: …`) or by Svelte's
// style directive (`style:--x="…"`), which is how components hand a computed
// value down to their own stylesheet.
const TOKEN_DEFINITION = /(?:style:)?(--[\w-]+)\s*[:=]/g;

function collect(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			if (entry !== 'node_modules') out.push(...collect(path));
		} else if (/\.(svelte|css|ts)$/.test(path)) {
			out.push(path);
		}
	}
	return out;
}

const files = collect(srcDir);
const problems = [];

const report = (file, line, rule, detail) =>
	problems.push({ file: relative(srcDir, file).replace(/\\/g, '/'), line, rule, detail });

// ---------------------------------------------------------------------------
// Pass 1 — every token this project defines anywhere.
// ---------------------------------------------------------------------------
const defined = new Set();
for (const file of files) {
	for (const match of readFileSync(file, 'utf8').matchAll(TOKEN_DEFINITION)) {
		defined.add(match[1]);
	}
}

// Tailwind injects a handful of custom properties we consume but never declare.
// Treat its namespace as defined rather than pretending we own it — the point of
// check 1 is *our* tokens, not vendor ones.
//
// `--color-*` is deliberately NOT here any more: those used to come from
// Skeleton's Cerberus theme, and with that dependency gone they are declared in
// app.css like everything else, so they should be checked like everything else.
const VENDOR_PREFIXES = ['--tw-', '--spacing'];
const isVendor = (token) => VENDOR_PREFIXES.some((prefix) => token.startsWith(prefix));

// ---------------------------------------------------------------------------
// Pass 2 — the four checks.
// ---------------------------------------------------------------------------
for (const file of files) {
	const relativePath = relative(srcDir, file).replace(/\\/g, '/');
	const isTest = /\.(test|spec)\.ts$/.test(relativePath);
	const exemptReason = RAW_COLOR_EXEMPT.get(relativePath);

	readFileSync(file, 'utf8')
		.split('\n')
		.forEach((text, index) => {
			const line = index + 1;

			for (const match of text.matchAll(VAR_REFERENCE)) {
				const [, token, hasFallback] = match;
				if (!defined.has(token) && !isVendor(token)) {
					report(file, line, 'undefined-token', `var(${token}) is never defined`);
				}
				if (hasFallback) {
					report(
						file,
						line,
						'var-fallback',
						`var(${token}, …) — a fallback turns a missing token into silence`
					);
				}
			}

			// A colour literal is legitimate in exactly one place: the right-hand
			// side of a token definition. That IS the token layer — the rule is
			// "literals live here and nowhere else", not "no literals anywhere".
			const definesToken = /^\s*--[\w-]+\s*:/.test(text);

			if (!exemptReason && !isTest && !definesToken) {
				for (const match of text.matchAll(RAW_COLOR)) {
					// `#` inside a URL fragment or an id selector is not a colour.
					if (match[0].startsWith('#') && !/^#[0-9a-fA-F]{3,8}$/.test(match[0])) continue;
					report(file, line, 'raw-color', `${match[0]} — use a token from app.css`);
				}
			}

			for (const match of text.matchAll(TAILWIND_COLOR)) {
				report(
					file,
					line,
					'tailwind-color',
					`${match[0]} — Tailwind may set layout only; colour goes through a token`
				);
			}
		});
}

if (problems.length > 0) {
	const byRule = new Map();
	for (const problem of problems) {
		byRule.set(problem.rule, [...(byRule.get(problem.rule) ?? []), problem]);
	}

	console.error(`[check-design-tokens] ${problems.length} problem(s):\n`);
	for (const [rule, entries] of byRule) {
		console.error(`  ${rule} (${entries.length})`);
		for (const { file, line, detail } of entries) {
			console.error(`    ${file}:${line}  ${detail}`);
		}
		console.error('');
	}
	process.exit(1);
}

console.log(`[check-design-tokens] OK — ${files.length} files, ${defined.size} tokens defined`);
