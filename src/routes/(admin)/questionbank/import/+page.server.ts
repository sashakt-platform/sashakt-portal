import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { schema } from './schema.js';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth.js';

export const load = async () => {
	// Create a form with the default values
	const form = await superValidate(zod(schema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Handle file upload logic here
		const file = form.data.file;

		// For demonstration, we just log the file name

		const formData = new FormData();
		formData.append('file', file);
		formData.append('user_id', String(form.data.user_id));

		const response = await fetch(`${BACKEND_URL}/questions/bulk-upload`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`
				// Don't set Content-Type header, it will be set automatically with boundary
			},
			body: formData
		});

		if (!response.ok) {
			return fail(500, { form });
		}

		return response.json().then((data) => {
			if (response.ok) {
				return message(form, 'File uploaded successfully');
			} else {
				return fail(500, { form });
			}
		});

		// You can add your file processing logic here

		// return message(form, 'File uploaded successfully');
	}
};

