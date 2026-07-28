// Populates the build ROOT with the files GitHub Pages only ever reads from there.
//
// The adapter writes the whole app into `build/<DEPLOY_PATH>/` (see
// deploy.config.js for why). GitHub Pages then publishes `build/` at the
// subdomain root — but three things must sit at that root or they are silently
// ignored:
//
//   • CNAME     — Pages reads the custom domain from the artifact root only.
//   • 404.html  — the not-found handler is looked up from the root.
//   • index.html— otherwise `https://iwac.frederickmadore.com/` is a bare 404.
//
// Runs as part of the npm `postbuild` chain, before stamp-sw.mjs.

import { readFile, writeFile, access, unlink, mkdir } from 'node:fs/promises';
import { DEPLOY_PATH, CUSTOM_DOMAIN } from '../deploy.config.js';

const BUILD_ROOT = new URL('../build/', import.meta.url);
const NESTED = new URL(`.${DEPLOY_PATH}/`, BUILD_ROOT);
const PLACEHOLDER = '__DEPLOY_PATH__';

try {
	await access(BUILD_ROOT);
} catch {
	console.warn('[nest-build] no build/ directory — skipping.');
	process.exit(0);
}

if (!DEPLOY_PATH) {
	// Serving at the domain root: the adapter already wrote everything where it
	// belongs and there is nothing to hoist. Only the CNAME still applies.
	await writeFile(new URL('CNAME', BUILD_ROOT), `${CUSTOM_DOMAIN}\n`);
	console.log('[nest-build] DEPLOY_PATH empty — wrote CNAME only.');
	process.exit(0);
}

// ---------------------------------------------------------------- CNAME
// Generated rather than shipped in static/, which would place it inside the
// nested directory where Pages never looks for it.
await mkdir(BUILD_ROOT, { recursive: true });
await writeFile(new URL('CNAME', BUILD_ROOT), `${CUSTOM_DOMAIN}\n`);

// ---------------------------------------------------------------- 404.html
// static/404.html ships a `__DEPLOY_PATH__` placeholder so the SPA redirect
// script never hardcodes the deploy path. Stamp it and hoist a copy to the root.
const nested404 = new URL('404.html', NESTED);
let notFound;
try {
	notFound = await readFile(nested404, 'utf8');
} catch {
	console.warn(`[nest-build] ${DEPLOY_PATH}/404.html not found — skipping 404 hoist.`);
	notFound = null;
}

if (notFound) {
	if (!notFound.includes(PLACEHOLDER)) {
		console.warn(`[nest-build] no ${PLACEHOLDER} in 404.html — already stamped?`);
	}
	const stamped = notFound.replaceAll(PLACEHOLDER, DEPLOY_PATH);
	await writeFile(new URL('404.html', BUILD_ROOT), stamped);
	await writeFile(nested404, stamped);

	// vite-plugin-compression emitted 404.html.gz/.br during `vite build`, i.e.
	// BEFORE this step, so they captured the placeholder verbatim. A server that
	// negotiates encoding — GitHub Pages does — would then serve a 404 page that
	// redirects to a literal `/__DEPLOY_PATH__/`. Drop them: the 404 page is a
	// rarely-hit fallback and Pages compresses at the edge anyway.
	for (const variant of ['404.html.gz', '404.html.br']) {
		await unlink(new URL(variant, NESTED)).catch(() => {});
	}
}

// ---------------------------------------------------------------- index.html
// Redirect the subdomain root into the app. Query and hash are carried across so
// GitHub's own 301 from the retired project URL (which drops the repo path
// segment but keeps `?view=…`) still lands on a working deep link.
const target = `${DEPLOY_PATH}/`;
const redirect = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>IWAC Sentiment Analysis</title>
		<link rel="canonical" href="https://${CUSTOM_DOMAIN}${target}" />
		<meta name="robots" content="noindex" />
		<meta http-equiv="refresh" content="0; url=${target}" />
		<script>
			location.replace('${target}' + location.search + location.hash);
		</script>
	</head>
	<body>
		<p>Redirecting to <a href="${target}">IWAC Sentiment Analysis</a>&hellip;</p>
	</body>
</html>
`;
await writeFile(new URL('index.html', BUILD_ROOT), redirect);

console.log(`[nest-build] Root ready: CNAME (${CUSTOM_DOMAIN}), 404.html, index.html → ${target}`);
