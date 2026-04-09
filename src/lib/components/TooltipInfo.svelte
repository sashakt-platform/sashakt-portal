<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';
	import type { QAItem } from '$lib/types/tooltip';

	let {
		label = 'Help',
		items = []
	}: {
		label?: string;
		items?: QAItem[];
	} = $props();

	let open = $state(false);

	const title = $derived(label.replace(/^Help:\s*/i, ''));
	const tooltipId = $derived(`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`);
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		aria-label={label}
		aria-describedby={tooltipId}
		class="focus-visible:ring-primary text-muted-foreground hover:text-foreground mt-3 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
	>
		<Info class="h-8 w-8" />
	</Popover.Trigger>

	<Popover.Content
		id={tooltipId}
		class="border-border bg-popover w-90.5 rounded-[20px] border p-0 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
		side="bottom"
		sideOffset={8}
		align="start"
	>
		<div class="flex items-center justify-between px-6 pt-6">
			<span class="text-muted-foreground text-base font-semibold">{title}</span>
			<Popover.Close aria-label="Close">
				<X class="h-4 w-4" />
			</Popover.Close>
		</div>

		<div class="flex flex-col gap-6 px-6 pt-4 pb-6">
			{#each items as item (item.question)}
				<div class="flex flex-col gap-1.5">
					<p class="text-foreground text-[12px] font-semibold">{item.question}</p>
					{#if item.text}
						<p class="text-foreground text-sm leading-relaxed">{item.text}</p>
					{:else if item.videoUrl}
						<div class="relative overflow-hidden rounded-lg">
							<iframe
								src={item.videoUrl}
								sandbox="allow-same-origin allow-scripts"
								title={item.question}
								class="aspect-video w-full rounded-lg border-0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							></iframe>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
