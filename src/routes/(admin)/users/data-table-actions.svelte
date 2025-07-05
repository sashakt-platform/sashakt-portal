<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';

	let { id }: { id: string } = $props();
	let deleteAction: string | null = $state(null);
</script>

<DeleteDialog bind:action={deleteAction} elementName="User" />

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
				<span class="sr-only">Open menu</span>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item><Pencil /><a href="/users/edit/{id}">Edit</a></DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => (deleteAction = `/users/delete/${id}?/delete`)}>
			<Trash_2 />
			Delete
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
