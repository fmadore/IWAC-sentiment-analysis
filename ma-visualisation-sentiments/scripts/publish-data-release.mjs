import { mkdir, readdir, rename, writeFile, readFile } from 'node:fs/promises';
import { DEPLOY_PATH } from '../deploy.config.js';
import { dataRelease } from './data-release.mjs';

const directory = new URL(`../build${DEPLOY_PATH}/data/`, import.meta.url);
const { release } = JSON.parse(await readFile(new URL('../data-build.json', directory), 'utf8'));
if (dataRelease(directory) !== release)
	throw new Error('Data changed during the build; rebuild before publishing.');
const destination = new URL(`releases/${release}/`, directory);
await mkdir(destination, { recursive: true });
for (const file of await readdir(directory, { withFileTypes: true })) {
	if (file.isFile() && /\.(json|geojson)$/.test(file.name))
		await rename(new URL(file.name, directory), new URL(file.name, destination));
}
await writeFile(new URL('release.json', directory), JSON.stringify({ release }));
console.log(`[data-release] Published immutable dataset ${release}`);
