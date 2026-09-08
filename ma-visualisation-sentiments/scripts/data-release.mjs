import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

export function dataRelease(directory = new URL('../static/data/', import.meta.url)) {
	if (existsSync(new URL('.generation-pending.json', directory)))
		throw new Error('Interrupted data publication: recover the generation before building.');
	const hash = createHash('sha256');
	for (const name of readdirSync(directory)
		.filter((name) => /\.(json|geojson)$/.test(name))
		.sort()) {
		hash.update(name);
		hash.update('\0');
		hash.update(readFileSync(new URL(name, directory)));
		hash.update('\0');
	}
	return hash.digest('hex').slice(0, 24);
}
