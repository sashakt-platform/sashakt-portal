<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createUserSchema, editUserSchema, type FormSchema } from './schema';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import type { Filter } from '$lib/types/filters';
	import { hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';

	let { data }: { data: any } = $props();

	let userData: Partial<Infer<FormSchema>> | null = data?.user || null;
	const isEditMode = data.action === 'edit';
	const schema = isEditMode ? editUserSchema : createUserSchema;

	// check if current user is Super Admin by checking organization management permissions
	const isSuperAdmin =
		hasPermission(data.currentUser, PERMISSIONS.CREATE_ORGANIZATION) ||
		hasPermission(data.currentUser, PERMISSIONS.UPDATE_ORGANIZATION) ||
		hasPermission(data.currentUser, PERMISSIONS.DELETE_ORGANIZATION);

	const form = superForm(userData || data.form, {
		applyAction: 'never',
		validators: zodClient(schema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;

	let selectedStates = $state<Filter[]>([]);

	if (userData?.states?.length > 0) {
		selectedStates = [{ id: String(userData.states[0].id), name: userData.states[0].name }];
	}

	$effect(() => {
		$formData.state_ids = selectedStates.length > 0 ? [parseInt(selectedStates[0].id, 10)] : [];
	});

	// for non-Super Admins, automatically set organization_id to current user's organization
	if (!isSuperAdmin && data.currentUser?.organization_id && !isEditMode) {
		$formData.organization_id = data.currentUser.organization_id.toString();
	}
</script>

<form method="POST" use:enhance action="?/save" class="flex flex-col gap-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Form.Field {form} name="full_name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>
					<Input {...props} bind:value={$formData.full_name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input {...props} bind:value={$formData.email} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Password {isEditMode ? '(Optional - leave blank to keep current)' : ''}</Form.Label
					>
					<Input
						{...props}
						type="password"
						bind:value={$formData.password}
						placeholder={isEditMode ? 'Leave blank to keep current password' : ''}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="confirm_password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Confirm Password {isEditMode ? '(Required if password is entered)' : ''}</Form.Label
					>
					<Input
						{...props}
						type="password"
						bind:value={$formData.confirm_password}
						placeholder={isEditMode ? 'Confirm new password if changing' : ''}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<Form.Field {form} name="phone">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Phone</Form.Label>
					<Input {...props} bind:value={$formData.phone} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="is_active">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Is Active?</Form.Label>
					<div class="flex items-center space-x-2 pt-2">
						<Checkbox {...props} bind:checked={$formData.is_active} />
						<span class="text-sm">Active</span>
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#if isSuperAdmin}
			<Form.Field {form} name="organization_id">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Organization</Form.Label>
						<Select.Root type="single" bind:value={$formData.organization_id} name={props.name}>
							<Select.Trigger {...props}>
								{#if $formData.organization_id}
									{data.organizations.find(
										(organization: any) => organization.id === $formData.organization_id
									)?.name || 'Select organization'}
								{:else}
									Select organization
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each data.organizations as organization (organization.id)}
									<Select.Item value={organization.id} label={organization.name} />
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/if}
		<Form.Field {form} name="role_id">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Role</Form.Label>
					<Select.Root type="single" bind:value={$formData.role_id} name={props.name}>
						<Select.Trigger {...props}>
							{#if $formData.role_id}
								{data.roles.find((role: any) => role.id === $formData.role_id)?.label ||
									'Select role'}
							{:else}
								Select role
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each data.roles as role (role.id)}
								<Select.Item value={role.id} label={role.label} />
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	{#if data.roles
		.find((role: any) => role.id === $formData.role_id)
		?.label?.toLowerCase()
		?.includes('state')}
		<Form.Field {form} name="state_ids">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>State</Form.Label>
					<StateSelection {...props} bind:states={selectedStates} multiple={false} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{/if}

	<div class="flex justify-end gap-4 pt-6">
		<Button variant="outline" type="button">
			<a href="/users" class="block">Cancel</a>
		</Button>
		<Form.Button>Save User</Form.Button>
	</div>
</form>
