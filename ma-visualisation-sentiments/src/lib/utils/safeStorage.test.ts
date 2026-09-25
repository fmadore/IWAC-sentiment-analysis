import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStorage, removeStorage, writeStorage } from './safeStorage';

const blocked = () => {
	throw new DOMException('The operation is insecure.', 'SecurityError');
};

describe('safeStorage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
		window.sessionStorage.clear();
	});

	it('reads, writes and removes when storage works', () => {
		expect(writeStorage('localStorage', 'app-language', 'en')).toBe(true);
		expect(readStorage('localStorage', 'app-language')).toBe('en');
		removeStorage('localStorage', 'app-language');
		expect(readStorage('localStorage', 'app-language')).toBeNull();
	});

	it('degrades to nothing stored when merely touching storage throws', () => {
		vi.spyOn(window, 'localStorage', 'get').mockImplementation(blocked);
		vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(blocked);

		expect(readStorage('localStorage', 'app-language')).toBeNull();
		expect(writeStorage('localStorage', 'app-language', 'en')).toBe(false);
		expect(() => removeStorage('sessionStorage', 'spa-redirect')).not.toThrow();
	});

	it('reports a failed write, such as a full quota, instead of throwing', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Quota exceeded', 'QuotaExceededError');
		});
		expect(writeStorage('localStorage', 'app-language', 'en')).toBe(false);
	});
});
