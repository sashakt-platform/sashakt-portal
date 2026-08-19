import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { requireLogin, getSessionTokenCookie } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import type { PageServerLoad, Actions } from './$types';

function titleCase(value: string): string {
	return value
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export const load: PageServerLoad = async () => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_ROLE);
	const token = getSessionTokenCookie();

	const [rolesResponse, permissionsResponse] = await Promise.all([
		fetch(`${BACKEND_URL}/roles/?limit=200`, {
			headers: { Authorization: `Bearer ${token}` }
		}),
		fetch(`${BACKEND_URL}/permissions/?limit=200`, {
			headers: { Authorization: `Bearer ${token}` }
		})
	]);

	const roles = rolesResponse.ok ? (await rolesResponse.json()).data : [];
	roles.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
	const permissions = permissionsResponse.ok ? (await permissionsResponse.json()).data : [];

	const permissionList = permissions.map((permission: { id: number; name: string }) => ({
		id: permission.id,
		name: permission.name,
		label: titleCase(permission.name)
	}));

	return {
		roles,
		permissions: permissionList
	};
};

export const actions: Actions = {
	updateRolePermissions: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_ROLE);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const roleId = formData.get('role_id');
		const payload = JSON.parse(formData.get('payload') as string);

		const response = await fetch(`${BACKEND_URL}/roles/${roleId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: errorMessage.detail || 'Failed to update role permissions'
				},
				cookies
			);
			return fail(500);
		}

		return { success: true };
	}
};
