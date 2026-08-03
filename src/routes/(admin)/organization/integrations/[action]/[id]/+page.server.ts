import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { error, fail } from '@sveltejs/kit';
import { addProviderSchema } from './schema.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add' || params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_MY_ORGANIZATION);
	}

	const catalogRes = await fetch(`${BACKEND_URL}/providers/?page=1&size=100`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!catalogRes.ok) {
		const errorMessage = await catalogRes.json();
		error(catalogRes.status, errorMessage.detail || 'Failed to load providers');
	}

	const providers = (await catalogRes.json()).items;

	let organizationProvider = null;

	if (params.action === 'edit') {
		const orgProvidersRes = await fetch(
			`${BACKEND_URL}/providers/organizations/${user.organization_id}/providers`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` }
			}
		);

		if (!orgProvidersRes.ok) {
			const errorMessage = await orgProvidersRes.json();
			error(orgProvidersRes.status, errorMessage.detail || 'Failed to load provider');
		}

		const organizationProviders = await orgProvidersRes.json();
		organizationProvider = organizationProviders.find(
			(op: { provider_id: number }) => op.provider_id === Number(params.id)
		);

		if (!organizationProvider) {
			error(404, 'Provider not found');
		}
	}

	return {
		form: await superValidate(
			organizationProvider
				? {
					provider_id: organizationProvider.provider_id,
					config_json: '',
					is_enabled: organizationProvider.is_enabled
				}
				: undefined,
			zod4(addProviderSchema)
		),
		action: params.action,
		providers
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'edit' || params.action === 'add') {
			requirePermission(user, PERMISSIONS.UPDATE_MY_ORGANIZATION);
		}

		const form = await superValidate(request, zod4(addProviderSchema));

		if (!form.valid) {
			setFlash(
				{
					type: 'error',
					message: `Provider not ${params.id === 'new' ? 'added' : 'updated'}. Please check all the details.`
				},
				cookies
			);
			return fail(400, { form });
		}

		const hasConfigJson = !!form.data.config_json?.trim();
		const configJson = hasConfigJson ? JSON.parse(form.data.config_json as string) : {};

		if (params.id === 'new') {
			const response = await fetch(
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

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{ type: 'error', message: errorMessage.detail || 'Failed to add provider' },
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.id !== 'new') {
			const response = await fetch(
				`${BACKEND_URL}/providers/organizations/${user.organization_id}/providers/${params.id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						is_enabled: form.data.is_enabled,
						...(hasConfigJson ? { config_json: configJson } : {})
					})
				}
			);

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{ type: 'error', message: errorMessage.detail || 'Failed to update provider' },
					cookies
				);
				return fail(500, { form });
			}
		}

		redirect(
			'/organization/integrations',
			{
				type: 'success',
				message: `Provider ${params.id === 'new' ? 'added' : 'updated'} successfully`
			},
			cookies
		);
	},

	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_MY_ORGANIZATION);
		const token = getSessionTokenCookie();

		const res = await fetch(
			`${BACKEND_URL}/providers/organizations/${user.organization_id}/providers/${params.id}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (!res.ok) {
			const errorMessage = await res.json();
			redirect(
				'/organization/integrations',
				{ type: 'error', message: errorMessage.detail || 'Failed to delete provider' },
				cookies
			);
		}

		redirect(
			'/organization/integrations',
			{ type: 'success', message: 'Provider deleted successfully' },
			cookies
		);
	}
};
