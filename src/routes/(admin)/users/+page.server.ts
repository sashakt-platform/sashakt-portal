import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import { getSessionTokenCookie } from '$lib/server/auth';

export const load = async ({ url }) => {
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
		...(sortOrder && { sort_order: sortOrder })
	});

	const res = await fetch(`${BACKEND_URL}/users?${queryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		return {
			users: null,
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	const users = await res.json();

	return {
		users,
		totalPages: users.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};
