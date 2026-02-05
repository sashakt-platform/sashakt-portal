<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createEntitySchema, editEntitySchema, type EntityFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<EntityFormSchema>>;
			entityAction: 'add' | 'edit';
			entityTypeId: string;
			entity: Partial<Infer<EntityFormSchema>> | null;
			entityTypes: { id: number; name: string }[];
			currentUser: any;
		};
	} = $props();

	const entityData: Partial<Infer<EntityFormSchema>> | null = data?.entity || null;
	const isEditMode = data.entityAction === 'edit';

	const {
		form: formData,
		enhance,
		submit,
		errors
	} = superForm(entityData || data.form, {
		validators: zod4Client(isEditMode ? editEntitySchema : createEntitySchema),
		dataType: 'json'
	});

	// Pre-set entity_type_id from URL when adding
	if (!isEditMode && data.entityTypeId) {
		$formData.entity_type_id = Number(data.entityTypeId);
	}
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex h-lvh flex-col gap-6 py-6 md:gap-10 md:py-8">
		<div class="mx-4 flex flex-row sm:mx-6 md:mx-10">
			<div class="my-auto flex flex-col">
				<div class="flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
						>
							{isEditMode ? 'Edit Entity' : 'Create Entity'}
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight"></Label>
			</div>
		</div>
		<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-10 md:p-9">
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">Name</h2>
				<Input type="text" name="name" bind:value={$formData.name} />
				{#if $errors.name}
					<span class="text-destructive text-sm">{$errors.name}</span>
				{/if}
			</div>
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">Description</h2>
				<Textarea name="description" bind:value={$formData.description} />
			</div>
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">Entity Type</h2>
				<Select.Root
					type="single"
					bind:value={$formData.entity_type_id}
					name="entity_type_id"
				>
					<Select.Trigger>
						{#if $formData.entity_type_id}
							{data.entityTypes.find((et) => et.id === $formData.entity_type_id)?.name ||
								'Select entity type'}
						{:else}
							Select entity type
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each data.entityTypes as entityType (entityType.id)}
							<Select.Item value={entityType.id} label={entityType.name} />
						{/each}
					</Select.Content>
				</Select.Root>
				{#if $errors.entity_type_id}
					<span class="text-destructive text-sm">{$errors.entity_type_id}</span>
				{/if}
			</div>
		</div>
	</div>
	<div
		class="sticky right-0 bottom-0 left-0 mt-2 flex w-full border-t-4 bg-white p-3 shadow-md sm:mt-4 sm:p-4"
	>
		<div class="flex w-full justify-between gap-2">
			<a href="/entity/view/{data.entityTypeId}">
				<Button variant="outline" class="border-primary text-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<Button
					class="bg-primary text-sm sm:text-base"
					onclick={submit}
					disabled={$formData.name?.trim() === '' || !$formData.entity_type_id}>Save</Button
				>
			</div>
		</div>
	</div>
</form>
