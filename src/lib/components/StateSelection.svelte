<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { goto } from '$app/navigation';
	import { type StateFilter } from '$lib/types/filters';

	const stateList = $derived.by(() => page?.data?.states?.items ?? []);

	let { states = $bindable(), ...rest } = $props();
	let open = $state(false);
	let searchQuery = $state('');
	const placeholder = 'Select states';

	// Debounced search
	let searchTimeout: NodeJS.Timeout | undefined;
	function handleSearch(e: Event) {
		const query = (e.target as HTMLInputElement).value.toLowerCase();
		searchQuery = query;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL(page.url);
			if (query) url.searchParams.set('state_search', query);
			else url.searchParams.delete('state_search');

			goto(url, { keepFocus: true, invalidateAll: true });
		}, 300);
	}
</script>

{#snippet myBadge(children: StateFilter)}
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
				url.searchParams.delete('state_ids', String(children.id));
				goto(url, { keepFocus: true, invalidateAll: true });
				states = states.filter((s) => s.id !== children.id);
			}}>&times;</button
		>
	</Badge>
{/snippet}

<Popover.Root
	bind:open
	{...rest}
	onOpenChangeComplete={() => {
		if (!open) {
			try {
				const url = new URL(page.url);
				url.searchParams.delete('state_search');
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
				class="my-8  w-full justify-start "
				role="combobox"
				aria-expanded={open}
			>
				{#if states?.length === 0}
					{placeholder}
				{:else if states?.length < 3}
					<span class="flex flex-row truncate text-start">
						{#each states as state}
							{@render myBadge(state)}
						{/each}
					</span>
				{:else if states.length >= 3}
					{#if states[0]}
						{@render myBadge(states[0])}
					{/if}
					{#if states[1]}
						{@render myBadge(states[1])}
					{/if}
					+ {states.length - 2}
				{/if}
				<ChevronsUpDownIcon class="ml-auto opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-fit p-0 ">
		<Command.Root>
			<Command.Input placeholder="Search States..." oninput={handleSearch} />
			<Command.List>
				<Command.Empty>No state found.</Command.Empty>
				{#each stateList as state (state.id)}
					<Command.Item
						value={String(state.name)}
						onSelect={() => {
							const stateId = state.id;
							if (states.some((s) => s.id === stateId)) {
								states = states.filter((s: { id: number }) => s.id !== stateId);
							} else {
								states = states ? [...states, state] : [state];
							}
						}}
					>
						<CheckIcon class={cn(!states.some((s) => s.id === state.id) && 'text-transparent')} />
						{state.name}
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

<!-- <Select.Root type="multiple" bind:value={states} name="states" {...rest}>
	<Select.Trigger>
		{#if states?.length === 0}
			{selectedStates}
		{:else}
			<span class="truncate text-start">
				{#each selectedStates as state}
					{@render myBadge(state)}
				{/each}
			</span>
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.GroupHeading>Select States</Select.GroupHeading>
			{#each stateList as state (state.id)}
				<Select.Item value={String(state.id)} label={state.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root> -->
