import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getSessionTokenCookie();

	// extract query parameters for tags
	const tagsPage = Number(url.searchParams.get('tagsPage')) || 1;
	const tagsSize = Number(url.searchParams.get('tagsSize')) || DEFAULT_PAGE_SIZE;
	const tagsSearch = url.searchParams.get('tagsSearch') || '';
	const tagsSortBy = url.searchParams.get('tagsSortBy') || '';
	const tagsSortOrder = url.searchParams.get('tagsSortOrder') || 'asc';

	// extract query parameters for tag types
	const tagTypesPage = Number(url.searchParams.get('tagTypesPage')) || 1;
	const tagTypesSize = Number(url.searchParams.get('tagTypesSize')) || DEFAULT_PAGE_SIZE;
	const tagTypesSearch = url.searchParams.get('tagTypesSearch') || '';
	const tagTypesSortBy = url.searchParams.get('tagTypesSortBy') || '';
	const tagTypesSortOrder = url.searchParams.get('tagTypesSortOrder') || 'asc';

	let tags = { items: [], total: 0, pages: 0 };
	let tagTypes = { items: [], total: 0, pages: 0 };

	// build query string for tags
	const tagsQueryParams = new URLSearchParams({
		page: tagsPage.toString(),
		size: tagsSize.toString(),
		...(tagsSearch && { search: tagsSearch }),
		...(tagsSortBy && { sort_by: tagsSortBy }),
		...(tagsSortOrder && { sort_order: tagsSortOrder })
	});

	const response = await fetch(`${BACKEND_URL}/tag?${tagsQueryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorMessage = await response.json();
		setFlash({ type: 'error', message: errorMessage.detail || 'Failed to fetch Tags.' }, cookies);
		return {
			tags,
			tagTypes,
			tagsParams: {
				page: tagsPage,
				size: tagsSize,
				search: tagsSearch,
				sortBy: tagsSortBy,
				sortOrder: tagsSortOrder
			},
			tagTypesParams: {
				page: tagTypesPage,
				size: tagTypesSize,
				search: tagTypesSearch,
				sortBy: tagTypesSortBy,
				sortOrder: tagTypesSortOrder
			}
		};
	} else {
		tags = await response.json();
	}

	// build query string for tag types
	const tagTypesQueryParams = new URLSearchParams({
		page: tagTypesPage.toString(),
		size: tagTypesSize.toString(),
		...(tagTypesSearch && { search: tagTypesSearch }),
		...(tagTypesSortBy && { sort_by: tagTypesSortBy }),
		...(tagTypesSortOrder && { sort_order: tagTypesSortOrder })
	});

	const responseTagTypes = await fetch(`${BACKEND_URL}/tagtype?${tagTypesQueryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	if (!responseTagTypes.ok) {
		const errorMessage = await responseTagTypes.json();
		setFlash(
			{ type: 'error', message: errorMessage.detail || 'Failed to fetch Tag Types.' },
			cookies
		);
	} else {
		tagTypes = await responseTagTypes.json();
	}

	return {
		tags,
		tagTypes,
		tagsTotalPages: tags.pages || 0,
		tagTypesTotalPages: tagTypes.pages || 0,
		tagsParams: {
			page: tagsPage,
			size: tagsSize,
			search: tagsSearch,
			sortBy: tagsSortBy,
			sortOrder: tagsSortOrder
		},
		tagTypesParams: {
			page: tagTypesPage,
			size: tagTypesSize,
			search: tagTypesSearch,
			sortBy: tagTypesSortBy,
			sortOrder: tagTypesSortOrder
		}
	};
};
