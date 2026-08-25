/**
 * Dataset State Module
 *
 * Manages dataset configuration and selection state using Svelte 5 runes.
 *
 * Two analysis generations are published. v2 is the showcased set; v1 stays
 * selectable so its URLs and figures keep resolving, but nothing offers it up
 * except the archive link in the methodology card. The active generation is
 * *derived* from the selected id rather than stored, so there is no way for a
 * generation flag and a model id to disagree.
 */

import type { DatasetId, DatasetOption, GenerationId, ModelPair } from '$lib/types/data';
import {
	CURRENT_GENERATION,
	datasetIdsOf,
	defaultDatasetOf,
	defaultPairOf,
	generationOf,
	getPairModels,
	isDatasetId,
	isModelPair,
	pairIdsOf
} from '$lib/domain/sentimentContract';

// ============================================
// Dataset Configuration (Static)
// ============================================

// Brand colours are duplicated from app.css on purpose: chart and logo code
// cannot read CSS custom properties (see the note beside --brand-* there).
const DATASETS: DatasetOption[] = [
	{
		id: 'chatgpt',
		generation: 'v1',
		name: 'ChatGPT',
		file: '/data/iwac_sentiment_chatgpt.json',
		logo: '/logo/ChatGPT_logo.svg',
		color: '#10a37f'
	},
	{
		id: 'gemini',
		generation: 'v1',
		name: 'Gemini',
		file: '/data/iwac_sentiment_gemini.json',
		logo: '/logo/Gemini_logo.svg',
		color: '#8e75b2'
	},
	{
		id: 'mistral',
		generation: 'v1',
		name: 'Mistral',
		file: '/data/iwac_sentiment_mistral.json',
		logo: '/logo/Mistral_AI_logo.svg',
		color: '#F54E42'
	},
	{
		id: 'luna',
		generation: 'v2',
		name: 'GPT-5.6 Luna',
		file: '/data/iwac_sentiment_luna.json',
		logo: '/logo/ChatGPT_logo.svg',
		color: '#10a37f'
	},
	{
		id: 'mistral-small',
		generation: 'v2',
		name: 'Mistral Small 4',
		file: '/data/iwac_sentiment_mistral-small.json',
		logo: '/logo/Mistral_AI_logo.svg',
		color: '#F54E42'
	},
	{
		id: 'deepseek',
		generation: 'v2',
		name: 'DeepSeek v4 Flash',
		file: '/data/iwac_sentiment_deepseek.json',
		logo: '/logo/DeepSeek_logo.svg',
		color: '#4d6bfe'
	},
	{
		id: 'gemma',
		generation: 'v2',
		name: 'Gemma 4 31B',
		file: '/data/iwac_sentiment_gemma.json',
		logo: '/logo/Gemma_logo.png',
		color: '#338dff'
	},
	{
		id: 'qwen',
		generation: 'v2',
		name: 'Qwen3.8 27B',
		file: '/data/iwac_sentiment_qwen.json',
		logo: '/logo/Qwen_logo.png',
		color: '#615ced'
	}
];

// ============================================
// Svelte 5 Runes State
// ============================================

let _selectedDataset = $state<DatasetId>(defaultDatasetOf(CURRENT_GENERATION));
let _comparisonMode = $state<boolean>(false);
let _comparisonPair = $state<ModelPair>(defaultPairOf(CURRENT_GENERATION));

// ============================================
// Modern State Accessors (Recommended)
// ============================================

/**
 * Dataset state object with reactive getters and setters.
 * Use this API for new code.
 *
 * @example
 * // Read state
 * const current = datasetState.selected;
 *
 * // Write state
 * datasetState.selected = 'luna';
 *
 * // Get dataset config
 * const config = datasetState.getById('luna');
 */
export const datasetState = {
	// Every dataset of every generation. Pickers should use `availableInGeneration`
	// instead, so the archived models stay out of the way.
	get available(): DatasetOption[] {
		return DATASETS;
	},

	/** The datasets a picker should offer: those of the active generation. */
	get availableInGeneration(): DatasetOption[] {
		const ids = datasetIdsOf(this.generation);
		return DATASETS.filter((dataset) => ids.includes(dataset.id));
	},

	/** The pair ids a picker should offer, in contract order. */
	get pairsInGeneration(): readonly ModelPair[] {
		return pairIdsOf(this.generation);
	},

	/**
	 * The generation currently on screen, derived from whichever id is in play.
	 * Comparison mode is driven by the pair, every other view by the dataset.
	 */
	get generation(): GenerationId {
		return generationOf(_comparisonMode ? _comparisonPair : _selectedDataset);
	},

	/** True while the archived analysis is being shown. */
	get isArchived(): boolean {
		return this.generation !== CURRENT_GENERATION;
	},

	// Selected dataset. The getter is narrowed to the DatasetId union; the
	// Invalid external values are rejected at their parsing boundary.
	get selected(): DatasetId {
		return _selectedDataset;
	},
	set selected(value: DatasetId) {
		if (!isDatasetId(value)) throw new Error(`Unknown dataset: ${value}`);
		_selectedDataset = value;
	},

	// Comparison mode
	get isComparisonMode() {
		return _comparisonMode;
	},
	set isComparisonMode(value: boolean) {
		if (value === _comparisonMode) return;
		// Carry the generation across the mode switch. Without this, entering
		// comparison from an archived model would silently jump to the current
		// generation's default pair, and leaving it would jump back.
		if (value) {
			if (generationOf(_comparisonPair) !== generationOf(_selectedDataset)) {
				_comparisonPair = defaultPairOf(generationOf(_selectedDataset));
			}
		} else if (generationOf(_selectedDataset) !== generationOf(_comparisonPair)) {
			_selectedDataset = getPairModels(_comparisonPair)[0];
		}
		_comparisonMode = value;
	},
	toggleComparisonMode() {
		this.isComparisonMode = !_comparisonMode;
	},

	/**
	 * The active model pair, always of the generation on screen.
	 *
	 * The stored pair can belong to the other generation, because outside
	 * comparison mode the generation follows `_selectedDataset` and nothing
	 * reconciles the two — `set isComparisonMode` only does it on the mode
	 * switch. That left the agreement view, which is not comparison mode but
	 * reads this pair, asking for a v2 pair while the v1 corpora were the ones
	 * being loaded: its models were never present, `pairAgreement` returned null,
	 * and the whole archived view sat in its loading state forever.
	 *
	 * Answering with the active generation's default makes "the pair belongs to
	 * the generation on screen" true by construction instead of by whoever
	 * remembers to reconcile it. Inside comparison mode the generation is derived
	 * FROM this pair, so the guard can never fire there.
	 */
	get pair(): ModelPair {
		return generationOf(_comparisonPair) === this.generation
			? _comparisonPair
			: defaultPairOf(this.generation);
	},
	set pair(value: ModelPair) {
		if (!isModelPair(value)) throw new Error(`Unknown model pair: ${value}`);
		_comparisonPair = value;
	},

	/**
	 * Switch the whole dashboard to another generation, keeping the current
	 * mode. Used by the archive link and by the "back to current" control.
	 */
	setGeneration(generation: GenerationId) {
		_comparisonPair = defaultPairOf(generation);
		_selectedDataset = defaultDatasetOf(generation);
	},

	// Utility: Get dataset by ID
	getById(id: string): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === id);
	},

	// Utility: Get current dataset config
	get current(): DatasetOption | undefined {
		return DATASETS.find((d) => d.id === _selectedDataset);
	}
};
