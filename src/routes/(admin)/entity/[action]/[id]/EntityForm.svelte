<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createEntitySchema, editEntitySchema, type EntityFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resolve } from '$app/paths';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<EntityFormSchema>>;
			action: 'add' | 'edit';
			entityType: Partial<Infer<EntityFormSchema>> | null;
			currentUser: any;
		};
	} = $props();

	const isEditMode = data.action === 'edit';

	const {
		form: formData,
		enhance,
		submit,
		errors
	} = superForm(data.form, {
		validators: zod4Client(isEditMode ? editEntitySchema : createEntitySchema),
		dataType: 'json'
	});
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex flex-col gap-10 py-8">
		<div class="mx-4 flex items-center justify-between py-4 sm:mx-6 md:mx-10">
			<div class="flex items-center gap-3">
				<a
					href={resolve('/entity')}
					class="hover:bg-muted rounded-lg border p-2"
					aria-label={`Back to ${term('entities', 'lower')}`}
				>
					<ArrowLeft size={20} />
				</a>
				<h2 class="text-2xl font-bold tracking-tight">
					{isEditMode ? `Edit ${term('entity')}` : `Create ${term('entity')}`}
				</h2>
			</div>
			<Button
				type="button"
				class="bg-primary font-semibold"
				onclick={submit}
				disabled={!$formData.name?.trim()}
			>
				Save {term('entity')}
			</Button>
		</div>

		<div class="mx-4 flex flex-col sm:mx-6 md:mx-10">
			<div class="bg-card rounded-2xl border">
				<div class="grid grid-cols-1 gap-6 p-8 md:grid-cols-1">
					<div class="flex flex-col gap-2">
						<Label for="name" class="font-semibold">{term('entity')} Name</Label>
						<Input
							id="name"
							type="text"
							name="name"
							placeholder={`Name of this ${term('entity', 'lower')}...`}
							bind:value={$formData.name}
						/>
						{#if $errors.name}
							<span class="text-destructive text-sm">{$errors.name}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<Label for="description" class="font-semibold">Description</Label>
						<Textarea
							id="description"
							name="description"
							placeholder={`Brief description of this ${term('entity', 'lower')}...`}
							bind:value={$formData.description}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
