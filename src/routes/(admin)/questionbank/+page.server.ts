import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { fail } from '@sveltejs/kit';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_QUESTION);
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
	const tagtypeIdsList = url.searchParams.getAll('tag_type_ids') || [];
	const tagtypeParams =
		tagtypeIdsList.length > 0
			? tagtypeIdsList.map((tagtypeId) => `tag_type_ids=${tagtypeId}`).join('&')
			: '';

	// build query string
	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { question_text: search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortOrder && { sort_order: sortOrder })
	});

	// add tag and state params if they exist
	const queryString = [queryParams.toString(), tagParams, stateParams, tagtypeParams]
		.filter(Boolean)
		.join('&');

	const response = await fetch(`${BACKEND_URL}/questions/?${queryString}`, {
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
			totalPages: 0,
			params: { page, size, search, sortBy, sortOrder }
		};
	}

	const questions = await response.json();

	return {
		questions,
		totalPages: questions.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};

export const actions: Actions = {
	batchDelete: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_QUESTION);
		const token = getSessionTokenCookie();
		const formData = await request.formData();

		try {
			const response = await fetch(`${BACKEND_URL}/questions`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: formData.get('questionIds')
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to delete questions: ${errorMessage.detail[0].msg || response.statusText}`
					},
					cookies
				);
				return fail(500);
			} else {
				const deleteResponse = await response.json();
				setFlash(
					{
						type: deleteResponse.delete_failure_list ? 'error' : 'success',
						message: `Deletion complete: ${deleteResponse.delete_success_count} successful, ${deleteResponse.delete_failure_list?.length || 0} failed.`
					},
					cookies
				);
			}
		} catch (error) {
			console.error('Batch delete error:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to delete questions'
				},
				cookies
			);
			return fail(500);
		}

		return { success: true };
	}
};
