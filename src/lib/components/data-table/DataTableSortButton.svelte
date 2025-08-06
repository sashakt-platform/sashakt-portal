<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		title,
		columnId,
		currentSortBy,
		currentSortOrder,
		handleSort,
		variant = 'ghost',
		...restProps
	} = $props();

	const isActiveSorted = $derived(currentSortBy === columnId);
	const isAsc = $derived(isActiveSorted && currentSortOrder === 'asc');
	const isDesc = $derived(isActiveSorted && currentSortOrder === 'desc');
</script>

<Button {variant} onclick={() => handleSort(columnId)} {...restProps}>
	{title}
	{#if isDesc}
		<ArrowDown class="ml-2 size-4" />
	{:else if isAsc}
		<ArrowUp class="ml-2 size-4" />
	{:else}
		<ArrowUpDown class="ml-2 size-4" />
	{/if}
</Button>
