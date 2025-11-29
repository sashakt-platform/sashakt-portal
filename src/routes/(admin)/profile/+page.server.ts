import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { editUserSchema } from './schema.js';

export const load: PageServerLoad = async ({ fetch }) => {
	const token = getSessionTokenCookie();
	let userData = null;

	// get current user data
	try {
		const userResponse = await fetch(`${BACKEND_URL}/users/me`, {
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
	} catch (error) {
		console.error('Error fetching user data:', error);
		userData = null;
	}

	return {
		form: await superValidate(zod4(editUserSchema)),
		currentUser: userData
	};
};

export const actions: Actions = {
	save: async ({ request, fetch, cookies }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod4(editUserSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		let res: Response;
		const updateData: any = {
			full_name: form.data.full_name,
			email: form.data.email,
			phone: form.data.phone || ''
		};

		res = await fetch(`${BACKEND_URL}/users/me`, {
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
			`/profile`,
			{ type: 'success', message: `Details Updated Successfully` },
			cookies
		);
	}
};
