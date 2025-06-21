<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';
	let { states = $bindable(), ...rest } = $props();

	const stateList = page.data.states;

	const selectedStates = $derived(
		states?.length
			? stateList
					.filter((state: { id: any }) => states.includes(String(state.id)))
					.map((state: { name: any }) => state.name)
			: 'Select relevant states'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

<Select.Root type="multiple" bind:value={states} name="states" {...rest}>
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
			<Select.GroupHeading>Select Relavant States</Select.GroupHeading>
			{#each stateList as state}
				<Select.Item value={String(state.id)} label={state.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
