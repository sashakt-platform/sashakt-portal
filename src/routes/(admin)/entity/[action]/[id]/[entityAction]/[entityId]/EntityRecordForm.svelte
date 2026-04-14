<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { entityRecordSchema, type EntityRecordFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import BlockSelection from '$lib/components/BlockSelection.svelte';
	import type { Filter } from '$lib/types/filters';
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<EntityRecordFormSchema>>;
			entityAction: 'add' | 'edit';
			entityTypeId: string;
			entity: Partial<Infer<EntityRecordFormSchema>> | null;
			entityType: { id: number; name: string } | null;
			currentUser: any;
		};
	} = $props();

	// State/District/Block selection state
	let selectedStates = $state<Filter[]>([]);
	let selectedDistricts = $state<Filter[]>([]);
	let selectedBlocks = $state<Filter[]>([]);

	const isEditMode = data.entityAction === 'edit';

	const {
		form: formData,
		enhance,
		submit,
		errors
	} = superForm(data.form, {
		validators: zod4Client(entityRecordSchema),
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
	if (isEditMode && data.entity) {
		if (data.entity.state?.id && data.entity.state?.name) {
			selectedStates = [{ id: String(data.entity.state.id), name: data.entity.state.name }];
		}
		if (data.entity.district?.id && data.entity.district?.name) {
			selectedDistricts = [
				{ id: String(data.entity.district.id), name: data.entity.district.name }
			];
		}
		if (data.entity.block?.id && data.entity.block?.name) {
			selectedBlocks = [{ id: String(data.entity.block.id), name: data.entity.block.name }];
		}
	}
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex flex-col gap-10 py-8">
		<div class="mx-4 flex items-center justify-between py-4 sm:mx-6 md:mx-10">
			<div class="flex items-center gap-3">
				<a
					href={resolve(`/entity/view/${data.entityTypeId}`)}
					class="hover:bg-muted rounded-lg border p-2"
					aria-label="Back to records"
				>
					<ArrowLeft size={20} />
				</a>
				<h2 class="text-2xl font-bold tracking-tight">
					{(isEditMode ? 'Edit ' : 'Create ') + (data.entityType?.name ?? 'Entity') + ' Record'}
				</h2>
			</div>
			<Button
				type="button"
				class="bg-primary font-semibold"
				onclick={submit}
				disabled={!$formData.name?.trim()}
			>
				Save
			</Button>
		</div>

		<div class="mx-4 sm:mx-6 md:mx-10">
			<div class="bg-card rounded-2xl border">
				<div class="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<h2 class="font-semibold">Name</h2>
							<Input
								type="text"
								name="name"
								placeholder="Name of this entity..."
								bind:value={$formData.name}
							/>
							{#if $errors.name}
								<span class="text-destructive text-sm">{$errors.name}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<h2 class="font-semibold">Description</h2>
							<Textarea
								name="description"
								placeholder="Brief description of this entity..."
								bind:value={$formData.description}
								class="min-h-30"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<h2 class="font-semibold">State</h2>
							<StateSelection bind:states={selectedStates} multiple={false} />
							{#if $errors.state_id}
								<span class="text-destructive text-sm">{$errors.state_id}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<h2 class="font-semibold">District</h2>
							<DistrictSelection
								bind:districts={selectedDistricts}
								{selectedStates}
								multiple={false}
							/>
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
		</div>
	</div>
</form>
