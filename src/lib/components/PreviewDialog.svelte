<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import X from '@lucide/svelte/icons/x';

	let {
		open = $bindable(false),
		title,
		viewMode = $bindable('mobile'),
		children,
		onClose
	}: {
		open: boolean;
		title: string;
		viewMode?: 'mobile' | 'desktop';
		children: Snippet;
		onClose?: () => void;
	} = $props();
</script>

{#snippet viewModeButton(
	mode: 'mobile' | 'desktop',
	Icon: Component<{ size?: number }>,
	label: string
)}
	<button
		type="button"
		onclick={() => (viewMode = mode)}
		class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors {viewMode ===
		mode
			? 'bg-background text-primary font-medium shadow-sm'
			: 'text-muted-foreground hover:text-foreground'}"
	>
		<Icon size={14} />
		{label}
	</button>
{/snippet}

<Dialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen) onClose?.();
	}}
>
	<Dialog.Overlay class="backdrop-blur-sm" />
	<Dialog.Content
		showCloseButton={false}
		class="flex flex-col gap-0 overflow-hidden rounded-xl p-0"
		style="width: 1200px; max-width: 95vw; height: 700px; max-height: 90vh;"
	>
		<Dialog.Header class="flex flex-row items-center justify-between space-y-0 border-b px-8 py-4">
			<Dialog.Title class="text-base font-semibold">{title}</Dialog.Title>

			<div class="flex items-center gap-3">
				<div class="bg-muted flex items-center rounded-lg border p-1">
					{@render viewModeButton('mobile', Smartphone, 'Mobile')}
					{@render viewModeButton('desktop', Monitor, 'Desktop')}
				</div>

				<Dialog.Close
					aria-label="Close"
					class="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center rounded-md p-2 transition-colors"
				>
					<X size={22} />
				</Dialog.Close>
			</div>
		</Dialog.Header>

		<div class="bg-muted/30 flex flex-1 items-start justify-center overflow-y-auto p-10">
			{#if viewMode === 'mobile'}
				<div
					class="border-foreground/80 bg-background relative mx-auto w-100 overflow-hidden rounded-2xl border-[3px]"
					style="min-height: 553px;"
				>
					<div class="overflow-y-auto" style="max-height: 553px;">
						{@render children()}
					</div>
				</div>
			{:else}
				<div class="border-foreground/80 bg-background w-full overflow-hidden rounded-2xl border-2">
					{@render children()}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
