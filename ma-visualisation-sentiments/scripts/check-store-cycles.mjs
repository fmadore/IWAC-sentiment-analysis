// Guards the store layering convention: no circular imports inside
// src/lib/stores. The barrel (index.ts) re-exports every store, so a store
// importing './index' (or the '$lib/stores' alias) is an instant cycle that
// only keeps working by accident of ESM live bindings. eslint-plugin-import-x
// can't trace .svelte.ts modules, hence this dedicated check (run via
// `npm run lint`).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const storesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/stores');

/** Collect all .ts files under stores/ */
function collect(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) out.push(...collect(p));
		else if (p.endsWith('.ts') && !p.endsWith('.test.ts')) out.push(p);
	}
	return out;
}

/** Resolve a relative or $lib/stores import specifier to a file in the graph */
function resolveSpecifier(fromFile, spec) {
	let base;
	if (spec.startsWith('.')) {
		base = resolve(dirname(fromFile), spec);
	} else if (spec === '$lib/stores' || spec.startsWith('$lib/stores/')) {
		base = resolve(storesDir, spec === '$lib/stores' ? '.' : spec.slice('$lib/stores/'.length));
	} else {
		return null; // external module — out of scope
	}
	for (const candidate of [
		base,
		`${base}.ts`,
		`${base}.svelte.ts`,
		join(base, 'index.ts'),
		join(base, 'index.svelte.ts')
	]) {
		if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
	}
	return null;
}

const files = collect(storesDir);
const graph = new Map();
const importRe = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g;

for (const file of files) {
	const src = readFileSync(file, 'utf8');
	const edges = [];
	for (const match of src.matchAll(importRe)) {
		const target = resolveSpecifier(file, match[1]);
		if (target) edges.push(target);
	}
	graph.set(file, edges);
}

const cycles = [];
const visiting = new Set();
const done = new Set();

function visit(node, path) {
	if (done.has(node)) return;
	if (visiting.has(node)) {
		const start = path.indexOf(node);
		cycles.push(path.slice(start).concat(node));
		return;
	}
	visiting.add(node);
	for (const dep of graph.get(node) ?? []) visit(dep, path.concat(node));
	visiting.delete(node);
	done.add(node);
}

for (const file of files) visit(file, []);

if (cycles.length > 0) {
	console.error('Circular imports detected in src/lib/stores:');
	for (const cycle of cycles) {
		console.error('  ' + cycle.map((f) => relative(storesDir, f)).join(' -> '));
	}
	process.exit(1);
}
console.log(`[check-store-cycles] OK — ${files.length} modules, no cycles`);
