<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { toast } from 'svelte-sonner';
	import type { FormField } from './schema.js';
	import { fieldTypeLabels } from './schema.js';

	interface Props {
		fields: FormField[];
		formId: number;
		onEdit: (field: FormField) => void;
		onDelete: (fieldId: number) => void;
		onReorder: (fields: FormField[]) => void;
	}

	let { fields, formId, onEdit, onDelete, onReorder }: Props = $props();

	let showDeleteDialog = $state(false);
	let fieldToDelete = $state<FormField | null>(null);

	function handleDeleteClick(field: FormField) {
		fieldToDelete = field;
		showDeleteDialog = true;
	}

	function handleDeleteCancel() {
		showDeleteDialog = false;
		fieldToDelete = null;
	}

	async function moveField(index: number, direction: 'up' | 'down') {
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= fields.length) return;

		// Capture previous order for rollback
		const previousFields = [...fields];

		const newFields = [...fields];
		[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

		// Update order values
		newFields.forEach((field, i) => {
			field.order = i;
		});

		// Optimistic update
		onReorder(newFields);

		// Submit reorder to server
		const fieldIds = newFields.map((f) => f.id);
		const formData = new FormData();
		formData.set('fieldIds', JSON.stringify(fieldIds));

		try {
			const response = await fetch(`?/reorderFields`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				onReorder(previousFields);
				toast.error('Failed to reorder fields');
			}
		} catch {
			onReorder(previousFields);
			toast.error('Failed to reorder fields. Please check your connection.');
		}
	}
</script>

<div class="space-y-3">
	{#each fields as field, index (field.id)}
		<Card.Root class="border border-gray-200">
			<Card.Content class="p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="flex flex-col gap-1">
							<Button
								variant="ghost"
								size="sm"
								class="h-6 w-6 p-0"
								disabled={index === 0}
								onclick={() => moveField(index, 'up')}
							>
								<ChevronUp class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-6 w-6 p-0"
								disabled={index === fields.length - 1}
								onclick={() => moveField(index, 'down')}
							>
								<ChevronDown class="h-4 w-4" />
							</Button>
						</div>

						<div class="flex flex-col gap-1">
							<div class="flex items-center gap-2">
								<span class="font-medium">{field.label}</span>
								{#if field.is_required}
									<Badge variant="destructive" class="text-xs">Required</Badge>
								{/if}
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-500">
								<Badge variant="outline"
									>{fieldTypeLabels[field.field_type as keyof typeof fieldTypeLabels] ||
										field.field_type}</Badge
								>
								<span class="text-xs">Field name: {field.name}</span>
							</div>
							{#if field.help_text}
								<span class="text-xs text-gray-400">{field.help_text}</span>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2">
						<Button variant="ghost" size="sm" onclick={() => onEdit(field)}>
							<Pencil class="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="text-destructive hover:text-destructive"
							onclick={() => handleDeleteClick(field)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>

<AlertDialog.Root
	bind:open={showDeleteDialog}
	onOpenChange={(value) => {
		if (!value) handleDeleteCancel();
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Field?</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete the field "{fieldToDelete?.label}"? This action cannot be
				undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel type="button" onclick={handleDeleteCancel}>Cancel</AlertDialog.Cancel>
			<form
				action="?/deleteField"
				method="POST"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success' && fieldToDelete?.id) {
							onDelete(fieldToDelete.id);
							showDeleteDialog = false;
							fieldToDelete = null;
						}
					};
				}}
			>
				<input type="hidden" name="fieldId" value={fieldToDelete?.id} />
				<Button variant="destructive" type="submit">Delete</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
