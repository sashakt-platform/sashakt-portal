import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createEntityTypeSchema, editEntityTypeSchema } from './schema.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_ENTITY);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_ENTITY);
	} else if (params.action === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_ENTITY);
	} else if (params.action === 'view') {
		requirePermission(user, PERMISSIONS.READ_ENTITY);
	}

	// --- VIEW: load entities list for this entity type ---
	if (params.action === 'view') {
		const entityTypeId = params.id;

		const page = Number(url.searchParams.get('page')) || 1;
		const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
		const search = url.searchParams.get('search') || '';
		const sortBy = url.searchParams.get('sortBy') || '';
		const sortOrder = url.searchParams.get('sortOrder') || 'asc';

		const queryParams = new URLSearchParams({
			page: page.toString(),
			size: size.toString(),
			entity_type_id: entityTypeId,
			...(search && { name: search }),
			...(sortBy && { sort_by: sortBy }),
			...(sortBy && { sort_order: sortOrder })
		});

		const entitiesRes = await fetch(`${BACKEND_URL}/entity/?${queryParams}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		const entityTypeRes = await fetch(`${BACKEND_URL}/entitytype/${entityTypeId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		const entities = entitiesRes.ok ? await entitiesRes.json() : null;
		const entityType = entityTypeRes.ok ? await entityTypeRes.json() : null;

		return {
			action: params.action,
			id: params.id,
			entities,
			entityType,
			entityTypeId,
			totalPages: entities?.pages || 0,
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	// --- ADD / EDIT: load entity type form ---
	let entityTypeData = null;

	try {
		if (params.id && params.action === 'edit') {
			const response = await fetch(`${BACKEND_URL}/entitytype/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				console.error(`Failed to fetch entity type data: ${response.statusText}`);
				throw new Error('Failed to fetch entity type data');
			}

			entityTypeData = await response.json();
		}
	} catch (error) {
		console.error('Error fetching entity type data:', error);
		entityTypeData = null;
	}

	const schema = params.action === 'edit' ? editEntityTypeSchema : createEntityTypeSchema;

	return {
		form: await superValidate(zod4(schema)),
		action: params.action,
		id: params.id,
		entityType: entityTypeData,
		currentUser: user
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_ENTITY);
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_ENTITY);
		}

		const schema = params.action === 'edit' ? editEntityTypeSchema : createEntityTypeSchema;
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

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/entitytype/`, {
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

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/entitytype/${params.id}`, {
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
			'/entity',
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

		const res = await fetch(`${BACKEND_URL}/entitytype/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			const errorMessage = await res.json();
			redirect(
				'/entity',
				{
					type: 'error',
					message: `${errorMessage.detail || res.statusText}`
				},
				cookies
			);
		}

		throw redirect(
			303,
			`/entity`,
			{ type: 'success', message: `Entity deleted successfully` },
			cookies
		);
	}
};
