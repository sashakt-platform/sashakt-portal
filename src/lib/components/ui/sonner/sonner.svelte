<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border); --success-bg: #0AA978; --success-border: #089968; --success-text: white; --error-bg: #EA001F; --error-border: #d4001b; --error-text: white; --warning-bg: #E8900E; --warning-border: #d0810c; --warning-text: white;"
	{...restProps}
	>{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>

<style>
	:global([data-sonner-toaster][data-x-position='center']) {
		left: calc(50% + var(--sidebar-width, 16rem) / 2) !important;
	}
</style>
