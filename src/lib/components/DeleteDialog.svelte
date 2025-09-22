<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		action = $bindable(),
		elementName = 'Element',
		batchMode = false,
		selectedCount = 0,
		selectedItems = [],
		onBatchConfirm,
		onBatchCancel
	} = $props<{
		action: string | null;
		elementName?: string;
		batchMode?: boolean;
		selectedCount?: number;
		selectedItems?: any[];
		onBatchConfirm?: () => void;
		onBatchCancel?: () => void;
	}>();

	let open = $derived.by(() => (action ? true : false) || (batchMode && selectedCount > 0));

	const handleBatchConfirm = () => {
		onBatchConfirm?.();
	};

	const handleBatchCancel = () => {
		onBatchCancel?.();
	};
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={(value) => {
		if (!value) {
			if (batchMode) {
				handleBatchCancel();
			} else {
				action = null; // Reset action when dialog is closed
			}
		}
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				{#if batchMode}
					Delete {selectedCount} {elementName}?
				{:else}
					Delete {elementName}?
				{/if}
			</AlertDialog.Title>
			<AlertDialog.Description>
				{#if batchMode}
					This action cannot be undone. This will permanently delete the selected {elementName}{selectedCount >
					1
						? 's'
						: ''}.
					{#if selectedCount <= 5}
						<div class="mt-3">
							<p class="text-sm font-medium">Items to be deleted:</p>
							<ul class="text-muted-foreground mt-1 list-inside list-disc text-sm">
								{#each selectedItems.slice(0, 5) as item}
									<li>{item.question_text || item.name || `Item ${item.id}`}</li>
								{/each}
							</ul>
						</div>
					{/if}
				{:else}
					This action cannot be undone. This will permanently delete your {elementName}
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			{#if batchMode}
				<AlertDialog.Cancel type="button" onclick={handleBatchCancel}>Cancel</AlertDialog.Cancel>
				<Button variant="destructive" onclick={handleBatchConfirm}>
					Delete {selectedCount}
					{elementName}
				</Button>
			{:else}
				<AlertDialog.Cancel type="button" onclick={() => (action = null)}>Cancel</AlertDialog.Cancel
				>
				<form {action} method="POST">
					<Button variant="destructive" type="submit">Delete</Button>
				</form>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
