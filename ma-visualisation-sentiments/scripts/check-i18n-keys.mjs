// Guards the translation catalogues. Run via `npm run lint`.
//
//   1. dead-key             — a key in src/lib/i18n/en.ts that nothing in src/
//                             references. fr.ts must mirror en.ts (the
//                             `Translations` type enforces parity), so a dead
//                             key costs two strings that drift unread.
//   2. placeholder-mismatch — an en/fr pair whose `{placeholders}` differ. The
//                             interpolation silently leaves `{count}` on screen
//                             in one language, and no type can see it.
//
// A key counts as referenced when its full dotted path appears in source
// (`$t.common.yes`, `translate('sentiment.notAnnotated')`) — or when it is
// reached dynamically, which DYNAMIC_KEYS below lists with the code that
// builds it. Comments are erased first, so a key named only in prose is dead.
//
// `npm run lint` runs it with `--strict`, so any finding fails the run; without
// the flag it only prints.
//
// Parses the catalogues with the TypeScript compiler API rather than importing
// them, so it needs no build step and no new dependency.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const strict = process.argv.includes('--strict');
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(appDir, 'src');
const i18nDir = join(srcDir, 'lib', 'i18n');

/**
 * Keys reached by a computed path, so their dotted name never appears in
 * source. Each entry is a key prefix (every leaf under it counts) or a full
 * key, with the code that builds it. Keep this short: a key reachable only
 * through a computed name is a key nobody can grep for.
 */
const DYNAMIC_KEYS = new Map([
	['nav', 'layout/SidebarNav.svelte, AppHeader.svelte: $t.nav[item.labelKey] (navItems.ts)'],
	['historyResearch.negative', 'viz/HistoricalModelTrends.svelte: $t.historyResearch[measure]'],
	['historyResearch.central', 'viz/HistoricalModelTrends.svelte: $t.historyResearch[measure]'],
	['historyResearch.subjective', 'viz/HistoricalModelTrends.svelte: $t.historyResearch[measure]'],
	['arbiterV2.polarity', 'ArbiterV2View, ArbiterV2VerdictPanel, …: $t.arbiterV2[dimension]'],
	['arbiterV2.subjectivity', 'ArbiterV2View, ArbiterV2VerdictPanel, …: $t.arbiterV2[dimension]'],
	['arbiterV2.centrality', 'ArbiterV2View, ArbiterV2VerdictPanel, …: $t.arbiterV2[dimension]'],
	['correlation.strength', 'viz/CorrelationChart.svelte: $t.correlation.strength[rhoStrength]'],
	['seasonality.months', 'viz/HijriSeasonalityChart.svelte: $t.seasonality.months[key]'],
	[
		'extremeAnalysis.descriptions',
		'viz/KeywordFrequencyChart.svelte: $t.extremeAnalysis.descriptions[descriptionKey]'
	],
	['meta.views', 'SEOHead.svelte: const m = $t.meta; views[view] ?? m.views.default']
]);

/**
 * Expressions that hold a whole catalogue: the `$t` store, a `$t` snapshot
 * (`currentTranslations`), and functions taking `Translations` as `t` or
 * `labels`. A section reached off one of these and handed on whole is
 * followed through its alias.
 */
const CATALOGUE_ROOTS = String.raw`\$t|(?<![\w$.])t|\blabels|\bcurrentTranslations|\btranslations`;

/** Leaf strings of a catalogue object literal, as `path → text`. */
function readCatalogue(file, exportName) {
	const source = ts.createSourceFile(
		file,
		readFileSync(file, 'utf8'),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);
	const leaves = new Map();

	const visit = (node, path) => {
		for (const property of node.properties) {
			if (!ts.isPropertyAssignment(property)) {
				throw new Error(`${file}: unsupported member at ${path.join('.') || '<root>'}`);
			}
			const name = property.name;
			const key =
				ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
					? name.text
					: name.getText(source);
			let value = property.initializer;
			while (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression;
			const next = [...path, key];
			if (ts.isObjectLiteralExpression(value)) {
				visit(value, next);
			} else if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
				leaves.set(next.join('.'), value.text);
			} else {
				// A function or array leaf: keep it as a key, with its source text
				// standing in for the string so placeholders are still compared.
				leaves.set(next.join('.'), value.getText(source));
			}
		}
	};

	let found = false;
	source.forEachChild((statement) => {
		if (!ts.isVariableStatement(statement)) return;
		for (const declaration of statement.declarationList.declarations) {
			if (declaration.name.getText(source) !== exportName || !declaration.initializer) continue;
			let value = declaration.initializer;
			while (ts.isAsExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression;
			if (!ts.isObjectLiteralExpression(value)) {
				throw new Error(`${file}: ${exportName} is not an object literal`);
			}
			visit(value, []);
			found = true;
		}
	});
	if (!found) throw new Error(`${file}: no \`${exportName}\` catalogue found`);
	return leaves;
}

function collect(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			if (entry !== 'node_modules') out.push(...collect(path));
		} else if (/\.(svelte|ts|js)$/.test(path)) {
			out.push(path);
		}
	}
	return out;
}

const blankComments = (text) =>
	text
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		// Line comments, but not `://` inside a URL.
		.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

const en = readCatalogue(join(i18nDir, 'en.ts'), 'en');
const fr = readCatalogue(join(i18nDir, 'fr.ts'), 'fr');

const catalogueFiles = new Set(['en.ts', 'fr.ts', 'types.ts'].map((name) => join(i18nDir, name)));
const corpus = collect(srcDir)
	.filter((file) => !catalogueFiles.has(file))
	.map((file) => blankComments(readFileSync(file, 'utf8')))
	.join('\n')
	// Prettier breaks long member chains (`$t.audit\n.excluded`), and `?.`
	// reaches a key as surely as `.`: read every access as one dotted path.
	.replace(/\s*\??\.\s*(?=[A-Za-z_$])/g, '.');

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isDynamic = (key) =>
	[...DYNAMIC_KEYS.keys()].some((prefix) => key === prefix || key.startsWith(`${prefix}.`));

// Sections handed around whole: `const copy = $t.analysisV2`, `$t.months[key]`.
// Only accesses off a known catalogue root count, because section names such
// as `map`, `table` and `common` are ordinary identifiers everywhere else.
const prefixes = new Set(
	[...en.keys()].flatMap((key) =>
		key
			.split('.')
			.slice(0, -1)
			.map((_, index, parts) => parts.slice(0, index + 1).join('.'))
	)
);
const aliased = new Set();
const indexed = new Map();
for (const prefix of prefixes) {
	const access = new RegExp(
		String.raw`(?:${CATALOGUE_ROOTS})\.${escape(prefix)}(?![\w$])(\s*(?:\??\.\s*[A-Za-z_$]|\(|\[))?`,
		'g'
	);
	for (const match of corpus.matchAll(access)) {
		const next = match[1]?.trim() ?? '';
		if (next === '' || next.startsWith('(')) {
			if (!next) aliased.add(prefix);
		} else if (next.startsWith('[')) {
			indexed.set(prefix, (indexed.get(prefix) ?? 0) + 1);
		}
	}
}

/**
 * Whether `key` is reached through an aliased section: `copy.config`, or a
 * scale step's `copyKey: 'polarityPositive'` (utils/scaleItems.ts), which the
 * methodology cards resolve against a section handed over whole.
 */
const viaAlias = (key) =>
	[...aliased].some((prefix) => {
		if (!key.startsWith(`${prefix}.`)) return false;
		const leaf = escape(key.slice(prefix.length + 1));
		return new RegExp(String.raw`\.\s*${leaf}(?![\w$])|copyKey:\s*'${leaf}'`).test(corpus);
	});

const deadKeys = [...en.keys()].filter(
	(key) =>
		!isDynamic(key) &&
		!new RegExp(`(?<![\\w$])${escape(key)}(?![\\w$])`).test(corpus) &&
		!viaAlias(key)
);

// A computed index the allow-list does not cover: its keys look dead, and the
// fix is to list the section with the code that builds the key.
// A section is covered when the allow-list names it or any key inside it.
const unlistedIndexed = [...indexed.keys()].filter(
	(prefix) =>
		![...DYNAMIC_KEYS.keys()].some((key) => key === prefix || key.startsWith(`${prefix}.`)) &&
		!isDynamic(prefix)
);

const placeholdersOf = (text) => [...new Set(text.match(/\{[\w]+\}/g) ?? [])].sort().join(' ');
const placeholderMismatches = [...en.entries()]
	.filter(([key]) => fr.has(key))
	.map(([key, text]) => ({ key, en: placeholdersOf(text), fr: placeholdersOf(fr.get(key)) }))
	.filter(({ en: enPlaceholders, fr: frPlaceholders }) => enPlaceholders !== frPlaceholders);

const staleDynamic = [...DYNAMIC_KEYS.keys()].filter(
	(prefix) => ![...en.keys()].some((key) => key === prefix || key.startsWith(`${prefix}.`))
);

const findings =
	deadKeys.length + placeholderMismatches.length + staleDynamic.length + unlistedIndexed.length;
const log = strict ? console.error : console.warn;
const where = relative(appDir, i18nDir).replace(/\\/g, '/');

if (deadKeys.length > 0) {
	log(`[check-i18n-keys] ${deadKeys.length} key(s) in ${where}/en.ts that nothing references:`);
	for (const key of deadKeys) log(`    ${key}`);
}
if (placeholderMismatches.length > 0) {
	log(`[check-i18n-keys] ${placeholderMismatches.length} en/fr placeholder mismatch(es):`);
	for (const { key, en: enPlaceholders, fr: frPlaceholders } of placeholderMismatches) {
		log(`    ${key}  en: ${enPlaceholders || '(none)'}  fr: ${frPlaceholders || '(none)'}`);
	}
}
if (staleDynamic.length > 0) {
	log(`[check-i18n-keys] DYNAMIC_KEYS entries that match no catalogue key (delete them):`);
	for (const prefix of staleDynamic) log(`    ${prefix}`);
}

if (unlistedIndexed.length > 0) {
	log('[check-i18n-keys] sections indexed with a computed key and not in DYNAMIC_KEYS:');
	for (const prefix of unlistedIndexed) log(`    ${prefix}[…]`);
}

if (findings === 0) {
	console.log(`[check-i18n-keys] OK — ${en.size} keys, all referenced, placeholders agree`);
} else if (strict) {
	process.exit(1);
} else {
	console.warn(`[check-i18n-keys] warning only; run with --strict to fail on these.`);
}
