<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import X from '@lucide/svelte/icons/x';

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

	let open = $state(false);

	$effect(() => {
		open = (action ? true : false) || (batchMode && selectedCount > 0);
	});

	function handleClose() {
		if (batchMode) {
			onBatchCancel?.();
		} else {
			action = null;
		}
	}

	const handleBatchConfirm = () => {
		onBatchConfirm?.();
	};
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={(value) => {
		if (!value) handleClose();
	}}
>
	<AlertDialog.Content class="gap-0 p-0">
		<div class="flex items-start justify-between p-6 pb-6">
			<AlertDialog.Title class="text-xl font-bold">
				{#if batchMode}
					Delete {selectedCount} {elementName}?
				{:else}
					Delete {elementName}?
				{/if}
			</AlertDialog.Title>
			<Button variant="ghost" size="icon" class="h-6 w-6 shrink-0" onclick={handleClose}>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<Separator />

		<div class="p-6 pt-4">
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
									<li>
										{item.question_text ||
											item.full_name ||
											item.name ||
											item.candidate_uuid ||
											`Item ${item.id}`}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				{:else}
					Are you sure you want to delete the {elementName}? This action cannot be undone.
				{/if}
			</AlertDialog.Description>
		</div>

		<AlertDialog.Footer class="flex-row gap-2 p-6 pt-0">
			{#if batchMode}
				<AlertDialog.Cancel type="button" onclick={handleClose} class="flex-1 sm:flex-none">
					Cancel
				</AlertDialog.Cancel>

				<Button variant="destructive" onclick={handleBatchConfirm} class="flex-1 sm:flex-none">
					Delete {selectedCount}
					{elementName}
				</Button>
			{:else}
				<AlertDialog.Cancel type="button" onclick={handleClose} class="flex-1 sm:flex-none">
					Cancel
				</AlertDialog.Cancel>

				<form {action} method="POST" class="flex-1 sm:flex-none">
					<Button variant="destructive" type="submit" class="w-full">Delete</Button>
				</form>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
