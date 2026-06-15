<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

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

	const title = $derived(
		mode === 'create' ? `Create ${term('tag_type')}` : `Edit ${term('tag_type')}`
	);
	const buttonText = $derived(mode === 'create' ? 'Save' : 'Save changes');
	const action = $derived(mode === 'create' ? '?/createTagType' : '?/updateTagType');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
		<hr class="-mx-6 border-border" />
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
			<div class="flex flex-col gap-5 pt-2 pb-2">
				<div class="flex flex-col gap-3">
					<Label for="tag-type-name">Name</Label>
					<Input
						id="tag-type-name"
						name="name"
						bind:value={name}
						placeholder="E.g., Difficulty Level"
						required
					/>
				</div>
				<div class="flex flex-col gap-3">
					<Label for="tag-type-description">Description</Label>
					<Textarea
						id="tag-type-description"
						name="description"
						bind:value={description}
						placeholder="Optional — helps others understand what this tag type is for"
						rows={3}
					/>
				</div>
				<Button type="submit" class="mt-4 w-full" disabled={!name.trim() || submitting}>
					{buttonText}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
