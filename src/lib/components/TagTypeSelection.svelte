<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';

	const tagtypeList = page.data.tagtypes?.items || [];

	let { tagtypes = $bindable(), ...rest } = $props();

	const selectedTagtypes = $derived(
		tagtypes?.length
			? tagtypeList
					.filter((tagtype) => tagtypes.includes(String(tagtype.id)))
					.map((tagtype) => tagtype.name)
			: 'Select tagtypes'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style="background-color:#3587B4" class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

<Select.Root type="multiple" bind:value={tagtypes} name="tagtypes" {...rest}>
	<Select.Trigger>
		{#if tagtypes?.length === 0}
			{selectedTagtypes}
		{:else}
			<span class="truncate text-start">
				{#each selectedTagtypes as tagtype}
					{@render myBadge(tagtype)}
				{/each}
			</span>
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.GroupHeading>Select Tagtypes</Select.GroupHeading>
			{#each tagtypeList as tagtype (tagtype.id)}
				<Select.Item value={String(tagtype.id)} label={tagtype.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
