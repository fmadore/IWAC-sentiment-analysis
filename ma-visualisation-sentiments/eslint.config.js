import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import { loadConfig } from '@sveltejs/load-config';

// Svelte options now live in the `sveltekit()` plugin call in vite.config.ts.
const appRoot = fileURLToPath(new URL('.', import.meta.url));
const loadedSvelteConfig = await loadConfig(appRoot, { traverse: false });
// A config that fails to load must not silently lint with no Svelte options.
if (loadedSvelteConfig && 'error' in loadedSvelteConfig) throw loadedSvelteConfig.error;
const svelteConfig = loadedSvelteConfig?.config;

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// These components render external URLs (islam.zmo.de article links),
		// not SvelteKit routes, so resolve() is not applicable.
		files: [
			'**/components/common/ArbiterArticleDetailModal.svelte',
			'**/components/common/ArbiterV2ArticleDetailModal.svelte',
			'**/components/data-display/AnalysisInfo.svelte',
			'**/components/data-display/ArticleDetail.svelte',
			'**/components/data-display/ComparisonDetail.svelte',
			'**/components/viz/IIIFViewer.svelte'
		],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
