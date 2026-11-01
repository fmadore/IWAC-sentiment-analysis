import { asset } from '$app/paths';
import type { AssetPath } from '$app/types';

/** Build identity covers every data asset; dev/test continue using flat fixtures. */
export const DATA_RELEASE = typeof __IWAC_DATA_RELEASE__ === 'string' ? __IWAC_DATA_RELEASE__ : '';
export function dataUrl(path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	const filename = path.replace(/^\/data\//, '');
	// Release copies are written after the build (scripts/publish-data-release.mjs),
	// so they are not among the `static/` files `AssetPath` is generated from.
	return asset(`data/${DATA_RELEASE ? `releases/${DATA_RELEASE}/` : ''}${filename}` as AssetPath);
}
