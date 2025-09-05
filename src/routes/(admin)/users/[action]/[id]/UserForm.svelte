<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { createUserSchema, editUserSchema, type FormSchema } from './schema';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import type { StateFilter } from '$lib/types/filters';

	let { data }: { data: any } = $props();

	let userData: Partial<Infer<FormSchema>> | null = data?.user || null;
	const isEditMode = data.action === 'edit';
	const schema = isEditMode ? editUserSchema : createUserSchema;

	const form = superForm(userData || data.form, {
		applyAction: 'never',
		validators: zodClient(schema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;

	if (userData) {
		$formData.state_ids =
			userData?.states?.map((state: StateFilter) => ({ id: state.id, name: state.name })) || [];
	}
</script>

<form method="POST" use:enhance action="?/save">
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
					placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password'}
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
					placeholder={isEditMode ? 'Confirm new password if changing' : 'Confirm password'}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="phone">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Phone</Form.Label>
				<Input {...props} bind:value={$formData.phone} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="organization_id">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Organization</Form.Label>
				<Select.Root type="single" bind:value={$formData.organization_id} name={props.name}>
					<Select.Trigger class="w-[180px]" {...props}>
						{#if $formData.organization_id}
							{data.organizations.find(
								(organization) => organization.id === $formData.organization_id
							)?.name || '--select--'}
						{:else}
							--select--
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
	<Form.Field {form} name="role_id">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Role</Form.Label>
				<Select.Root type="single" bind:value={$formData.role_id} name={props.name}>
					<Select.Trigger class="w-[180px]" {...props}>
						{#if $formData.role_id}
							{data.roles.find((role) => role.id === $formData.role_id)?.label || '--select--'}
						{:else}
							--select--
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
	{#if data.roles
		.find((role) => role.id === $formData.role_id)
		?.label?.toLowerCase()
		?.includes('state')}
		<Form.Field {form} name="state_ids">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>States</Form.Label>
					<StateSelection {...props} bind:states={$formData.state_ids} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{/if}
	<Form.Field {form} name="is_active">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Is Active?</Form.Label>
				<Checkbox {...props} bind:checked={$formData.is_active} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Save</Form.Button>
	<Form.Button><a href="/users">Cancel</a></Form.Button>
</form>
