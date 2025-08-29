import type { PageServerLoad } from './$types.js';
import { BACKEND_URL, TEST_TAKER_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import { setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ params, url, cookies }) => {
	const is_template = params.type === 'template';

	// extract query parameters for DataTable
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';

	const tagIdsList = url.searchParams.getAll('tag_ids') || [];
	const tagParams =
		tagIdsList.length > 0 ? tagIdsList.map((tagId) => `tag_ids=${tagId}`).join('&') : '';
	const tagtypeIdsList = url.searchParams.getAll('tag_type_ids') || [];
	const tagtypeParams =
		tagtypeIdsList.length > 0 ? tagtypeIdsList.map((tagtypeId) => `tag_type_ids=${tagtypeId}`).join('&') : '';
	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';
	const districtsList = url.searchParams.getAll('district_ids') || [];
	const districtParams =
		districtsList.length > 0 ? districtsList.map((district) => `district_ids=${district}`).join('&') : '';

	// build query string for DataTable pagination/sorting
	const queryParams = new URLSearchParams({
		is_template: is_template.toString(),
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortOrder && { sort_order: sortOrder })
	});

	// add tag and state params if they exist
	const queryString = [queryParams.toString(), tagParams, stateParams, districtParams, tagtypeParams].filter(Boolean).join('&');

	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/test/?${queryString}`, {
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
				message: `Failed to fetch Test ${is_template ? 'template' : 'sessions'}. Details: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);
		return {
			tests: { items: [], total: 0, pages: 0 },
			questions: [],
			is_template: is_template,
			test_taker_url: TEST_TAKER_URL,
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	const tests = await res.json();

	// fetch questions (might be needed for test creation)
	let questions = [];
	const responseQuestions = await fetch(`${BACKEND_URL}/questions/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseQuestions.ok) {
		questions = await responseQuestions.json();
	}

	return {
		tests,
		questions,
		is_template: is_template,
		test_taker_url: TEST_TAKER_URL,
		params: { page, size, search, sortBy, sortOrder }
	};
};
