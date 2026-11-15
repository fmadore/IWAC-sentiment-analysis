import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// A Svelte component module is not provably side-effect-free, so importing one
// name from a component barrel ties every component it re-exports into the
// importer's chunk. That once put the detail modals and arbiter panels on every
// cold load and broke the per-view JavaScript budgets in e2e/performance.spec.ts.
const SRC = join(process.cwd(), 'src');
const BARREL_IMPORT =
	/from\s+['"](?:#lib\/components(?:\/[a-z-]+)?\/index(?:\.js)?|\.\.?\/index(?:\.js)?)['"]/;

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(svelte|ts)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
	});
}

describe('component imports', () => {
	it('never go through a component barrel in application code', () => {
		const offenders = sourceFiles(join(SRC, 'lib', 'components'))
			.concat(sourceFiles(join(SRC, 'routes')))
			.filter((file) => !/[\\/]index\.ts$/.test(file))
			.filter((file) => BARREL_IMPORT.test(readFileSync(file, 'utf8')))
			.map((file) => relative(SRC, file));
		expect(offenders).toEqual([]);
	});
});
