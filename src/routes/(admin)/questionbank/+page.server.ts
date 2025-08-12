import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getSessionTokenCookie();

	// extract query parameters
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';

	const tagIdsList = url.searchParams.getAll('tag_ids') || [];
	const tagParams =
		tagIdsList.length > 0 ? tagIdsList.map((tagId) => `tag_ids=${tagId}`).join('&') : '';
	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';

	// build query string
	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { question_text: search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortOrder && { sort_order: sortOrder })
	});

	// add tag and state params if they exist
	const queryString = [queryParams.toString(), tagParams, stateParams].filter(Boolean).join('&');

	const response = await fetch(`${BACKEND_URL}/questions?${queryString}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorMessage = await response.json();
		setFlash(
			{
				type: 'error',
				message: `Failed to fetch questions: ${errorMessage.detail || response.statusText}`
			},
			cookies
		);
		return {
			questions: { items: [], total: 0, pages: 0 },
			params: { page, size, search: search, sortBy, sortOrder }
		};
	}

	const questions = await response.json();

	return {
		questions,
		totalPages: questions.pages || 0,
		params: { page, size, search: search, sortBy, sortOrder }
	};
};
