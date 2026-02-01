import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import type { PageServerLoad } from './$types';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_FORM);
	const token = getSessionTokenCookie();

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';

	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder })
	});

	const res = await fetch(`${BACKEND_URL}/form/?${queryParams}`, {
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
				message: `Failed to fetch forms: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);

		return {
			forms: { items: [], total: 0, pages: 0 },
			totalPages: 0,
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	const forms = await res.json();

	return {
		forms,
		totalPages: forms.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};
