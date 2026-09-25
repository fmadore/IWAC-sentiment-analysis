import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Translations } from './types.js';
import { fr } from './fr.js';
import { readStorage, writeStorage } from '$lib/utils/safeStorage';

// Available languages
export const LANGUAGES = {
	fr: 'Français',
	en: 'English'
} as const;

export type Language = keyof typeof LANGUAGES;

/*
 * The catalogues. French — the default, and the language the page is
 * prerendered in — ships with the app; English (about 18 KiB gzip) is fetched
 * the first time it is needed. `currentLanguage` still switches at once, so the
 * URL and the `lang` attribute are always what was asked for; `t` shows French
 * for the moment it takes the English catalogue to arrive, which is what the
 * prerendered page already shows before hydration.
 */
const catalogues = writable<Partial<Record<Language, Translations>>>({ fr });
const catalogueLoaders: Record<Exclude<Language, 'fr'>, () => Promise<Translations>> = {
	en: () => import('./en.js').then((module) => module.en)
};
const pendingCatalogues = new Map<Language, Promise<void>>();

/** Load a language's catalogue if it is not already here. Retried on failure. */
export function loadCatalogue(lang: Language): Promise<void> {
	if (lang === 'fr') return Promise.resolve();
	let pending = pendingCatalogues.get(lang);
	if (!pending) {
		pending = catalogueLoaders[lang]()
			.then((catalogue) => catalogues.update((loaded) => ({ ...loaded, [lang]: catalogue })))
			.catch((error) => {
				pendingCatalogues.delete(lang);
				console.error(`Failed to load the ${lang} catalogue:`, error);
			});
		pendingCatalogues.set(lang, pending);
	}
	return pending;
}

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
			// A convenience only: blocked or full storage must not stop the switch.
			if (browser) writeStorage('localStorage', 'app-language', lang);
			void loadCatalogue(lang);
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
		const stored = readStorage('localStorage', 'app-language') as Language | null;
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

// Current translations store: the chosen catalogue, French until it arrives.
export const t = derived(
	[currentLanguage, catalogues],
	([$currentLanguage, $catalogues]) => $catalogues[$currentLanguage] ?? fr
);

// Translation function
export function translate(key: string, lang?: Language): string {
	const targetLang = lang || get(currentLanguage);
	const translation = get(catalogues)[targetLang] ?? fr;

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
