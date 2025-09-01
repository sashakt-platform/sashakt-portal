<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';

	const districtList = page.data.districts?.items || [];
	let { districts = $bindable(), ...rest } = $props();

	const selectedDistricts = $derived(
		districts?.length
			? districtList
					.filter((district: { id: any }) => districts.includes(String(district.id)))
					.map((district: { name: any }) => district.name)
			: 'Select districts'
	);
</script>

{#snippet myBadge(children: any)}
	<Badge variant="default" style="background-color:#3587B4" class="m-1 rounded-sm  p-2"
		>{children}</Badge
	>
{/snippet}

<Select.Root type="multiple" bind:value={districts} name="districts" {...rest}>
	<Select.Trigger>
		{#if districts?.length === 0}
			{selectedDistricts}
		{:else}
			<span class="truncate text-start">
				{#each selectedDistricts as district}
					{@render myBadge(district)}
				{/each}
			</span>
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.GroupHeading>Select districts</Select.GroupHeading>
			{#each districtList as district (district.id)}
				<Select.Item value={String(district.id)} label={district.name} />
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
