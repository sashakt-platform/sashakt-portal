import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createRoleSchema, editRoleSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

function slugifyLabel(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_ROLE);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_ROLE);
	}

	let roleData = null;

	try {
		if (params.id && params.action === 'edit') {
			const response = await fetch(`${BACKEND_URL}/roles/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error(`Failed to fetch role data: ${response.statusText}`);
				roleData = null;
			} else {
				roleData = await response.json();
			}
		}
	} catch (error) {
		console.error('Error fetching role data:', error);
		roleData = null;
	}

	const rolesResponse = await fetch(`${BACKEND_URL}/roles/?limit=200`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	const roles = rolesResponse.ok ? (await rolesResponse.json()).data : [];
	const availableRoles = roles
		.map((role: { name: string; label: string }) => ({ name: role.name, label: role.label }))
		.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

	const schema = params.action === 'edit' ? editRoleSchema : createRoleSchema;

	return {
		form: roleData
			? await superValidate(roleData, zod4(schema))
			: await superValidate(zod4(schema)),
		action: params.action,
		id: params.id,
		availableRoles
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_ROLE);
			if (params.id === 'new') {
				return fail(400, { error: 'Invalid role ID for edit action' });
			}
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_ROLE);
			if (params.id !== 'new') {
				return fail(400, { error: 'Invalid role ID for add action' });
			}
		} else {
			return fail(400, { error: 'Invalid action' });
		}

		const schema = params.action === 'edit' ? editRoleSchema : createRoleSchema;
		const form = await superValidate(request, zod4(schema));

		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Role not saved. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}

		const payload = {
			...form.data,
			name: slugifyLabel(form.data.label)
		};

		if (params.action === 'add') {
			const response = await fetch(`${BACKEND_URL}/roles/`, {
				method: 'POST',
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
						message: errorMessage.detail || 'Role not created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.action === 'edit') {
			const response = await fetch(`${BACKEND_URL}/roles/${params.id}`, {
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
						message: errorMessage.detail || 'Role not updated. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		throw redirect(
			303,
			'/organization/roles-permissions',
			{ type: 'success', message: 'Role saved successfully' },
			cookies
		);
	}
};
