/**
 * Web storage that never throws.
 *
 * Merely *reading* `window.localStorage` throws a `SecurityError` when a visitor
 * blocks site data (Firefox or Chrome "block all cookies", hardened and some
 * embedded contexts), and `setItem` throws when storage is full. Every use here
 * is a convenience — the remembered language, the SPA-redirect stash — so a
 * failure must degrade to "nothing stored", never to an exception. An unguarded
 * read in start-up code left such visitors with a blank dashboard.
 */

type StorageKind = 'localStorage' | 'sessionStorage';

function storageArea(kind: StorageKind): Storage | null {
	try {
		return typeof window === 'undefined' ? null : window[kind];
	} catch {
		return null;
	}
}

/** The stored value, or null when absent or when storage is unavailable. */
export function readStorage(kind: StorageKind, key: string): string | null {
	try {
		return storageArea(kind)?.getItem(key) ?? null;
	} catch {
		return null;
	}
}

/** Store a value; returns whether it was actually stored. */
export function writeStorage(kind: StorageKind, key: string, value: string): boolean {
	try {
		const area = storageArea(kind);
		if (!area) return false;
		area.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

/** Remove a value, ignoring an unavailable storage area. */
export function removeStorage(kind: StorageKind, key: string): void {
	try {
		storageArea(kind)?.removeItem(key);
	} catch {
		// Nothing was stored, or nothing can be.
	}
}
