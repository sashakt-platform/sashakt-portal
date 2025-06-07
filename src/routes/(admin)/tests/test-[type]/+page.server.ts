import type { PageServerLoad, Actions } from './$types.js';
import { testSchema, individualTestSchema } from './schema.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

import { getSessionTokenCookie } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params }) => {
	const is_template = params.type === 'template';

	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/test/?is_template=${is_template}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		console.error('Failed to fetch tests:', res.status, res.statusText);
		return { tests: null };
	}

	const tests = await res.json();

	// Create a form with the default values
	const form = await superValidate(zod(testSchema));
	const deleteForm = await superValidate(zod(individualTestSchema));

	// Update is_template property based on params.type
	form.data.is_template = is_template;

	return {
		form,
		deleteForm,
		tests
	};
};

export const actions: Actions = {
	saveAction: async ({ request, params }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(testSchema));
		if (!form.valid) {
			return fail(400, { form });
        }

        const is_create = !form.data.test_id;

			const response = await fetch(`${BACKEND_URL}/test${is_create ? '' : `/${form.data.test_id}`}`, {
                method: `${is_create ? 'POST' : 'PUT'}`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				return fail(500, { form });
			}

			return response.json().then((data) => {
				if (response.ok) {
					return redirect(303, `/tests/test-${form.data.is_template?'template':'session'}`);
				} else {
					return fail(500, { form });
				}
			});
        
	},

	deleteAction: async ({ request, params }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod(individualTestSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const response = await fetch(`${BACKEND_URL}/test/${form.data.test_id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return fail(500, { form });
		}

		return response.json().then((data) => {
			if (response.ok) {
				return redirect(303, `/tests/test-${params.type}`);
			} else {
				return fail(500, { form });
			}
		});
	}
};
