import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_CERTIFICATE);
	const token = getSessionTokenCookie();

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';
	const isActiveRaw = url.searchParams.get('isActive')?.toLowerCase();
	const isActive = isActiveRaw === 'true' || isActiveRaw === 'false' ? isActiveRaw : '';

	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder }),
		...(isActive && { is_active: isActive })
	});

	const res = await fetch(`${BACKEND_URL}/certificate/?${queryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		const errorMessage = await res.json();

		setFlash(
			{
				type: 'error',
				message: `Failed to fetch certificates: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);

		return {
			certificates: { items: [], total: 0, pages: 0 },
			totalPages: 0,
			params: { page, size, search, sortBy, sortOrder, isActive }
		};
	}

	const certificates = await res.json();

	return {
		certificates,
		totalPages: certificates.pages || 0,
		params: { page, size, search, sortBy, sortOrder, isActive }
	};
};

export const actions: Actions = {
	batchDelete: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_CERTIFICATE);
		const token = getSessionTokenCookie();
		const formData = await request.formData();

		try {
			const response = await fetch(`${BACKEND_URL}/certificate/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: formData.get('certificateIds')
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to delete certificates: ${errorMessage.detail || response.statusText}`
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
			setFlash({ type: 'error', message: 'Failed to delete certificates' }, cookies);
			return fail(500);
		}

		return { success: true };
	}
};
