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

	const stateList = page.data.states.items || [];
	let { states = $bindable(), ...rest } = $props();
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedStates = $derived(
		states?.length
			? stateList
					.filter((state: { id: Number }) => states.includes(String(state.id)))
					.map((state: { name: any }) => state.name)
			: 'Select states'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2 "
		>{children}</Badge
	>
{/snippet}

<Popover.Root bind:open {...rest}>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-full justify-start"
				role="combobox"
				aria-expanded={open}
			>
				{#if states?.length === 0}
					{selectedStates}
				{:else if states?.length < 3}
					<span class="truncate text-start">
						{#each selectedStates as state}
							{@render myBadge(state)}
						{/each}
					</span>
				{:else if states?.length >= 3}
					{@render myBadge(selectedStates[0])}
					{@render myBadge(selectedStates[1])}
					+ {states.length}
				{/if}
				<ChevronsUpDownIcon class="ml-auto opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-fit p-0">
		<Command.Root>
			<Command.Input placeholder="Search States..." />
			<Command.List>
				<Command.Empty>No state found.</Command.Empty>
				<Command.Group>
					{#each stateList as state (state.id)}
						<Command.Item
							value={String(state.id)}
							onSelect={() => {
								console.log('selected', state.id);
								const stateId = String(state.id);
								if (states?.includes(stateId)) {
									states = states.filter((id) => id !== stateId);
								} else {
									states = states ? [...states, stateId] : [stateId];
								}
							}}
						>
							<CheckIcon class={cn(!states.includes(String(state.id)) && 'text-transparent')} />
							{state.name}
						</Command.Item>
					{/each}
				</Command.Group>
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
			{#each stateList as state}
				<Select.Item value={String(state.id)} label={state.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root> -->
