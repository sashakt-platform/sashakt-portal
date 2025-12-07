<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { resetPasswordSchema, type ResetPasswordFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		data
	}: {
		data: { form: SuperValidated<Infer<ResetPasswordFormSchema>> };
	} = $props();

	const form = superForm(data.form, {
		id: 'resetPasswordForm',
		validators: zod4Client(resetPasswordSchema)
	});
	const { form: formData, enhance } = form;
</script>

<form method="POST" action="?/resetpassword" use:enhance class="space-y-4">
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
