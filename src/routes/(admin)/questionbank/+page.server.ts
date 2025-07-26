import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getSessionTokenCookie();

	let questionName = url.searchParams.get('name') || '';
	let currentPage = url.searchParams.get('page') || 1;

	const tagIdsList = url.searchParams.getAll('tag_ids') || [];
	const tagParams =
		tagIdsList.length > 0 ? tagIdsList.map((tagId) => `tag_ids=${tagId}`).join('&') : '';

	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';

	const response = await fetch(
		`${BACKEND_URL}/questions?question_text=${questionName}&${tagParams}&${stateParams}&page=${currentPage}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!response.ok) {
		const errorMessage = await response.json();
		setFlash(
			{
				type: 'error',
				message: `Failed to fetch questions: ${errorMessage.detail || response.statusText}`
			},
			cookies
		);
		return { questions: null };
	}

	const questions = await response.json();

	return {
		questions
	};
};
