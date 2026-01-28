<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';
	import { editUserSchema, type EditUserSchema } from './schema';

	let {
		data,
		header
	}: {
		data: PageData;
		header: Snippet;
	} = $props();

	let userData: Partial<Infer<EditUserSchema>> | null = data?.currentUser || null;

	const form = superForm(userData || data.form, {
		validators: zod4Client(editUserSchema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<div class="mx-auto flex h-lvh flex-col gap-6 py-6 md:gap-10 md:py-8">
		{@render header()}
		<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-10 md:p-9">
			<Form.Field {form} name="full_name" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Name</Form.Label>
						<Input {...props} bind:value={$formData.full_name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="email" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Email</Form.Label>
						<Input {...props} type="email" bind:value={$formData.email} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="phone" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Phone</Form.Label>
						<Input {...props} type="tel" bind:value={$formData.phone} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
	<div
		class="sticky right-0 bottom-0 left-0 mt-2 flex w-full border-t-4 bg-white p-3 shadow-md sm:mt-4 sm:p-4"
	>
		<div class="flex w-full justify-between gap-2">
			<a href="/dashboard">
				<Button variant="outline" class="border-primary text-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<Form.Button class="bg-primary text-sm sm:text-base">Save</Form.Button>
			</div>
		</div>
	</div>
</form>
