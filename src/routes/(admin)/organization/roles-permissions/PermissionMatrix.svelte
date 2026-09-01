<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { resolve } from '$app/paths';

	type Role = {
		id: number;
		name: string;
		label: string;
		description: string | null;
		is_active: boolean;
		location_scope: 'state' | 'district' | null;
		allowed_roles: string[];
		permissions: number[];
		is_restricted: boolean;
	};

	const {
		roles,
		permissions,
		canUpdate = false,
		canDelete = false
	}: {
		roles: Role[];
		permissions: { id: number; name: string; label: string }[];
		canUpdate?: boolean;
		canDelete?: boolean;
	} = $props();

	let pendingKey = $state<string | null>(null);
	let deleteAction = $state<string | null>(null);
	let deletingRoleLabel = $state('');

	function requestDeleteRole(role: Role) {
		deletingRoleLabel = role.label;
		deleteAction = `?/deleteRole&role_id=${role.id}`;
	}

	async function togglePermission(role: Role, permissionId: number, checked: boolean) {
		if (!canUpdate) return;

		const key = `${role.id}-${permissionId}`;
		const previousPermissions = role.permissions;
		const updatedPermissions = checked
			? [...role.permissions, permissionId]
			: role.permissions.filter((id) => id !== permissionId);

		role.permissions = updatedPermissions;
		pendingKey = key;

		const formData = new FormData();
		formData.set('role_id', String(role.id));
		formData.set(
			'payload',
			JSON.stringify({
				name: role.name,
				label: role.label,
				description: role.description,
				is_active: role.is_active,
				location_scope: role.location_scope,
				allowed_roles: role.allowed_roles,
				permissions: updatedPermissions
			})
		);

		try {
			const response = await fetch('?/updateRolePermissions', { method: 'POST', body: formData });
			if (!response.ok) throw new Error('Request failed');
			toast.success('Permission updated');
		} catch {
			role.permissions = previousPermissions;
			toast.error('Failed to update permission');
		} finally {
			pendingKey = null;
			await invalidateAll();
		}
	}
</script>

<DeleteDialog bind:action={deleteAction} elementName={deletingRoleLabel || 'Role'} />

<div class="overflow-x-auto rounded-2xl border border-border">
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr class="bg-muted">
				<th
					class="text-muted-foreground sticky left-0 min-w-50 bg-muted p-4 text-left text-xs font-semibold tracking-wide uppercase"
				>
					Permission
				</th>
				{#each roles as role (role.id)}
					<th class="min-w-30 p-4 text-center text-sm font-semibold">
						<div class="group flex items-center justify-center gap-1.5">
							<span>{role.label}</span>
							{#if canUpdate}
								<a
									href={resolve(`/organization/roles-permissions/edit/${role.id}`)}
									class="text-muted-foreground hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
									aria-label={`Edit ${role.label}`}
								>
									<Pencil class="h-4 w-4" />
								</a>
							{/if}
							{#if canDelete && !role.is_restricted}
								<button
									type="button"
									class="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
									aria-label={`Delete ${role.label}`}
									onclick={() => requestDeleteRole(role)}
								>
									<Trash2 class="h-4 w-4" />
								</button>
							{/if}
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each permissions as permission (permission.id)}
				<tr class="border-t border-border">
					<td class="sticky left-0 bg-card p-4">{permission.label}</td>
					{#each roles as role (role.id)}
						<td class="p-4">
							<div class="flex justify-center">
								<Checkbox
									checked={role.permissions.includes(permission.id)}
									disabled={!canUpdate || pendingKey === `${role.id}-${permission.id}`}
									onCheckedChange={(checked) => togglePermission(role, permission.id, checked)}
								/>
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
