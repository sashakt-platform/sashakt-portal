import type { PageServerLoad, Actions } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema';
import { setSessionTokenCookie, setRefreshTokenCookie } from '$lib/server/auth.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod(loginSchema))
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));
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

		const { access_token, refresh_token, expires_in } = await res.json();

		// Use expires_in from backend, fallback to 24 hours if not provided
		const accessExpiryMs = expires_in ? expires_in * 1000 : 60 * 60 * 24 * 1000;

		setSessionTokenCookie(cookies, access_token, new Date(Date.now() + accessExpiryMs));
		setRefreshTokenCookie(cookies, refresh_token);

		throw redirect(303, '/dashboard');
	}
};
