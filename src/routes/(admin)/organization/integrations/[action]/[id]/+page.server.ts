import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';
import { addProviderSchema } from './schema.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.CREATE_PROVIDER);
	const token = getSessionTokenCookie();

	const res = await fetch(`${BACKEND_URL}/providers/?page=1&size=100`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	const providers = res.ok ? (await res.json()).items : [];

	return {
		form: await superValidate(zod4(addProviderSchema)),
		action: params.action,
		providers
	};
};

export const actions: Actions = {
	save: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_PROVIDER);
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod4(addProviderSchema));

		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Provider not added. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}

		const configJson = form.data.config_json?.trim() ? JSON.parse(form.data.config_json) : {};

		const res = await fetch(
			`${BACKEND_URL}/providers/organizations/${user.organization_id}/providers`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					provider_id: form.data.provider_id,
					is_enabled: form.data.is_enabled,
					config_json: configJson
				})
			}
		);

		if (!res.ok) {
			const errorMessage = await res.json();
			setFlash(
				{ type: 'error', message: errorMessage.detail || 'Failed to add provider' },
				cookies
			);
			return fail(500, { form });
		}

		redirect(
			'/organization/integrations',
			{ type: 'success', message: 'Provider added successfully' },
			cookies
		);
	}
};
