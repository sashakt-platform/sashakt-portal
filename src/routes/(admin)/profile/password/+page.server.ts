import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { passwordSchema } from './schema.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(passwordSchema))
	};
};

export const actions: Actions = {
	save: async ({ request, fetch, cookies }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod(passwordSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const passwordUpdateData: { current_password: string; new_password: string } = {
			current_password: form.data.current_password,
			new_password: form.data.new_password
		};

		const response = await fetch(`${BACKEND_URL}/users/me/password`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(passwordUpdateData)
		});

		if (!response.ok) {
			let message = 'Unable to update password';

			const error = await response.json();
			message = error?.detail?.[0].msg ?? error?.detail ?? message;

			form.errors = { current_password: [message] };
			return fail(response.status === 401 ? 401 : 400, { form });
		}

		await response.json();
		throw redirect(
			303,
			`/`,
			{ type: 'success', message: `Password Updated Successfully` },
			cookies
		);
	}
};
