import { mkdir, readdir, rename, rm, writeFile, readFile } from 'node:fs/promises';
import { DEPLOY_PATH } from '../deploy.config.js';
import { dataRelease } from './data-release.mjs';

const directory = new URL(`../build${DEPLOY_PATH}/data/`, import.meta.url);
// data-build.json is the build's handoff to this script (vite.config.ts emits
// it): the release the bundle was compiled against. The app never reads it, so
// it is removed once read, and check-build-artifact.mjs fails if it ships.
const buildIdentity = new URL('../data-build.json', directory);
const { release } = JSON.parse(await readFile(buildIdentity, 'utf8'));
await rm(buildIdentity);
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
