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

		const res = await fetch(`${BACKEND_URL}/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: new URLSearchParams({
				full_name: form.data.full_name,
				email: form.data.email,
				password: form.data.password,
				phone: form.data.phone || '',
				organization_id: form.data.organization_id.toString(),
				role_id: form.data.role_id.toString(),
				is_active: form.data.is_active ? 'true' : 'false'
			})
		});

		if (!res.ok) {
			const err = await res.json();
			form.errors = { full_name: [err.detail] };
			return fail(401, { form });
		}

		const { access_token } = await res.json();

		throw redirect(303, '/users');
	}
};
