import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { organisationSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_ORGANIZATION);
		return {
			form: await superValidate(zod4(organisationSchema)),
			action: params.action,
			organisation: null
		};
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_ORGANIZATION);

		const res = await fetch(`${BACKEND_URL}/organization/${params.id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) {
			error(404, 'Organisation not found');
		}

		const organisation = await res.json();

		const form = await superValidate(
			{
				name: organisation.name,
				shortcode: organisation.shortcode,
				description: organisation.description ?? '',
				is_active: organisation.is_active
			},
			zod4(organisationSchema)
		);

		const logoPath: string | null = organisation.logo ?? null;
		const currentLogoUrl = logoPath
			? logoPath.startsWith('http')
				? logoPath
				: `${new URL(BACKEND_URL).origin}${logoPath}`
			: null;

		return {
			form,
			action: params.action,
			organisation,
			currentLogoUrl
		};
	}

	error(400, 'Invalid action');
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_ORGANIZATION);
		} else if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_ORGANIZATION);
		} else {
			error(400, 'Invalid action');
		}

		const form = await superValidate(request, zod4(organisationSchema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check all required fields.' }, cookies);
			return fail(400, { form });
		}

		let res: Response;

		if (params.action === 'add') {
			const formData = new FormData();
			formData.append('name', form.data.name);
			formData.append('shortcode', form.data.shortcode ?? '');
			if (form.data.description) formData.append('description', form.data.description);
			formData.append('is_active', String(form.data.is_active));
			if (form.data.logo instanceof File && form.data.logo.size > 0) {
				formData.append('logo', form.data.logo);
			}

			res = await fetch(`${BACKEND_URL}/organization/`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});
		} else {
			const editFormData = new FormData();
			editFormData.append('name', form.data.name);
			editFormData.append('shortcode', form.data.shortcode ?? '');
			if (form.data.description) editFormData.append('description', form.data.description);
			editFormData.append('is_active', String(form.data.is_active));
			if (form.data.logo instanceof File && form.data.logo.size > 0) {
				editFormData.append('logo', form.data.logo);
			}

			res = await fetch(`${BACKEND_URL}/organization/${params.id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: editFormData
			});
		}

		if (!res.ok) {
			const errorBody = await res.json().catch(() => ({}));
			setFlash(
				{
					type: 'error',
					message: errorBody.detail || 'Failed to save organisation.'
				},
				cookies
			);
			return fail(res.status, { form });
		}

		const message =
			params.action === 'add'
				? 'Organisation created successfully.'
				: 'Organisation updated successfully.';
		setFlash({ type: 'success', message }, cookies);
		redirect(303, '/organisations');
	}
};
