import type { PageServerLoad, Actions } from './$types.js';
import { BACKEND_URL, TEST_TAKER_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, cookies }) => {
	const user = requireLogin();
	const is_template = params.type === 'template';

	// Check permissions based on type
	if (is_template) {
		requirePermission(user, PERMISSIONS.READ_TEST_TEMPLATE);
	} else {
		requirePermission(user, PERMISSIONS.READ_TEST);
	}

	// extract query parameters for DataTable
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';
	const myTests = url.searchParams.get('my_tests') ?? '';

	const tagIdsList = url.searchParams.getAll('tag_ids') || [];
	const tagParams =
		tagIdsList.length > 0 ? tagIdsList.map((tagId) => `tag_ids=${tagId}`).join('&') : '';

	const tagtypeIdsList = url.searchParams.getAll('tag_type_ids') || [];
	const tagtypeParams =
		tagtypeIdsList.length > 0
			? tagtypeIdsList.map((tagtypeId) => `tag_type_ids=${tagtypeId}`).join('&')
			: '';

	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';

	const districtIdsList = url.searchParams.getAll('district_ids') || [];
	const districtParams =
		districtIdsList.length > 0
			? districtIdsList.map((districtId) => `district_ids=${districtId}`).join('&')
			: '';

	// build query string for DataTable pagination/sorting
	const queryParams = new URLSearchParams({
		is_template: is_template.toString(),
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortOrder && { sort_order: sortOrder }),
		...(myTests !== '' && { my_tests: myTests })
	});

	// add tag and state params if they exist
	const queryString = [
		queryParams.toString(),
		tagParams,
		stateParams,
		tagtypeParams,
		districtParams
	]
		.filter(Boolean)
		.join('&');

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
			params: { page, size, search, sortBy, sortOrder, myTests }
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
		params: { page, size, search, sortBy, sortOrder, myTests }
	};
};

export const actions: Actions = {
	batchDelete: async ({ request, cookies, params }) => {
		const user = requireLogin();
		const is_template = params.type === 'template';
		requirePermission(
			user,
			is_template ? PERMISSIONS.DELETE_TEST_TEMPLATE : PERMISSIONS.DELETE_TEST
		);
		const token = getSessionTokenCookie();
		const formData = await request.formData();

		try {
			const response = await fetch(`${BACKEND_URL}/test/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: formData.get('testIds')
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to delete ${is_template ? 'test templates' : 'tests'}: ${errorMessage.detail?.[0]?.msg || response.statusText}`
					},
					cookies
				);
				return fail(500);
			}

			const deleteResponse = await response.json();
			setFlash(
				{
					type: (deleteResponse.delete_failure_list?.length ?? 0) > 0 ? 'error' : 'success',
					message: `Deletion complete: ${deleteResponse.delete_success_count} successful, ${deleteResponse.delete_failure_list?.length || 0} failed.`
				},
				cookies
			);
		} catch (error) {
			console.error('Batch delete error:', error);
			setFlash(
				{
					type: 'error',
					message: `Failed to delete ${is_template ? 'test templates' : 'tests'}`
				},
				cookies
			);
			return fail(500);
		}

		return { success: true };
	}
};
