// PWA utilities for IWAC Sentiment Analysis
import { browser } from '$app/environment';

/**
 * Check if the app is running as a PWA
 */
export function isPWA(): boolean {
	if (!browser) return false;
	
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone ||
		document.referrer.includes('android-app://')
	);
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
	if (!browser) return false;
	
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if PWA installation is available
 */
export function canInstallPWA(): boolean {
	if (!browser) return false;
	
	// Check if already installed
	if (isPWA()) return false;
	
	// Check if browser supports PWA installation
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode(): 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser' {
	if (!browser) return 'browser';
	
	if (window.matchMedia('(display-mode: standalone)').matches) {
		return 'standalone';
	}
	if (window.matchMedia('(display-mode: minimal-ui)').matches) {
		return 'minimal-ui';
	}
	if (window.matchMedia('(display-mode: fullscreen)').matches) {
		return 'fullscreen';
	}
	return 'browser';
}

/**
 * Show iOS installation instructions
 */
export function showIOSInstallInstructions(): string {
	return `To install this app on your iOS device:
1. Tap the Share button in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm`;
}

/**
 * Share content using Web Share API if available
 */
export async function shareContent(data: {
	title?: string;
	text?: string;
	url?: string;
}): Promise<boolean> {
	if (!browser || !navigator.share) {
		return false;
	}
	
	try {
		await navigator.share(data);
		return true;
	} catch (error) {
		console.log('Error sharing:', error);
		return false;
	}
}

/**
 * Request persistent storage for PWA
 */
export async function requestPersistentStorage(): Promise<boolean> {
	if (!browser || !navigator.storage?.persist) {
		return false;
	}
	
	try {
		const persistent = await navigator.storage.persist();
		console.log(`Persistent storage: ${persistent}`);
		return persistent;
	} catch (error) {
		console.log('Error requesting persistent storage:', error);
		return false;
	}
}

/**
 * Get storage usage estimation
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
	if (!browser || !navigator.storage?.estimate) {
		return null;
	}
	
	try {
		const estimate = await navigator.storage.estimate();
		return estimate;
	} catch (error) {
		console.log('Error getting storage estimate:', error);
		return null;
	}
}