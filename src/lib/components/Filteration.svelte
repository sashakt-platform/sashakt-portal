<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { goto } from '$app/navigation';

	type Filter = { id: string; name: string };

	let { items = $bindable(), itemList = $bindable(), itemName, ...rest } = $props();
	let open = $state(false);
	let searchQuery = $state('');
	const placeholder = 'Select ' + itemName + 's';

	// Debounced search
	let searchTimeout: NodeJS.Timeout | undefined;
	function handleSearch(e: Event) {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL(page.url);
			if (searchQuery) url.searchParams.set(itemName + '_search', searchQuery.toLowerCase());
			else url.searchParams.delete(itemName + '_search');

			goto(url, { keepFocus: true, invalidateAll: true });
		}, 300);
	}
</script>

{#snippet myBadge(children: Filter)}
	<Badge
		variant="default"
		style="background-color:#3587B4"
		class="m-1 flex items-center gap-1 rounded-sm "
	>
		{children.name}
		<button
			class="ml-2 text-white hover:text-gray-400 focus:outline-none"
			style="margin-left:auto;"
			onclick={(e) => {
				e.stopPropagation();
				const url = new URL(page.url);
				url.searchParams.delete(itemName + '_ids', String(children.id));
				goto(url, { keepFocus: true, invalidateAll: true });
				items = items.filter((s: Filter) => s.id !== children.id);
			}}>&times;</button
		>
	</Badge>
{/snippet}

<Popover.Root
	bind:open
	{...rest}
	onOpenChangeComplete={() => {
		if (!open) {
			searchQuery = '';
			try {
				const url = new URL(page.url);
				url.searchParams.delete(itemName + '_search');
				goto(url, { keepFocus: true, invalidateAll: true });
			} catch (e) {
				console.error('Failed to update URL on popover close', e);
			}
		}
	}}
>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="h-10 w-full justify-start"
				role="combobox"
				aria-expanded={open}
			>
				{#if items?.length === 0}
					{placeholder}
				{:else if items?.length < 3}
					<span class="flex flex-row truncate text-start">
						{#each items as item (item.id)}
							{@render myBadge(item)}
						{/each}
					</span>
				{:else if items?.length >= 3}
					{#if items[0]}
						{@render myBadge(items[0])}
					{/if}
					{#if items[1]}
						{@render myBadge(items[1])}
					{/if}
					+ {items?.length - 2}
				{/if}
				<ChevronsUpDownIcon class="ml-auto opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-fit p-0 ">
		<Command.Root>
			<Command.Input
				placeholder={'Search ' + itemName + 's...'}
				oninput={handleSearch}
				bind:value={searchQuery}
			/>
			<Command.List>
				<Command.Empty>No {itemName} found.</Command.Empty>
				{#each itemList as item (item.id)}
					<Command.Item
						value={String(item.name)}
						onSelect={() => {
							const itemId: string = String(item.id);
							const next = (items ?? []) as Filter[];
							if (next.some((s) => String(s.id) === itemId)) {
								items = next.filter((s) => String(s.id) !== itemId);
							} else {
								items = [...next, { id: String(item.id), name: item.name }];
							}
						}}
					>
						<CheckIcon
							class={cn(
								!(items ?? []).some((s: Filter) => String(s.id) === String(item.id)) &&
									'text-transparent'
							)}
						/>
						{item.name}
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
