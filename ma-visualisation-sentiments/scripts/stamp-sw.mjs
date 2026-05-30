// Stamps build/sw.js with a unique per-deploy version.
//
// static/sw.js ships a `__BUILD_VERSION__` placeholder; this script (run as the
// npm `postbuild` step) replaces it in the built output. Because the resulting
// sw.js bytes differ on every deploy, the browser detects the updated worker and
// purges the previous deploy's caches — the durable fix for "stuck on a stale
// cached version".
//
// Version source: the commit SHA in CI (stable, only changes with the code), or a
// timestamp locally so `vite preview` of repeated local builds still differs.

import { readFile, writeFile, access } from 'node:fs/promises';

const SW_PATH = new URL('../build/sw.js', import.meta.url);
const PLACEHOLDER = '__BUILD_VERSION__';

const version =
	(process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 12)) || `local-${Date.now()}`;

try {
	await access(SW_PATH);
} catch {
	// No build output (e.g. `prepack`/library-only run) — nothing to stamp.
	console.warn('[stamp-sw] build/sw.js not found — skipping.');
	process.exit(0);
}

const source = await readFile(SW_PATH, 'utf8');

if (!source.includes(PLACEHOLDER)) {
	console.warn(`[stamp-sw] no ${PLACEHOLDER} placeholder in build/sw.js — already stamped?`);
	process.exit(0);
}

await writeFile(SW_PATH, source.replaceAll(PLACEHOLDER, version));
console.log(`[stamp-sw] Stamped build/sw.js → ${version}`);
