<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createFormSchema, editFormSchema, type FormFormSchema } from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resolve } from '$app/paths';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { dragHandleZone } from 'svelte-dnd-action';
	import InlineFieldCard from './InlineFieldCard.svelte';
	import ChooseFieldTypeDialog from './ChooseFieldTypeDialog.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Settings from '@lucide/svelte/icons/settings';
	import Plus from '@lucide/svelte/icons/plus';
	import type { FormField } from './schema.js';
	import { fieldTypeLabels, type FormFieldTypeValue } from './schema.js';

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
			currentUser: { organization_id?: number };
		};
	} = $props();

	const existingForm = $derived(data?.formData || null);
	const isEditMode = $derived(data.action === 'edit' && existingForm !== null);

	let fields = $state<FormField[]>([]);
	let showTypeChooser = $state(false);

	const validationSchema = $derived(data.action === 'edit' ? editFormSchema : createFormSchema);
	const organizationId = $derived(data.currentUser?.organization_id);

	// Sync fields with server data when it changes
	$effect(() => {
		if (data?.formData?.fields) {
			fields = data.formData.fields;
		}
	});

	// Auto-open field chooser if flagged (after create redirect)
	$effect(() => {
		if (isEditMode && typeof window !== 'undefined') {
			const flag = localStorage.getItem('openFieldChooser');
			if (flag === 'true') {
				localStorage.removeItem('openFieldChooser');
				showTypeChooser = true;
			}
		}
	});

	const {
		form: formData,
		enhance,
		submit
	} = superForm(data.form, {
		validators: zod4Client(validationSchema),
		dataType: 'json',
		onSubmit: () => {
			if (organizationId) {
				$formData.organization_id = organizationId;
			}
		}
	});

	function handleAddField() {
		if (!isEditMode) {
			// In create mode, save the form first
			if (!$formData.name?.trim()) {
				toast.error('Please enter a form name first');
				return;
			}
			localStorage.setItem('openFieldChooser', 'true');
			submit();
		} else {
			showTypeChooser = true;
		}
	}

	async function handleFieldTypeSelected(fieldType: FormFieldTypeValue) {
		showTypeChooser = false;

		const defaultLabel = fieldTypeLabels[fieldType] || 'New Field';
		const defaultName = defaultLabel
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');

		const fieldData: FormField = {
			field_type: fieldType,
			label: defaultLabel,
			name: defaultName,
			is_required: false,
			order: fields.length,
			placeholder: null,
			help_text: null,
			options: null,
			validation: null,
			default_value: null,
			entity_type_id: null
		};

		const formDataPayload = new FormData();
		formDataPayload.set('field', JSON.stringify(fieldData));

		try {
			const response = await fetch('?/addField', {
				method: 'POST',
				body: formDataPayload
			});

			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data) {
				const newField: FormField = {
					...fieldData,
					id: (result.data as { id: number }).id
				};
				fields = [...fields, newField];
			} else {
				toast.error('Failed to add field');
			}
		} catch {
			toast.error('Failed to add field');
		}
	}

	function handleFieldDeleted(fieldId: number) {
		fields = fields.filter((f) => f.id !== fieldId);
	}

	function handleDndConsider(e: CustomEvent<{ items: FormField[] }>) {
		fields = e.detail.items;
	}

	async function handleDndFinalize(e: CustomEvent<{ items: FormField[] }>) {
		fields = e.detail.items.map((f, i) => ({ ...f, order: i }));

		const fieldIds = fields.map((f) => f.id);
		const formDataPayload = new FormData();
		formDataPayload.set('fieldIds', JSON.stringify(fieldIds));

		try {
			const response = await fetch('?/reorderFields', {
				method: 'POST',
				body: formDataPayload
			});

			const result = deserialize(await response.text());
			if (result.type === 'failure') {
				toast.error('Failed to reorder fields');
				await invalidateAll();
			}
		} catch {
			toast.error('Failed to reorder fields');
			await invalidateAll();
		}
	}

	async function handleDuplicateField(sourceField: FormField) {
		const duplicateName = `${sourceField.name}_copy`;
		const duplicateLabel = `${sourceField.label} (Copy)`;

		const fieldData: FormField = {
			...sourceField,
			id: undefined,
			label: duplicateLabel,
			name: duplicateName,
			order: fields.length
		};

		const formDataPayload = new FormData();
		formDataPayload.set('field', JSON.stringify(fieldData));

		try {
			const response = await fetch('?/addField', {
				method: 'POST',
				body: formDataPayload
			});

			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data) {
				const newField: FormField = {
					...fieldData,
					id: (result.data as { id: number }).id
				};
				fields = [...fields, newField];
				toast.success('Field duplicated');
			} else {
				toast.error('Failed to duplicate field');
			}
		} catch {
			toast.error('Failed to duplicate field');
		}
	}
</script>

<form method="POST" action="?/save" use:enhance class="flex min-h-screen flex-col">
	<div class="flex-1 overflow-auto">
		<div class="mx-auto flex flex-col gap-6 px-6 py-8 md:px-10">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href={resolve('/forms/')}
						aria-label="Back to forms"
						class="text-foreground hover:bg-accent rounded-md p-1.5 transition-colors"
					>
						<ArrowLeft class="h-5 w-5" />
					</a>
					<h1 class="text-2xl font-bold">
						{isEditMode ? 'Edit Form' : 'Create Form'}
					</h1>
				</div>

				<div class="flex items-center gap-3">
					<Button
						type="button"
						class="bg-primary"
						disabled={!$formData.name?.trim()}
						onclick={submit}
					>
						Save
					</Button>
				</div>
			</div>

			<!-- Primary Details Card -->
			<div class="border-border bg-card rounded-lg border">
				<div class="border-border flex items-center gap-2 border-b px-6 py-4">
					<Settings class="text-muted-foreground h-5 w-5" />
					<h2 class="text-lg font-semibold">Primary Details</h2>
				</div>

				<div class="flex flex-col gap-6 p-6">
					<div class="grid grid-cols-2 gap-6">
						<div class="flex flex-col gap-2">
							<Label class="font-semibold">
								Form Name
								<span class="text-muted-foreground font-normal">(Visible to the candidate)</span>
							</Label>
							<Input
								type="text"
								name="name"
								bind:value={$formData.name}
								placeholder="E.g., State level tests"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<Label class="font-semibold">
								Description
								<span class="text-muted-foreground font-normal">(Visible to the candidate)</span>
							</Label>
							<Input
								type="text"
								name="description"
								bind:value={$formData.description}
								placeholder="Brief description of this form..."
							/>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<Label class="font-semibold">Form Status</Label>
						<span
							class="text-sm {$formData.is_active
								? 'text-primary font-medium'
								: 'text-muted-foreground'}"
						>
							{$formData.is_active ? 'Active' : 'Inactive'}
						</span>
						<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
					</div>
				</div>
			</div>

			<!-- Field Cards -->
			{#if fields.length > 0}
				<div
					class="flex flex-col gap-6"
					use:dragHandleZone={{ items: fields, flipDurationMs: 150 }}
					onconsider={handleDndConsider}
					onfinalize={handleDndFinalize}
				>
					{#each fields as field, i (field.id)}
						<InlineFieldCard
							{field}
							index={i}
							entityTypes={data.entityTypes}
							onDelete={handleFieldDeleted}
							onDuplicate={handleDuplicateField}
						/>
					{/each}
				</div>
			{/if}

			<!-- Add Field Button -->
			<button
				type="button"
				class="bg-accent border-primary/40 text-primary hover:border-primary flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 transition-colors"
				onclick={handleAddField}
			>
				<Plus class="h-4 w-4" />
				<span class="font-medium">Add Field</span>
			</button>
		</div>
	</div>
</form>

<ChooseFieldTypeDialog
	bind:open={showTypeChooser}
	onSelect={handleFieldTypeSelected}
	onClose={() => (showTypeChooser = false)}
/>
