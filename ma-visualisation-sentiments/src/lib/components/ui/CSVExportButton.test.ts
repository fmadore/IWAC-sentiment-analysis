import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import type { Article, ComparisonData } from '$lib/types/data';
import { currentLanguage } from '$lib/i18n';
import { downloadCSVFile } from '$lib/utils/csv';
import CSVExportButton from './CSVExportButton.svelte';
import ComparisonCSVExportButton from './ComparisonCSVExportButton.svelte';

const mocks = vi.hoisted(() => ({
	articleState: { filtered: [] as Article[] },
	comparisonState: { filtered: [] as ComparisonData[] },
	datasetState: {
		selected: 'luna',
		pair: 'luna-gemma',
		available: [
			{ id: 'luna', name: 'Luna' },
			{ id: 'gemma', name: 'Gemma' }
		]
	},
	loadJustifications: vi.fn(),
	urlState: { view: 'table', dataset: 'luna', lang: 'fr', countries: ['Bénin'] }
}));

vi.mock('$lib/stores', () => mocks);
vi.mock('$lib/stores/url/state.svelte', () => ({ getCurrentState: () => mocks.urlState }));
vi.mock('$lib/utils/csv', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/utils/csv')>()),
	downloadCSVFile: vi.fn()
}));

function article(id: number, title: string): Article {
	return {
		'o:id': id,
		'o:title': title,
		dataset_id: 'luna',
		Country: 'Bénin',
		Newspaper: 'Le Matinal',
		journal_source: 'Le Matinal',
		publication_date: '2020-01',
		sentiment_analysis: {
			polarite: 'Positif',
			subjectivite_score: 2,
			centralite_islam_musulmans: 'Central',
			polarite_justification: null,
			subjectivite_justification: null,
			centralite_justification: null
		}
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	currentLanguage.set('fr');
	mocks.datasetState.selected = 'luna';
	mocks.datasetState.pair = 'luna-gemma';
	mocks.urlState.countries = ['Bénin'];
});
afterEach(() => {
	cleanup();
	currentLanguage.set('fr');
});

it('exports the clicked model, rows, language and filters while another selection is made', async () => {
	const original = article(2248, 'Article initial');
	mocks.articleState.filtered = [original];
	let release!: () => void;
	mocks.loadJustifications.mockImplementation(
		() =>
			new Promise<void>((resolve) => {
				release = () => {
					original.sentiment_analysis!.polarite_justification = 'Justification initiale';
					resolve();
				};
			})
	);
	const { getByRole } = render(CSVExportButton);
	await fireEvent.click(getByRole('button'));
	expect(mocks.loadJustifications).toHaveBeenCalledWith('luna', expect.any(Function), [2248]);
	mocks.datasetState.selected = 'qwen';
	mocks.articleState.filtered = [article(999, 'Autre sélection')];
	mocks.urlState.countries = ['Togo'];
	currentLanguage.set('en');
	release();
	await waitFor(() => expect(downloadCSVFile).toHaveBeenCalledOnce());
	const csv = vi.mocked(downloadCSVFile).mock.calls[0][0];
	expect(csv).toContain('Article initial');
	expect(csv).toContain('Justification initiale');
	expect(csv).toContain(',Positif,');
	expect(csv).toContain(',v2,luna,development,fr,filtered_articles,');
	expect(csv).toContain('countries=B%C3%A9nin');
	expect(csv).not.toContain('Autre sélection');
	expect(csv).not.toContain('countries=Togo');
	expect(csv.split('\n')).toHaveLength(2);
});

it('prepares only the clicked comparison rows for both original models', async () => {
	const original = article(42, 'Comparaison initiale');
	const row: ComparisonData = {
		article: original,
		modelAId: 'luna',
		modelBId: 'gemma',
		modelA: original.sentiment_analysis,
		modelB: { ...original.sentiment_analysis! },
		discrepancies: {
			polarityDiff: 0,
			subjectivityDiff: 0,
			centralityDiff: 0,
			totalDiff: 0,
			hasConflict: false,
			isComparable: true
		}
	};
	mocks.comparisonState.filtered = [row];
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	mocks.loadJustifications.mockImplementation(() => gate);
	const { getByRole } = render(ComparisonCSVExportButton);
	await fireEvent.click(getByRole('button'));
	expect(mocks.loadJustifications).toHaveBeenCalledWith('luna', expect.any(Function), [42]);
	expect(mocks.loadJustifications).toHaveBeenCalledWith('gemma', expect.any(Function), [42]);
	mocks.datasetState.pair = 'deepseek-qwen';
	mocks.comparisonState.filtered = [];
	currentLanguage.set('en');
	row.modelA!.polarite_justification = 'Raisonnement A';
	row.modelB!.polarite_justification = 'Raisonnement B';
	release();
	await waitFor(() => expect(downloadCSVFile).toHaveBeenCalledOnce());
	const csv = vi.mocked(downloadCSVFile).mock.calls[0][0];
	expect(csv).toContain('Comparaison initiale');
	expect(csv).toContain('Raisonnement A');
	expect(csv).toContain('Raisonnement B');
	expect(csv).toContain(',v2,luna;gemma,development,fr,filtered_comparisons,');
	expect(csv).toContain('Luna -');
	expect(csv).not.toContain('DeepSeek');
});
