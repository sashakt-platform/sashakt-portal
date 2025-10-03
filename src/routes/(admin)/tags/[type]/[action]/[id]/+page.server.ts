import type { PageServerLoad, Actions } from './$types.js';
import { tagSchema, tagTypeSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ params, cookies }: any) => {
	if (params.type != 'tag' && params.type != 'tagtype') {
		throw new Error('Invalid type parameter');
	}

	const user = requireLogin();
	const token = getSessionTokenCookie();

	// Check permissions based on action
	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_TAG);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_TAG);
	} else if (params.action === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_TAG);
	}
	let tagData = null;

	try {
		if (params.id && params.id !== 'new') {
			const tagResponse = await fetch(`${BACKEND_URL}/${params.type}/${params.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!tagResponse.ok) {
				console.error(`Failed to fetch tag data: ${tagResponse.statusText}`);
				throw new Error('Failed to fetch tag data');
			}

			tagData = await tagResponse.json();
		}
	} catch (error) {
		console.error('Error fetching tag data:', error);
		tagData = null;
	}
	let tagTypes = [];
	try {
		const tagTypesResponse = await fetch(`${BACKEND_URL}/tagtype/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!tagTypesResponse.ok) {
			console.error(`Failed to fetch tag types: ${tagTypesResponse.statusText}`);
			throw new Error('Failed to fetch tag types');
		}

		const tagTypesData = await tagTypesResponse.json();
		tagTypes = tagTypesData.items;
	} catch (error) {
		console.error('Error fetching tag types:', error);
	}

	const tagForm = await superValidate(zod(tagSchema));
	const tagTypeForm = await superValidate(zod(tagTypeSchema));

	return {
		tagForm,
		tagTypeForm,
		tagData,
		tagTypes,
		type: params.type
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		if (params.type != 'tag' && params.type != 'tagtype') {
			throw new Error('Invalid type parameter');
		}

		const user = requireLogin();
		const token = getSessionTokenCookie();

		// Check permissions based on action
		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_TAG);
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_TAG);
		}
		const form = await superValidate(
			request,
			zod(params.type == 'tag' ? tagSchema : tagTypeSchema)
		);
		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Tag not Created. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/${params.type}/`, {
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
						message: errorMessage.detail || 'Question not Created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/${params.type}/${params.id}`, {
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
						message: `Failed to update tags: ${errorMessage.detail || response.statusText}`
					},
					cookies
				);
				return fail(500, { form });
			}
		}
		const redirectUrl = params.type === 'tag' ? '/tags?tab=tag' : '/tags?tab=tagtype';
		redirect(
			redirectUrl,
			{
				type: 'success',
				message: `${params.type === 'tag' ? 'Tag' : 'Tag Type'} saved successfully`
			},
			cookies
		);
	},
	delete: async ({ params, cookies }) => {
		if (params.type != 'tag' && params.type != 'tagtype') {
			throw new Error('Invalid type parameter');
		}

		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_TAG);
		const token = getSessionTokenCookie();
		const response = await fetch(`${BACKEND_URL}/${params.type}/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			const redirectUrl = params.type === 'tag' ? '/tags?tab=tag' : '/tags?tab=tagtype';
			redirect(
				redirectUrl,
				{
					type: 'error',
					message: `${errorMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		const redirectUrl = params.type === 'tag' ? '/tags?tab=tag' : '/tags?tab=tagtype';
		redirect(
			redirectUrl,
			{
				type: 'success',
				message: `${params.type === 'tag' ? 'Tag' : 'Tag-Type'} deleted successfully`
			},
			cookies
		);
	}
};
