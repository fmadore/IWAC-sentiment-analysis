/** Serve the final Pages artifact, including stamped SW and release paths.
 * Vite preview serves .svelte-kit/output and bypasses our postbuild pipeline.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../build/', import.meta.url));
const option = (name, fallback) => {
	const i = process.argv.indexOf(name);
	return i < 0 ? fallback : process.argv[i + 1];
};
const host = option('--host', '127.0.0.1');
const port = Number(option('--port', '4173'));
const types = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.geojson': 'application/geo+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.woff2': 'font/woff2',
	'.wasm': 'application/wasm'
};

createServer(async (request, response) => {
	try {
		if (!['GET', 'HEAD'].includes(request.method ?? '')) {
			response.writeHead(405).end();
			return;
		}
		const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
		let path = resolve(root, `.${pathname}`);
		const rel = relative(root, path);
		if (rel === '..' || rel.startsWith(`..${sep}`) || rel.includes(':')) {
			response.writeHead(403).end();
			return;
		}
		if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
		const file = await stat(path);
		if (!file.isFile()) throw new Error('not a file');
		response.writeHead(200, {
			'Content-Type': types[extname(path)] ?? 'application/octet-stream',
			'Content-Length': file.size,
			'Cache-Control': 'no-cache'
		});
		if (request.method === 'HEAD') response.end();
		else
			createReadStream(path)
				.on('error', () => response.destroy())
				.pipe(response);
	} catch {
		response.writeHead(404).end('Not found');
	}
}).listen(port, host, () => console.log(`Built artifact: http://${host}:${port}`));
