import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { editOrganizationSchema } from './schema.js';

export const load: PageServerLoad = async ({ fetch }) => {
	const token = getSessionTokenCookie();
	let organizationData = null;

	try {
		const orgResponse = await fetch(`${BACKEND_URL}/organization/current`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!orgResponse.ok) {
			console.error(`Failed to fetch organization data: ${orgResponse.statusText}`);
			throw new Error('Failed to fetch organization data');
		}

		organizationData = await orgResponse.json();
	} catch (error) {
		console.error('Error fetching organization data:', error);
		organizationData = null;
	}

	return {
		form: await superValidate(zod4(editOrganizationSchema)),
		currentOrganization: organizationData
	};
};

export const actions: Actions = {
	save: async ({ request, fetch, cookies }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod4(editOrganizationSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const updateData: any = {
			name: form.data.name,
			description: form.data.description || '',
			shortcode: form.data.shortcode,
			logo: form.data.logo || ''
		};

		const res = await fetch(`${BACKEND_URL}/organization/current`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(updateData)
		});

		if (!res.ok) {
			return fail(401, { form });
		}

		await res.json();

		throw redirect(
			303,
			`/organization`,
			{ type: 'success', message: 'Organization Updated Successfully' },
			cookies
		);
	}
};
