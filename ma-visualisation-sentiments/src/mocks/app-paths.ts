/**
 * Mock for $app/paths SvelteKit module
 * Used in testing environment, where the base path is empty
 */
export const asset = (file: string) => `/${file.replace(/^\//, '')}`;
export const resolve = (path: string) => (path.startsWith('/') ? path : `/${path}`);
