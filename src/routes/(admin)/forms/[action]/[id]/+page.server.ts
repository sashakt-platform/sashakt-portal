import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createFormSchema, editFormSchema, formFieldSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_FORM);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
	} else if (params.action === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_FORM);
	}

	let formData = null;
	let entityTypes: Array<{ id: number; name: string }> = [];

	try {
		// Fetch entity types for entity field selection
		const entityTypesRes = await fetch(`${BACKEND_URL}/entitytype/?size=100`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (entityTypesRes.ok) {
			const entityTypesData = await entityTypesRes.json();
			entityTypes = entityTypesData.items || [];
		} else {
			console.error(
				'Failed to fetch entity types:',
				entityTypesRes.status,
				entityTypesRes.statusText
			);
		}

		// Fetch form data in edit mode
		if (params.id && params.action === 'edit') {
			const response = await fetch(`${BACKEND_URL}/form/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error(`Failed to fetch form data: ${response.statusText}`);
				throw new Error('Failed to fetch form data');
			}

			formData = await response.json();
		}
	} catch (error) {
		console.error('Error fetching form data:', error);
		formData = null;
	}

	const schema = params.action === 'edit' ? editFormSchema : createFormSchema;

	return {
		form: await superValidate(zod4(schema)),
		action: params.action,
		id: params.id,
		formData,
		entityTypes,
		currentUser: user
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_FORM);
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_FORM);
		}

		const schema = params.action === 'edit' ? editFormSchema : createFormSchema;
		const form = await superValidate(request, zod4(schema));

		if (user.organization_id) {
			form.data.organization_id = user.organization_id;
		}

		if (!form.valid) {
			setFlash(
				{
					type: 'error',
					message: 'Form not saved. Please check all the details.'
				},
				cookies
			);
			return fail(400, { form });
		}

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/form/`, {
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
						message: errorMessage.detail || 'Form not created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}

			const newForm = await response.json();
			// Redirect to edit page so user can add fields
			redirect(
				`/forms/edit/${newForm.id}`,
				{
					type: 'success',
					message: 'Form created successfully. Now add fields to your form.'
				},
				cookies
			);
		}

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/form/${params.id}`, {
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
						message: errorMessage.detail || 'Form not updated. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		redirect(
			'/forms',
			{
				type: 'success',
				message: 'Form saved successfully'
			},
			cookies
		);
	},

	addField: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
		const token = getSessionTokenCookie();

		const data = await request.formData();
		const fieldData = JSON.parse(data.get('field') as string);

		const response = await fetch(`${BACKEND_URL}/form/${params.id}/field/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(fieldData)
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: errorMessage.detail || 'Failed to add field'
				},
				cookies
			);
			return fail(500, {});
		}

		setFlash({ type: 'success', message: 'Field added successfully' }, cookies);
		return { success: true };
	},

	updateField: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
		const token = getSessionTokenCookie();

		const data = await request.formData();
		const fieldId = data.get('fieldId') as string;
		const fieldData = JSON.parse(data.get('field') as string);

		const response = await fetch(`${BACKEND_URL}/form/${params.id}/field/${fieldId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(fieldData)
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: errorMessage.detail || 'Failed to update field'
				},
				cookies
			);
			return fail(500, {});
		}

		setFlash({ type: 'success', message: 'Field updated successfully' }, cookies);
		return { success: true };
	},

	deleteField: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
		const token = getSessionTokenCookie();

		const data = await request.formData();
		const fieldId = data.get('fieldId') as string;

		const response = await fetch(`${BACKEND_URL}/form/${params.id}/field/${fieldId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: errorMessage.detail || 'Failed to delete field'
				},
				cookies
			);
			return fail(500, {});
		}

		setFlash({ type: 'success', message: 'Field deleted successfully' }, cookies);
		return { success: true };
	},

	reorderFields: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
		const token = getSessionTokenCookie();

		const data = await request.formData();
		const fieldIds = JSON.parse(data.get('fieldIds') as string);

		const response = await fetch(`${BACKEND_URL}/form/${params.id}/field/reorder`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ field_ids: fieldIds })
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: errorMessage.detail || 'Failed to reorder fields'
				},
				cookies
			);
			return fail(500, {});
		}

		return { success: true };
	},

	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_FORM);
		const token = getSessionTokenCookie();

		const res = await fetch(`${BACKEND_URL}/form/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			const errorMessage = await res.json();
			redirect(
				'/forms',
				{
					type: 'error',
					message: `${errorMessage.detail || res.statusText}`
				},
				cookies
			);
		}

		throw redirect(
			303,
			`/forms`,
			{ type: 'success', message: `Form Deleted Successfully` },
			cookies
		);
	}
};
