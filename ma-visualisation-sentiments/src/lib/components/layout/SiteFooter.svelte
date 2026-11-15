<!--
  SiteFooter

  Citation and provenance, in normal document flow at the end of the page: how
  to cite the software (mirrored from CITATION.cff, see citation.ts), its DOI and
  version, and which data the numbers on screen come from — the manifest of the
  generation on screen (source revision and generation date) plus the build's
  immutable data release. Quiet on purpose: eyebrow labels and small type.

  The manifest is fetched once per generation, after mount, from the same
  release directory as every other data file; it is not part of the initial
  payload and the page never waits on it.
-->
<script module lang="ts">
	import type { GenerationId } from '#lib/types/data.js';

	interface ManifestSummary {
		generated: string | null;
		revision: string | null;
	}

	// A plain cache of promises, never read reactively: the component tracks the
	// load in its own state.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const manifestLoads = new Map<GenerationId, Promise<ManifestSummary>>();

	function loadManifest(generation: GenerationId, url: string): Promise<ManifestSummary> {
		let pending = manifestLoads.get(generation);
		if (!pending) {
			pending = fetch(url)
				.then((response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					return response.json() as Promise<{
						generated?: unknown;
						source?: { revision?: unknown };
					}>;
				})
				.then((manifest) => ({
					generated: typeof manifest.generated === 'string' ? manifest.generated : null,
					revision: typeof manifest.source?.revision === 'string' ? manifest.source.revision : null
				}));
			pending.catch(() => manifestLoads.delete(generation));
			manifestLoads.set(generation, pending);
		}
		return pending;
	}
</script>

<script lang="ts">
	// Every link here is external (DOI, GitHub, Hugging Face), so the app's
	// own `resolve()` does not apply; the rule cannot tell from a variable.
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { onMount } from 'svelte';
	import { t, currentLanguage } from '#lib/i18n/index.js';
	import { datasetState } from '#lib/stores/index.js';
	import { DATA_RELEASE, dataUrl } from '#lib/data/release.js';
	import { CITATION, CITATION_DOI_URL } from './citation';

	let mounted = $state(false);
	onMount(() => (mounted = true));

	const generation = $derived(datasetState.generation);
	const manifestFile = $derived(
		generation === 'v2' ? 'iwac_data_manifest_v2.json' : 'iwac_data_manifest.json'
	);

	type ManifestState =
		{ status: 'loading' } | { status: 'ready'; data: ManifestSummary } | { status: 'error' };

	let manifest = $state<ManifestState>({ status: 'loading' });

	$effect(() => {
		if (!mounted) return;
		const gen = generation;
		const url = dataUrl(manifestFile);
		let current = true;
		manifest = { status: 'loading' };
		loadManifest(gen, url)
			.then((data) => {
				if (current) manifest = { status: 'ready', data };
			})
			.catch(() => {
				if (current) manifest = { status: 'error' };
			});
		return () => {
			current = false;
		};
	});

	const year = CITATION.dateReleased.slice(0, 4);

	function formatDate(iso: string): string {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso;
		return new Intl.DateTimeFormat($currentLanguage, { dateStyle: 'long' }).format(date);
	}

	const provenance = $derived.by(() => {
		if (manifest.status !== 'ready') return null;
		const parts: string[] = [
			generation === 'v2' ? $t.footer.currentAnalysis : $t.footer.archivedAnalysis
		];
		if (manifest.data.generated)
			parts.push($t.footer.generated.replace('{date}', formatDate(manifest.data.generated)));
		if (manifest.data.revision)
			parts.push(
				$t.footer.sourceRevision.replace('{revision}', manifest.data.revision.slice(0, 7))
			);
		if (DATA_RELEASE) parts.push($t.footer.release.replace('{release}', DATA_RELEASE.slice(0, 12)));
		return parts.join(' · ');
	});
</script>

<footer class="site-footer">
	<div class="footer-inner">
		<section class="footer-block footer-cite" aria-labelledby="footer-cite-title">
			<h2 class="footer-label" id="footer-cite-title">{$t.footer.cite}</h2>
			<p class="footer-citation">
				{CITATION.author.family}, {CITATION.author.given} ({year}).
				<cite>{CITATION.title}</cite>, {$t.footer.version.toLowerCase()}
				{CITATION.version} [{$t.footer.softwareTag}]. Zenodo.
				<a class="footer-link" href={CITATION_DOI_URL} rel="noopener noreferrer"
					>{CITATION_DOI_URL}</a
				>
			</p>
			<p class="footer-note">{$t.footer.citeNote}</p>
		</section>

		<dl class="footer-facts">
			<div class="footer-fact">
				<dt class="footer-label">{$t.footer.version}</dt>
				<dd>{CITATION.version}</dd>
			</div>
			<div class="footer-fact">
				<dt class="footer-label">{$t.footer.data}</dt>
				<dd>
					{#if provenance}
						{provenance}
					{:else if manifest.status === 'error'}
						{$t.footer.provenanceUnavailable}
					{:else}
						{$t.footer.provenanceLoading}
					{/if}
				</dd>
			</div>
			<div class="footer-fact">
				<dt class="footer-label">{$t.footer.licence}</dt>
				<dd>{$t.footer.licenceText}</dd>
			</div>
			{#if generation === 'v2'}
				<!-- Required by the HPC centre for work run on its cluster (Qwen, v2 only). -->
				<div class="footer-fact">
					<dt class="footer-label">{$t.footer.acknowledgements}</dt>
					<dd>{$t.footer.acknowledgementText}</dd>
				</div>
			{/if}
		</dl>

		<ul class="footer-links">
			<li>
				<a class="footer-link" href={CITATION.repository} target="_blank" rel="noopener noreferrer"
					>{$t.footer.repository}</a
				>
			</li>
			<li>
				<a class="footer-link" href={CITATION.dataset} target="_blank" rel="noopener noreferrer"
					>{$t.footer.dataset}</a
				>
			</li>
		</ul>
	</div>
</footer>

<style>
	.site-footer {
		border-top: 1px solid var(--border-subtle);
		background: var(--app-bg-elevated);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
	}

	.footer-inner {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
		max-width: 105rem;
		margin-inline: auto;
		padding: var(--space-5) var(--space-4);
	}

	.footer-block,
	.footer-facts {
		margin: 0;
		min-width: 0;
	}

	.footer-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-eyebrow);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--text-muted);
		margin: 0 0 var(--space-1);
	}

	.footer-citation {
		color: var(--text-secondary);
		margin: 0;
		max-width: var(--prose-width);
		overflow-wrap: anywhere;
	}

	.footer-note {
		margin: var(--space-1) 0 0;
		max-width: var(--prose-width);
	}

	.footer-facts {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.footer-fact dd {
		margin: 0;
		color: var(--text-secondary);
		overflow-wrap: anywhere;
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.footer-link {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
		overflow-wrap: anywhere;
	}

	.footer-link:hover {
		color: var(--text-primary);
	}

	@media (min-width: 1024px) {
		.footer-inner {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
			padding: var(--space-6);
		}

		.footer-links {
			grid-column: 1 / -1;
		}
	}
</style>
