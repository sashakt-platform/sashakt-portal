import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const token = getSessionTokenCookie();

	const response = await fetch(`${BACKEND_URL}/questions`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		console.error('Failed to fetch questions:', response.status, response.statusText);
		return { questions: null };
	}

	const questions = await response.json();




	return {
		questions
	};
};
