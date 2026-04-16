<script lang="ts">
	import { deserialize } from '$app/forms';
	import { dragHandle } from 'svelte-dnd-action';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Plus from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import FieldTypeGrid from './FieldTypeGrid.svelte';
	import { getFieldTypeIcon } from './fieldTypeIcons.js';
	import type { FormField, FieldOption } from './schema.js';
	import { fieldTypeLabels, type FormFieldTypeValue } from './schema.js';

	interface Props {
		field: FormField;
		index: number;
		entityTypes: Array<{ id: number; name: string }>;
		onDelete: (fieldId: number) => void;
		onDuplicate: (field: FormField) => void;
	}

	let { field, index, entityTypes, onDelete, onDuplicate }: Props = $props();

	// Local editable state — initialized empty, synced via $effect
	let fieldType = $state('');
	let label = $state('');
	let name = $state('');
	let typePopoverOpen = $state(false);
	let placeholder = $state('');
	let helpText = $state('');
	let isRequired = $state(false);
	let entityTypeId = $state<number | null>(null);
	let options = $state<FieldOption[]>([]);

	// Validation fields
	let minLength = $state<number | null>(null);
	let maxLength = $state<number | null>(null);
	let minValue = $state<number | null>(null);
	let maxValue = $state<number | null>(null);
	let pattern = $state('');
	let customErrorMessage = $state('');

	let showDeleteDialog = $state(false);
	let additionalControlsOpen = $state(false);
	let nameManuallyEdited = $state(false);

	function toSlug(text: string) {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_|_$/g, '');
	}

	// Auto-generate name from label when name hasn't been manually edited
	$effect(() => {
		if (!nameManuallyEdited && label) {
			name = toSlug(label);
		}
	});

	// Sync state when field prop changes (e.g. after server reload)
	$effect(() => {
		fieldType = field.field_type;
		label = field.label;
		name = field.name;
		// If existing name doesn't match auto-generated from label, it was customized
		nameManuallyEdited = field.name !== toSlug(field.label);
		placeholder = field.placeholder || '';
		helpText = field.help_text || '';
		isRequired = field.is_required || false;
		entityTypeId = field.entity_type_id ?? null;
		options = field.options || [];
		minLength = field.validation?.min_length ?? null;
		maxLength = field.validation?.max_length ?? null;
		minValue = field.validation?.min_value ?? null;
		maxValue = field.validation?.max_value ?? null;
		pattern = field.validation?.pattern || '';
		customErrorMessage = field.validation?.custom_error_message || '';
	});

	const FieldIcon = $derived(getFieldTypeIcon(fieldType));

	// Field types that need options
	const optionFieldTypes = ['select', 'radio', 'multi_select'];
	const needsOptions = $derived(optionFieldTypes.includes(fieldType));

	// Field types that support text validation
	const textFieldTypes = ['text', 'textarea', 'full_name'];
	const needsTextValidation = $derived(textFieldTypes.includes(fieldType));

	// Field types that support number validation
	const needsNumberValidation = $derived(fieldType === 'number');

	const needsEntityType = $derived(fieldType === 'entity');

	const showAdditionalControls = $derived(needsTextValidation || needsNumberValidation);

	const isValid = $derived(
		fieldType !== '' &&
			label.trim() !== '' &&
			name.trim() !== '' &&
			(!needsOptions || options.length > 0) &&
			(!needsEntityType || entityTypeId !== null)
	);

	function buildFieldData(): FormField {
		const fieldData: FormField = {
			id: field.id,
			field_type: fieldType,
			label,
			name,
			placeholder: placeholder || null,
			help_text: helpText || null,
			is_required: isRequired,
			order: field.order,
			default_value: field.default_value || null,
			entity_type_id: needsEntityType ? entityTypeId : null,
			options: needsOptions && options.length > 0 ? options : null,
			validation: null
		};

		if (showAdditionalControls || pattern) {
			fieldData.validation = {
				min_length: needsTextValidation ? minLength : null,
				max_length: needsTextValidation ? maxLength : null,
				min_value: needsNumberValidation ? minValue : null,
				max_value: needsNumberValidation ? maxValue : null,
				pattern: pattern || null,
				custom_error_message: customErrorMessage || null
			};
		}

		return fieldData;
	}

	// Debounced save
	let saveTimeout: ReturnType<typeof setTimeout>;
	async function saveField() {
		if (!field.id || !isValid) return;

		const formData = new FormData();
		formData.set('field', JSON.stringify(buildFieldData()));
		formData.set('fieldId', String(field.id));

		try {
			const response = await fetch('?/updateField', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());
			if (result.type === 'failure') {
				toast.error('Failed to save field changes');
			}
		} catch {
			toast.error('Failed to save field changes');
		}
	}

	function debouncedSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveField, 800);
	}

	function handleFieldTypeChange(newType: FormFieldTypeValue) {
		fieldType = newType;
		typePopoverOpen = false;
		debouncedSave();
	}

	function handleRequiredToggle(checked: boolean) {
		isRequired = checked;
		debouncedSave();
	}

	// Options management
	function addOption() {
		const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id || 0)) + 1 : 1;
		options = [...options, { id: nextId, label: '', value: '' }];
	}

	function removeOption(idx: number) {
		options = options.filter((_, i) => i !== idx);
		debouncedSave();
	}

	function updateOptionLabel(idx: number, newLabel: string) {
		options = options.map((opt, i) => {
			if (i === idx) {
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
		debouncedSave();
	}
</script>

<div class="border-border bg-card rounded-lg border">
	<!-- Header bar -->
	<div
		class="bg-muted/50 border-border flex items-center justify-between rounded-t-lg border-b px-4 py-3"
	>
		<div class="flex items-center gap-3">
			<span use:dragHandle aria-label="drag to reorder">
				<GripVertical class="text-muted-foreground h-5 w-5 cursor-grab" />
			</span>

			<span
				class="bg-input text-muted-foreground flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold"
			>
				{index + 1}
			</span>

			<Popover.Root bind:open={typePopoverOpen}>
				<Popover.Trigger
					class="border-border bg-card hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors"
				>
					{#if FieldIcon}
						<span class="text-muted-foreground flex h-4 w-4 items-center">
							<svelte:component this={FieldIcon} size={16} />
						</span>
					{/if}
					<span class="text-sm font-medium">
						{fieldTypeLabels[fieldType as FormFieldTypeValue] || fieldType}
					</span>
					<ChevronDown class="text-muted-foreground h-3.5 w-3.5" />
				</Popover.Trigger>
				<Popover.Content class="w-[640px] p-4" align="start">
					<FieldTypeGrid selectedType={fieldType} onSelect={handleFieldTypeChange} />
				</Popover.Content>
			</Popover.Root>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5 transition-colors"
				title="Duplicate field"
				onclick={() => onDuplicate(buildFieldData())}
			>
				<Copy class="h-4.5 w-4.5" />
			</button>

			<button
				type="button"
				class="text-muted-foreground hover:bg-accent hover:text-destructive rounded-md p-1.5 transition-colors"
				title="Delete field"
				onclick={() => (showDeleteDialog = true)}
			>
				<Trash2 class="h-4.5 w-4.5" />
			</button>

			<div class="bg-border mx-2 h-6 w-px"></div>

			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm">Required</span>
				<Switch checked={isRequired} onCheckedChange={handleRequiredToggle} />
			</div>
		</div>
	</div>

	<!-- Body -->
	<div class="flex flex-col gap-6 p-6">
		<!-- Basic fields -->
		<div class="grid grid-cols-2 gap-6">
			<div class="flex flex-col gap-2">
				<Label class="font-semibold">Field Label</Label>
				<Input bind:value={label} placeholder="Enter a label" onblur={debouncedSave} />
			</div>
			<div class="flex flex-col gap-2">
				<Label class="font-semibold">
					Database Label
					<span class="text-muted-foreground font-normal">(Token in certificate & key)</span>
				</Label>
				<Input
					bind:value={name}
					placeholder="Enter database label"
					oninput={() => (nameManuallyEdited = true)}
					onblur={debouncedSave}
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<div class="flex flex-col gap-2">
				<Label class="font-semibold">Placeholder Text</Label>
				<Input
					bind:value={placeholder}
					placeholder="Enter placeholder text for the input field"
					onblur={debouncedSave}
				/>
			</div>
			<div class="flex flex-col gap-2">
				<Label class="font-semibold">Helper Text</Label>
				<Input
					bind:value={helpText}
					placeholder="Enter placeholder text for the input field"
					onblur={debouncedSave}
				/>
			</div>
		</div>

		<!-- Entity type selection -->
		{#if needsEntityType}
			<div class="grid grid-cols-2 gap-6">
				<div class="flex flex-col gap-2">
					<Label class="font-semibold">Entity Type</Label>
					<Select.Root
						type="single"
						value={entityTypeId?.toString()}
						onValueChange={(value) => {
							entityTypeId = value ? parseInt(value) : null;
							debouncedSave();
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
			</div>
		{/if}

		<!-- Options for select/radio/multi_select -->
		{#if needsOptions}
			<div class="border-border flex flex-col gap-3 border-t pt-4">
				<div class="flex items-center justify-between">
					<Label class="font-semibold">Options</Label>
					<Button type="button" variant="outline" size="sm" onclick={addOption}>
						<Plus class="mr-1 h-4 w-4" />
						Add Option
					</Button>
				</div>

				{#if options.length === 0}
					<p class="text-muted-foreground text-sm">Add at least one option for this field type.</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each options as option, idx (option.id ?? idx)}
							<div class="flex items-center gap-2">
								<Input
									value={option.label}
									oninput={(e) => updateOptionLabel(idx, e.currentTarget.value)}
									placeholder="Option label"
									class="flex-1"
								/>
								<Input
									value={option.value}
									oninput={(e) => {
										options = options.map((opt, i) =>
											i === idx ? { ...opt, value: e.currentTarget.value } : opt
										);
										debouncedSave();
									}}
									class="flex-1"
									placeholder="Value"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="text-destructive"
									onclick={() => removeOption(idx)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Additional controls (collapsible) -->
		{#if showAdditionalControls}
			<Collapsible.Root bind:open={additionalControlsOpen}>
				<Collapsible.Trigger
					class="text-primary flex w-full items-center gap-2 text-left text-sm font-medium"
				>
					<span>Additional controls</span>
					<ChevronDown
						class="h-4 w-4 transition-transform {additionalControlsOpen ? 'rotate-180' : ''}"
					/>
				</Collapsible.Trigger>

				<Collapsible.Content>
					<div class="mt-4 flex flex-col gap-6">
						{#if needsTextValidation}
							<div class="grid grid-cols-2 gap-6">
								<div class="flex flex-col gap-2">
									<Label class="font-semibold">Min Length</Label>
									<Input
										type="number"
										bind:value={minLength}
										placeholder="Enter minimum length"
										min="0"
										onblur={debouncedSave}
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label class="font-semibold">Max Length</Label>
									<Input
										type="number"
										bind:value={maxLength}
										placeholder="Enter maximum length"
										min="0"
										onblur={debouncedSave}
									/>
								</div>
							</div>
						{/if}

						{#if needsNumberValidation}
							<div class="grid grid-cols-2 gap-6">
								<div class="flex flex-col gap-2">
									<Label class="font-semibold">Min Value</Label>
									<Input
										type="number"
										bind:value={minValue}
										placeholder="Enter minimum value"
										onblur={debouncedSave}
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label class="font-semibold">Max Value</Label>
									<Input
										type="number"
										bind:value={maxValue}
										placeholder="Enter maximum value"
										onblur={debouncedSave}
									/>
								</div>
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-6">
							<div class="flex flex-col gap-2">
								<Label class="font-semibold">Error Message</Label>
								<Input
									bind:value={customErrorMessage}
									placeholder="Enter error message for the input field"
									onblur={debouncedSave}
								/>
							</div>
							<div class="flex flex-col gap-2">
								<Label class="font-semibold">
									Pattern
									<span class="text-muted-foreground font-normal">(Regex)</span>
								</Label>
								<Input bind:value={pattern} placeholder="e.g. ^[a-zA-Z]+$" onblur={debouncedSave} />
							</div>
						</div>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/if}
	</div>
</div>

<!-- Delete confirmation -->
<AlertDialog.Root
	bind:open={showDeleteDialog}
	onOpenChange={(val) => {
		if (!val) showDeleteDialog = false;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Field?</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete the field "{field.label}"? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel type="button" onclick={() => (showDeleteDialog = false)}>
				Cancel
			</AlertDialog.Cancel>
			<form
				action="?/deleteField"
				method="POST"
				onsubmit={async (e) => {
					e.preventDefault();
					const formData = new FormData();
					formData.set('fieldId', String(field.id));

					try {
						const response = await fetch('?/deleteField', {
							method: 'POST',
							body: formData
						});
						const result = deserialize(await response.text());
						if (result.type === 'success' && field.id) {
							onDelete(field.id);
							showDeleteDialog = false;
						} else {
							toast.error('Failed to delete field');
						}
					} catch {
						toast.error('Failed to delete field');
					}
				}}
			>
				<Button variant="destructive" type="submit">Delete</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
