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
const strayData = relativePaths
	.filter((path) => path.startsWith(`${nestedPrefix}data/`))
	.map((path) => path.slice(`${nestedPrefix}data/`.length))
	.filter((path) => path !== 'release.json' && !path.startsWith('releases/'));
if (strayData.length) {
	throw new Error(
		`[artifact] data outside the published release: ${strayData.slice(0, 5).join(', ')}`
	);
}

for (const file of files.filter((candidate) =>
	/\.(?:html|js|json|css)$/.test(candidate.pathname)
)) {
	const source = await readFile(file, 'utf8');
	for (const placeholder of ['__DEPLOY_PATH__', '__BUILD_VERSION__']) {
		if (source.includes(placeholder))
			throw new Error(`[artifact] unresolved ${placeholder} in ${file.pathname}`);
	}
}

const appHtml = await readFile(new URL('index.html', nested), 'utf8');
const initialPaths = [...appHtml.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((match) => match[1]);
let initialGzip = 0;
for (const path of new Set(initialPaths)) {
	const relative = path.startsWith(DEPLOY_PATH)
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
	`[artifact] OK: ${files.length} files, initial JS ${Math.round(initialGzip / 1024)} KiB gzip`
);
