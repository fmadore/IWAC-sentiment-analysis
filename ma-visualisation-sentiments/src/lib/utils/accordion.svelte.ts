/**
 * Shared accordion composable using Svelte 5 runes.
 * Used by: AnalysisInfo, ArbiterMethodology
 */

export interface AccordionState {
	isOpen: (section: string) => boolean;
	toggle: (section: string) => void;
}

export function createAccordion(): AccordionState {
	let openSections = $state<string[]>([]);

	function isOpen(section: string): boolean {
		return openSections.includes(section);
	}

	function toggle(section: string) {
		if (openSections.includes(section)) {
			openSections = openSections.filter((s) => s !== section);
		} else {
			openSections = [...openSections, section];
		}
	}

	return { isOpen, toggle };
}
