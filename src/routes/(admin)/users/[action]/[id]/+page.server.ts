import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { userSchema } from './schema';

export const load: PageServerLoad = async ({ params }) => {
	return {
		form: await superValidate(zod(userSchema)),
		action: params.action,
		id: params.id
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(userSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const res = await fetch(`${BACKEND_URL}/login/access-token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				username: form.data.username,
				password: form.data.password
			})
		});

		if (!res.ok) {
			const err = await res.json();
			form.errors = { username: [err.detail] };
			return fail(401, { form });
		}

		const { access_token } = await res.json();

		throw redirect(303, '/users');
	}
};
