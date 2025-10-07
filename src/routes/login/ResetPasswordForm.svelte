<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { resetSchema, type ResetFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let {
		data
	}: {
		data: { form: SuperValidated<Infer<ResetFormSchema>> };
	} = $props();

	const form = superForm(data.form, {
		id: 'resetPasswordForm',
		validators: zodClient(resetSchema)
	});
	const { form: formData, enhance, message } = form;
</script>

<form method="POST" action="?/reset" use:enhance class="space-y-4">
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" placeholder="user@mail.com" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button class=" mt-4 w-full  py-5 ">Send Reset Link</Form.Button>
</form>
