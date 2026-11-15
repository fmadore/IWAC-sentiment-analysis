// Guards the design-system conventions that CLAUDE.md states but nothing
// enforced. Run via `npm run lint`, alongside check-store-cycles.mjs.
//
// The design system in app.css is good; the problem was that four styling
// systems reached the same properties with equal authority and no rule said
// which won, so components drifted — worst in the newest views. A rule nobody
// can violate does not need to be remembered, which is what this file is for.
//
// The checks, each closing a failure that actually shipped or a rule DESIGN.md
// claimed was enforced before it was:
//
//   1. undefined-token    — a var(--x) nobody defines. `--elevation-overlay` and
//                           `--text-faint` both shipped this way. CSS treats the
//                           whole declaration as invalid and moves on, so the
//                           element silently inherits and no tool complains.
//   2. var-fallback       — `var(--x, <fallback>)`. The fallback is what turned
//                           check 1 into silence for months. If a token is
//                           missing, fail loudly instead.
//   3. raw-color          — a hex/rgb()/hsl() literal in a component. Colour is
//                           the token layer's job. (chartTheme.ts is exempt:
//                           ECharts cannot parse oklch, and that duplication has
//                           its own guard in chartTheme.palette.test.ts.) A
//                           literal on the right of `--x:` is allowed only in
//                           the token file itself, src/lib/styles/tokens.css.
//   4. named-color        — `color: white`, `color-mix(in oklab, black …)`: a CSS
//                           colour keyword in a colour-bearing declaration is a
//                           raw colour by another spelling.
//   5. tailwind-color     — a Tailwind colour utility in markup. This is the one
//                           the written rule missed: "never hardcode colours"
//                           read as being only about hex, so `text-white/60` and
//                           `text-amber-400` walked straight past it. Tailwind
//                           may set layout and nothing else. It also catches the
//                           project's own palette names (`bg-surface-800`,
//                           `text-primary-400`), which are not in Tailwind's
//                           @theme: Tailwind generates nothing for them, so the
//                           element renders unstyled.
//   6. tailwind-type      — a Tailwind typography utility (`text-xs`,
//                           `font-semibold`, `leading-relaxed`, `tracking-wide`)
//                           in a component's markup or script. Same rule.
//   7. raw-font-size      — a px/rem/em length in a `font-size` declaration,
//                           including inside clamp()/calc(). The type scale is
//                           the --font-size-* tokens.
//   8. raw-letter-spacing — a non-zero length in `letter-spacing`. Tracking is
//                           the --tracking-* tokens.
//   9. raw-duration       — a non-zero ms/s literal in a transition or animation
//                           declaration. Motion is --timing-* and --easing-*.
//  10. retired-class      — a component class name from the Skeleton era that no
//                           stylesheet defines any more. `class="btn btn-sm …"`
//                           survived Skeleton's removal in three places and the
//                           buttons lost their entire box: a <button> with an
//                           icon and a label falls back to `display: inline` and
//                           stacks them. Nothing else can see this — the class
//                           names are valid strings and the markup is valid HTML,
//                           so the compiler, svelte-check and the tests all pass.
//
// Checks 4 and 7-9 read CSS declarations (a component's <style> block or a .css
// file), so a value split across lines — `transition:` followed by an indented
// list — is still read whole. A custom-property definition (`--x: …`) is never
// a declaration of those properties, so the token layer defines its values
// without an exemption. Inline `style="…"` attributes are not read: they carry
// computed values.
//
// Violations that predate a check sit in TEMPORARY_ALLOW below, keyed by file,
// rule and the offending text rather than a line number, so an unrelated edit
// does not shift them. An entry that no longer matches anything fails the run:
// the fix is to delete the entry with the violation, never to leave a hole.
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
	// reads --brand-* from tokens.css; this is the TS-side registry for logo
	// surrounds, where custom properties cannot reach (`modelBrandColor`). Model
	// series colours come from chartTheme's categorical palette, not from here.
	// datasets.test.ts holds the two copies equal.
	['lib/stores/datasets.svelte.ts', 'third-party model brand identity registry (logos only)']
]);

/** The one file whose `--x: <literal>` lines are the token layer itself. */
const TOKEN_FILES = new Set(['lib/styles/tokens.css']);

/**
 * Violations that predate the check that finds them. Temporary by definition:
 * the component owes the fix, and an entry that stops matching fails the run
 * so it is deleted with the fix.
 *
 * `match` is compared with the text the rule reports — the declaration value,
 * the colour keyword, or the utility class — not with a line number, so editing
 * the file elsewhere leaves the entry valid.
 */
const TEMPORARY_ALLOW = [];

const UTILITY_PREFIXES = '(?:text|bg|border|ring|divide|placeholder|from|via|to|fill|stroke)';

/** Tailwind utilities that carry design meaning rather than layout. */
const TAILWIND_COLOR = new RegExp(
	[
		// text-white, bg-white/60, border-black, …
		String.raw`(?<![\w-])${UTILITY_PREFIXES}-(?:white|black)(?:\/\d+)?(?![\w-])`,
		// text-amber-400, bg-red-500/20, …
		String.raw`(?<![\w-])${UTILITY_PREFIXES}-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?(?![\w-])`,
		// bg-surface-800, text-primary-400: the project's own palette names.
		String.raw`(?<![\w-])${UTILITY_PREFIXES}-(?:surface|primary|secondary|tertiary|success|warning|error)-\d{2,3}(?:\/\d+)?(?![\w-])`
	].join('|'),
	'g'
);

/** Tailwind typography utilities: type goes through the --font-size-* scale. */
const TAILWIND_TYPE = new RegExp(
	[
		String.raw`text-(?:xs|sm|base|lg|xl|[2-9]xl)`,
		String.raw`font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|mono|sans|serif)`,
		String.raw`leading-(?:none|tight|snug|normal|relaxed|loose|\d+)`,
		String.raw`tracking-(?:tighter|tight|normal|wide|wider|widest)`
	]
		.map((pattern) => String.raw`(?<![\w-])${pattern}(?![\w-])`)
		.join('|'),
	'g'
);

/** CSS colour keywords. `transparent`, `currentColor` and `inherit` are fine. */
const NAMED_COLOR =
	/(?<![\w-])(?:white|black|red|green|blue|gray|grey|silver|yellow|orange|purple|pink|navy|maroon|teal|aqua|fuchsia|lime|olive|gold|brown)(?![\w-])/gi;
const COLOR_PROPERTY =
	/^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?)$/;
const MOTION_PROPERTY = /^(?:transition|animation)(?:-(?:duration|delay))?$/;

/** A length in one of `units`, e.g. `1.5rem` or `.75em`. */
const lengthIn = (units) => new RegExp(String.raw`(?<![\w.-])\d*\.?\d+(?:${units})(?![\w-])`, 'g');
const LENGTH = lengthIn('px|rem|em');
const DURATION = lengthIn('ms|s');
const hasNonZero = (value, pattern) =>
	[...value.matchAll(pattern)].some((literal) => Number.parseFloat(literal[0]) !== 0);

/** A CSS declaration: property, then value up to `;`, `{` or `}`. */
const DECLARATION = /(?<![\w-])([a-z][a-z-]*)\s*:\s*([^;{}]*)/g;
/** var(--x) references, dropped before a value is inspected. */
const VAR_CALL = /var\(\s*--[\w-]+\s*\)/g;

/** Class names in a `class="…"` / `class={…}` attribute, expressions dropped. */
const CLASS_ATTRIBUTE = /class=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
/** Class selectors in a stylesheet. */
const CLASS_SELECTOR = /\.(-?[A-Za-z_][\w-]*)/g;

/**
 * Component class names that came from Skeleton, plus the ones app.css took
 * over from it. Each is checked against what is actually defined — in app.css,
 * or in the using component's own <style> — so this list is a watchlist, not a
 * blocklist. `variant-glass` is on it and passes, because app.css defines it;
 * the day someone deletes that rule, its four call sites fail instead of
 * silently rendering as nothing.
 */
const WATCHED_CLASSES = [
	/^btn(-.+)?$/,
	/^chip$/,
	/^variant-.+$/,
	/^card$/,
	/^badge$/,
	/^alert$/,
	/^select(-.+)?$/,
	/^table(-hover|-comfortable|-compact)?$/
];
const isWatched = (name) => WATCHED_CLASSES.some((pattern) => pattern.test(name));

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
const allowUsed = new Set();

/**
 * Record a problem unless TEMPORARY_ALLOW covers it. `subject` is the text an
 * entry's `match` is compared with.
 */
const report = (file, line, rule, detail, subject = detail) => {
	const path = relative(srcDir, file).replace(/\\/g, '/');
	const allowed = TEMPORARY_ALLOW.find(
		(entry) => entry.file === path && entry.rule === rule && subject.includes(entry.match)
	);
	if (allowed) {
		allowUsed.add(allowed);
		return;
	}
	problems.push({ file: path, line, rule, detail });
};

/**
 * Erase what a match covers while keeping the file's line count, so reported
 * line numbers stay true.
 */
const blank = (source, pattern) => source.replace(pattern, (match) => match.replace(/[^\n]/g, ''));

const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const MARKUP_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * A component's markup and its <style> block, separated, with comments erased
 * from both. Prose is not code: app.css's own header explains why there is no
 * global `.btn` and quotes `class="btn btn-sm"` while doing it. Read literally,
 * that is both a definition and a use — the check would cancel itself out on
 * the very rule it exists to enforce.
 */
function splitSvelte(source) {
	const styles = [];
	const markup = source.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (match, css) => {
		styles.push(blank(css, CSS_COMMENT));
		return match.replace(/[^\n]/g, '');
	});
	return { markup: blank(markup, MARKUP_COMMENT), styles: styles.join('\n') };
}

/**
 * The file's stylesheet at its original line positions, with everything else
 * blanked and comments erased: a .css file whole, a component's <style> blocks.
 */
function stylesheetOf(file, source) {
	if (file.endsWith('.css')) return blank(source, CSS_COMMENT);
	if (!file.endsWith('.svelte')) return '';
	let out = '';
	let last = 0;
	for (const match of source.matchAll(/(<style[^>]*>)([\s\S]*?)<\/style>/g)) {
		const cssStart = match.index + match[1].length;
		out += source.slice(last, cssStart).replace(/[^\n]/g, '');
		out += blank(match[2], CSS_COMMENT);
		last = cssStart + match[2].length;
	}
	return out + source.slice(last).replace(/[^\n]/g, '');
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

// ---------------------------------------------------------------------------
// Pass 1 — every token this project defines anywhere, and every class name the
// global stylesheets define. Tokens are global by nature; class names are not,
// so a component's own <style> block is read separately, at its use site.
// ---------------------------------------------------------------------------
const defined = new Set();
const globalClasses = new Set();
for (const file of files) {
	const source = readFileSync(file, 'utf8');

	for (const match of source.matchAll(TOKEN_DEFINITION)) {
		defined.add(match[1]);
	}

	if (file.endsWith('.css')) {
		for (const match of blank(source, CSS_COMMENT).matchAll(CLASS_SELECTOR)) {
			globalClasses.add(match[1]);
		}
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
// Pass 2 — the checks.
// ---------------------------------------------------------------------------
for (const file of files) {
	const relativePath = relative(srcDir, file).replace(/\\/g, '/');
	const isTest = /\.(test|spec)\.ts$/.test(relativePath);
	const exemptReason = RAW_COLOR_EXEMPT.get(relativePath);
	const source = readFileSync(file, 'utf8');

	// Check 10 only asks about components, and only about their markup — a class
	// name is defined by app.css or by this file's own <style>, and by nothing
	// else. Scoping it per-file is the point: a `.select-sm` in some other
	// component is not a definition here.
	if (file.endsWith('.svelte')) {
		const { markup, styles } = splitSvelte(source);
		const localClasses = new Set([...styles.matchAll(CLASS_SELECTOR)].map((match) => match[1]));

		markup.split('\n').forEach((text, index) => {
			for (const match of text.matchAll(CLASS_ATTRIBUTE)) {
				const names = (match[1] ?? match[2] ?? match[3] ?? '').split(/[\s'"`]+/);
				for (const name of names) {
					if (!isWatched(name) || globalClasses.has(name) || localClasses.has(name)) continue;
					report(
						file,
						index + 1,
						'retired-class',
						`.${name} is defined neither in app.css nor in this component — it renders as nothing`
					);
				}
			}

			// Check 6 — typography utilities in markup and script, never in the
			// stylesheet (where `--tracking-wide` is a token) or in comments.
			for (const match of text.matchAll(TAILWIND_TYPE)) {
				report(
					file,
					index + 1,
					'tailwind-type',
					`${match[0]} — Tailwind may set layout only; type goes through a token`,
					match[0]
				);
			}
		});
	}

	source.split('\n').forEach((text, index) => {
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
		// side of a token definition in the token file. That IS the token layer —
		// the rule is "literals live there and nowhere else". A `--x: #hex` in a
		// component is a raw colour with a name.
		const definesToken = TOKEN_FILES.has(relativePath) && /^\s*--[\w-]+\s*:/.test(text);

		if (!exemptReason && !isTest && !definesToken) {
			for (const match of text.matchAll(RAW_COLOR)) {
				// `#` inside a URL fragment or an id selector is not a colour.
				if (match[0].startsWith('#') && !/^#[0-9a-fA-F]{3,8}$/.test(match[0])) continue;
				report(file, line, 'raw-color', `${match[0]} — use a token from tokens.css`);
			}
		}

		for (const match of text.matchAll(TAILWIND_COLOR)) {
			report(
				file,
				line,
				'tailwind-color',
				`${match[0]} — Tailwind may set layout only; colour goes through a token`,
				match[0]
			);
		}
	});

	// Checks 4 and 7-9 — declarations, read whole even when they span lines.
	const stylesheet = stylesheetOf(file, source);
	for (const match of stylesheet.matchAll(DECLARATION)) {
		const [, property, rawValue] = match;
		const value = rawValue.replace(VAR_CALL, '');
		if (!value.trim()) continue;
		const line = lineAt(stylesheet, match.index);
		const shown = rawValue.replace(/\s+/g, ' ').trim();

		if (property === 'font-size' && hasNonZero(value, LENGTH)) {
			report(file, line, 'raw-font-size', `font-size: ${shown} — use a --font-size-* token`, shown);
		}
		if (property === 'letter-spacing' && hasNonZero(value, LENGTH)) {
			report(
				file,
				line,
				'raw-letter-spacing',
				`letter-spacing: ${shown} — use a --tracking-* token`,
				shown
			);
		}
		if (MOTION_PROPERTY.test(property) && hasNonZero(value, DURATION)) {
			report(file, line, 'raw-duration', `${property}: ${shown} — use a --timing-* token`, shown);
		}
		if (COLOR_PROPERTY.test(property)) {
			for (const keyword of value.matchAll(NAMED_COLOR)) {
				report(
					file,
					line,
					'named-color',
					`${property}: ${shown} — "${keyword[0]}" is a raw colour; use a token`,
					keyword[0]
				);
			}
		}
	}
}

for (const entry of TEMPORARY_ALLOW) {
	if (allowUsed.has(entry)) continue;
	problems.push({
		file: entry.file,
		line: 0,
		rule: 'stale-allowlist',
		detail: `TEMPORARY_ALLOW entry for ${entry.rule} "${entry.match}" matches nothing — delete it`
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

console.log(
	`[check-design-tokens] OK — ${files.length} files, ${defined.size} tokens defined, ` +
		`${TEMPORARY_ALLOW.length} temporary exemption(s) still owed a fix`
);
