// PWA TypeScript type definitions

/**
 * BeforeInstallPromptEvent interface for PWA installation
 */
export interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed';
		platform: string;
	}>;
	prompt(): Promise<void>;
}

/**
 * Extended Navigator interface with PWA-specific properties
 */
declare global {
	interface Navigator {
		standalone?: boolean;
	}

	interface Window {
		// Add any window-level PWA types here
	}

	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
		appinstalled: Event;
	}
}

/**
 * Service Worker Registration with Background Sync support
 */
export interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
	sync?: {
		register(tag: string): Promise<void>;
	};
	periodicSync?: {
		register(tag: string, options: { minInterval: number }): Promise<void>;
	};
}

/**
 * Options for PWA installation prompt
 */
export interface PWAInstallOptions {
	immediate?: boolean;
	onBeforeInstallPrompt?: (event: BeforeInstallPromptEvent) => void;
	onInstalled?: () => void;
	onDismissed?: () => void;
}

/**
 * PWA update options
 */
export interface PWAUpdateOptions {
	onUpdateAvailable?: () => void;
	onUpdateReady?: () => void;
	onUpdateError?: (error: Error) => void;
}

export {};