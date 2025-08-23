<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { editUserSchema, type EditUserSchema } from './schema';

	let { data, isEditMode = $bindable() }: { data: PageData; isEditMode: boolean } = $props();

	let userData: Partial<Infer<EditUserSchema>> | null = data?.currentUser || null;

	const form = superForm(userData || data.form, {
		validators: zodClient(editUserSchema),
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				isEditMode = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<Form.Field {form} name="full_name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.full_name} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.full_name}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.email} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.email}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="phone">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Phone</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.phone} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.phone}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	{#if isEditMode}
		<div class="float-end mt-2 flex gap-x-3">
			<Button variant="outline" onclick={() => (isEditMode = false)}>Cancel</Button>
			<Form.Button>Save</Form.Button>
		</div>
	{/if}
</form>
