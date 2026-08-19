<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	type Role = {
		id: number;
		name: string;
		label: string;
		description: string | null;
		is_active: boolean;
		location_scope: 'state' | 'district' | null;
		allowed_roles: string[];
		permissions: number[];
	};

	const {
		roles,
		permissions
	}: {
		roles: Role[];
		permissions: { id: number; name: string; label: string }[];
	} = $props();

	let pendingKey = $state<string | null>(null);

	async function togglePermission(role: Role, permissionId: number, checked: boolean) {
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
						{role.label}
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
									disabled={pendingKey === `${role.id}-${permission.id}`}
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
