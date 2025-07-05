<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let { action = $bindable(), elementName = 'Element' } = $props<{
		action: string | null;
		elementName?: string;
	}>();

	let open = $derived.by(() => (action ? true : false));
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={(value) => {
		if (!value) {
			action = null; // Reset action when dialog is closed
		}
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete {elementName}?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete your {elementName}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<form {action} method="POST">
				<AlertDialog.Cancel type="reset" onclick={() => (action = null)}>Cancel</AlertDialog.Cancel>

				<AlertDialog.Action type="submit">Continue</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
