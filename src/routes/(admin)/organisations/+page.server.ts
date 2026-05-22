import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load = async ({ url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_ORGANIZATION);
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
		...(sortBy && { sort_by: sortBy }),
		...(sortBy && { sort_order: sortOrder }),
		...(isActive && { is_active: isActive })
	});

	const res = await fetch(`${BACKEND_URL}/organization/?${queryParams}`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		return {
			organisations: null,
			params: { page, size, search, sortBy, sortOrder, isActive }
		};
	}

	const organisations = await res.json();

	return {
		organisations,
		totalPages: organisations.pages || 0,
		params: { page, size, search, sortBy, sortOrder, isActive }
	};
};

