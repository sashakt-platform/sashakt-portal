import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createCertificateSchema, editCertificateSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_CERTIFICATE);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_CERTIFICATE);
	} else if (params.action === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_CERTIFICATE);
	}

	let certificateData = null;

	try {
		if (params.id && params.action === 'edit') {
			const response = await fetch(`${BACKEND_URL}/certificate/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error(`Failed to fetch certificate data: ${response.statusText}`);
				throw new Error('Failed to fetch certificate data');
			}

			certificateData = await response.json();
		}
	} catch (error) {
		console.error('Error fetching certificate data:', error);
		certificateData = null;
	}

	const schema = params.action === 'edit' ? editCertificateSchema : createCertificateSchema;

	return {
		form: await superValidate(zod4(schema)),
		action: params.action,
		id: params.id,
		certificate: certificateData,
		currentUser: user
	};
};
export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_CERTIFICATE);
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_CERTIFICATE);
		}

		const schema = params.action === 'edit' ? editCertificateSchema : createCertificateSchema;

		const form = await superValidate(request, zod4(schema));

		if (user.organization_id) {
			form.data.organization_id = user.organization_id;
		}

		if (!form.valid) {
			setFlash(
				{
					type: 'error',
					message: 'Certificate not created. Please check all the details.'
				},
				cookies
			);
			return fail(400, { form });
		}

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/certificate/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: errorMessage.detail || 'Certificate not created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/certificate/${params.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: errorMessage.detail || 'Certificate not updated. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		redirect(
			'/certificate',
			{
				type: 'success',
				message: 'Certificate saved successfully'
			},
			cookies
		);
	},

	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_CERTIFICATE);

		const token = getSessionTokenCookie();

		const res = await fetch(`${BACKEND_URL}/certificate/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			const errorMessage = await res.json();
			redirect(
				'/certificate',
				{
					type: 'error',
					message: `${errorMessage.detail || res.statusText}`
				},
				cookies
			);
		}

		throw redirect(
			303,
			`/certificate`,
			{ type: 'success', message: `Certificate Deleted Successfully` },
			cookies
		);
	}
};
