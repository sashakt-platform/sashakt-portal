<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editUserSchema, type EditUserSchema } from './schema';

	let { data, isEditMode = $bindable() }: { data: any; isEditMode: boolean } = $props();

	let userData: Partial<Infer<EditUserSchema>> | null = data?.currentUser || null;
	$inspect(data.form);

	const form = superForm(userData || data.form, {
		validators: zodClient(editUserSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<Form.Field {form} name="full_name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				<Input {...props} readonly={!isEditMode} bind:value={$formData.full_name} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} readonly={!isEditMode} bind:value={$formData.email} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="phone">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Phone</Form.Label>
				<Input {...props} readonly={!isEditMode} bind:value={$formData.phone} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	{#if isEditMode}
		<div class="float-end mt-2 flex gap-x-3">
			<Button variant="outline" onclick={() => (isEditMode = false)}>Cancel</Button>
			<Form.Button onclick={() => (isEditMode = false)}>Save</Form.Button>
		</div>
	{/if}
</form>
