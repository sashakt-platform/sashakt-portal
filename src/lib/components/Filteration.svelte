<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { goto } from '$app/navigation';

	type Filter = { id: string; name: string };

	let {
		items = $bindable(),
		itemList = $bindable(),
		itemName,
		label = null,
		filteration = false,
		multiple = true,
		onSearch = null as ((search: string) => void) | null,
		isLoading = false,
		...rest
	} = $props();
	let open = $state(false);
	let searchQuery = $state('');
	const placeholder = $derived(
		multiple ? 'Select ' + (label ?? itemName) + 's' : 'Select ' + (label ?? itemName)
	);

	// Debounced search
	let searchTimeout: NodeJS.Timeout | undefined;
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (onSearch) {
				// Lazy loading mode - call the search callback
				onSearch(searchQuery);
			} else {
				// Original URL-based mode for backward compatibility
				const url = new URL(page.url);
				if (searchQuery) url.searchParams.set(itemName + '_search', searchQuery.toLowerCase());
				else url.searchParams.delete(itemName + '_search');

				// reset pagination to first page user searches
				url.searchParams.set('page', '1');
				goto(url, { keepFocus: true, invalidateAll: true });
			}
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

				// reset pagination to first page when filters removed
				url.searchParams.set('page', '1');

				goto(url, { keepFocus: true, invalidateAll: true });
				items = items.filter((s: Filter) => s.id !== children.id);
			}}>&times;</button
		>
	</Badge>
{/snippet}

<Popover.Root
	bind:open
	{...rest}
	onOpenChange={(e: boolean) => {
		if (!e) {
			searchQuery = '';

			// let's reset the filter list when popover closes
			if (onSearch) {
				onSearch('');
			}

			const url = new URL(page.url);
			try {
				url.searchParams.delete(itemName + '_search');
			} catch (e) {
				console.error('Failed to update URL on popover close', e);
			}
			if (filteration) {
				url.searchParams.delete(itemName + '_ids');
				items.map((item: Filter) => {
					url.searchParams.append(itemName + '_ids', item.id);
				});

				// reset pagination to first page when filters change
				url.searchParams.set('page', '1');
			}
			goto(url, { keepFocus: true, invalidateAll: true });
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
				{#if multiple}
					{#if items?.length === 0}
						{placeholder}
					{:else if items?.length < 3}
						<span class="flex flex-row truncate text-start">
							{#each items as item (item.id)}
								{@render myBadge(item)}
							{/each}
						</span>
					{:else if items?.length >= 3}
						<span class="flex min-w-0 flex-1 flex-row overflow-hidden text-start">
							{#if items[0]}
								{@render myBadge(items[0])}
							{/if}
							{#if items[1]}
								{@render myBadge(items[1])}
							{/if}
						</span>
						<span class="shrink-0 whitespace-nowrap">+ {items?.length - 2}</span>
					{/if}
				{:else if !items || items.length === 0}
					{placeholder}
				{:else if items && items.length > 0 && items[0]}
					{items[0].name}
				{/if}
				<ChevronsUpDownIcon class="ml-auto opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-fit p-0 ">
		<Command.Root>
			<Command.Input
				placeholder={'Search ' + (label ?? itemName) + 's...'}
				oninput={handleSearch}
				bind:value={searchQuery}
			/>
			<Command.List>
				<Command.Empty>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<LoaderIcon class="h-4 w-4 animate-spin" />
							Loading...
						</div>
					{:else}
						No {label || itemName} found.
					{/if}
				</Command.Empty>
				{#each itemList as item (item.id)}
					<Command.Item
						value={String(item.name)}
						onSelect={() => {
							const itemId: string = String(item.id);
							if (multiple) {
								const next = (items ?? []) as Filter[];
								if (next.some((s) => String(s.id) === itemId)) {
									items = next.filter((s) => String(s.id) !== itemId);
								} else {
									items = [...next, { id: String(item.id), name: item.name }];
								}
							} else {
								items = [{ id: String(item.id), name: item.name }];
								open = false;
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
