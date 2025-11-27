<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { updatePasswordSchema, type UpdatePasswordSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: SuperValidated<Infer<UpdatePasswordSchema>> } = $props();

	const form = superForm(data, {
		id: 'updatePasswordForm',
		validators: zodClient(updatePasswordSchema)
	});
	const { form: formData, enhance, message } = form;
</script>

{#if $message}
	<div class="mb-4 text-green-600">{$message}</div>
{/if}
<form method="POST" action="?/update" use:enhance>
	<input type="hidden" name="token" value={$formData.token} />
	<Form.Field {form} name="password">
		<Form.Control>
			<Form.Label>New Password</Form.Label>
			<Input name="password" type="password" bind:value={$formData.password} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="confirm_password">
		<Form.Control>
			<Form.Label>Confirm Password</Form.Label>
			<Input name="confirm_password" type="password" bind:value={$formData.confirm_password} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class=" mt-4 w-full  py-5 ">Update Password</Form.Button>
</form>
