<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
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
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete {elementType}?</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
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
