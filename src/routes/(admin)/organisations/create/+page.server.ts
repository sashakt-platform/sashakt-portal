import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createOrganisationSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.CREATE_ORGANIZATION);

	return {
		form: await superValidate(zod4(createOrganisationSchema))
	};
};

export const actions: Actions = {
	save: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_ORGANIZATION);
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod4(createOrganisationSchema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check all required fields.' }, cookies);
			return fail(400, { form });
		}

		const res = await fetch(`${BACKEND_URL}/organization/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(form.data)
		});

		if (!res.ok) {
			const errorBody = await res.json().catch(() => ({}));
			setFlash(
				{ type: 'error', message: errorBody.detail || 'Failed to create organisation.' },
				cookies
			);
			return fail(500, { form });
		}

		setFlash({ type: 'success', message: 'Organisation created successfully.' }, cookies);
		redirect(303, '/organisations');
	}
};
