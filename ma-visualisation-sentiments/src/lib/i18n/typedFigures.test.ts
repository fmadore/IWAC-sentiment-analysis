/**
 * Corpus figures that stay typed into the catalogues, pinned to the shipped data.
 *
 * Most figures on screen are computed from the loaded data or the contract.
 * These few cannot be: the run-configuration list describes the generation-2
 * annotation run as a fixed record, and the Open Graph alt text is a static
 * meta tag rendered before any data loads. A corpus change that moves one of
 * them must fail here rather than ship a stale number in either language.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { datasetIdsOf } from '#lib/domain/sentimentContract.js';
import { en } from './en';
import { fr } from './fr';

const DATA_DIR = resolve(process.cwd(), 'static/data');
const load = (name: string): unknown => JSON.parse(readFileSync(`${DATA_DIR}/${name}`, 'utf8'));

const corpus = (load('iwac_articles_base.json') as unknown[]).length;
const rated = Object.fromEntries(
	datasetIdsOf('v2').map((id) => {
		const { sentiments } = load(`iwac_sentiment_${id}.json`) as {
			sentiments: Record<string, { polarite?: string | null } | null>;
		};
		const count = Object.values(sentiments).filter((s) => s?.polarite != null).length;
		return [id, count];
	})
) as Record<string, number>;

/** A number as each catalogue writes it: `12,348` in English, `12 348` in French. */
const written = (value: number) => ({
	en: value.toLocaleString('en-GB'),
	fr: new RegExp(
		String.raw`(?<!\d)${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '[\\s\\u202f\\u00a0]')}(?!\d)`
	)
});

function expectBoth(enText: string, frText: string, value: number) {
	const form = written(value);
	expect(enText).toContain(form.en);
	expect(frText).toMatch(form.fr);
}

describe('typed corpus figures', () => {
	const coverageEn = en.analysisV2.config.find((line) => line.startsWith('Coverage'))!;
	const coverageFr = fr.analysisV2.config.find((line) => line.startsWith('Couverture'))!;
	const fullPanel = rated.luna;

	it('states the corpus size and the articles the full panel annotates', () => {
		expectBoth(coverageEn, coverageFr, corpus);
		expectBoth(coverageEn, coverageFr, fullPanel);
		// GPT-5.6 Luna, Mistral Small 4, DeepSeek v4 Flash and Gemma 4 31B rate the same set.
		for (const id of ['mistral-small', 'deepseek', 'gemma']) expect(rated[id]).toBe(fullPanel);
		expectBoth(coverageEn, coverageFr, corpus - fullPanel);
	});

	it('states the shortfalls of Claude Haiku 5.5 and Qwen3.8 27B', () => {
		const haikuEn = en.analysisV2.config.find((line) => line.startsWith('Claude Haiku 5.5 stops'))!;
		const haikuFr = fr.analysisV2.config.find((line) =>
			line.startsWith('Claude Haiku 5.5 s’arrête')
		)!;
		expectBoth(haikuEn, haikuFr, fullPanel - rated.haiku);
		const qwenEn = en.analysisV2.config.find((line) => line.startsWith('Qwen3.8 27B stops'))!;
		const qwenFr = fr.analysisV2.config.find((line) => line.startsWith('Qwen3.8 27B s’arrête'))!;
		expectBoth(qwenEn, qwenFr, fullPanel - rated.qwen);
	});

	it('gives the corpus size in the Open Graph alt text', () => {
		expectBoth(en.meta.ogImageAlt, fr.meta.ogImageAlt, corpus);
	});
});
