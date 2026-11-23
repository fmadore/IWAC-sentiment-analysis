/**
 * A closed drawer is moved off-screen by transform only, which hides nothing
 * from the keyboard: it must be `inert` as well as `aria-hidden`, and the
 * static rail it becomes at desktop widths must never be.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Drawer from './Drawer.svelte';

const children = createRawSnippet(() => ({
	render: () => '<div><a href="#x">Link</a><button type="button">Control</button></div>'
}));

function mount(props: { open: boolean; enabled?: boolean; onClose?: () => void }) {
	const onClose = props.onClose ?? vi.fn();
	const result = render(Drawer, {
		props: { label: 'Filters', children, ...props, onClose }
	});
	const panel = result.getByLabelText('Filters');
	return { ...result, panel, onClose };
}

afterEach(() => {
	cleanup();
	document.body.style.overflow = '';
});

describe('Drawer inert state', () => {
	it('is inert and aria-hidden when enabled and closed', () => {
		const { panel } = mount({ open: false });
		expect(panel.hasAttribute('inert')).toBe(true);
		expect(panel.getAttribute('aria-hidden')).toBe('true');
	});

	it('is not inert when open, and focus lands in the panel', () => {
		const { panel } = mount({ open: true });
		expect(panel.hasAttribute('inert')).toBe(false);
		expect(panel.hasAttribute('aria-hidden')).toBe(false);
		expect(document.activeElement).toBe(panel);
	});

	it('drops inert before focus moves in when it opens, and restores it on close', async () => {
		const trigger = document.createElement('button');
		document.body.append(trigger);
		trigger.focus();
		const { panel, rerender } = mount({ open: false });
		expect(panel.hasAttribute('inert')).toBe(true);
		// jsdom does not enforce inert on focus, so record the attribute at the
		// moment focus arrives: a real browser refuses focus to an inert element.
		const inertWhenFocused: boolean[] = [];
		panel.addEventListener('focus', () => inertWhenFocused.push(panel.hasAttribute('inert')));

		await rerender({ open: true });
		expect(panel.hasAttribute('inert')).toBe(false);
		expect(document.activeElement).toBe(panel);
		expect(inertWhenFocused).toEqual([false]);

		await rerender({ open: false });
		expect(panel.hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(trigger);
		trigger.remove();
	});

	it.each([false, true])('is never inert when disabled (static rail), open=%s', (open) => {
		const { panel } = mount({ open, enabled: false });
		flushSync();
		expect(panel.hasAttribute('inert')).toBe(false);
		expect(panel.hasAttribute('aria-hidden')).toBe(false);
	});

	it('leaves no inert on the rail when disabled while open', async () => {
		const onClose = vi.fn();
		const { panel, rerender } = mount({ open: true, onClose });
		await rerender({ open: true, enabled: false });
		expect(onClose).toHaveBeenCalled();
		await rerender({ open: false, enabled: false });
		expect(panel.hasAttribute('inert')).toBe(false);
	});

	it('does not put back a stale inert on a sibling whose own state changed meanwhile', async () => {
		// The other drawer's closed panel, inert by its own template when this
		// one opens, then un-inerted (it became a static rail) before this one's
		// cleanup runs. The cleanup must not restore its old `true`.
		const sibling = document.createElement('aside');
		sibling.inert = true;
		document.body.append(sibling);
		const { rerender } = mount({ open: true });
		expect(sibling.inert).toBe(true);
		sibling.inert = false;
		await rerender({ open: false });
		expect(sibling.inert).toBe(false);
		sibling.remove();
	});
});
