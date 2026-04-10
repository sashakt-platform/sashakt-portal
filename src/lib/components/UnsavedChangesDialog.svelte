<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		open = $bindable(false),
		onDiscard
	}: {
		open: boolean;
		onDiscard: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Unsaved Changes</Dialog.Title>
		</Dialog.Header>
		<p class="text-muted-foreground text-sm">
			You have unsaved changes that will be lost if you leave this page. Are you sure you want to
			discard your changes?
		</p>
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (open = false)}>Keep editing</Button>
			<Button variant="destructive" onclick={onDiscard}>Discard changes</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
