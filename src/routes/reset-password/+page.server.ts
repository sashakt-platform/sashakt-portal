import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { updatePasswordSchema } from './schema';
import { BACKEND_URL } from '$env/static/private';
import { redirect } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') || '';

	return {
		form: await superValidate({ token }, zod4(updatePasswordSchema))
	};
};

export const actions: Actions = {
	update: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(updatePasswordSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const res = await fetch(`${BACKEND_URL}/reset-password/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				new_password: form.data.password,
				token: form.data.token
			})
		});
		const data = await res.json();
		if (!res.ok) {
			form.errors = {
				password: [data.detail ?? 'Failed to update password']
			};
			return fail(res.status, { form });
		}

		throw redirect(
			303,
			`/login`,
			{ type: 'success', message: `Password Updated successfully` },
			cookies
		);
	}
};
