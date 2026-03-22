<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';

	let {
		open = $bindable(false),
		mode = 'create',
		tagType = null
	}: {
		open: boolean;
		mode: 'create' | 'edit';
		tagType: { id: number; name: string; description?: string | null } | null;
	} = $props();

	let name = $state('');
	let description = $state('');
	let submitting = $state(false);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			if (mode === 'edit' && tagType) {
				name = tagType.name;
				description = tagType.description || '';
			} else {
				name = '';
				description = '';
			}
		}
	});

	const title = $derived(mode === 'create' ? 'Create Tag Type' : 'Edit Tag Type');
	const buttonText = $derived(mode === 'create' ? 'Save' : 'Save changes');
	const action = $derived(mode === 'create' ? '?/createTagType' : '?/updateTagType');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					open = false;
					await update();
				};
			}}
		>
			{#if mode === 'edit' && tagType}
				<input type="hidden" name="id" value={tagType.id} />
			{/if}
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="tag-type-name">Name</Label>
					<Input id="tag-type-name" name="name" bind:value={name} required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="tag-type-description">Description</Label>
					<Textarea
						id="tag-type-description"
						name="description"
						bind:value={description}
						rows={3}
					/>
				</div>
				<Button type="submit" class="w-full" disabled={!name.trim() || submitting}>
					{buttonText}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
