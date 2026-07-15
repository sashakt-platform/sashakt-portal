<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let {
		open = $bindable(false),
		onConfirm,
		onCancel
	}: {
		open: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen) onCancel();
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Switch selection mode?</AlertDialog.Title>
			<AlertDialog.Description>
				Switching selection mode will remove your currently selected questions. Continue?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={onCancel}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onConfirm}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
