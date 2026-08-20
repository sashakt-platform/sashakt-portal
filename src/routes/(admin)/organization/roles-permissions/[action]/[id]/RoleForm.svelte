<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Shield from '@lucide/svelte/icons/shield';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { createRoleSchema, editRoleSchema } from './schema.js';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils.js';

	const { data }: { data: any } = $props();

	const isEditMode = $derived(data.action === 'edit');
	const availableRoles: { name: string; label: string }[] = data.availableRoles ?? [];

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

	let allowedRolesOpen = $state(false);
	let visibleToRolesOpen = $state(false);

	function toggleRole(field: 'allowed_roles' | 'visible_to_roles', roleName: string) {
		const current = $formData[field] ?? [];
		$formData[field] = current.includes(roleName)
			? current.filter((name: string) => name !== roleName)
			: [...current, roleName];
	}

	function roleLabel(roleName: string): string {
		return availableRoles.find((role) => role.name === roleName)?.label ?? roleName;
	}
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
							<Label for="location_scope">Location Level</Label>
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

						<div class="flex flex-col gap-2">
							<Label for="allowed_roles">Can Manage These Roles</Label>
							<Popover.Root bind:open={allowedRolesOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<Button
											{...props}
											id="allowed_roles"
											type="button"
											variant="outline"
											class="bg-card h-auto min-h-10 w-full justify-start rounded-full text-muted-foreground"
											role="combobox"
											aria-expanded={allowedRolesOpen}
										>
											{#if !$formData.allowed_roles || $formData.allowed_roles.length === 0}
												Choose the roles this role controls
											{:else}
												<span class="flex flex-wrap gap-1 text-start">
													{#each $formData.allowed_roles as roleName (roleName)}
														<Badge
															variant="outline"
															class="border-primary/20 bg-secondary text-primary rounded-full border font-semibold"
														>
															{roleLabel(roleName)}
														</Badge>
													{/each}
												</span>
											{/if}
											<ChevronDown class="ml-auto shrink-0 opacity-50" />
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-(--radix-popover-trigger-width) min-w-50 max-w-100 p-0">
									<Command.Root>
										<Command.Input placeholder="Search roles..." />
										<Command.List>
											<Command.Empty>No roles found.</Command.Empty>
											{#each availableRoles as role (role.name)}
												<Command.Item
													value={role.label}
													onSelect={() => toggleRole('allowed_roles', role.name)}
												>
													<Check
														class={cn(
															'shrink-0',
															!($formData.allowed_roles ?? []).includes(role.name) &&
																'text-transparent'
														)}
													/>
													<span class="min-w-0 truncate" title={role.label}>{role.label}</span>
												</Command.Item>
											{/each}
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						</div>

						<div class="flex flex-col gap-2">
							<Label for="visible_to_roles">Visible To These Admin Roles</Label>
							<Popover.Root bind:open={visibleToRolesOpen}>
								<Popover.Trigger>
									{#snippet child({ props })}
										<Button
											{...props}
											id="visible_to_roles"
											type="button"
											variant="outline"
											class="bg-card h-auto min-h-10 w-full justify-start rounded-full text-muted-foreground"
											role="combobox"
											aria-expanded={visibleToRolesOpen}
										>
											{#if !$formData.visible_to_roles || $formData.visible_to_roles.length === 0}
												Select admin roles that can see and manage this role
											{:else}
												<span class="flex flex-wrap gap-1 text-start">
													{#each $formData.visible_to_roles as roleName (roleName)}
														<Badge
															variant="outline"
															class="border-primary/20 bg-secondary text-primary rounded-full border font-semibold"
														>
															{roleLabel(roleName)}
														</Badge>
													{/each}
												</span>
											{/if}
											<ChevronDown class="ml-auto shrink-0 opacity-50" />
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-(--radix-popover-trigger-width) min-w-50 max-w-100 p-0">
									<Command.Root>
										<Command.Input placeholder="Search roles..." />
										<Command.List>
											<Command.Empty>No roles found.</Command.Empty>
											{#each availableRoles as role (role.name)}
												<Command.Item
													value={role.label}
													onSelect={() => toggleRole('visible_to_roles', role.name)}
												>
													<Check
														class={cn(
															'shrink-0',
															!($formData.visible_to_roles ?? []).includes(role.name) &&
																'text-transparent'
														)}
													/>
													<span class="min-w-0 truncate" title={role.label}>{role.label}</span>
												</Command.Item>
											{/each}
										</Command.List>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
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
