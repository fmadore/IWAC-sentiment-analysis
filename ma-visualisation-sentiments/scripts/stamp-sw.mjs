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
//
// IMPORTANT — the precompressed variants must be rewritten too.
// vite-plugin-compression emits sw.js.gz and sw.js.br during `vite build`, i.e.
// BEFORE this postbuild step runs, so they capture the placeholder verbatim.
// Any server that negotiates encoding — GitHub Pages does — then serves a
// service worker whose bytes are byte-identical on every single deploy. The
// browser sees no change, never activates a new worker, and the versioned cache
// names never rotate: exactly the failure this script exists to prevent, hidden
// behind Content-Encoding. Regenerating them here keeps compression and
// correctness.

import { readFile, writeFile, access, unlink } from 'node:fs/promises';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const SW_PATH = new URL('../build/sw.js', import.meta.url);
const SW_GZ_PATH = new URL('../build/sw.js.gz', import.meta.url);
const SW_BR_PATH = new URL('../build/sw.js.br', import.meta.url);
const PLACEHOLDER = '__BUILD_VERSION__';

const version =
	(process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 12)) || `local-${Date.now()}`;

try {
	await access(SW_PATH);
} catch {
	// No build output — nothing to stamp.
	console.warn('[stamp-sw] build/sw.js not found — skipping.');
	process.exit(0);
}

const source = await readFile(SW_PATH, 'utf8');

if (!source.includes(PLACEHOLDER)) {
	console.warn(`[stamp-sw] no ${PLACEHOLDER} placeholder in build/sw.js — already stamped?`);
	process.exit(0);
}

const stamped = source.replaceAll(PLACEHOLDER, version);
await writeFile(SW_PATH, stamped);

// Re-emit the precompressed variants from the stamped source. Matches the
// plugin's settings in vite.config.ts (gzip level 9, brotli level 11) so the
// served bytes are equivalent to what the build would have produced had it
// compressed after stamping.
const buffer = Buffer.from(stamped, 'utf8');

for (const [path, compress, label] of [
	[SW_GZ_PATH, () => gzipSync(buffer, { level: 9 }), 'gz'],
	[
		SW_BR_PATH,
		() =>
			brotliCompressSync(buffer, {
				params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
			}),
		'br'
	]
]) {
	try {
		await access(path);
	} catch {
		// The plugin didn't emit this variant (or compression is off) — nothing
		// stale to correct, so don't create one.
		continue;
	}

	try {
		await writeFile(path, compress());
		console.log(`[stamp-sw] Re-compressed sw.js.${label} from the stamped source`);
	} catch (error) {
		// A stale compressed copy is worse than none: it would pin the worker to
		// the placeholder version forever. Remove it and let the server fall back
		// to the (correct, uncompressed) sw.js.
		console.warn(`[stamp-sw] Could not re-compress sw.js.${label}: ${error.message}`);
		await unlink(path).catch(() => {});
	}
}

console.log(`[stamp-sw] Stamped build/sw.js → ${version}`);
