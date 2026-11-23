/**
 * PromptModal is a native modal <dialog>: Escape reaches it as `cancel`, the
 * page behind is inert, focus returns to the opener and the body's overflow
 * is restored to what it was, not blanked.
 *
 * jsdom implements neither `showModal()` nor `close()`, so both are stubbed to
 * toggle the `open` attribute; the browser's own behaviour is covered by
 * e2e/citations.spec.ts.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import PromptModal from './PromptModal.svelte';
import { currentLanguage } from '#lib/i18n/index.js';

const proto = HTMLDialogElement.prototype;
const originalShowModal = proto.showModal;
const originalClose = proto.close;

beforeAll(() => {
	currentLanguage.set('en');
	proto.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	proto.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
});

afterAll(() => {
	proto.showModal = originalShowModal;
	proto.close = originalClose;
	currentLanguage.set('fr');
});

afterEach(() => {
	cleanup();
	document.body.style.overflow = '';
	document.body.replaceChildren();
	vi.clearAllMocks();
});

const title = createRawSnippet(() => ({ render: () => '<span>Annotation prompt</span>' }));
const children = createRawSnippet(() => ({ render: () => '<p>Prompt body</p>' }));

function renderModal(open: boolean, onClose = vi.fn()) {
	const result = render(PromptModal, { props: { open, onClose, title, children } });
	return { ...result, onClose };
}

describe('PromptModal', () => {
	it('opens as a native modal dialog named by its heading', () => {
		renderModal(true);
		const dialog = screen.getByRole('dialog', { name: 'Annotation prompt' });
		expect(dialog.tagName).toBe('DIALOG');
		expect(proto.showModal).toHaveBeenCalledTimes(1);
		expect(dialog.hasAttribute('open')).toBe(true);
		const labelledBy = dialog.getAttribute('aria-labelledby');
		expect(labelledBy).toBeTruthy();
		expect(document.getElementById(labelledBy!)?.textContent).toContain('Annotation prompt');
	});

	it('renders nothing while closed', () => {
		renderModal(false);
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(proto.showModal).not.toHaveBeenCalled();
	});

	it('closes on Escape, which the browser delivers as a cancel event', async () => {
		const { onClose } = renderModal(true);
		const dialog = screen.getByRole('dialog');
		const cancel = new Event('cancel', { cancelable: true });
		await fireEvent(dialog, cancel);
		expect(onClose).toHaveBeenCalledTimes(1);
		// The parent owns `open`, so the native close is left to the effect.
		expect(cancel.defaultPrevented).toBe(true);
	});

	it('closes on a scrim click but not on a click inside the panel', async () => {
		const { onClose } = renderModal(true);
		await fireEvent.click(screen.getByText('Prompt body'));
		expect(onClose).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('dialog'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('closes from both close buttons', async () => {
		const { onClose } = renderModal(true);
		const buttons = screen.getAllByRole('button', { name: 'Close' });
		expect(buttons).toHaveLength(2);
		for (const button of buttons) await fireEvent.click(button);
		expect(onClose).toHaveBeenCalledTimes(2);
	});

	it('restores the previous body overflow and returns focus to the opener', async () => {
		const opener = document.createElement('button');
		opener.textContent = 'Open prompt';
		document.body.append(opener);
		opener.focus();
		document.body.style.overflow = 'scroll';

		const { rerender } = renderModal(true);
		expect(document.body.style.overflow).toBe('hidden');
		screen.getAllByRole('button', { name: 'Close' })[0].focus();
		expect(document.activeElement).not.toBe(opener);

		await rerender({ open: false });
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(proto.close).toHaveBeenCalledTimes(1);
		expect(document.body.style.overflow).toBe('scroll');
		expect(document.activeElement).toBe(opener);
	});
});
