<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';

	let {
		open = $bindable(false),
		elementName = '',
		elementId = null,
		elementType = 'tag'
	}: {
		open: boolean;
		elementName: string;
		elementId: number | string | null;
		elementType: 'tag' | 'tag type';
	} = $props();

	const action = $derived(elementType === 'tag' ? '?/deleteTag' : '?/deleteTagType');
	const description = $derived(
		elementType === 'tag'
			? `Are you sure you want to delete the tag "${elementName}"? Questions using this tag will be untagged.`
			: `Are you sure you want to delete the tag type "${elementName}"?`
	);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content class="gap-0 p-0">
		<div class="flex items-start justify-between p-6">
			<AlertDialog.Title class="text-xl font-bold">Delete {elementType}?</AlertDialog.Title>
			<Button
				variant="ghost"
				size="icon"
				class="h-6 w-6 shrink-0"
				onclick={() => (open = false)}
			>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<Separator />

		<div class="p-6 pt-4">
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</div>

		<AlertDialog.Footer class="p-6 pt-0">
			<AlertDialog.Cancel type="button" onclick={() => (open = false)}>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				{action}
				use:enhance={() => {
					return async ({ update }) => {
						open = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={elementId} />
				<Button variant="destructive" type="submit">Delete</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
