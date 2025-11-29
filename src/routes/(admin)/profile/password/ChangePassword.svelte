<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { passwordSchema } from './schema';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(passwordSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<Form.Field {form} name="current_password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Current Password</Form.Label>
				<Input {...props} type="password" bind:value={$formData.current_password} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="new_password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>New Password</Form.Label>
				<Input {...props} type="password" bind:value={$formData.new_password} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="confirm_password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Confirm Password</Form.Label>
				<Input {...props} type="password" bind:value={$formData.confirm_password} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="float-end mt-2 flex gap-x-3">
		<Button variant="outline" onclick={() => goto('/')}>Cancel</Button>
		<Form.Button>Save</Form.Button>
	</div>
</form>
