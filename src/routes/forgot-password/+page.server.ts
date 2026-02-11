import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { forgotPasswordSchema } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		form: await superValidate(zod4(forgotPasswordSchema)),
		organizationData: locals.organization
	};
};

export const actions: Actions = {
	default: async ({ fetch, request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const res = await fetch(`${BACKEND_URL}/password-recovery/${form.data.email}`, {
			method: 'POST',
			headers: { accept: 'application/json' }
		});

		const data = await res.json();

		if (!res.ok) {
			form.errors = { email: [data.detail ?? 'Failed to send reset link'] };
			return fail(res.status, { form });
		}

		return message(form, 'Password reset email sent successfully');
	}
};
