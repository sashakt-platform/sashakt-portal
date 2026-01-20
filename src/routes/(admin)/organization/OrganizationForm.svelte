<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { editOrganizationSchema, type EditOrganizationSchema } from './schema';

	let { data, isEditMode = $bindable() }: { data: PageData; isEditMode: boolean } = $props();

	let orgData: Partial<Infer<EditOrganizationSchema>> | null = data?.currentOrganization || null;

	const form = superForm(orgData || data.form, {
		validators: zod4Client(editOrganizationSchema),
		dataType: 'json',
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				isEditMode = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.name} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.name}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.description} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.description}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="shortcode">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Shortcode</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.shortcode} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.shortcode}
					</div>
				{/if}
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="logo">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Logo URL</Form.Label>
				{#if isEditMode}
					<Input {...props} bind:value={$formData.logo} />
				{:else}
					<div class="mb-2 px-3.5 py-2.5 text-sm">
						{$formData.logo || 'No logo'}
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
