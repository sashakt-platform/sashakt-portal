import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

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

	// build query parameters
	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortBy && { sort_order: sortOrder })
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
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	const entityTypes = await res.json();

	return {
		entities: entityTypes,
		totalPages: entityTypes.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};
