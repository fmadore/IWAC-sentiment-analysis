import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Translations } from './types.js';
import { fr } from './fr.js';
import { en } from './en.js';

// Available languages
export const LANGUAGES = {
	fr: 'Français',
	en: 'English'
} as const;

export type Language = keyof typeof LANGUAGES;

// Translation data
const translations: Record<Language, Translations> = {
	fr,
	en
};

// Current language store
function createLanguageStore() {
	// Get initial language - will be updated by URL state initialization
	const getInitialLanguage = (): Language => {
		return 'fr'; // Default to French, will be overridden by initialization
	};

	const { subscribe, set, update } = writable<Language>(getInitialLanguage());

	return {
		subscribe,
		set: (lang: Language) => {
			if (browser) {
				localStorage.setItem('app-language', lang);
			}
			set(lang);
		},
		update
	};
}

export const currentLanguage = createLanguageStore();

/**
 * Initialize language from URL or fallback sources
 * Should be called once during app initialization
 */
export function initializeLanguage(urlLang?: Language): void {
	if (!browser) return;

	let targetLang: Language = 'fr'; // Default

	// Priority 1: URL parameter
	if (urlLang && urlLang in LANGUAGES) {
		targetLang = urlLang;
	}
	// Priority 2: localStorage
	else {
		const stored = localStorage.getItem('app-language') as Language;
		if (stored && stored in LANGUAGES) {
			targetLang = stored;
		}
		// Priority 3: Browser language
		else {
			const browserLang = navigator.language.split('-')[0] as Language;
			if (browserLang in LANGUAGES) {
				targetLang = browserLang;
			}
		}
	}

	// Set the language without triggering URL update
	currentLanguage.set(targetLang);
}

// Current translations store
export const t = derived(currentLanguage, ($currentLanguage) => translations[$currentLanguage]);

// Translation function
export function translate(key: string, lang?: Language): string {
	const targetLang = lang || get(currentLanguage);
	const translation = translations[targetLang];

	// Support nested keys with dot notation
	const keys = key.split('.');
	let value: unknown = translation;

	for (const k of keys) {
		if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
			value = (value as Record<string, unknown>)[k];
		} else {
			console.warn(`Translation key not found: ${key} for language: ${targetLang}`);
			return key; // Return the key if translation not found
		}
	}

	return typeof value === 'string' ? value : key;
}

// Helper function to get current language value
function get<T>(store: { subscribe: (fn: (value: T) => void) => () => void }): T {
	let value: T;
	const unsubscribe = store.subscribe((v) => (value = v));
	unsubscribe();
	return value!;
}

// Language switcher function
export function switchLanguage(lang: Language) {
	currentLanguage.set(lang);
}

// Get all available languages
export function getAvailableLanguages() {
	return Object.entries(LANGUAGES).map(([code, name]) => ({
		code: code as Language,
		name
	}));
}
