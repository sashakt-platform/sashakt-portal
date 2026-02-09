<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { entitySchema, type EntityFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import BlockSelection from '$lib/components/BlockSelection.svelte';
	import type { Filter } from '$lib/types/filters';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<EntityFormSchema>>;
			entityAction: 'add' | 'edit';
			entityTypeId: string;
			entity: Partial<Infer<EntityFormSchema>> | null;
			entityType: { id: number; name: string } | null;
			currentUser: any;
		};
	} = $props();

	// State/District/Block selection state
	let selectedStates = $state<Filter[]>([]);
	let selectedDistricts = $state<Filter[]>([]);
	let selectedBlocks = $state<Filter[]>([]);

	const entityData: Partial<Infer<EntityFormSchema>> | null = data?.entity || null;
	const isEditMode = data.entityAction === 'edit';

	const {
		form: formData,
		enhance,
		submit,
		errors
	} = superForm((entityData as any) || data.form, {
		applyAction: 'never',
		validators: zod4Client(entitySchema),
		dataType: 'json',
		onSubmit: () => {
			$formData.entity_type_id = Number(data.entityTypeId);
			$formData.state_id = selectedStates.length > 0 ? parseInt(selectedStates[0].id, 10) : null;
			$formData.district_id =
				selectedDistricts.length > 0 ? parseInt(selectedDistricts[0].id, 10) : null;
			$formData.block_id = selectedBlocks.length > 0 ? parseInt(selectedBlocks[0].id, 10) : null;
		}
	});

	// Initialize selections from entity data in edit mode
	if (isEditMode && entityData) {
		if (entityData.state?.id && entityData.state?.name) {
			selectedStates = [{ id: String(entityData.state.id), name: entityData.state.name }];
		}
		if (entityData.district?.id && entityData.district?.name) {
			selectedDistricts = [{ id: String(entityData.district.id), name: entityData.district.name }];
		}
		if (entityData.block?.id && entityData.block?.name) {
			selectedBlocks = [{ id: String(entityData.block.id), name: entityData.block.name }];
		}
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
							{(isEditMode ? 'Edit ' : 'Create ') + data.entityType?.name}
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
			<div class="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
				<div class="flex flex-col gap-2">
					<h2 class="font-semibold">State</h2>
					<StateSelection bind:states={selectedStates} multiple={false} />
					{#if $errors.state_id}
						<span class="text-destructive text-sm">{$errors.state_id}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<h2 class="font-semibold">District</h2>
					<DistrictSelection bind:districts={selectedDistricts} {selectedStates} multiple={false} />
					{#if $errors.district_id}
						<span class="text-destructive text-sm">{$errors.district_id}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<h2 class="font-semibold">Block</h2>
					<BlockSelection bind:blocks={selectedBlocks} {selectedDistricts} multiple={false} />
					{#if $errors.block_id}
						<span class="text-destructive text-sm">{$errors.block_id}</span>
					{/if}
				</div>
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
					disabled={$formData.name?.trim() === ''}>Save</Button
				>
			</div>
		</div>
	</div>
</form>
