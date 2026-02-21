import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createFormSchema, editFormSchema, formFieldSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { error, fail } from '@sveltejs/kit';

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

	// Fetch entity types for entity field selection (non-fatal)
	try {
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
	} catch (err) {
		console.error('Error fetching entity types:', err);
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
			throw error(response.status, `Failed to load form: ${response.statusText}`);
		}

		formData = await response.json();
	}

	const schema = params.action === 'edit' ? editFormSchema : createFormSchema;

	return {
		form: await superValidate(formData ?? undefined, zod4(schema)),
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
		let fieldData;
		try {
			fieldData = JSON.parse(data.get('field') as string);
		} catch {
			setFlash({ type: 'error', message: 'Invalid JSON for field' }, cookies);
			return fail(400, {});
		}

		// Validate field data
		const validationResult = formFieldSchema.safeParse(fieldData);
		if (!validationResult.success) {
			setFlash(
				{
					type: 'error',
					message: 'Invalid field data. Please check all required fields.'
				},
				cookies
			);
			return fail(400, { errors: validationResult.error.flatten() });
		}

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

		// Get the created field with its ID from the response
		const createdField = await response.json();

		setFlash({ type: 'success', message: 'Field added successfully' }, cookies);
		return { success: true, id: createdField.id };
	},

	updateField: async ({ request, params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_FORM);
		const token = getSessionTokenCookie();

		const data = await request.formData();
		const fieldId = data.get('fieldId') as string;
		let fieldData;
		try {
			fieldData = JSON.parse(data.get('field') as string);
		} catch {
			setFlash({ type: 'error', message: 'Invalid JSON for field' }, cookies);
			return fail(400, {});
		}

		// Validate field data
		const validationResult = formFieldSchema.safeParse(fieldData);
		if (!validationResult.success) {
			setFlash(
				{
					type: 'error',
					message: 'Invalid field data. Please check all required fields.'
				},
				cookies
			);
			return fail(400, { errors: validationResult.error.flatten() });
		}

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
			let detail = 'Failed to delete field';
			try {
				const errorMessage = await response.json();
				detail = errorMessage.detail || detail;
			} catch {
				// Response was not JSON, use default message
			}
			setFlash({ type: 'error', message: detail }, cookies);
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
		let fieldIds;
		try {
			fieldIds = JSON.parse(data.get('fieldIds') as string);
		} catch {
			setFlash({ type: 'error', message: 'Invalid JSON for field order' }, cookies);
			return fail(400, {});
		}

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
			throw redirect(
				303,
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
