<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createUserSchema, editUserSchema, type FormSchema } from './schema';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import type { Filter } from '$lib/types/filters';
	import {
		hasPermission,
		isSuperAdmin,
		PERMISSIONS,
		isStateAdmin,
		getUserState,
		getUserDistrict,
		hasAssignedDistricts
	} from '$lib/utils/permissions.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	let { data }: { data: any } = $props();

	let userData: Partial<Infer<FormSchema>> | null = data?.user || null;
	const isEditMode = data.action === 'edit';
	const schema = isEditMode ? editUserSchema : createUserSchema;

	const isSuperAdminUser = isSuperAdmin(data.currentUser);

	const form = superForm(userData || data.form, {
		applyAction: 'never',
		validators: zod4Client(schema as any),
		dataType: 'json'
	});

	const { form: formData, enhance, errors } = form;

	let selectedStates = $state<Filter[]>([]);
	let selectedDistricts = $state<Filter[]>([]);

	// check if the current user is a state admin
	const currentUserIsStateAdmin = isStateAdmin(data.currentUser);

	const currentUserHasAssignedDistricts = hasAssignedDistricts(data.currentUser);

	if (userData?.states?.length > 0) {
		selectedStates = [{ id: String(userData.states[0].id), name: userData.states[0].name }];
	}

	if (userData?.districts?.length > 0) {
		selectedDistricts = userData.districts.map((d) => ({
			id: String(d.id),
			name: d.name
		}));
	}

	const showLocationFields = $derived.by(() => {
		const label =
			data.roles.find((role: any) => role.id === $formData.role_id)?.label?.toLowerCase() ?? '';
		return label.includes('state') || label.includes('test');
	});

	const isSelectedRoleStateAdmin = $derived.by(() => {
		const label =
			data.roles.find((role: any) => role.id === $formData.role_id)?.label?.toLowerCase() ?? '';
		return label.includes('state');
	});

	$effect(() => {
		if (isSelectedRoleStateAdmin) {
			selectedDistricts = [];
		}
	});

	// if state admin is creating a user with state admin or test admin role,
	// then we should auto-assign current state admin's state and state admin's districts
	$effect(() => {
		const selectedRole = data.roles.find((role: any) => role.id === $formData.role_id);
		const selectedRoleLabel = selectedRole?.label?.toLowerCase() ?? '';
		const isStateRole = selectedRoleLabel.includes('state');
		const isTestRole = selectedRoleLabel.includes('test');

		if (currentUserIsStateAdmin && (isStateRole || isTestRole)) {
			if (selectedStates.length === 0) {
				const userState = getUserState(data.currentUser);
				if (userState) {
					selectedStates = [{ id: String(userState.id), name: userState.name }];
				}
			}
		}
		if (currentUserHasAssignedDistricts && (isStateRole || isTestRole)) {
			if (selectedDistricts.length === 0) {
				const userDistrict = getUserDistrict(data.currentUser);
				if (userDistrict?.length) {
					selectedDistricts = userDistrict.map((d) => ({
						id: String(d.id),
						name: d.name
					}));
				}
			}
		}
	});

	$effect(() => {
		$formData.state_ids = selectedStates.length > 0 ? [parseInt(selectedStates[0].id, 10)] : [];
		$formData.district_ids =
			selectedDistricts.length > 0 ? selectedDistricts.map((d) => Number.parseInt(d.id, 10)) : [];
	});

	// for non-Super Admins, automatically set organization_id to current user's organization
	if (!isSuperAdminUser && data.currentUser?.organization_id && !isEditMode) {
		$formData.organization_id = data.currentUser.organization_id.toString();
	}
</script>

<form id="user-form" method="POST" use:enhance action="?/save" class="flex flex-col gap-6">
	{#if $errors._errors && $errors._errors.length > 0}
		<div class="border-destructive bg-destructive/10 rounded-md border p-4">
			<h3 class="text-destructive mb-2 text-sm font-medium">Please fix the following errors:</h3>
			<ul class="list-inside list-disc space-y-1">
				{#each $errors._errors as error, index (index)}
					<li class="text-destructive text-sm">{error}</li>
				{/each}
			</ul>
		</div>
	{/if}
	<div class="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
		<div class="flex flex-col gap-6">
			<Form.Field {form} name="full_name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Name</Form.Label>
						<Input {...props} placeholder="Name of this user..." bind:value={$formData.full_name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Email</Form.Label>
						<Input {...props} placeholder="Email of this user..." bind:value={$formData.email} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="phone">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Phone Number</Form.Label>
						<Input
							{...props}
							placeholder="Phone number of this user..."
							bind:value={$formData.phone}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			{#if isSuperAdminUser}
				<Form.Field {form} name="organization_id">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="font-semibold">Organization</Form.Label>
							<Select.Root type="single" bind:value={$formData.organization_id} name={props.name}>
								<Select.Trigger {...props} class="h-10 w-full gap-2 rounded-full px-4">
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
						<Form.Label class="font-semibold">Role</Form.Label>
						<Select.Root type="single" bind:value={$formData.role_id} name={props.name}>
							<Select.Trigger {...props} class="h-10 w-full gap-2 rounded-full px-4">
								{#if $formData.role_id}
									{data.roles.find((role: any) => role.id === $formData.role_id)?.label ||
										'Select Role'}
								{:else}
									Select Role
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

			{#if showLocationFields}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#if !currentUserIsStateAdmin}
						<Form.Field {form} name="state_ids">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label class="font-semibold">State</Form.Label>
									<StateSelection {...props} bind:states={selectedStates} multiple={false} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
					{#if !currentUserHasAssignedDistricts && !isSelectedRoleStateAdmin}
						<Form.Field {form} name="district_ids">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label class="font-semibold">District</Form.Label>
									<DistrictSelection
										{...props}
										bind:districts={selectedDistricts}
										{selectedStates}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-6">
			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">
							Password{isEditMode ? ' (Optional - leave blank to keep current)' : ''}
						</Form.Label>
						<div class="relative">
							<Input
								{...props}
								type={showPassword ? 'text' : 'password'}
								bind:value={$formData.password}
								placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password'}
								class="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="text-muted-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
								onclick={() => (showPassword = !showPassword)}
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{#if showPassword}
									<Eye size={16} />
								{:else}
									<EyeOff size={16} />
								{/if}
							</Button>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="confirm_password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">
							Confirm Password{isEditMode ? ' (Required if password is entered)' : ''}
						</Form.Label>
						<div class="relative">
							<Input
								{...props}
								type={showConfirmPassword ? 'text' : 'password'}
								bind:value={$formData.confirm_password}
								placeholder={isEditMode ? 'Confirm new password if changing' : 'Re-enter password'}
								class="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="text-muted-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
								aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
							>
								{#if showConfirmPassword}
									<Eye size={16} />
								{:else}
									<EyeOff size={16} />
								{/if}
							</Button>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="is_active">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center justify-between">
							<Form.Label class="font-semibold">User Status</Form.Label>
							<div class="flex items-center gap-2">
								<span
									class="text-sm {$formData.is_active
										? 'text-primary font-semibold'
										: 'text-muted-foreground'}"
								>
									{$formData.is_active ? 'Active' : 'Inactive'}
								</span>
								<Switch {...props} bind:checked={$formData.is_active} />
							</div>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
</form>
