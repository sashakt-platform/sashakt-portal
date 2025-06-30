<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';

	const tagList = page.data.tags;
	let { tags = $bindable(), ...rest } = $props();

	const selectedTags = $derived(
		tags?.length
			? tagList
					.filter((tag) => tags.includes(String(tag.id)))
					.map((tag) => tag.name + '-(' + tag.tag_type.name + ')')
			: 'Select relevant tags'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style={'background-color:#3587B4'} class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

<Select.Root type="multiple" bind:value={tags} name="tags" {...rest}>
	<Select.Trigger>
		{#if tags?.length === 0}
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
			{#each tagList as tag}
				<Select.Item value={String(tag.id)} label={tag.name + '-(' + tag.tag_type.name + ')'} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
