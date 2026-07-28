// Single source of truth for where this dashboard is published.
//
// WHY THIS FILE EXISTS — the deployment shape is unusual and the pieces must agree.
//
// The site is served from a custom subdomain, `iwac.frederickmadore.com`, at the
// sub-path `/sentiment-analysis/`. Those two facts pull in opposite directions on
// GitHub Pages:
//
//   • With a *project page* (the old fmadore.github.io/IWAC-sentiment-analysis/),
//     GitHub supplies the path prefix. The build root maps straight onto it, so
//     `paths.base` alone was enough.
//   • With a *custom domain*, GitHub serves the artifact at the subdomain ROOT.
//     Nothing supplies a `/sentiment-analysis/` segment any more — so the build
//     output has to physically contain that directory, or every base-prefixed URL
//     404s.
//
// Hence: the adapter writes the app into `build/sentiment-analysis/`, and
// `scripts/nest-build.mjs` populates the build ROOT with the three files GitHub
// only ever reads from there (CNAME, 404.html, and a redirect index.html).
//
// Everything that needs to know the path or the domain imports it from here:
// svelte.config.js, scripts/nest-build.mjs and scripts/stamp-sw.mjs. `static/sw.js`
// derives its own base from `self.location` and `static/404.html` carries a
// `__DEPLOY_PATH__` placeholder stamped at build time, so neither hardcodes it.

/**
 * Path prefix the app is served under, relative to the domain root.
 * Must start with `/` and not end with one (SvelteKit's `paths.base` contract).
 * Set to `''` to serve at the domain root instead.
 */
export const DEPLOY_PATH = '/sentiment-analysis';

/** Custom domain written to `build/CNAME` for GitHub Pages. */
export const CUSTOM_DOMAIN = 'iwac.frederickmadore.com';

/** Canonical origin + path, no trailing slash. Used for SEO absolute URLs. */
export const CANONICAL_URL = `https://${CUSTOM_DOMAIN}${DEPLOY_PATH}`;
