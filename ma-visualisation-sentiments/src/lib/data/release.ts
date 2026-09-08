import { base } from '$app/paths';

/** Build identity covers every data asset; dev/test continue using flat fixtures. */
export const DATA_RELEASE = typeof __IWAC_DATA_RELEASE__ === 'string' ? __IWAC_DATA_RELEASE__ : '';
export function dataUrl(path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	const filename = path.replace(/^\/data\//, '');
	return `${base}/data/${DATA_RELEASE ? `releases/${DATA_RELEASE}/` : ''}${filename}`;
}
