<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { editOrganizationSchema, type EditOrganizationSchema } from './schema';

	let { data }: { data: PageData } = $props();

	let orgData: Partial<Infer<EditOrganizationSchema>> | null = data?.currentOrganization || null;

	const form = superForm(orgData || data.form, {
		validators: zod4Client(editOrganizationSchema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;

	function handleCancel() {
		history.back();
	}
</script>

<form method="POST" use:enhance action="?/save">
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				<Input {...props} bind:value={$formData.name} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				<Input {...props} bind:value={$formData.description} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="shortcode">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Shortcode</Form.Label>
				<Input {...props} bind:value={$formData.shortcode} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="logo">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Logo URL</Form.Label>
				<Input {...props} bind:value={$formData.logo} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="float-end mt-2 flex gap-x-3">
		<Button variant="outline" onclick={handleCancel}>Cancel</Button>
		<Form.Button>Save</Form.Button>
	</div>
</form>
