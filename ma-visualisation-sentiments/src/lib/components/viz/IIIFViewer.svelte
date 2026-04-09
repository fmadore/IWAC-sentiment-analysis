<!-- Embedded IIIF document viewer using OpenSeadragon -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import type OpenSeadragon from 'openseadragon';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import MaximizeIcon from '@lucide/svelte/icons/maximize';
	import MinimizeIcon from '@lucide/svelte/icons/minimize';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface IIIFViewerProps {
		manifestUrl: string;
		articleUrl?: string;
	}

	let { manifestUrl, articleUrl }: IIIFViewerProps = $props();

	let viewerContainer = $state<HTMLDivElement>();
	let OSD: typeof OpenSeadragon | null = $state(null);
	let viewer: OpenSeadragon.Viewer | null = $state(null);
	let tileSources = $state<(string | { type: string; url: string })[]>([]);
	let currentPage = $state(0);
	let totalPages = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let fallback = $state(false);
	let expanded = $state(false);

	onMount(() => {
		import('openseadragon').then((mod) => {
			OSD = mod.default;
			loadManifest();
		});
		return () => {
			viewer?.destroy();
		};
	});

	async function loadManifest() {
		try {
			const res = await fetch(manifestUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const manifest = await res.json();

			// IIIF v3: items[].items[].items[].body.service[]
			const sources: (string | { type: string; url: string })[] = [];

			// IIIF v3: items[].items[].items[].body.service[]
			if (manifest.items) {
				for (const canvas of manifest.items) {
					const body = canvas.items?.[0]?.items?.[0]?.body;
					if (!body) continue;
					const service = body.service?.[0];
					if (service?.id) {
						sources.push(service.id + '/info.json');
					} else if (body.id) {
						sources.push({ type: 'image', url: body.id });
					}
				}
			}

			// IIIF v2 fallback: sequences[].canvases[].images[].resource.service
			if (sources.length === 0 && manifest.sequences) {
				for (const canvas of manifest.sequences[0]?.canvases ?? []) {
					const resource = canvas.images?.[0]?.resource;
					if (!resource) continue;
					const service = resource.service;
					const svcId = service?.['@id'] ?? service?.id;
					if (svcId) {
						sources.push(svcId + '/info.json');
					} else if (resource['@id']) {
						sources.push({ type: 'image', url: resource['@id'] });
					}
				}
			}

			if (sources.length === 0) {
				// Manifest exists but has no canvases — fall back to external link
				fallback = true;
				loading = false;
				return;
			}

			tileSources = sources;
			totalPages = sources.length;
			loading = false;

			// Wait for DOM, then init viewer
			requestAnimationFrame(() => initViewer());
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load manifest';
			loading = false;
		}
	}

	function initViewer() {
		if (!viewerContainer || tileSources.length === 0 || !OSD) return;

		viewer = OSD({
			element: viewerContainer,
			// OSD accepts strings and { type, url } objects at runtime; its TileSourceSpecifier
			// type is stricter than what we need for IIIF info.json URLs.
			tileSources: tileSources[0] as unknown as OpenSeadragon.TileSourceSpecifier,
			showNavigationControl: false,
			showZoomControl: false,
			showHomeControl: false,
			showFullPageControl: false,
			gestureSettingsMouse: { scrollToZoom: true },
			gestureSettingsTouch: { pinchToZoom: true },
			animationTime: 0.3,
			minZoomLevel: 0.5,
			maxZoomLevel: 10,
			visibilityRatio: 0.8,
			constrainDuringPan: true
		});
	}

	function goToPage(page: number) {
		if (!viewer || page < 0 || page >= totalPages) return;
		currentPage = page;
		viewer.open(tileSources[page] as unknown as OpenSeadragon.TileSourceSpecifier);
	}

	function toggleExpanded() {
		expanded = !expanded;
		// Let the container resize, then fit the image
		requestAnimationFrame(() => {
			viewer?.viewport?.goHome(true);
		});
	}
</script>

{#if !fallback}
	<div class="iiif-viewer-wrapper" data-expanded={expanded}>
		{#if loading}
			<div class="viewer-placeholder">
				<div class="viewer-spinner"></div>
				<p class="text-white/60 text-sm">{$t.messages?.loading ?? 'Loading...'}</p>
			</div>
		{:else if error}
			<div class="viewer-placeholder">
				<p class="text-white/60 text-sm">{error}</p>
				{#if articleUrl}
					<a
						href={articleUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="viewer-fallback-link"
					>
						{$t.article?.consultOriginalArticle ?? 'View original article'}
						<ExternalLinkIcon size={14} />
					</a>
				{/if}
			</div>
		{:else}
			<!-- Toolbar -->
			<div class="viewer-toolbar">
				{#if totalPages > 1}
					<div class="page-nav">
						<button
							class="viewer-btn"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 0}
							aria-label="Previous page"
						>
							<ChevronLeftIcon size={16} />
						</button>
						<span class="page-indicator">{currentPage + 1} / {totalPages}</span>
						<button
							class="viewer-btn"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages - 1}
							aria-label="Next page"
						>
							<ChevronRightIcon size={16} />
						</button>
					</div>
				{/if}
				<div class="toolbar-actions">
					<button class="viewer-btn" onclick={toggleExpanded} aria-label="Toggle expanded view">
						{#if expanded}
							<MinimizeIcon size={16} />
						{:else}
							<MaximizeIcon size={16} />
						{/if}
					</button>
					{#if articleUrl}
						<a
							href={articleUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="viewer-btn"
							aria-label="Open in new tab"
						>
							<ExternalLinkIcon size={16} />
						</a>
					{/if}
				</div>
			</div>

			<!-- OpenSeadragon container -->
			<div bind:this={viewerContainer} class="osd-container"></div>
		{/if}
	</div>
{/if}

<style>
	.iiif-viewer-wrapper {
		border-radius: 0.75rem;
		overflow: hidden;
		background: color-mix(in oklab, var(--color-surface-950) 80%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-surface-50) 10%, transparent);
	}

	.iiif-viewer-wrapper[data-expanded='true'] {
		position: fixed;
		inset: 1rem;
		z-index: 900;
		border-radius: 1rem;
		box-shadow: 0 16px 64px color-mix(in oklab, black 50%, transparent);
	}

	.osd-container {
		width: 100%;
		height: 400px;
		cursor: grab;
	}

	.iiif-viewer-wrapper[data-expanded='true'] .osd-container {
		height: calc(100% - 44px);
	}

	.viewer-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		height: 200px;
	}

	.viewer-spinner {
		width: 32px;
		height: 32px;
		border: 2px solid color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		border-top-color: var(--color-primary-400);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.viewer-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
		border-bottom: 1px solid color-mix(in oklab, var(--color-surface-50) 8%, transparent);
		min-height: 44px;
	}

	.page-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.page-indicator {
		font-size: 0.8125rem;
		color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
		min-width: 3rem;
		text-align: center;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
	}

	.viewer-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		border: none;
		background: color-mix(in oklab, var(--color-surface-50) 8%, transparent);
		color: color-mix(in oklab, var(--color-surface-50) 70%, transparent);
		cursor: pointer;
		transition: all var(--timing-fast) var(--easing-default);
		text-decoration: none;
	}

	.viewer-btn:hover:not(:disabled) {
		background: color-mix(in oklab, var(--color-surface-50) 15%, transparent);
		color: var(--color-surface-50);
	}

	.viewer-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.viewer-fallback-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-primary-400);
		font-size: 0.875rem;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (max-width: 640px) {
		.osd-container {
			height: 300px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.viewer-spinner {
			animation: none;
		}

		.viewer-btn {
			transition: none;
		}
	}
</style>
