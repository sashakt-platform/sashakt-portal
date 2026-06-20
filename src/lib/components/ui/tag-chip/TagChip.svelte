<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		name,
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		name: string;
		children?: Snippet;
	} = $props();
</script>

<span
	data-slot="tag-chip"
	class={cn(
		'bg-muted text-muted-foreground inline-flex max-w-full items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-normal transition-colors',
		className
	)}
	{...restProps}
>
	<span class="whitespace-normal break-all">{name}</span>
	{#if children}
		{@render children()}
	{/if}
</span>
