<script lang="ts">
	import TagList from '$lib/data/tags.json';

	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	let tags = $state<string[]>([]);
	const selectedTags = $derived(
		tags.length
			? TagList.filter((tag) => tags.includes(String(tag.id))).map((tag) => tag.name)
			: 'Select relevant tags'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

<Select.Root type="multiple" bind:value={tags}>
	<Select.Trigger>
		{#if tags.length === 0}
			{selectedTags}
		{:else}
			<span class="truncate text-start">
				{#each selectedTags as tag}
					{@render myBadge(tag)}
				{/each}
			</span>
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.GroupHeading>Select Relavant Tags</Select.GroupHeading>
			{#each TagList as tag}
				<Select.Item value={String(tag.id)} label={tag.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
