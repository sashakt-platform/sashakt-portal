<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		open = $bindable(false),
		onConfirm
	}: {
		open: boolean;
		onConfirm: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Logout of Sashakt?</Dialog.Title>
		</Dialog.Header>
		<hr class="-mx-6 border-border" />
		<p class="text-muted-foreground text-sm">
			Are you sure you want to logout? You'll need to sign in again to access your account.
		</p>
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button variant="destructive" onclick={onConfirm}>Logout</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
