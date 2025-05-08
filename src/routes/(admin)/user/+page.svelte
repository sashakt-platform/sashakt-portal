<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash';

	const { data } = $props();
	console.log(data);
</script>

<div class="mt-10 ml-10 flex w-full items-center align-middle">
	<span class="flex flex-row">
		<h2
			class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
		>
			User
		</h2>
		<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
	</span>
</div>
<Label class="my-auto ml-10 align-middle text-sm font-extralight"
	>Create, edit and update all the Users</Label
>
<div class="m-10 w-3/4 rounded-2xl bg-white text-center align-top shadow-2xl">
	<div class="flex h-full flex-col">
		{#if data.users.data}
			<Table.Root>
				<Table.Header class="">
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Phone</Table.Head>
						<Table.Head>&nbsp;</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.users.data as user}
						<Table.Row>
							<Table.Cell class="text-left">{user.full_name}</Table.Cell>
							<Table.Cell class="text-left">{user.email}</Table.Cell>
							<Table.Cell class="text-left">{user.phone}</Table.Cell>
							<Table.Cell class="">
								<a href="/user/edit"><Pencil /></a><a href="/user/delete"><Trash /></a></Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:else}
			<span>No users.</span>
		{/if}
	</div>
</div>
