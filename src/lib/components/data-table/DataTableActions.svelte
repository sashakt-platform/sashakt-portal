<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import Copy from '@lucide/svelte/icons/copy';

	interface CustomAction {
		label: string;
		href?: string;
		action?: () => void;
		icon?: string;
		method?: string;
	}

	let {
		entityName = 'Item',
		editUrl,
		deleteUrl,
		customActions = [],
		onDelete,
		canEdit = true,
		canDelete = true
	}: {
		entityName?: string;
		editUrl: string;
		deleteUrl: string;
		customActions?: CustomAction[];
		onDelete?: () => void;
		canEdit?: boolean;
		canDelete?: boolean;
	} = $props();

	let deleteAction: string | null = $state(null);

	function handleDelete() {
		if (onDelete) {
			onDelete();
		} else {
			deleteAction = deleteUrl;
		}
	}

	function getIcon(iconName?: string) {
		switch (iconName) {
			case 'file-plus':
				return FilePlus;
			case 'external-link':
				return ExternalLink;
			case 'copy':
				return Copy;
			case 'qr-code':
				return QrCode;
			default:
				return undefined;
		}
	}
</script>

<DeleteDialog bind:action={deleteAction} elementName={entityName} />

{#if canEdit || canDelete || customActions.length > 0}
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
			{#if canEdit}
				<a href={editUrl}>
					<DropdownMenu.Item class="cursor-pointer">
						<Pencil />
						Edit
					</DropdownMenu.Item>
				</a>
			{/if}
			{#if canDelete}
				<DropdownMenu.Item onclick={handleDelete}>
					<Trash_2 />
					Delete
				</DropdownMenu.Item>
			{/if}

			{#each customActions as action}
				{#if action.href && action.method === 'POST'}
					<form action={action.href} method="POST">
						<DropdownMenu.Item class="cursor-pointer p-0">
							<Button
								type="submit"
								variant="ghost"
								size="sm"
								class="h-auto w-full justify-start p-2"
							>
								{@const IconComponent = getIcon(action.icon)}
								{#if IconComponent}
									<IconComponent class="mr-2 h-4 w-4" />
								{/if}
								{action.label}
							</Button>
						</DropdownMenu.Item>
					</form>
				{:else if action.href}
					<a href={action.href}>
						<DropdownMenu.Item class="cursor-pointer">
							{@const IconComponent = getIcon(action.icon)}
							{#if IconComponent}
								<IconComponent />
							{/if}
							{action.label}
						</DropdownMenu.Item>
					</a>
				{:else if action.action}
					<DropdownMenu.Item onclick={action.action}>
						{@const IconComponent = getIcon(action.icon)}
						{#if IconComponent}
							<IconComponent />
						{/if}
						{action.label}
					</DropdownMenu.Item>
				{/if}
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
