<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Shield from '@lucide/svelte/icons/shield';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { createRoleSchema, editRoleSchema } from './schema.js';
	import { resolve } from '$app/paths';

	const { data }: { data: any } = $props();

	const isEditMode = $derived(data.action === 'edit');

	const locationScopeOptions = [
		{ value: 'none', label: 'None (organization-wide)' },
		{ value: 'state', label: 'State' },
		{ value: 'district', label: 'District' }
	];

	const {
		form: formData,
		enhance,
		errors
	} = superForm(data.form, {
		validators: zod4Client(isEditMode ? editRoleSchema : createRoleSchema),
		dataType: 'json'
	});

	const canSave = $derived(($formData.label?.trim() ?? '') !== '');
</script>

<form method="POST" action="?/save" use:enhance>
	<div>
		<div class="bg-card">
			<div class="mx-4 flex items-center justify-between py-4 sm:mx-10">
				<div class="m-4 flex items-center gap-3">
					<a
						href={resolve('/organization/roles-permissions')}
						class="hover:bg-muted rounded-lg border border-border p-2"
						aria-label="Back to roles and permissions"
					>
						<ArrowLeft size={20} />
					</a>
					<h2 class="text-2xl font-bold tracking-tight">
						{isEditMode ? 'Edit Role' : 'Create Role'}
					</h2>
				</div>
				<Button type="submit" class="bg-primary font-semibold" disabled={!canSave}>Save</Button>
			</div>
		</div>
		<hr class="border-border" />

		<div class="bg-background">
			<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
				<div class="bg-card rounded-2xl border border-border">
					<div class="border-border flex items-center gap-5 rounded-t-2xl border-b p-8">
						<span class="bg-brand-subtle shrink-0 rounded-lg p-2">
							<Shield class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</span>
						<h3 class="text-base font-semibold sm:text-xl">Role Details</h3>
					</div>

					<div class="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
						<div class="flex flex-col gap-2">
							<Label for="label">Role Name</Label>
							<Input
								id="label"
								type="text"
								name="label"
								placeholder="e.g. State Admin"
								bind:value={$formData.label}
							/>
							{#if $errors.label}
								<span class="text-destructive text-sm">{$errors.label}</span>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<Label for="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								placeholder="Brief description of this role..."
								bind:value={$formData.description}
							/>
						</div>

						<div class="flex flex-col gap-2">
							<Label for="location_scope">Location Scope</Label>
							<Select.Root
								type="single"
								value={$formData.location_scope ?? 'none'}
								onValueChange={(value) => {
									$formData.location_scope =
										value === 'none' ? null : (value as 'state' | 'district');
								}}
								name="location_scope"
							>
								<Select.Trigger id="location_scope" class="h-10 w-full gap-2 rounded-full px-4">
									{locationScopeOptions.find(
										(option) => option.value === ($formData.location_scope ?? 'none')
									)?.label}
								</Select.Trigger>
								<Select.Content>
									{#each locationScopeOptions as option (option.value)}
										<Select.Item value={option.value} label={option.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="flex items-center justify-between">
							<Label for="is_active" class="font-semibold">Role Status</Label>
							<div class="flex items-center gap-2">
								<span
									class="text-sm {$formData.is_active
										? 'text-primary font-semibold'
										: 'text-muted-foreground'}"
								>
									{$formData.is_active ? 'Active' : 'Inactive'}
								</span>
								<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
