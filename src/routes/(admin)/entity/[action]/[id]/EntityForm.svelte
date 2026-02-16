<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createEntitySchema, editEntitySchema, type EntityFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resolve } from '$app/paths';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<EntityFormSchema>>;
			action: 'add' | 'edit';
			entityType: Partial<Infer<EntityFormSchema>> | null;
			currentUser: any;
		};
	} = $props();

	const isEditMode = data.action === 'edit';

	const {
		form: formData,
		enhance,
		submit,
		errors
	} = superForm(data.form, {
		validators: zod4Client(isEditMode ? editEntitySchema : createEntitySchema),
		dataType: 'json'
	});
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
		</div>
	</div>
	<div
		class="sticky right-0 bottom-0 left-0 mt-2 flex w-full border-t-4 bg-white p-3 shadow-md sm:mt-4 sm:p-4"
	>
		<div class="flex w-full justify-between gap-2">
			<a href={resolve('/entity')}>
				<Button variant="outline" class="border-primary text-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<Button
					class="bg-primary text-sm sm:text-base"
					onclick={submit}
					disabled={!$formData.name?.trim()}>Save</Button
				>
			</div>
		</div>
	</div>
</form>
