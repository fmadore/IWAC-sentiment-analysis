/**
 * The citation record the footer shows, mirrored from `CITATION.cff` at the
 * repository root.
 *
 * Mirrored rather than read: the file sits outside the app's root, where Vite's
 * dev server will not serve it, and a YAML parser is not worth shipping for six
 * fields. `citation.test.ts` fails when this module and `CITATION.cff` (or
 * `package.json`'s version) disagree, so a release that bumps one without the
 * other cannot pass the test run.
 */

export const CITATION = {
	title: 'IWAC Sentiment Analysis Visualization',
	author: { family: 'Madore', given: 'Frédérick' },
	version: '5.0.0',
	dateReleased: '2026-10-05',
	/** The concept DOI: resolves to the latest release. */
	doi: '10.5281/zenodo.21806223',
	license: 'MIT',
	repository: 'https://github.com/fmadore/IWAC-sentiment-analysis',
	dataset: 'https://huggingface.co/datasets/fmadore/islam-west-africa-collection'
} as const;

export const CITATION_DOI_URL = `https://doi.org/${CITATION.doi}`;
