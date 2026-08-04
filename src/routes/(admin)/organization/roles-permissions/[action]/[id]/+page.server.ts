import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { error, fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import type { PageServerLoad, Actions } from './$types';

type Role = {
	id: number;
	organization_id: number;
	name: string;
	label: string;
	description: string | null;
	is_active: boolean;
	permissions: number[];
};

type Permission = {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
};

export const load: PageServerLoad = async ({ params, cookies }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.UPDATE_ROLE);
	const token = getSessionTokenCookie();

	const roleRes = await fetch(`${BACKEND_URL}/roles/${params.id}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!roleRes.ok) {
		const errorMessage = await roleRes.json();
		error(roleRes.status, errorMessage.detail || 'Failed to load role');
	}

	const role: Role = await roleRes.json();

	let permissionCatalog: Permission[] = [];
	const permissionsRes = await fetch(`${BACKEND_URL}/permissions/?limit=500`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (permissionsRes.ok) {
		const body = await permissionsRes.json();
		permissionCatalog = body.data;
	} else {
		setFlash(
			{
				type: 'error',
				message: 'Unable to load the permission catalog. You can still view the role name.'
			},
			cookies
		);
	}

	return { role, permissionCatalog };
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_ROLE);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const name = formData.get('name');
		const label = formData.get('label');
		const description = formData.get('description');
		const isActive = formData.get('is_active') === 'true';
		const permissions = formData.getAll('permissions').map((id) => Number(id));

		if (typeof name !== 'string' || typeof label !== 'string') {
			return fail(400, { message: 'Missing role data' });
		}

		const res = await fetch(`${BACKEND_URL}/roles/${params.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				name,
				label,
				description: typeof description === 'string' && description ? description : null,
				is_active: isActive,
				permissions
			})
		});

		if (!res.ok) {
			const errorMessage = await res.json();
			setFlash({ type: 'error', message: errorMessage.detail || 'Failed to update role' }, cookies);
			return fail(res.status, { message: errorMessage.detail || 'Failed to update role' });
		}

		redirect(
			303,
			`/organization/roles-permissions/edit/${params.id}`,
			{ type: 'success', message: 'Role updated successfully' },
			cookies
		);
	}
};
