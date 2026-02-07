<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import TooltipInfo from '$lib/components/TooltipInfo.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createFormSchema, editFormSchema, type FormFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import FieldList from './FieldList.svelte';
	import FieldEditor from './FieldEditor.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import type { FormField } from './schema.js';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormFormSchema>>;
			action: 'add' | 'edit';
			formData: {
				id: number;
				name: string;
				description: string | null;
				is_active: boolean;
				fields: FormField[];
			} | null;
			entityTypes: Array<{ id: number; name: string }>;
			currentUser: any;
		};
	} = $props();

	const existingForm = $derived(data?.formData || null);
	const isEditMode = $derived(data.action === 'edit' && existingForm !== null);

	let fields = $state<FormField[]>(data?.formData?.fields || []);
	let showFieldEditor = $state(false);
	let editingField = $state<FormField | null>(null);

	// Sync fields with server data when it changes
	$effect(() => {
		if (data?.formData?.fields) {
			fields = data.formData.fields;
		}
	});

	const {
		form: formData,
		enhance,
		submit
	} = superForm(existingForm || data.form, {
		validators: zod4Client(data.action === 'edit' ? editFormSchema : createFormSchema),
		dataType: 'json',
		onSubmit: () => {
			if (data.currentUser?.organization_id) {
				$formData.organization_id = data.currentUser.organization_id;
			}
		}
	});

	function handleAddField() {
		editingField = null;
		showFieldEditor = true;
	}

	function handleEditField(field: FormField) {
		editingField = field;
		showFieldEditor = true;
	}

	function handleFieldDeleted(fieldId: number) {
		fields = fields.filter((f) => f.id !== fieldId);
	}

	function handleFieldsReordered(reorderedFields: FormField[]) {
		fields = reorderedFields;
	}

	function handleCloseEditor() {
		showFieldEditor = false;
		editingField = null;
	}
</script>

<form method="POST" action="?/save" use:enhance class="flex min-h-screen flex-col">
	<div class="flex-1 overflow-auto">
		<div class="mx-auto flex flex-col gap-10 py-8">
			{#snippet snippetHeading(title: string)}
				<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
					<Label class="text-md my-auto font-bold">{title}</Label>
					<!-- <Info class="my-auto w-4 align-middle text-xs text-gray-600" /> -->
				</div>
			{/snippet}

			<div class="mx-4 flex flex-col gap-4 sm:mx-6 md:mx-10 md:flex-row">
				<div class="my-auto flex flex-col">
					<div class="flex w-full items-center align-middle">
						<div class="flex flex-row">
							<h2
								class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
							>
								{isEditMode ? 'Edit Form' : 'Create Form'}
							</h2>

							<TooltipInfo
								label="Help: Forms"
								description="Create dynamic forms to collect candidate information before tests. Add various field types like text, select, date, and more."
							/>
						</div>
					</div>

					<Label class="my-auto align-middle text-sm font-extralight">
						{isEditMode
							? 'Edit form details and manage fields'
							: 'Create a new form with basic information. After saving, you can add fields.'}
					</Label>
				</div>
			</div>

			<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-8 md:p-9">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Form Details')}

						<div class="flex flex-col gap-2">
							<Label>Name</Label>
							<Input type="text" name="name" bind:value={$formData.name} />
						</div>

						<div class="flex flex-col gap-2">
							<Label>Description</Label>
							<Textarea name="description" bind:value={$formData.description} />
						</div>

						<div class="mt-4 flex items-center gap-2">
							<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
							<Label for="is_active">Is Active?</Label>
						</div>
					</div>
				</div>

				{#if isEditMode}
					<div class="flex flex-col gap-4">
						{@render snippetHeading('Form Fields')}

						<div class="flex items-center justify-between">
							<p class="text-sm text-gray-600">
								{fields.length === 0
									? 'No fields added yet. Click the button to add fields.'
									: `${fields.length} field${fields.length !== 1 ? 's' : ''} configured`}
							</p>
							<Button type="button" variant="outline" onclick={handleAddField}>
								<Plus class="mr-2 h-4 w-4" />
								Add Field
							</Button>
						</div>

						{#if fields.length > 0}
							<FieldList
								{fields}
								formId={existingForm?.id || 0}
								onEdit={handleEditField}
								onDelete={handleFieldDeleted}
								onReorder={handleFieldsReordered}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="sticky bottom-0 my-2 flex w-full border-t-4 bg-white p-3 sm:my-4 sm:p-4">
		<div class="flex w-full justify-between gap-2">
			<a href="/forms/">
				<Button variant="outline" class="text-primary border-primary border-1 text-sm sm:text-base">
					Cancel
				</Button>
			</a>

			<Button
				class="bg-primary text-sm sm:text-base"
				disabled={$formData.name?.trim() === ''}
				onclick={submit}
			>
				Save
			</Button>
		</div>
	</div>
</form>

{#if showFieldEditor}
	<FieldEditor
		field={editingField}
		formId={existingForm?.id || 0}
		entityTypes={data.entityTypes}
		onClose={handleCloseEditor}
	/>
{/if}
