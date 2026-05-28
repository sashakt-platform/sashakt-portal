import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async ({ url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_ENTITY);
	const token = getSessionTokenCookie();

	// extract query params
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';
	const isActiveRaw = url.searchParams.get('isActive')?.toLowerCase();
	const isActive = isActiveRaw === 'true' || isActiveRaw === 'false' ? isActiveRaw : '';

	// build query parameters
	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder }),
		...(isActive && { is_active: isActive })
	});

	const res = await fetch(`${BACKEND_URL}/entitytype/?${queryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		return {
			entities: null,
			params: { page, size, search, sortBy, sortOrder, isActive }
		};
	}

	const entityTypes = await res.json();

	return {
		entities: entityTypes,
		totalPages: entityTypes.pages || 0,
		params: { page, size, search, sortBy, sortOrder, isActive }
	};
};

export const actions: Actions = {
	batchDelete: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_ENTITY);
		const token = getSessionTokenCookie();
		const formData = await request.formData();

		try {
			const response = await fetch(`${BACKEND_URL}/entitytype/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: formData.get('entityIds')
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to delete entity types: ${errorMessage.detail || response.statusText}`
					},
					cookies
				);
				return fail(500);
			}

			const deleteResponse = await response.json();
			setFlash(
				{
					type: deleteResponse.delete_failure_list ? 'error' : 'success',
					message: `Deletion complete: ${deleteResponse.delete_success_count} successful, ${deleteResponse.delete_failure_list?.length || 0} failed.`
				},
				cookies
			);
		} catch (error) {
			console.error('Batch delete error:', error);
			setFlash({ type: 'error', message: 'Failed to delete entity types' }, cookies);
			return fail(500);
		}

		return { success: true };
	}
};
