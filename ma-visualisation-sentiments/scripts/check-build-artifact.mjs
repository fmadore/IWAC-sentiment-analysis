import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { DEPLOY_PATH } from '../deploy.config.js';

const root = new URL('../build/', import.meta.url);
const nested = new URL(`.${DEPLOY_PATH}/`, root);
const required = [
	new URL('index.html', root),
	new URL('404.html', root),
	new URL('CNAME', root),
	new URL('index.html', nested),
	new URL('sw.js', nested)
];

for (const path of required) {
	if (!(await stat(path).catch(() => null))?.isFile()) {
		throw new Error(`[artifact] required file is missing: ${path.pathname}`);
	}
}

async function walk(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
		if (entry.isDirectory()) files.push(...(await walk(url)));
		else files.push(url);
	}
	return files;
}

const files = await walk(root);
const compressed = files.filter((file) => /\.(?:gz|br)$/.test(file.pathname));
if (compressed.length) {
	throw new Error(`[artifact] unexpected precompressed siblings: ${compressed.length}`);
}

// Everything under static/ is published verbatim, so scratch state that lands
// there ships with the site: the data exports' writer lock did, and a stage left
// by a killed export would have shipped a second copy of the generation. Nothing
// legitimate in this artifact is a dot-file, and its directories are known.
const relativePaths = files.map((file) => file.pathname.slice(root.pathname.length));
const hidden = relativePaths.filter((path) => path.split('/').some((part) => part.startsWith('.')));
if (hidden.length) {
	throw new Error(`[artifact] unexpected hidden files: ${hidden.slice(0, 5).join(', ')}`);
}
const ALLOWED_DIRECTORIES = new Set(['_app', 'data', 'icons', 'logo']);
const nestedPrefix = nested.pathname.slice(root.pathname.length);
const strayDirectories = new Set(
	relativePaths
		.filter((path) => path.startsWith(nestedPrefix))
		.map((path) => path.slice(nestedPrefix.length).split('/'))
		.filter((parts) => parts.length > 1 && !ALLOWED_DIRECTORIES.has(parts[0]))
		.map((parts) => parts[0])
);
if (strayDirectories.size) {
	throw new Error(
		`[artifact] unexpected directories under ${DEPLOY_PATH}/: ${[...strayDirectories].join(', ')} ` +
			'(a new static/ folder must be added to ALLOWED_DIRECTORIES in check-build-artifact.mjs)'
	);
}

// Loose files, checked as strictly as directories. The app's own top level is
// what static/ ships plus the shell; the artifact root (when the app is nested)
// holds only what nest-build.mjs hoists there for GitHub Pages. A stray file —
// a build-time handoff such as data-build.json, a scratch export — fails here
// instead of shipping.
const APP_FILES = new Set([
	'index.html',
	'404.html',
	'sw.js',
	'favicon.png',
	'manifest.json',
	'browserconfig.xml',
	'social-preview.png'
]);
const ROOT_FILES = new Set(['index.html', '404.html', 'CNAME']);
const strayFiles = relativePaths.filter((path) => {
	if (!path.includes('/')) {
		return !ROOT_FILES.has(path) && !(nestedPrefix === '' && APP_FILES.has(path));
	}
	if (!path.startsWith(nestedPrefix)) return true;
	const inApp = path.slice(nestedPrefix.length);
	return !inApp.includes('/') && !APP_FILES.has(inApp);
});
if (strayFiles.length) {
	throw new Error(
		`[artifact] unexpected top-level files: ${strayFiles.slice(0, 5).join(', ')} ` +
			'(a new static/ file must be added to APP_FILES in check-build-artifact.mjs)'
	);
}

const strayData = relativePaths
	.filter((path) => path.startsWith(`${nestedPrefix}data/`))
	.map((path) => path.slice(`${nestedPrefix}data/`.length))
	.filter((path) => path !== 'release.json' && !path.startsWith('releases/'));
if (strayData.length) {
	throw new Error(
		`[artifact] data outside the published release: ${strayData.slice(0, 5).join(', ')}`
	);
}

// Placeholders are stamped into the shell, the worker and the 404 page. The data
// release (~170 MB of JSON) is copied verbatim from static/ and never carries
// one, so reading it here would only cost time.
const releasesPrefix = `${nestedPrefix}data/releases/`;
for (const file of files.filter(
	(candidate, index) =>
		/\.(?:html|js|json|css)$/.test(candidate.pathname) &&
		!relativePaths[index].startsWith(releasesPrefix)
)) {
	const source = await readFile(file, 'utf8');
	for (const placeholder of ['__DEPLOY_PATH__', '__BUILD_VERSION__', '__DATA_RELEASE__']) {
		if (source.includes(placeholder))
			throw new Error(`[artifact] unresolved ${placeholder} in ${file.pathname}`);
	}
}

// The JS the shell loads before first render: modulepreload links, script tags
// and the inline `import("…")` entry calls, with either quote style.
const appHtml = await readFile(new URL('index.html', nested), 'utf8');
const initialPaths = new Set(
	[
		...appHtml.matchAll(/\b(?:src|href)=["']([^"']+\.m?js)["']/g),
		...appHtml.matchAll(/\bimport\(\s*["']([^"']+\.m?js)["']\s*\)/g)
	].map((match) => match[1])
);
// A budget over nothing passes vacuously. A SvelteKit shell names its `_app/`
// entry; if it does and none of the patterns above found a script, they have
// drifted from the shell's markup and the budget is measuring nothing.
const shellReferencesApp = /_app\//.test(appHtml);
if (shellReferencesApp && initialPaths.size === 0) {
	throw new Error(
		'[artifact] the shell references _app/ but no initial JS was found; ' +
			'the extraction patterns in check-build-artifact.mjs no longer match its markup'
	);
}
const appScriptsInShell = new Set(appHtml.match(/[^"'\s()]*_app\/[^"'\s()]+\.m?js/g) ?? []);
const missed = [...appScriptsInShell].filter((path) => !initialPaths.has(path));
if (missed.length) {
	throw new Error(
		`[artifact] shell scripts the initial-JS budget does not count: ${missed.slice(0, 3).join(', ')}`
	);
}
let initialGzip = 0;
for (const path of initialPaths) {
	// `/sentiment-analysis/_app/…`, `/_app/…` or `./_app/…`, all relative to the app.
	const relative =
		DEPLOY_PATH && path.startsWith(`${DEPLOY_PATH}/`)
			? path.slice(DEPLOY_PATH.length + 1)
			: path.replace(/^\//, '');
	const bytes = await readFile(new URL(relative, nested));
	initialGzip += gzipSync(bytes).length;
}

const INITIAL_GZIP_BUDGET = 300 * 1024;
if (initialGzip > INITIAL_GZIP_BUDGET) {
	throw new Error(
		`[artifact] initial JS ${Math.round(initialGzip / 1024)} KiB gzip exceeds 300 KiB`
	);
}

console.log(
	`[artifact] OK: ${files.length} files, initial JS ${Math.round(initialGzip / 1024)} KiB gzip ` +
		`across ${initialPaths.size} module(s)`
);
