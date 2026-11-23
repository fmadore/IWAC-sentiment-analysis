<!-- Embedded IIIF document viewer using OpenSeadragon -->
<script lang="ts">
	import { tick } from 'svelte';
	import { viewOptionsState } from '#lib/stores/view-options.svelte.js';
	import { t } from '#lib/i18n/index.js';
	import type OpenSeadragon from 'openseadragon';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import MaximizeIcon from '@lucide/svelte/icons/maximize';
	import MinimizeIcon from '@lucide/svelte/icons/minimize';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Spinner from '#lib/components/common/Spinner.svelte';

	interface IIIFViewerProps {
		manifestUrl: string;
		articleUrl?: string;
	}

	let { manifestUrl, articleUrl }: IIIFViewerProps = $props();

	let viewerContainer = $state<HTMLDivElement>();
	let viewer: OpenSeadragon.Viewer | null = $state(null);
	let tileSources = $state<(string | { type: string; url: string })[]>([]);
	let currentPage = $state(0);
	let totalPages = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let fallback = $state(false);
	let expanded = $state(false);
	let resizeFrame: number | undefined;

	$effect(() => {
		const page = Math.max(0, Math.min(viewOptionsState.scanPage - 1, totalPages - 1));
		if (viewer && totalPages > 0 && page !== currentPage) {
			currentPage = page;
			viewer.open(tileSources[page] as unknown as OpenSeadragon.TileSourceSpecifier);
		}
	});

	$effect(() => {
		const url = manifestUrl;
		const controller = new AbortController();
		let activeViewer: OpenSeadragon.Viewer | null = null;
		viewer = null;
		tileSources = [];
		totalPages = 0;
		currentPage = 0;
		loading = true;
		error = null;
		fallback = false;
		expanded = false;

		async function load() {
			try {
				const [{ default: OSD }, sources] = await Promise.all([
					import('openseadragon'),
					loadManifest(url, controller.signal)
				]);
				// A prop change or unmount can finish before the import or response body does.
				if (controller.signal.aborted) return;
				if (sources.length === 0) {
					fallback = true;
					loading = false;
					return;
				}

				tileSources = sources;
				totalPages = sources.length;
				loading = false;
				// The loading branch must yield its container before OpenSeadragon mounts.
				await tick();
				if (controller.signal.aborted || !viewerContainer) return;

				const page = Math.max(0, Math.min(viewOptionsState.scanPage - 1, sources.length - 1));
				currentPage = page;
				activeViewer = OSD({
					element: viewerContainer,
					// OSD accepts strings and { type, url } objects at runtime; its
					// TileSourceSpecifier type is stricter than these IIIF URLs.
					tileSources: sources[page] as unknown as OpenSeadragon.TileSourceSpecifier,
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
				viewer = activeViewer;
			} catch (e) {
				if (controller.signal.aborted) return;
				error = e instanceof Error ? e.message : 'Failed to load manifest';
				loading = false;
			}
		}

		void load();
		return () => {
			controller.abort();
			if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
			resizeFrame = undefined;
			activeViewer?.destroy();
			viewer = null;
		};
	});

	async function loadManifest(url: string, signal: AbortSignal) {
		const res = await fetch(url, { signal });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const manifest = await res.json();
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
		return sources;
	}

	function goToPage(page: number) {
		if (!viewer || page < 0 || page >= totalPages) return;
		viewOptionsState.scanPage = page + 1;
	}

	// OpenSeadragon's own zoom controls are image sprites in a style this app
	// does not use, so they stay off and these buttons drive the viewport.
	// Without them zoom was reachable only by wheel or pinch — no keyboard
	// path and nothing to discover on a trackpad-less desktop.
	function zoomBy(factor: number) {
		const viewport = viewer?.viewport;
		if (!viewport) return;
		viewport.zoomBy(factor);
		viewport.applyConstraints();
	}

	function resetZoom() {
		viewer?.viewport?.goHome();
	}

	// While expanded, Escape collapses the viewer and goes no further. The viewer
	// sits inside the article modal's native <dialog>, whose cancel is fired by
	// the browser's close request, not by a bubbling keydown: stopping
	// propagation alone would not prevent it. Cancelling the keydown does —
	// a close request is only processed when its Escape keydown was not
	// default-prevented. Capture phase on window, so this runs before any
	// other keydown listener on the page.
	$effect(() => {
		if (!expanded) return;
		function collapseOnEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopPropagation();
			toggleExpanded();
		}
		window.addEventListener('keydown', collapseOnEscape, { capture: true });
		return () => window.removeEventListener('keydown', collapseOnEscape, { capture: true });
	});

	function toggleExpanded() {
		expanded = !expanded;
		// Fit only the viewer that requested this resize, if it is still mounted.
		const activeViewer = viewer;
		if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(() => {
			resizeFrame = undefined;
			if (viewer === activeViewer) activeViewer?.viewport?.goHome(true);
		});
	}
</script>

{#if !fallback}
	<div class="iiif-viewer-wrapper" data-expanded={expanded}>
		{#if loading}
			<div class="viewer-placeholder">
				<Spinner size="xl" decorative --spinner-accent="var(--color-primary-400)" />
				<p class="viewer-note" role="status">{$t.messages.loading}</p>
			</div>
		{:else if error}
			<div class="viewer-placeholder">
				<p class="viewer-note">{error}</p>
				{#if articleUrl}
					<a
						href={articleUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="viewer-fallback-link"
					>
						{$t.article.consultOriginalArticle}
						<ExternalLinkIcon size={14} aria-hidden="true" />
					</a>
				{/if}
			</div>
		{:else}
			<!-- Toolbar -->
			<div class="viewer-toolbar">
				{#if totalPages > 1}
					<div class="page-nav">
						<button
							type="button"
							class="viewer-btn"
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 0}
							aria-label={$t.common.previous}
						>
							<ChevronLeftIcon size={18} aria-hidden="true" />
						</button>
						<span class="page-indicator">{currentPage + 1} / {totalPages}</span>
						<button
							type="button"
							class="viewer-btn"
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages - 1}
							aria-label={$t.common.next}
						>
							<ChevronRightIcon size={18} aria-hidden="true" />
						</button>
					</div>
				{/if}
				<div class="toolbar-actions">
					<button
						type="button"
						class="viewer-btn"
						onclick={() => zoomBy(1.5)}
						aria-label={$t.audit.zoomIn}
						title={$t.audit.zoomIn}
					>
						<ZoomInIcon size={18} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="viewer-btn"
						onclick={() => zoomBy(1 / 1.5)}
						aria-label={$t.audit.zoomOut}
						title={$t.audit.zoomOut}
					>
						<ZoomOutIcon size={18} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="viewer-btn"
						onclick={resetZoom}
						aria-label={$t.audit.zoomReset}
						title={$t.audit.zoomReset}
					>
						<RotateCcwIcon size={18} aria-hidden="true" />
					</button>
					<button
						type="button"
						class="viewer-btn"
						onclick={toggleExpanded}
						aria-label={$t.audit.expandViewer}
						aria-pressed={expanded}
					>
						{#if expanded}
							<MinimizeIcon size={16} aria-hidden="true" />
						{:else}
							<MaximizeIcon size={16} aria-hidden="true" />
						{/if}
					</button>
					{#if articleUrl}
						<a
							href={articleUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="viewer-btn"
							aria-label={$t.audit.newTab}
						>
							<ExternalLinkIcon size={16} aria-hidden="true" />
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
		border-radius: var(--radius-panel);
		overflow: hidden;
		background: var(--surface-nested);
		border: 1px solid var(--border-default);
	}

	.iiif-viewer-wrapper[data-expanded='true'] {
		position: fixed;
		inset: var(--space-4);
		z-index: var(--z-tooltip);
		border-radius: var(--radius-panel);
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
	}

	.osd-container {
		width: 100%;
		height: 300px;
		cursor: grab;
	}

	/* Fills whatever the toolbar leaves, whatever the toolbar's height. */
	.iiif-viewer-wrapper[data-expanded='true'] .osd-container {
		flex: 1;
		height: auto;
		min-height: 0;
	}

	.viewer-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		height: 200px;
	}

	.viewer-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) var(--space-3);
		background: color-mix(in oklab, var(--color-surface-900) 90%, transparent);
		border-bottom: 1px solid var(--border-subtle);
		min-height: var(--size-control-xl);
	}

	.page-nav {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.page-indicator {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		min-width: 3rem;
		text-align: center;
	}

	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		margin-left: auto;
	}

	.viewer-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		/* 40px: the touch-target floor (DESIGN.md, Accessibility floors). */
		width: var(--size-control-lg);
		height: var(--size-control-lg);
		border-radius: var(--radius-hairline);
		border: none;
		background: var(--surface-subtle);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background-color var(--timing-fast) var(--easing-default),
			color var(--timing-fast) var(--easing-default);
		text-decoration: none;
	}

	.viewer-btn:hover:not(:disabled) {
		background: var(--surface-hover);
		color: var(--text-primary);
	}

	.viewer-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.viewer-fallback-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		color: var(--color-primary-400);
		font-size: var(--font-size-base);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (min-width: 640px) {
		.osd-container {
			height: 400px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.viewer-btn {
			transition: none;
		}
	}

	.viewer-note {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}
</style>
