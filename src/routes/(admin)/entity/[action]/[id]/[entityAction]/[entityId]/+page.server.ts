import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createEntitySchema, editEntitySchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	const entityTypeId = params.id;

	if (params.entityAction === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_ENTITY);
	} else if (params.entityAction === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_ENTITY);
	} else if (params.entityAction === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_ENTITY);
	}

	let entityData = null;

	try {
		if (params.entityId && params.entityAction === 'edit') {
			const response = await fetch(`${BACKEND_URL}/entity/${params.entityId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error(`Failed to fetch entity data: ${response.statusText}`);
				throw new Error('Failed to fetch entity data');
			}

			entityData = await response.json();
		}
	} catch (error) {
		console.error('Error fetching entity data:', error);
		entityData = null;
	}

	// Fetch entity types for dropdown
	let entityTypes: { id: number; name: string }[] = [];
	try {
		const entityTypesRes = await fetch(`${BACKEND_URL}/entitytype/?page=1&size=100`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (entityTypesRes.ok) {
			const data = await entityTypesRes.json();
			entityTypes = (data.items || []).map((et: { id: number; name: string }) => ({
				id: et.id,
				name: et.name
			}));
		}
	} catch (error) {
		console.error('Error fetching entity types:', error);
	}

	const schema = params.entityAction === 'edit' ? editEntitySchema : createEntitySchema;

	return {
		form: await superValidate(zod4(schema)),
		entityAction: params.entityAction,
		entityId: params.entityId,
		entityTypeId,
		entity: entityData,
		entityTypes,
		currentUser: user
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.entityAction === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_ENTITY);
		} else if (params.entityAction === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_ENTITY);
		}

		const schema = params.entityAction === 'edit' ? editEntitySchema : createEntitySchema;
		const form = await superValidate(request, zod4(schema));

		if (!form.valid) {
			setFlash(
				{
					type: 'error',
					message: 'Entity not saved. Please check all the details.'
				},
				cookies
			);
			return fail(400, { form });
		}

		if (params.entityId === 'new') {
			const response = await fetch(`${BACKEND_URL}/entity/`, {
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
						message: errorMessage.detail || 'Entity not created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.entityId !== 'new') {
			const response = await fetch(`${BACKEND_URL}/entity/${params.entityId}`, {
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
						message: errorMessage.detail || 'Entity not updated. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		redirect(
			`/entity/view/${params.id}`,
			{
				type: 'success',
				message: 'Entity saved successfully'
			},
			cookies
		);
	},

	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_ENTITY);

		const token = getSessionTokenCookie();

		const res = await fetch(`${BACKEND_URL}/entity/${params.entityId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			const errorMessage = await res.json();
			redirect(
				`/entity/view/${params.id}`,
				{
					type: 'error',
					message: `${errorMessage.detail || res.statusText}`
				},
				cookies
			);
		}

		throw redirect(
			303,
			`/entity/view/${params.id}`,
			{ type: 'success', message: `Entity deleted successfully` },
			cookies
		);
	}
};
