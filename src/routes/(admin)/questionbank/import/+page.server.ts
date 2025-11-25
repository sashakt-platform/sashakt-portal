import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types.js';
import { schema } from './schema.js';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async () => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.CREATE_QUESTION);

	// Create a form with the default values
	const form = await superValidate(zod4(schema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_QUESTION);
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod4(schema));

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

		const data = await response.json();
		return message(form, data);
	}
};
