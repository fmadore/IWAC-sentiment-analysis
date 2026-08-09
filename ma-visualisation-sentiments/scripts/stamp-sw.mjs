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
import { DEPLOY_PATH } from '../deploy.config.js';

// The adapter nests the app under the deploy path (see deploy.config.js), so the
// worker lives at build/<DEPLOY_PATH>/sw.js — not at the build root.
const OUT_DIR = new URL(`../build${DEPLOY_PATH}/`, import.meta.url);
const SW_PATH = new URL('sw.js', OUT_DIR);
const PLACEHOLDER = '__BUILD_VERSION__';

const version =
	(process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 12)) || `local-${Date.now()}`;

try {
	await access(SW_PATH);
} catch {
	throw new Error(`[stamp-sw] build${DEPLOY_PATH}/sw.js not found`);
}

const source = await readFile(SW_PATH, 'utf8');

if (!source.includes(PLACEHOLDER)) {
	throw new Error(`[stamp-sw] no ${PLACEHOLDER} placeholder in the built sw.js`);
}

const stamped = source.replaceAll(PLACEHOLDER, version);
await writeFile(SW_PATH, stamped);

console.log(`[stamp-sw] Stamped build${DEPLOY_PATH}/sw.js → ${version}`);
