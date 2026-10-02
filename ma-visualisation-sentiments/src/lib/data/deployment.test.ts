// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import { dataRelease } from '../../../scripts/data-release.mjs';

it.each(['', '/sentiment-analysis'])(
	'publishes and verifies a complete artifact at base "%s"',
	(base) => {
		const fixture = mkdtempSync(join(tmpdir(), 'iwac-deploy-test-'));
		try {
			const build = join(fixture, 'build');
			const app = join(build, base);
			const data = join(app, 'data');
			mkdirSync(data, { recursive: true });
			mkdirSync(join(fixture, 'scripts'));
			writeFileSync(join(fixture, 'package.json'), '{"type":"module"}');
			writeFileSync(
				join(fixture, 'deploy.config.js'),
				`export const DEPLOY_PATH = ${JSON.stringify(base)}; export const CUSTOM_DOMAIN = 'example.org';`
			);
			for (const name of [
				'nest-build',
				'publish-data-release',
				'data-release',
				'stamp-sw',
				'check-build-artifact'
			])
				cpSync(
					new URL(`../../../scripts/${name}.mjs`, import.meta.url),
					join(fixture, 'scripts', `${name}.mjs`)
				);
			for (const name of ['404.html', 'sw.js'])
				cpSync(new URL(`../../../static/${name}`, import.meta.url), join(app, name));
			writeFileSync(join(app, 'index.html'), '<html lang="en"><body>App shell</body></html>');
			writeFileSync(join(data, 'iwac_sentiment_luna.json'), '{"42":{}}');
			const release = dataRelease(pathToFileURL(data + sep));
			writeFileSync(join(app, 'data-build.json'), JSON.stringify({ release }));
			for (const name of ['nest-build', 'publish-data-release', 'stamp-sw', 'check-build-artifact'])
				execFileSync(process.execPath, [join(fixture, 'scripts', `${name}.mjs`)], {
					cwd: fixture,
					env: { ...process.env, GITHUB_SHA: '1234567890abcdef' },
					stdio: 'pipe'
				});
			expect(readFileSync(join(build, 'CNAME'), 'utf8')).toBe('example.org\n');
			expect(readFileSync(join(build, '404.html'), 'utf8')).toContain(`var basePath = '${base}'`);
			expect(readFileSync(join(app, 'index.html'), 'utf8')).toContain('App shell');
			if (base)
				expect(readFileSync(join(build, 'index.html'), 'utf8')).toContain(
					`location.replace('${base}/' + location.search + location.hash)`
				);
			expect(existsSync(join(data, 'iwac_sentiment_luna.json'))).toBe(false);
			expect(
				readFileSync(join(data, 'releases', release, 'iwac_sentiment_luna.json'), 'utf8')
			).toBe('{"42":{}}');
			expect(readFileSync(join(app, 'sw.js'), 'utf8')).toContain(
				`const DATA_RELEASE = '${release}'`
			);
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	}
);
