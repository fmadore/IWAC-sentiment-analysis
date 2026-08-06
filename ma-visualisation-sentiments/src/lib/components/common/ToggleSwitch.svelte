<!--
  ToggleSwitch Component

  An accessible boolean switch (role="switch" + aria-checked) with a visible
  :focus-visible ring. The active track color is themable via the
  --toggle-active-bg / --toggle-active-bg-hover CSS custom properties,
  defaulting to the comparison palette.

  Usage:
  <ToggleSwitch
    checked={excludeNonApplicable}
    onChange={(value) => { ... }}
    ariaLabel="Toggle exclude non-applicable articles"
  />
-->
<script lang="ts">
	interface ToggleSwitchProps {
		/** Whether the switch is on */
		checked: boolean;
		/** Called with the new value when the switch is toggled */
		onChange: (checked: boolean) => void;
		/** Accessible label for the switch */
		ariaLabel: string;
		/** Whether the switch is disabled */
		disabled?: boolean;
		/** Additional CSS class */
		class?: string;
	}

	let {
		checked,
		onChange,
		ariaLabel,
		disabled = false,
		class: className = ''
	}: ToggleSwitchProps = $props();
</script>

<button
	class="toggle-switch {className}"
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={ariaLabel}
	data-active={checked}
	{disabled}
	onclick={() => onChange(!checked)}
>
	<span class="toggle-thumb"></span>
</button>

<style>
	.toggle-switch {
		/* Component API — override on any ancestor to retint the active track. */
		--toggle-active-bg: var(--sentiment-comparison);
		--toggle-active-bg-hover: var(--sentiment-comparison-light);

		position: relative;
		width: var(--size-control-lg);
		height: 22px;
		background: var(--surface-active);
		border-radius: var(--radius-panel);
		border: none;
		cursor: pointer;
		transition: background-color var(--timing-normal) var(--easing-default);
	}

	.toggle-switch:hover:not(:disabled) {
		background: var(--border-strong);
	}

	.toggle-switch:focus-visible {
		outline: none;
		box-shadow: var(--ring-focus);
	}

	.toggle-switch:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toggle-switch[data-active='true'] {
		background: var(--toggle-active-bg);
	}

	.toggle-switch[data-active='true']:hover:not(:disabled) {
		background: var(--toggle-active-bg-hover);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--text-primary);
		border-radius: var(--radius-circle);
		transition: transform var(--timing-normal) var(--easing-default);
		box-shadow: 0 2px 4px color-mix(in oklab, black 20%, transparent);
	}

	.toggle-switch[data-active='true'] .toggle-thumb {
		transform: translateX(18px);
	}

	/* Responsive */
	@media (min-width: 640px) {
		.toggle-switch {
			width: var(--size-control-xl);
			height: var(--size-icon-lg);
		}

		.toggle-thumb {
			width: var(--size-icon-md);
			height: var(--size-icon-md);
		}

		.toggle-switch[data-active='true'] .toggle-thumb {
			transform: translateX(20px);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.toggle-switch,
		.toggle-thumb {
			transition: none;
		}
	}
</style>
