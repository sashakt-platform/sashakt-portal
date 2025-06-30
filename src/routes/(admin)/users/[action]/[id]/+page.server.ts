import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { userSchema } from './schema';
import { getSessionTokenCookie } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ params }) => {
	const token = getSessionTokenCookie();

	let userData = null;

	// get user data in edit mode
	try {
		if (params.id && params.action === 'edit') {
			const userResponse = await fetch(`${BACKEND_URL}/users/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!userResponse.ok) {
				console.error(`Failed to fetch user data: ${userResponse.statusText}`);
				throw new Error('Failed to fetch user data');
			}

			userData = await userResponse.json();
		}
	} catch (error) {
		console.error('Error fetching user data:', error);
		userData = null;
	}

	// get roles from the backend
	let formattedRoles = [];
	try {
		const roleResponse = await fetch(`${BACKEND_URL}/roles`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!roleResponse.ok) {
			console.error(`Failed to fetch role data: ${roleResponse.statusText}`);
			throw new Error('Failed to fetch role data');
		}

		const { data: roleData } = await roleResponse.json();

		formattedRoles = roleData.map((role: { id: string; label: string }) => ({
			id: role.id,
			label: role.label
		}));
	} catch (error) {
		console.error('Error fetching role data:', error);
	}

	// get organization from the backend
	let formattedOrganizations = [];
	try {
		const organizationResponse = await fetch(`${BACKEND_URL}/organization`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!organizationResponse.ok) {
			console.error(`Failed to fetch organization data: ${organizationResponse.statusText}`);
			throw new Error('Failed to fetch organization data');
		}

		// const { data: organizationData } = await organizationResponse.json();

		const organizationData = await organizationResponse.json();

		formattedOrganizations = organizationData.map((organization: { id: string; name: string }) => ({
			id: organization.id,
			name: organization.name
		}));
	} catch (error) {
		console.error('Error fetching organization data:', error);
	}

	return {
		form: await superValidate(zod(userSchema)),
		action: params.action,
		id: params.id,
		user: userData,
		roles: formattedRoles,
		organizations: formattedOrganizations
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(userSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		let res: Response;
		if (params.action === 'edit' && params.id) {
			res = await fetch(`${BACKEND_URL}/users/${params.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					full_name: form.data.full_name,
					email: form.data.email,
					password: form.data.password,
					phone: form.data.phone || '',
					organization_id: form.data.organization_id.toString(),
					role_id: form.data.role_id.toString(),
					is_active: form.data.is_active ? 'true' : 'false'
				})
			});
		} else if (params.action === 'add') {
			res = await fetch(`${BACKEND_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					full_name: form.data.full_name,
					email: form.data.email,
					password: form.data.password,
					phone: form.data.phone || '',
					organization_id: form.data.organization_id.toString(),
					role_id: form.data.role_id.toString(),
					is_active: form.data.is_active ? 'true' : 'false'
				})
			});
		}

		if (!res.ok) {
			const err = await res.json();
			form.errors = { password: [err.detail[0].msg] };
			return fail(401, { form });
		}

		await res.json();

		throw redirect(303, '/users');
	}
};
