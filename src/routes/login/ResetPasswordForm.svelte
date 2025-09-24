<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { resetSchema, type ResetFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { form: SuperValidated<Infer<ResetFormSchema>> } } = $props();

	const form = superForm(data.form, {
		id: 'resetPasswordForm',
		validators: zodClient(resetSchema)
	});
	const { form: formData, enhance, message } = form;
</script>

{#if $message}
	<div class="text-green-600">{$message}</div>
{/if}

<form method="POST" action="?/reset" use:enhance>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>Send Reset Link</Form.Button>
</form>
