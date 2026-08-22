<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Info from '@lucide/svelte/icons/info';
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
		tagType: {
			id: number;
			name: string;
			description?: string | null;
			show_to_candidate?: boolean | null;
		} | null;
	} = $props();

	let name = $state('');
	let description = $state('');
	let showToCandidate = $state(false);
	let submitting = $state(false);

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			if (mode === 'edit' && tagType) {
				name = tagType.name;
				description = tagType.description || '';
				showToCandidate = tagType.show_to_candidate ?? false;
			} else {
				name = '';
				description = '';
				showToCandidate = false;
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
			<input type="hidden" name="show_to_candidate" value={showToCandidate ? 'true' : 'false'} />
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
				<div class="flex items-center gap-3">
					<Switch id="tag-type-show-to-candidate" bind:checked={showToCandidate} />
					<div class="flex items-center gap-1.5">
						<Label for="tag-type-show-to-candidate" class="cursor-pointer">
							Make this {term('tag_type', 'lower')} and its {term('tags', 'lower')} visible to candidates
						</Label>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Info class="h-3.5 w-3.5 text-muted-foreground" />
								</Tooltip.Trigger>
								<Tooltip.Content
									class="border-border bg-popover text-popover-foreground max-w-xs rounded-md border p-3 text-xs shadow-lg/20"
									side="top"
								>
									<p>
										Candidates will be able to see this {term('tag_type', 'lower')} and its {term(
											'tags',
											'lower'
										)} during answer review.
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</div>
				<Button type="submit" class="mt-4 w-full" disabled={!name.trim() || submitting}>
					{buttonText}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
