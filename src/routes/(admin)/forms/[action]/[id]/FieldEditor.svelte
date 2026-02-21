<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { FormField, FieldOption } from './schema.js';
	import { fieldTypeLabels, fieldTypeCategories, type FormFieldTypeValue } from './schema.js';

	interface Props {
		field: FormField | null;
		entityTypes: Array<{ id: number; name: string }>;
		onClose: () => void;
	}

	let { field, entityTypes: initialEntityTypes, onClose }: Props = $props();

	const isEditing = field !== null;

	// Local state for entity types (with client-side fallback loading)
	let entityTypes = $state<Array<{ id: number; name: string }>>(initialEntityTypes || []);

	// Load entity types via client-side API if not provided
	async function loadEntityTypes() {
		if (entityTypes.length > 0) return;

		try {
			const response = await fetch('/api/filters/entitytypes');
			if (response.ok) {
				const data = await response.json();
				entityTypes = data.items || [];
			}
		} catch (error) {
			console.error('Failed to load entity types:', error);
		}
	}

	// Load entity types on mount if empty
	$effect(() => {
		loadEntityTypes();
	});

	// Initialize form state
	let fieldType = $state<string>(field?.field_type || '');
	let label = $state(field?.label || '');
	let name = $state(field?.name || '');
	let placeholder = $state(field?.placeholder || '');
	let helpText = $state(field?.help_text || '');
	let isRequired = $state(field?.is_required || false);
	let defaultValue = $state(field?.default_value || '');
	let entityTypeId = $state<number | null>(field?.entity_type_id || null);
	let options = $state<FieldOption[]>(field?.options || []);

	// Validation fields
	let minLength = $state<number | null>(field?.validation?.min_length ?? null);
	let maxLength = $state<number | null>(field?.validation?.max_length ?? null);
	let minValue = $state<number | null>(field?.validation?.min_value ?? null);
	let maxValue = $state<number | null>(field?.validation?.max_value ?? null);
	let pattern = $state(field?.validation?.pattern || '');
	let customErrorMessage = $state(field?.validation?.custom_error_message || '');

	// Auto-generate field name from label
	$effect(() => {
		if (!isEditing && label) {
			name = label
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_|_$/g, '');
		}
	});

	// Field types that need options
	const optionFieldTypes = ['select', 'radio', 'multi_select'];
	const needsOptions = $derived(optionFieldTypes.includes(fieldType));

	// Field types that need entity type selection
	const needsEntityType = $derived(fieldType === 'entity');

	// Field types that support text validation (email/phone validated on frontend already)
	const textFieldTypes = ['text', 'textarea', 'full_name'];
	const needsTextValidation = $derived(textFieldTypes.includes(fieldType));

	// Field types that support number validation
	const needsNumberValidation = $derived(fieldType === 'number');

	function addOption() {
		const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id || 0)) + 1 : 1;
		options = [...options, { id: nextId, label: '', value: '' }];
	}

	function removeOption(index: number) {
		options = options.filter((_, i) => i !== index);
	}

	function updateOptionLabel(index: number, newLabel: string) {
		options = options.map((opt, i) => {
			if (i === index) {
				return {
					...opt,
					label: newLabel,
					value: newLabel
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '_')
						.replace(/^_|_$/g, '')
				};
			}
			return opt;
		});
	}

	function buildFieldData(): FormField {
		const fieldData: FormField = {
			field_type: fieldType,
			label,
			name,
			placeholder: placeholder || null,
			help_text: helpText || null,
			is_required: isRequired,
			order: field?.order || 0,
			default_value: defaultValue || null,
			entity_type_id: needsEntityType ? entityTypeId : null,
			options: needsOptions && options.length > 0 ? options : null,
			validation: null
		};

		// Add validation if any validation fields are set
		if (needsTextValidation || needsNumberValidation || pattern) {
			fieldData.validation = {
				min_length: needsTextValidation ? minLength : null,
				max_length: needsTextValidation ? maxLength : null,
				min_value: needsNumberValidation ? minValue : null,
				max_value: needsNumberValidation ? maxValue : null,
				pattern: pattern || null,
				custom_error_message: customErrorMessage || null
			};
		}

		if (isEditing && field?.id) {
			fieldData.id = field.id;
		}

		return fieldData;
	}

	const isValid = $derived(
		fieldType !== '' &&
			label.trim() !== '' &&
			name.trim() !== '' &&
			(!needsOptions || options.length > 0) &&
			(!needsEntityType || entityTypeId !== null)
	);
</script>

<Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Field' : 'Add Field'}</Dialog.Title>
			<Dialog.Description>
				{isEditing ? 'Update the field configuration' : 'Configure the new field for your form'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={isEditing ? '?/updateField' : '?/addField'}
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						// Invalidate page data to reload fields from server
						await invalidateAll();
						onClose();
					} else {
						// Process the result to display flash messages on error
						await update();
					}
				};
			}}
			class="space-y-6"
		>
			<input type="hidden" name="field" value={JSON.stringify(buildFieldData())} />
			{#if isEditing}
				<input type="hidden" name="fieldId" value={field?.id} />
			{/if}

			<!-- Field Type Selection -->
			{#if !isEditing}
				<div class="space-y-2">
					<Label>Field Type *</Label>
					<Select.Root
						type="single"
						onValueChange={(value) => {
							fieldType = value || '';
						}}
					>
						<Select.Trigger class="w-full">
							{fieldType ? fieldTypeLabels[fieldType as FormFieldTypeValue] : 'Select a field type'}
						</Select.Trigger>
						<Select.Content>
							{#each Object.entries(fieldTypeCategories) as [category, types] (category)}
								<Select.Group>
									<Select.GroupHeading>{category}</Select.GroupHeading>
									{#each types as type (type)}
										<Select.Item value={type}>{fieldTypeLabels[type]}</Select.Item>
									{/each}
								</Select.Group>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{:else}
				<div class="space-y-2">
					<Label>Field Type</Label>
					<Input value={fieldTypeLabels[fieldType as FormFieldTypeValue]} disabled />
				</div>
			{/if}

			<!-- Basic Field Properties -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>Label *</Label>
					<Input bind:value={label} placeholder="Enter field label" />
				</div>
				<div class="space-y-2">
					<Label>Field Name *</Label>
					<Input bind:value={name} placeholder="field_name" disabled={isEditing} />
					<p class="text-xs text-gray-500">
						Used as token in certificate and key in form response.
					</p>
				</div>
			</div>

			<div class="space-y-2">
				<Label>Placeholder</Label>
				<Input bind:value={placeholder} placeholder="Enter placeholder text" />
			</div>

			<div class="space-y-2">
				<Label>Help Text</Label>
				<Textarea bind:value={helpText} placeholder="Enter help text shown below the field" />
			</div>

			<div class="flex items-center gap-2">
				<Switch bind:checked={isRequired} />
				<Label>Required Field</Label>
			</div>

			<!-- Options for select/radio/multi_select -->
			{#if needsOptions}
				<div class="space-y-4 border-t pt-4">
					<div class="flex items-center justify-between">
						<Label>Options *</Label>
						<Button type="button" variant="outline" size="sm" onclick={addOption}>
							<Plus class="mr-1 h-4 w-4" />
							Add Option
						</Button>
					</div>

					{#if options.length === 0}
						<p class="text-sm text-gray-500">Add at least one option for this field type.</p>
					{:else}
						<div class="space-y-2">
							{#each options as option, index}
								<div class="flex items-center gap-2">
									<Input
										value={option.label}
										oninput={(e) => updateOptionLabel(index, e.currentTarget.value)}
										placeholder="Option label"
										class="flex-1"
									/>
									<Input value={option.value} disabled class="flex-1" placeholder="Value" />
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="text-destructive"
										onclick={() => removeOption(index)}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Entity Type Selection -->
			{#if needsEntityType}
				<div class="space-y-2 border-t pt-4">
					<Label>Entity Type *</Label>
					<Select.Root
						type="single"
						value={entityTypeId?.toString()}
						onValueChange={(value) => {
							entityTypeId = value ? parseInt(value) : null;
						}}
					>
						<Select.Trigger class="w-full">
							{entityTypeId
								? entityTypes.find((et) => et.id === entityTypeId)?.name || 'Select entity type'
								: 'Select entity type'}
						</Select.Trigger>
						<Select.Content>
							{#each entityTypes as entityType (entityType.id)}
								<Select.Item value={entityType.id.toString()}>{entityType.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<!-- Validation Settings -->
			{#if needsTextValidation || needsNumberValidation}
				<div class="border-t pt-4">
					<Collapsible.Root>
						<Collapsible.Trigger class="flex w-full items-center justify-between text-left">
							<Label class="pointer-events-none text-base font-semibold"
								>Validation (Optional)</Label
							>
							<ChevronDown class="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="space-y-4 pt-4">
								{#if needsTextValidation}
									<div class="grid grid-cols-2 gap-4">
										<div class="space-y-2">
											<Label>Min Length</Label>
											<Input
												type="number"
												bind:value={minLength}
												placeholder="No minimum"
												min="0"
											/>
										</div>
										<div class="space-y-2">
											<Label>Max Length</Label>
											<Input
												type="number"
												bind:value={maxLength}
												placeholder="No maximum"
												min="0"
											/>
										</div>
									</div>
								{/if}

								{#if needsNumberValidation}
									<div class="grid grid-cols-2 gap-4">
										<div class="space-y-2">
											<Label>Min Value</Label>
											<Input type="number" bind:value={minValue} placeholder="No minimum" />
										</div>
										<div class="space-y-2">
											<Label>Max Value</Label>
											<Input type="number" bind:value={maxValue} placeholder="No maximum" />
										</div>
									</div>
								{/if}

								<div class="space-y-2">
									<Label>Pattern (Regex)</Label>
									<Input bind:value={pattern} placeholder="e.g., ^[a-zA-Z]+$" />
								</div>

								<div class="space-y-2">
									<Label>Custom Error Message</Label>
									<Input
										bind:value={customErrorMessage}
										placeholder="Error message when validation fails"
									/>
								</div>
							</div>
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={onClose}>Cancel</Button>
				<Button type="submit" disabled={!isValid}>
					{isEditing ? 'Update Field' : 'Add Field'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
